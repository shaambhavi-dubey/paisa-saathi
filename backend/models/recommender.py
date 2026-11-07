"""
Next-Best Product Recommender & Anti-Predatory Policy Engine for Paisa Saathi.

Recommends between:
  1. Small Business Working Capital Loan (PM SVANidhi / Mudra Shishu)
  2. Recurring Deposit (RD) / Micro-Savings

Includes:
  - LightGBM propensity model
  - Strict Anti-Predatory Guardrails (Stress gate & 40% debt-burden cap)
  - One-sentence plain Hindi explainability ("Why this product fits you")
"""

import json
import os
import sys
from typing import Optional, Tuple

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

MODEL_DIR = "data/models"
RECOMMENDER_PATH = os.path.join(MODEL_DIR, "recommender_lgb.joblib")


def prepare_recommender_dataset(
    rhythm_features_path: str = "data/models/customer_rhythm_features.csv",
    customers_path: str = "data/synthetic/customers.csv",
) -> pd.DataFrame:
    """
    Merge rhythm features with customer financial context to build training dataset.
    """
    features = pd.read_csv(rhythm_features_path)
    cust = pd.read_csv(customers_path)

    df = features.merge(cust, on="customer_id")

    # Financial health features
    monthly_income = df["base_daily_income"] * 30
    df["debt_burden_ratio"] = (df["emi_amount"] / monthly_income.replace(0, 1e-5)).fillna(0)
    df["est_monthly_surplus"] = (monthly_income * df["savings_ratio"]).clip(lower=0)

    # Encode persona
    persona_map = {"vendor": 0, "gig_worker": 1, "farmer": 2, "salaried": 3}
    df["persona_code"] = df["predicted_persona"].map(persona_map).fillna(0).astype(int)

    # Ground truth recommendation label:
    # 0 = Recurring Deposit (RD / Savings)
    # 1 = Small Working Capital Loan
    # Stressed customers are filtered during training or labeled as no-loan to enforce safety
    loan_eligible = (
        (~df["stressed"])
        & (df["debt_burden_ratio"] < 0.35)
        & (df["base_daily_income"] >= 400)
        & (~df["has_loan"] | (df["debt_burden_ratio"] < 0.15))
    )

    # High surplus + low loan need -> RD
    rd_preferred = (
        (df["savings_ratio"] > 0.12)
        & (df["est_monthly_surplus"] > 1000)
        & (~loan_eligible | (df["has_loan"]))
    )

    # Target: 1 for Loan, 0 for RD
    df["target_product"] = np.where(loan_eligible & ~rd_preferred, 1, 0)

    return df


RECOMMENDER_FEATURES = [
    "base_daily_income",
    "debt_burden_ratio",
    "savings_ratio",
    "est_monthly_surplus",
    "inflow_cv",
    "inflow_days_ratio",
    "max_dow_share",
    "max_dom_share",
    "persona_code",
    "tier",
    "age",
]


