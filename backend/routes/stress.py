"""
Early Stress Detection API routes for Paisa Saathi.
Serves:
  1. Customer supportive care / restructuring trigger
  2. Proactive RM / Banker Stress Queue
"""

import os
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException

from backend.models.stress import check_customer_stress_live

router = APIRouter(prefix="/api/stress", tags=["stress"])

STRESS_RESULTS_CSV = "data/models/customer_stress_results.csv"
CUSTOMERS_CSV = "data/synthetic/customers.csv"


@router.get("/queue")
async def get_stress_queue(limit: int = 50):
    """
    Banker / RM proactive care queue:
    Lists customers experiencing cash-flow deceleration before default happens.
    """
    if not os.path.exists(STRESS_RESULTS_CSV):
        raise HTTPException(status_code=404, detail="Stress evaluation results not found. Run training first.")

    res_df = pd.read_csv(STRESS_RESULTS_CSV)
    cust_df = pd.read_csv(CUSTOMERS_CSV).set_index("customer_id")

    # Stressed customers with loans
    stressed = res_df[res_df["pred_stressed"]].copy()
    stressed = stressed.merge(cust_df[["persona", "base_daily_income", "emi_amount", "has_loan", "tier"]], on="customer_id")
    
    # Prioritize customers with active loans
    stressed = stressed.sort_values(by=["has_loan", "inflow_drop_ratio"], ascending=[False, False])

    records = []
    for _, row in stressed.head(limit).iterrows():
        records.append({
            "customer_id": row["customer_id"],
            "persona": row["persona"],
            "tier": int(row["tier"]),
            "has_loan": bool(row["has_loan"]),
            "current_emi": float(row["emi_amount"]),
            "inflow_drop_percentage": round(float(row["inflow_drop_ratio"]) * 100, 1),
            "lead_days_before_emi": int(row["lead_days_before_emi"]) if pd.notna(row.get("lead_days_before_emi")) else None,
            "recommended_action": "Offer 10-day EMI date shift (Care outreach)" if row["has_loan"] else "Financial buffer guidance",
        })

    return {
        "total_stressed_detected": len(stressed),
        "queue": records,
    }


@router.get("/{customer_id}")
async def get_customer_stress(customer_id: str):
    """
    Customer stress evaluation endpoint.
    Returns supportive care message and EMI shift option (never shows a raw stress score).
    """
    result = check_customer_stress_live(customer_id)
    return result
