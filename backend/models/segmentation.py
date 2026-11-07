"""
Rhythm-Based Segmentation Module for Paisa Saathi.

Extracts cash-flow temporal rhythms from raw transaction history and
clusters customers into 4 empirical personas (Vendor, Gig Worker, Farmer, Salaried)
using k-Means on rhythm features instead of static salary credit checks.
"""

import json
import os
import sys
from typing import Optional, Tuple

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler

MODEL_DIR = "data/models"
MODEL_PATH = os.path.join(MODEL_DIR, "segmentation_kmeans.joblib")
FEATURE_NAMES = [
    "inflow_days_ratio",       # Proportion of days with >= 1 credit (high for vendors, low for farmers/salaried)
    "inflow_cv",               # Volatility of daily credits (high for farmers with lumpy harvest, low for salaried)
    "max_dow_share",           # Peak day-of-week inflow share (high for weekly market day vendors)
    "max_dom_share",           # Peak day-of-month inflow share (high for salaried on 1st-5th)
    "log_mean_credit_amt",     # Log of average credit transaction size
    "platform_inflow_share",   # Fraction of credits from delivery/gig platforms
    "mandi_inflow_share",      # Fraction of credits from agricultural mandis
    "savings_ratio",           # (Inflows - Outflows) / Inflows
]


def extract_rhythm_features(
    transactions_df: pd.DataFrame,
    total_days: int = 183,
) -> pd.DataFrame:
    """
    Extract cash-flow rhythm feature vectors per customer.
    """
    print(f"Extracting rhythm features for {transactions_df['customer_id'].nunique()} customers...")
    
    # Pre-parse timestamps
    tx = transactions_df.copy()
    tx["timestamp"] = pd.to_datetime(tx["timestamp"])
    
    tx["date"] = tx["timestamp"].dt.date
    tx["dow"] = tx["timestamp"].dt.dayofweek
    tx["day_of_month"] = tx["timestamp"].dt.day

    credits = tx[tx["direction"] == "credit"]
    debits = tx[tx["direction"] == "debit"]

    # Customer aggregates
    grouped_cust = credits.groupby("customer_id")
    
    # 1. Inflow days & count
    unique_credit_days = grouped_cust["date"].nunique()
    total_credit_amt = grouped_cust["amount"].sum()
    mean_credit_amt = grouped_cust["amount"].mean()

    # 2. Daily inflow volatility (CV = std / mean)
    daily_credits = credits.groupby(["customer_id", "date"])["amount"].sum()
    daily_std = daily_credits.groupby("customer_id").std().fillna(0)
    daily_mean = daily_credits.groupby("customer_id").mean().replace(0, 1e-5)
    inflow_cv = daily_std / daily_mean

    # 3. Day of week concentration (max_dow_share)
    dow_totals = credits.groupby(["customer_id", "dow"])["amount"].sum()
    max_dow_amt = dow_totals.groupby("customer_id").max()
    max_dow_share = (max_dow_amt / total_credit_amt.replace(0, 1e-5)).fillna(1.0 / 7)

    # 4. Day of month concentration (max_dom_share)
    dom_totals = credits.groupby(["customer_id", "day_of_month"])["amount"].sum()
    max_dom_amt = dom_totals.groupby("customer_id").max()
    max_dom_share = (max_dom_amt / total_credit_amt.replace(0, 1e-5)).fillna(1.0 / 30)

    # 5. Counterparty type shares
    platform_credits = credits[credits["counterparty_type"] == "platform"].groupby("customer_id")["amount"].sum()
    platform_inflow_share = (platform_credits / total_credit_amt).fillna(0)

    mandi_credits = credits[credits["counterparty_type"] == "mandi"].groupby("customer_id")["amount"].sum()
    mandi_inflow_share = (mandi_credits / total_credit_amt).fillna(0)

    # 6. Outflow & Savings ratio
    total_debit_amt = debits.groupby("customer_id")["amount"].sum()
    net_savings = total_credit_amt - total_debit_amt
    savings_ratio = (net_savings / total_credit_amt.replace(0, 1e-5)).clip(-1.0, 1.0).fillna(0)

    # Assemble feature dataframe
    all_customers = transactions_df["customer_id"].unique()
    features = pd.DataFrame(index=all_customers)
    features.index.name = "customer_id"

    features["inflow_days_ratio"] = (unique_credit_days / total_days).clip(0, 1).fillna(0)
    features["inflow_cv"] = inflow_cv.fillna(0)
    features["max_dow_share"] = max_dow_share.fillna(1.0 / 7)
    features["max_dom_share"] = max_dom_share.fillna(1.0 / 30)
    features["log_mean_credit_amt"] = np.log1p(mean_credit_amt.fillna(0))
    features["platform_inflow_share"] = platform_inflow_share.fillna(0)
    features["mandi_inflow_share"] = mandi_inflow_share.fillna(0)
    features["savings_ratio"] = savings_ratio.fillna(0)

    return features.reset_index()