def train_recommender(
    rhythm_features_path: str = "data/models/customer_rhythm_features.csv",
    customers_path: str = "data/synthetic/customers.csv",
    out_dir: str = MODEL_DIR,
) -> Tuple[lgb.LGBMClassifier, dict]:
    """
    Train LightGBM propensity model for Loan vs RD recommendation.
    """
    os.makedirs(out_dir, exist_ok=True)
    df = prepare_recommender_dataset(rhythm_features_path, customers_path)

    X = df[RECOMMENDER_FEATURES]
    y = df["target_product"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"Training LightGBM Recommender on {len(X_train)} samples, testing on {len(X_test)}...")
    clf = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=4,
        num_leaves=15,
        random_state=42,
        verbose=-1,
    )
    clf.fit(X_train, y_train)

    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    auc = roc_auc_score(y_test, y_pred_proba)
    report = classification_report(y_test, y_pred, output_dict=True)

    print("\n✅ Recommender Evaluation:")
    print(f"  - ROC-AUC Score:  {auc:.4f}")
    print(f"  - Accuracy:       {report['accuracy'] * 100:.1f}%")
    print(f"  - Precision (Loan): {report['1']['precision']:.4f}")
    print(f"  - Recall (Loan):    {report['1']['recall']:.4f}")

    # Feature Importances
    importances = dict(zip(RECOMMENDER_FEATURES, [round(float(v), 2) for v in clf.feature_importances_]))
    print("\nTop Feature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  - {feat}: {imp}")

    metrics = {
        "roc_auc": round(float(auc), 4),
        "accuracy": round(float(report["accuracy"]), 4),
        "classification_report": report,
        "feature_importances": importances,
    }

    joblib.dump({
        "model": clf,
        "feature_names": RECOMMENDER_FEATURES,
        "metrics": metrics,
    }, RECOMMENDER_PATH)

    with open(os.path.join(out_dir, "recommender_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nTrained recommender saved to {RECOMMENDER_PATH}")
    return clf, metrics


def generate_recommendation_with_guardrail(
    customer_id: str,
    customer_profile: dict,
    rhythm_features: dict,
    model_artifact: Optional[dict] = None,
) -> dict:
    """
    Applies Policy Layer & Anti-Predatory Guardrails, then runs Recommender.
    Returns recommendation, explanation in Hindi, and policy flag.
    """
    if model_artifact is None:
        model_artifact = joblib.load(RECOMMENDER_PATH)

    model = model_artifact["model"]

    # 1. Anti-Predatory Stress Gate
    is_stressed = bool(customer_profile.get("stressed", False))
    monthly_income = customer_profile.get("base_daily_income", 1000) * 30
    emi_amount = customer_profile.get("emi_amount", 0)
    debt_burden = emi_amount / max(monthly_income, 1)

    if is_stressed or debt_burden >= 0.40:
        # STRICT GUARDRAIL: Block new credit!
        return {
            "customer_id": customer_id,
            "action": "SUPPORT_AND_RESTRUCTURE",
            "product_recommended": None,
            "guardrail_triggered": "ANTI_PREDATORY_STRESS_GATE",
            "reason_hindi": (
                "Aapki pichle do hafte ki aamdani thodi kam dikh rahi hai. "
                "Paisa Saathi naye karz ke bajaye aapki maujuda EMI ko aasan karne mein madad karega."
            ),
            "loan_blocked": True,
            "emi_restructure_offer": {
                "current_emi": emi_amount,
                "suggested_grace_days": 10,
                "message": "Kya aap is mahine ki EMI ki tarikh 10 din aage badhana chahenge?",
            },
        }

    # 2. Extract feature vector for ML scoring
    savings_ratio = rhythm_features.get("savings_ratio", 0.1)
    monthly_surplus = max(0, monthly_income * savings_ratio)
    persona_map = {"vendor": 0, "gig_worker": 1, "farmer": 2, "salaried": 3}
    persona_code = persona_map.get(customer_profile.get("persona", "vendor"), 0)

    feat_vector = pd.DataFrame([{
        "base_daily_income": customer_profile.get("base_daily_income", 1000),
        "debt_burden_ratio": debt_burden,
        "savings_ratio": savings_ratio,
        "est_monthly_surplus": monthly_surplus,
        "inflow_cv": rhythm_features.get("inflow_cv", 0.5),
        "inflow_days_ratio": rhythm_features.get("inflow_days_ratio", 0.8),
        "max_dow_share": rhythm_features.get("max_dow_share", 0.2),
        "max_dom_share": rhythm_features.get("max_dom_share", 0.1),
        "persona_code": persona_code,
        "tier": customer_profile.get("tier", 3),
        "age": customer_profile.get("age", 35),
    }])

    # Predict propensity
    loan_prob = float(model.predict_proba(feat_vector)[0, 1])

    persona = customer_profile.get("persona", "vendor")
    dow_names = ["Somwar", "Mangalwar", "Budhwar", "Guruwar", "Shukrawar", "Shaniwar", "Ravivar"]
    market_day = dow_names[int(customer_profile.get("market_dow", 4)) % 7]

    if loan_prob >= 0.50:
        # Small Business Loan Offer
        loan_amount = int(min(50000, max(10000, customer_profile.get("base_daily_income", 800) * 20)))
        repayment_style = f"{market_day} ki weekly kisht" if persona == "vendor" else "Mahine ki aasan kisht"
        
        explanation_hindi = (
            f"Aapka vyapar aur rozana aamdani sthir hai. {market_day} ke bazaar flow ke anusaar, "
            f"₹{loan_amount:,} ka vyapar loan aur {repayment_style} aapke liye sabse upyukt rahegi."
        )

        return {
            "customer_id": customer_id,
            "action": "RECOMMEND_PRODUCT",
            "product_recommended": "WORKING_CAPITAL_LOAN",
            "propensity_score": round(loan_prob, 3),
            "guardrail_triggered": None,
            "loan_blocked": False,
            "details": {
                "amount": loan_amount,
                "repayment_frequency": "weekly" if persona == "vendor" else "monthly",
                "recommended_day": market_day if persona == "vendor" else "Day 5",
            },
            "reason_hindi": explanation_hindi,
        }
    else:
        # Recurring Deposit (RD) / Savings Offer
        monthly_deposit = int(max(500, round(monthly_surplus * 0.4, -2)))
        explanation_hindi = (
            f"Aapki bachat acchi chal rahi hai. Aage ke liye emergency fund banane hetu "
            f"₹{monthly_deposit:,}/mahina ka Recurring Deposit (RD) aapke liye surakshit vikalp hai."
        )

        return {
            "customer_id": customer_id,
            "action": "RECOMMEND_PRODUCT",
            "product_recommended": "RECURRING_DEPOSIT",
            "propensity_score": round(1.0 - loan_prob, 3),
            "guardrail_triggered": None,
            "loan_blocked": False,
            "details": {
                "monthly_deposit": monthly_deposit,
                "tenure_months": 12,
                "interest_rate": "6.8%",
            },
            "reason_hindi": explanation_hindi,
        }


if __name__ == "__main__":
    train_recommender()
