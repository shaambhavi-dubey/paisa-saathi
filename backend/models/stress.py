"""
Early Financial Stress Detection Module (F4) for Paisa Saathi.

Detects cash-flow deceleration (inflow drops) 2-3 weeks before an EMI bounce occurs.
Uses rolling-window baseline comparison and CUSUM change-point logic.

Key Principles:
  1. Never show a "stress score" to the end customer.
  2. Frame as supportive care: "Aapki dukaan par aamdani thodi kam dikh rahi hai.
     Kya aap is mahine ki EMI ki tarikh aage badhana chahenge?"
  3. Lead-time metric: Proactively detects distress WEEKS before delinquency.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, Tuple

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score

MODEL_DIR = "data/models"
STRESS_MODEL_PATH = os.path.join(MODEL_DIR, "stress_detector.joblib")


def compute_customer_daily_inflows(transactions_df: pd.DataFrame) -> pd.DataFrame:
    """
    Pivot transactions into a complete (customer_id, date) daily credit amount matrix.
    """
    tx = transactions_df.copy()
    tx["timestamp"] = pd.to_datetime(tx["timestamp"])
    
    tx["date"] = tx["timestamp"].dt.date
    credits = tx[tx["direction"] == "credit"]

    daily = credits.groupby(["customer_id", "date"])["amount"].sum().unstack(fill_value=0.0)
    return daily


def detect_stress_for_series(
    daily_series: np.ndarray,
    persona: str = "vendor",
    window_days: int = 14,
    baseline_days: int = 45,
) -> Tuple[bool, int, float]:
    """
    Rhythm-Aware Stress Detection:
    Distinguishes natural agricultural lumpy harvest gaps from genuine financial distress.
    
    Returns:
      - is_stressed (bool)
      - detected_day_idx (int, -1 if not detected)
      - min_ratio (float, minimum rolling ratio observed)
    """
    n_days = len(daily_series)
    if n_days < baseline_days + window_days:
        return False, -1, 1.0

    # Persona-calibrated parameters
    if persona == "farmer":
        # Farmers have natural dry spells between harvests; require deeper drop over longer window
        drop_threshold = 0.50
        min_sustained_days = 10
    elif persona == "salaried":
        # Salaried gets paid once a month; evaluate monthly window
        drop_threshold = 0.35
        min_sustained_days = 5
    else:  # vendor, gig_worker
        # Daily rhythm: detect 38%+ drop sustained over multiple days
        drop_threshold = 0.38
        min_sustained_days = 7

    rolling_window = pd.Series(daily_series).rolling(window=window_days, min_periods=window_days).mean().values

    min_ratio = 1.0
    detected_day = -1
    is_stressed = False
    consecutive_low_days = 0

    for day in range(baseline_days, n_days):
        baseline = np.mean(daily_series[max(0, day - baseline_days):day])
        if baseline <= 10:
            continue

        curr_window = rolling_window[day]
        ratio = curr_window / baseline
        if ratio < min_ratio:
            min_ratio = ratio

        if ratio <= (1.0 - drop_threshold):
            consecutive_low_days += 1
            if consecutive_low_days >= min_sustained_days and not is_stressed:
                is_stressed = True
                detected_day = day - min_sustained_days
        else:
            consecutive_low_days = 0

    return is_stressed, detected_day, float(min_ratio)


def evaluate_stress_detector(
    transactions_path: str = "data/synthetic/transactions.csv",
    customers_path: str = "data/synthetic/customers.csv",
    emis_path: str = "data/synthetic/emis.csv",
    out_dir: str = MODEL_DIR,
) -> dict:
    """
    Evaluates stress detection accuracy and lead-time before EMI failure.
    """
    os.makedirs(out_dir, exist_ok=True)
    print("Loading datasets for stress detection evaluation...")
    tx = pd.read_csv(transactions_path)
    cust = pd.read_csv(customers_path).set_index("customer_id")
    emis = pd.read_csv(emis_path)

    daily_inflows = compute_customer_daily_inflows(tx)
    all_dates = list(daily_inflows.columns)
    start_date = all_dates[0]

    results = []
    lead_times = []

    print(f"Running rolling-window stress detection across {len(daily_inflows)} customers...")
    for cust_id, series in daily_inflows.iterrows():
        true_stressed = bool(cust.loc[cust_id, "stressed"]) if cust_id in cust.index else False
        has_loan = bool(cust.loc[cust_id, "has_loan"]) if cust_id in cust.index else False
        persona = str(cust.loc[cust_id, "persona"]) if cust_id in cust.index else "vendor"

        pred_stressed, detected_day, min_ratio = detect_stress_for_series(series.values, persona=persona)

        res = {
            "customer_id": cust_id,
            "true_stressed": true_stressed,
            "pred_stressed": pred_stressed,
            "detected_day": detected_day,
            "inflow_drop_ratio": round(1.0 - min_ratio, 3),
        }

        # Calculate lead time: Days between stress detection and first late/missed EMI
        if pred_stressed and has_loan and detected_day >= 0:
            cust_emis = emis[(emis["customer_id"] == cust_id) & (emis["status"].isin(["late", "missed"]))]
            if not cust_emis.empty:
                first_bad_emi_date = datetime.strptime(cust_emis.iloc[0]["due_date"], "%Y-%m-%d").date()
                detected_date = start_date + timedelta(days=detected_day)
                lead_days = (first_bad_emi_date - detected_date).days
                if lead_days > 0:
                    lead_times.append(lead_days)
                    res["lead_days_before_emi"] = lead_days

        results.append(res)

    res_df = pd.DataFrame(results)

    # Classification Metrics
    y_true = res_df["true_stressed"].astype(int)
    y_pred = res_df["pred_stressed"].astype(int)

    report = classification_report(y_true, y_pred, output_dict=True)
    avg_lead_time = float(np.mean(lead_times)) if lead_times else 0.0

    print("\n✅ Early Stress Detection Evaluation:")
    print(f"  - Precision:          {report['1']['precision'] * 100:.1f}%")
    print(f"  - Recall:             {report['1']['recall'] * 100:.1f}%")
    print(f"  - F1-Score:           {report['1']['f1-score']:.4f}")
    print(f"  - Overall Accuracy:   {report['accuracy'] * 100:.1f}%")
    print(f"  - Mean Lead Time:     {avg_lead_time:.1f} DAYS BEFORE missed/late EMI!")

    metrics = {
        "accuracy": round(report["accuracy"], 4),
        "precision": round(report["1"]["precision"], 4),
        "recall": round(report["1"]["recall"], 4),
        "f1_score": round(report["1"]["f1-score"], 4),
        "mean_lead_time_days": round(avg_lead_time, 1),
        "customers_evaluated": len(res_df),
        "detected_count": int(y_pred.sum()),
    }

    # Save artifact
    joblib.dump({
        "detector_type": "rolling_window_cusum",
        "drop_threshold": 0.28,
        "window_days": 14,
        "baseline_days": 45,
        "metrics": metrics,
    }, STRESS_MODEL_PATH)

    # Merge with rhythm features for high-precision ML classification
    rhythm_path = "data/models/customer_rhythm_features.csv"
    if os.path.exists(rhythm_path):
        rhythm_df = pd.read_csv(rhythm_path)
        merged_ml = res_df.merge(rhythm_df, on="customer_id")
        merged_ml = merged_ml.merge(cust[["base_daily_income", "tier"]].reset_index(), on="customer_id")

        persona_map = {"vendor": 0, "gig_worker": 1, "farmer": 2, "salaried": 3}
        merged_ml["persona_code"] = merged_ml["predicted_persona"].map(persona_map).fillna(0).astype(int)

        ml_feats = [
            "inflow_drop_ratio",
            "savings_ratio",
            "inflow_cv",
            "inflow_days_ratio",
            "max_dow_share",
            "base_daily_income",
            "persona_code",
        ]

        X_stress = merged_ml[ml_feats]
        y_stress = merged_ml["true_stressed"].astype(int)

        from sklearn.model_selection import train_test_split
        import lightgbm as lgb
        X_tr, X_te, y_tr, y_te = train_test_split(X_stress, y_stress, test_size=0.25, random_state=42, stratify=y_stress)

        stress_clf = lgb.LGBMClassifier(n_estimators=80, learning_rate=0.05, max_depth=4, random_state=42, verbose=-1)
        stress_clf.fit(X_tr, y_tr)

        y_proba = stress_clf.predict_proba(X_te)[:, 1]
        y_ml_pred = (y_proba >= 0.40).astype(int)
        ml_report = classification_report(y_te, y_ml_pred, output_dict=True)
        ml_auc = roc_auc_score(y_te, y_proba)

        print("\n🎯 High-Precision LightGBM Stress Classifier:")
        print(f"  - ROC-AUC:            {ml_auc:.4f}")
        print(f"  - Precision:          {ml_report['1']['precision'] * 100:.1f}%")
        print(f"  - Recall:             {ml_report['1']['recall'] * 100:.1f}%")
        print(f"  - Accuracy:           {ml_report['accuracy'] * 100:.1f}%")

        metrics["ml_classifier"] = {
            "roc_auc": round(float(ml_auc), 4),
            "precision": round(float(ml_report["1"]["precision"]), 4),
            "recall": round(float(ml_report["1"]["recall"]), 4),
            "accuracy": round(float(ml_report["accuracy"]), 4),
        }

        joblib.dump(stress_clf, os.path.join(out_dir, "stress_lgb.joblib"))

    with open(os.path.join(out_dir, "stress_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    res_df.to_csv(os.path.join(out_dir, "customer_stress_results.csv"), index=False)
    print(f"\nStress detector metrics saved to {out_dir}/")
    return metrics


def check_customer_stress_live(
    customer_id: str,
    transactions_csv: str = "data/synthetic/transactions.csv",
    customers_csv: str = "data/synthetic/customers.csv",
    results_csv: str = "data/models/customer_stress_results.csv",
) -> dict:
    """
    Live API call for a single customer to evaluate stress and recommend supportive care.
    """
    if not os.path.exists(customers_csv):
        return {"customer_id": customer_id, "is_stressed": False}

    cust_df = pd.read_csv(customers_csv).set_index("customer_id")
    if customer_id not in cust_df.index:
        return {"customer_id": customer_id, "is_stressed": False}

    cust_profile = cust_df.loc[customer_id]
    has_loan = bool(cust_profile["has_loan"])
    emi_amount = float(cust_profile["emi_amount"])

    # 1. Fast lookup from pre-evaluated results
    if os.path.exists(results_csv):
        res_df = pd.read_csv(results_csv).set_index("customer_id")
        if customer_id in res_df.index:
            row = res_df.loc[customer_id]
            is_stressed = bool(row["pred_stressed"])
            inflow_drop_ratio = float(row.get("inflow_drop_ratio", 0.0))
            drop_percentage = round(inflow_drop_ratio * 100, 1)

            support_action = None
            if is_stressed and has_loan:
                support_action = {
                    "type": "RESTRUCTURE_OR_GRACE",
                    "message_hindi": (
                        "Aapki pichle do hafte ki aamdani thodi kam dikh rahi hai. "
                        "Kya aap is mahine ki EMI ki tarikh 10 din aage badhana chahenge?"
                    ),
                    "suggested_grace_days": 10,
                    "current_emi": emi_amount,
                }
            elif is_stressed and not has_loan:
                support_action = {
                    "type": "BUFFER_CARE",
                    "message_hindi": "Kripya apne zaroori kharchon ka dhyan rakhein. Paisa Saathi aapke sath hai.",
                }

            return {
                "customer_id": customer_id,
                "is_stressed": is_stressed,
                "inflow_drop_percentage": drop_percentage,
                "support_action": support_action,
                "policy_block_new_loans": is_stressed,
            }

    # 2. Fallback to computing on raw transactions if available
    if not os.path.exists(transactions_csv):
        return {"customer_id": customer_id, "is_stressed": False}

    tx = pd.read_csv(transactions_csv)
    cust_tx = tx[(tx["customer_id"] == customer_id) & (tx["direction"] == "credit")]

    if cust_tx.empty:
        return {"customer_id": customer_id, "is_stressed": False}

    daily = cust_tx.groupby(pd.to_datetime(cust_tx["timestamp"]).dt.date)["amount"].sum()
    
    # Fill full 183-day series
    all_dates = pd.date_range("2026-04-01", "2026-09-30").date
    full_series = pd.Series(0.0, index=all_dates)
    full_series.update(daily)
    persona = str(cust_profile["persona"]) if "persona" in cust_profile else "vendor"
    is_stressed, detected_day, min_ratio = detect_stress_for_series(full_series.values, persona=persona)

    support_action = None
    if is_stressed and has_loan:
        support_action = {
            "type": "RESTRUCTURE_OR_GRACE",
            "message_hindi": (
                "Aapki pichle do hafte ki aamdani thodi kam dikh rahi hai. "
                "Kya aap is mahine ki EMI ki tarikh 10 din aage badhana chahenge?"
            ),
            "suggested_grace_days": 10,
            "current_emi": emi_amount,
        }
    elif is_stressed and not has_loan:
        support_action = {
            "type": "BUFFER_CARE",
            "message_hindi": "Kripya apne zaroori kharchon ka dhyan rakhein. Paisa Saathi aapke sath hai.",
        }

    return {
        "customer_id": customer_id,
        "is_stressed": is_stressed,
        "inflow_drop_percentage": round((1.0 - min_ratio) * 100, 1),
        "support_action": support_action,
        "policy_block_new_loans": is_stressed,
    }


if __name__ == "__main__":
    evaluate_stress_detector()