def map_clusters_to_personas(
    kmeans: KMeans,
    features_df: pd.DataFrame,
    cluster_labels: np.ndarray,
) -> dict[int, str]:
    """
    Empirically map cluster indices (0..3) to human-readable personas based on centroid signatures.
    """
    df = features_df.copy()
    df["cluster"] = cluster_labels
    means = df.groupby("cluster")[FEATURE_NAMES].mean()

    mapping = {}
    remaining_clusters = set(range(kmeans.n_clusters))

    # 1. Salaried: Highest day-of-month concentration
    salaried_cluster = means["max_dom_share"].idxmax()
    mapping[salaried_cluster] = "salaried"
    remaining_clusters.remove(salaried_cluster)

    # 2. Farmer: Highest mandi share (or highest CV)
    means_rem = means.loc[list(remaining_clusters)]
    farmer_cluster = means_rem["mandi_inflow_share"].idxmax()
    if means_rem.loc[farmer_cluster, "mandi_inflow_share"] == 0:
        farmer_cluster = means_rem["inflow_cv"].idxmax()
    mapping[farmer_cluster] = "farmer"
    remaining_clusters.remove(farmer_cluster)

    # 3. Gig Worker: Highest platform inflow share
    means_rem = means.loc[list(remaining_clusters)]
    gig_cluster = means_rem["platform_inflow_share"].idxmax()
    mapping[gig_cluster] = "gig_worker"
    remaining_clusters.remove(gig_cluster)

    # 4. Vendor: Remaining cluster (daily sales, weekly market day)
    vendor_cluster = remaining_clusters.pop()
    mapping[vendor_cluster] = "vendor"

    return mapping


def train_segmentation(
    transactions_path: str = "data/synthetic/transactions.csv",
    customers_path: str = "data/synthetic/customers.csv",
    out_dir: str = MODEL_DIR,
) -> Tuple[KMeans, StandardScaler, dict]:
    """
    Train k-Means segmentation model and evaluate clustering quality.
    """
    os.makedirs(out_dir, exist_ok=True)
    
    tx = pd.read_csv(transactions_path)
    cust = pd.read_csv(customers_path) if os.path.exists(customers_path) else None

    features_df = extract_rhythm_features(tx)
    X = features_df[FEATURE_NAMES].values

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Fit k-Means
    print("Fitting k-Means (k=4) on cash-flow rhythm features...")
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)

    # Map clusters to personas
    raw_mapping = map_clusters_to_personas(kmeans, features_df, cluster_labels)
    mapping = {int(k): str(v) for k, v in raw_mapping.items()}
    predicted_personas = [mapping[c] for c in cluster_labels]
    features_df["predicted_persona"] = predicted_personas

    # Metrics
    sil_score = silhouette_score(X_scaled, cluster_labels)
    metrics = {
        "silhouette_score": round(float(sil_score), 4),
        "cluster_to_persona_map": mapping,
        "features": FEATURE_NAMES,
    }

    if cust is not None:
        merged = features_df.merge(cust[["customer_id", "persona"]], on="customer_id")
        ari = adjusted_rand_score(merged["persona"], merged["predicted_persona"])
        accuracy = (merged["persona"] == merged["predicted_persona"]).mean()
        metrics["adjusted_rand_index"] = round(float(ari), 4)
        metrics["ground_truth_accuracy"] = round(float(accuracy), 4)
        print(f"\n✅ Clustering Evaluation:")
        print(f"  - Silhouette Score:       {metrics['silhouette_score']:.4f}")
        print(f"  - Adjusted Rand Index:    {metrics['adjusted_rand_index']:.4f}")
        print(f"  - Ground Truth Accuracy:  {metrics['ground_truth_accuracy'] * 100:.1f}%\n")
        print("Confusion Matrix:")
        print(pd.crosstab(merged["persona"], merged["predicted_persona"], rownames=["True"], colnames=["Cluster Pred"]))

    # Save artifacts
    joblib.dump({
        "kmeans": kmeans,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "mapping": mapping,
        "metrics": metrics,
    }, MODEL_PATH)

    with open(os.path.join(out_dir, "segmentation_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    features_df.to_csv(os.path.join(out_dir, "customer_rhythm_features.csv"), index=False)
    print(f"\nModel and features saved to {out_dir}/")
    return kmeans, scaler, mapping


if __name__ == "__main__":
    train_segmentation()
