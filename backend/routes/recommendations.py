"""
Recommendation & Policy Layer routes for Paisa Saathi.
Serves personalized next-best product recommendations, policy guardrails,
and plain Hindi explanations.
"""

from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.models.recommender import generate_recommendation_with_guardrail

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

CUSTOMERS_CSV = "data/synthetic/customers.csv"
FEATURES_CSV = "data/models/customer_rhythm_features.csv"


class RecommendationRequest(BaseModel):
    customer_id: str


@router.get("/{customer_id}")
async def get_customer_recommendation(customer_id: str):
    """
    Get personalized recommendation for a customer with anti-predatory guardrails.
    """
    try:
        cust_df = pd.read_csv(CUSTOMERS_CSV).set_index("customer_id")
        feat_df = pd.read_csv(FEATURES_CSV).set_index("customer_id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data files not loaded: {e}")

    if customer_id not in cust_df.index:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    cust_profile = cust_df.loc[customer_id].to_dict()
    feat_profile = feat_df.loc[customer_id].to_dict() if customer_id in feat_df.index else {}

    result = generate_recommendation_with_guardrail(
        customer_id=customer_id,
        customer_profile=cust_profile,
        rhythm_features=feat_profile,
    )
    return result
