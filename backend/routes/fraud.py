"""
Fraud & Transfer Risk Guard routes for Paisa Saathi.
Intercepts suspicious transfers with explainable scam warnings.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from backend.models.fraud import assess_transfer_risk

router = APIRouter(prefix="/api/fraud", tags=["fraud"])


class TransferCheckRequest(BaseModel):
    customer_id: str = "C00000"
    payee_id: str
    amount: float


@router.post("/check-transfer")
async def check_transfer_risk(req: TransferCheckRequest):
    """
    Evaluates risk on a candidate outgoing payment.
    If suspicious, returns explainable warning and spoken Hindi alert.
    Never silently blocks — requests explicit voice confirmation.
    """
    result = assess_transfer_risk(
        amount=req.amount,
        payee_id=req.payee_id,
        customer_id=req.customer_id,
    )
    return result
