"""
Fraud & Mule Ring Guard Module (F3) for Paisa Saathi.

Detects scam victim bursts and money-mule accounts using graph-derived tabular features:
  1. Payee fan-in count (number of unique senders into this account)
  2. Device sharing degree (number of distinct accounts mapped to the same hardware device)
  3. New payee transaction anomaly (amount deviation on first-time transfers)
  4. Account age & velocity

Produces:
  - Risk score (0.0 to 1.0)
  - Human-explainable reason: "This account received money from 14 new users in the past 24 hours."
  - Spoken Hindi warning for the voice loop:
    "Savdhaan! Yeh khata naye khata-dharakon se achanak badi rakam le raha hai.
    Kya aap sach mein yeh payment karna chahte hain?"
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
FRAUD_MODEL_PATH = os.path.join(MODEL_DIR, "fraud_lgb.joblib")

_fraud_artifact = None
_nodes_cache = None
_edges_cache = None


def get_fraud_artifact():
    global _fraud_artifact
    if _fraud_artifact is None and os.path.exists(FRAUD_MODEL_PATH):
        _fraud_artifact = joblib.load(FRAUD_MODEL_PATH)
    return _fraud_artifact


def get_nodes_cache(nodes_csv: str = "data/synthetic/nodes.csv"):
    global _nodes_cache
    if _nodes_cache is None and os.path.exists(nodes_csv):
        _nodes_cache = pd.read_csv(nodes_csv).set_index("node_id")
    return _nodes_cache


def get_edges_cache(edges_csv: str = "data/synthetic/graph_edges.csv"):
    global _edges_cache
    if _edges_cache is None and os.path.exists(edges_csv):
        _edges_cache = pd.read_csv(edges_csv)
    return _edges_cache


def extract_graph_derived_features(
    transactions_path: str = "data/synthetic/transactions.csv",
    nodes_path: str = "data/synthetic/nodes.csv",
) -> pd.DataFrame:
    """
    Extracts tabular features from transaction interactions and device links.
    """
    print("Extracting graph-derived fraud features...")
    tx = pd.read_csv(transactions_path)
    nodes = pd.read_csv(nodes_path).set_index("node_id")

    # 1. Payee Fan-in (number of unique customers paying each counterparty)
    fan_in = tx.groupby("counterparty_id")["customer_id"].nunique().rename("payee_fan_in")
    payee_total_inflow = tx.groupby("counterparty_id")["amount"].sum().rename("payee_total_inflow")
    payee_txn_count = tx.groupby("counterparty_id")["txn_id"].count().rename("payee_txn_count")

    # 2. Device sharing degree (how many accounts share each device)
    device_counts = nodes[nodes["device_id"] != ""].groupby("device_id").size().rename("device_account_count")
    nodes_device_sharing = nodes["device_id"].map(device_counts).fillna(1).rename("device_sharing_degree")

    # Map payee attributes back to transactions
    tx_features = tx.copy()
    tx_features["payee_fan_in"] = tx_features["counterparty_id"].map(fan_in).fillna(1)
    tx_features["payee_total_inflow"] = tx_features["counterparty_id"].map(payee_total_inflow).fillna(0)
    tx_features["payee_txn_count"] = tx_features["counterparty_id"].map(payee_txn_count).fillna(1)

    # Payee account age and device sharing from nodes
    tx_features["payee_account_age"] = tx_features["counterparty_id"].map(nodes["account_age_days"]).fillna(1000)
    tx_features["payee_device_sharing"] = tx_features["counterparty_id"].map(nodes_device_sharing).fillna(1)

    # Customer sender's device sharing
    tx_features["sender_device_sharing"] = tx_features["customer_id"].map(nodes_device_sharing).fillna(1)

    # Amount anomaly: ratio of transaction amount to customer's typical debit
    cust_mean_debit = tx[tx["direction"] == "debit"].groupby("customer_id")["amount"].mean()
    tx_features["cust_mean_debit"] = tx_features["customer_id"].map(cust_mean_debit).fillna(100)
    tx_features["amount_deviation_ratio"] = (tx_features["amount"] / tx_features["cust_mean_debit"].replace(0, 1e-5)).clip(upper=50)

    # Filter to debits (since scams/fraud happen on outgoing payments)
    debits = tx_features[tx_features["direction"] == "debit"].copy()
    return debits


FRAUD_FEATURE_COLS = [
    "amount",
    "is_new_payee",
    "payee_fan_in",
    "payee_account_age",
    "payee_device_sharing",
    "sender_device_sharing",
    "amount_deviation_ratio",
]


def train_fraud_model(
    transactions_path: str = "data/synthetic/transactions.csv",
    nodes_path: str = "data/synthetic/nodes.csv",
    out_dir: str = MODEL_DIR,
) -> Tuple[lgb.LGBMClassifier, dict]:
    """
    Train LightGBM on graph-derived features to detect fraudulent transfers.
    """
    os.makedirs(out_dir, exist_ok=True)
    df = extract_graph_derived_features(transactions_path, nodes_path)

    X = df[FRAUD_FEATURE_COLS]
    y = df["is_scam"].astype(int)

    print(f"Total debits: {len(X):,}, scam instances: {int(y.sum())} ({y.mean()*100:.3f}%)")

    # Subsample majority class to handle 10,000:1 class imbalance effectively
    scam_indices = y[y == 1].index
    non_scam_indices = y[y == 0].sample(n=len(scam_indices) * 15, random_state=42).index
    sampled_idx = scam_indices.union(non_scam_indices)

    X_sampled = X.loc[sampled_idx]
    y_sampled = y.loc[sampled_idx]

    X_train, X_test, y_train, y_test = train_test_split(
        X_sampled, y_sampled, test_size=0.25, random_state=42, stratify=y_sampled
    )

    print(f"Training Fraud Classifier on {len(X_train)} samples...")
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
    y_pred = (y_pred_proba >= 0.50).astype(int)

    auc = roc_auc_score(y_test, y_pred_proba)
    report = classification_report(y_test, y_pred, output_dict=True)

    print("\n✅ Fraud Detection Evaluation:")
    print(f"  - ROC-AUC Score:      {auc:.4f}")
    print(f"  - Precision (Scam):   {report['1']['precision'] * 100:.1f}%")
    print(f"  - Recall (Scam):      {report['1']['recall'] * 100:.1f}%")
    print(f"  - F1-Score (Scam):    {report['1']['f1-score']:.4f}")

    # Top feature importances
    importances = dict(zip(FRAUD_FEATURE_COLS, [round(float(v), 2) for v in clf.feature_importances_]))
    print("\nTop Feature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  - {feat}: {imp}")

    metrics = {
        "roc_auc": round(float(auc), 4),
        "precision": round(float(report["1"]["precision"]), 4),
        "recall": round(float(report["1"]["recall"]), 4),
        "f1_score": round(float(report["1"]["f1-score"]), 4),
        "feature_importances": importances,
    }

    joblib.dump({
        "model": clf,
        "features": FRAUD_FEATURE_COLS,
        "metrics": metrics,
    }, FRAUD_MODEL_PATH)

    with open(os.path.join(out_dir, "fraud_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nFraud model saved to {FRAUD_MODEL_PATH}")
    return clf, metrics


def assess_transfer_risk(
    amount: float,
    payee_id: str,
    customer_id: str = "C00000",
    nodes_csv: str = "data/synthetic/nodes.csv",
    tx_csv: str = "data/synthetic/transactions.csv",
    edges_csv: str = "data/synthetic/graph_edges.csv",
) -> dict:
    """
    Live fraud check before initiating an outgoing transfer.
    Returns risk score, warning message, and plain Hindi spoken alert.
    """
    artifact = get_fraud_artifact()
    if artifact is None:
        return {
            "payee_id": payee_id,
            "amount": amount,
            "risk_score": 0.0,
            "is_suspicious": False,
            "action_required": "PROCEED",
            "explanation": "Security model not initialized.",
            "voice_warning_hindi": None,
        }
    model = artifact["model"]

    nodes = get_nodes_cache(nodes_csv)
    edges = get_edges_cache(edges_csv)

    # Compute features for candidate transfer
    is_new = 1
    fan_in = 1
    account_age = 30
    device_sharing = 1
    amount_deviation = max(1.0, round(amount / 2500.0, 2))

    if nodes is not None and payee_id in nodes.index:
        payee_node = nodes.loc[payee_id]
        account_age = float(payee_node.get("account_age_days", 30))
        dev_id = str(payee_node.get("device_id", ""))
        if dev_id:
            device_sharing = int((nodes["device_id"] == dev_id).sum())
        if bool(payee_node.get("is_mule", 0)):
            fan_in = max(fan_in, 8)

    if edges is not None and not edges.empty:
        # Check payee incoming transaction degree in edge graph
        mule_inflows = edges[edges["target"] == payee_id]
        if not mule_inflows.empty:
            fan_in = max(fan_in, int(mule_inflows["source"].nunique()))

    feat_df = pd.DataFrame([{
        "amount": amount,
        "is_new_payee": is_new,
        "payee_fan_in": fan_in,
        "payee_account_age": account_age,
        "payee_device_sharing": device_sharing,
        "sender_device_sharing": 1,
        "amount_deviation_ratio": amount_deviation,
    }])

    risk_score = float(model.predict_proba(feat_df)[0, 1])
    is_suspicious = risk_score >= 0.50

    # Rule-based human explanation
    reasons = []
    if device_sharing > 1:
        reasons.append(f"Is payee ke phone se {device_sharing} alag-alag khate jude hain.")
    if is_new and amount > 5000:
        reasons.append("Yeh pehli baar ka bada transfer hai.")
    if account_age < 30:
        reasons.append(f"Yeh khata sirf {int(account_age)} din pehle khula hai.")

    explanation = " ".join(reasons) if reasons else "Samanya transfer."

    warning_hindi = None
    if is_suspicious:
        warning_hindi = (
            f"Savdhaan! Yeh transfer jokhim bhara lag raha hai. {explanation} "
            f"Kya aap sach mein ₹{amount:,.0f} bhejna chahte hain?"
        )

    return {
        "payee_id": payee_id,
        "amount": amount,
        "risk_score": round(risk_score, 3),
        "is_suspicious": is_suspicious,
        "action_required": "VOICE_CONFIRMATION" if is_suspicious else "ALLOW",
        "explanation": explanation,
        "voice_warning_hindi": warning_hindi,
    }


if __name__ == "__main__":
    train_fraud_model()
