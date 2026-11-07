"""
6-Step Guided Loan Journey & Consent Engine for Paisa Saathi.

Implements the official 6-Step Voice & Text Loan Flow:
  Step 1: Language & Mode (Hindi/English, Voice/Text)
  Step 2: Granular Consent & Data Rights (3 toggles, plain Hindi notice, withdraw right)
  Step 3: Identity Verification (Simulated Demo ID, no real Aadhaar)
  Step 4: Income & Business Confirmation (Pre-filled from cash-flow rhythm)
  Step 5: Personalized Offer Presentation (Connected to Recommender & Policy Gate)
  Step 6: Final Spoken Confirmation (Summary read aloud with explicit Yes/No)

Features:
  - Save & resume session tracking
  - Voice prompt generation per step
  - Drop-off mitigation & fallback support
"""

import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.models.recommender import generate_recommendation_with_guardrail

router = APIRouter(prefix="/api/journey", tags=["journey"])

CUSTOMERS_CSV = "data/synthetic/customers.csv"
FEATURES_CSV = "data/models/customer_rhythm_features.csv"

# In-memory session store (keyed by session_id and customer_id for save/resume)
_journey_sessions: Dict[str, Dict[str, Any]] = {}
_customer_to_session: Dict[str, str] = {}


def get_customer_row(customer_id: str) -> Optional[dict]:
    if os.path.exists(CUSTOMERS_CSV):
        df = pd.read_csv(CUSTOMERS_CSV).set_index("customer_id")
        if customer_id in df.index:
            return df.loc[customer_id].to_dict()
    return None


def get_rhythm_row(customer_id: str) -> Optional[dict]:
    if os.path.exists(FEATURES_CSV):
        df = pd.read_csv(FEATURES_CSV).set_index("customer_id")
        if customer_id in df.index:
            return df.loc[customer_id].to_dict()
    return None


class ConsentToggles(BaseModel):
    share_transactions: bool = True
    verify_identity: bool = True
    evaluate_offers: bool = True


class JourneyState(BaseModel):
    session_id: str
    customer_id: str
    current_step: int = Field(1, ge=1, le=6)
    total_steps: int = 6
    language: str = "hi"  # "hi" or "en"
    mode: str = "voice"   # "voice" or "text"
    consent: Dict[str, Any] = Field(default_factory=dict)
    identity: Dict[str, Any] = Field(default_factory=dict)
    income_business: Dict[str, Any] = Field(default_factory=dict)
    offer: Optional[Dict[str, Any]] = None
    confirmation: Optional[Dict[str, Any]] = None
    status: str = "IN_PROGRESS"  # IN_PROGRESS, COMPLETED, BLOCKED_GUARDRAIL
    spoken_prompt_hindi: str = ""
    spoken_prompt_en: str = ""
    last_updated: str = ""


def build_step_prompts(state: dict, customer: Optional[dict] = None) -> Tuple[str, str]:
    """Generates the localized conversational prompt for the current step."""
    step = state["current_step"]
    persona = customer.get("persona", "vendor") if customer else "vendor"
    dow_names = ["Somwar", "Mangalwar", "Budhwar", "Guruwar", "Shukrawar", "Shaniwar", "Ravivar"]
    dow_names_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    m_idx = int(customer.get("market_dow", 4)) % 7 if customer else 4
    market_day = dow_names[m_idx]
    market_day_en = dow_names_en[m_idx]

    if step == 1:
        hi = "Namaste! Main Paisa Saathi hoon. Aap kis bhasha mein baat karna chahenge — Hindi ya English? Aur awaaz se ya likhkar?"
        en = "Hello! I am Paisa Saathi. Which language would you prefer — Hindi or English? And would you like to speak or type?"
    elif step == 2:
        hi = "Aage badhne ke liye, kripya bataiye kya hum aapka len-den aur pehchan verify kar sakte hain? Aap jab chahein ise wapas le sakte hain."
        en = "To proceed, do you consent to sharing your transaction history and identity verification? You can withdraw consent anytime."
    elif step == 3:
        hi = "Pehchan pushti: Kripya apna demo aavedan number pusht karein."
        en = "Identity verification: Please confirm your demo ID for verification."
    elif step == 4:
        inc = customer.get("base_daily_income", 800) if customer else 800
        hi = (
            f"Aapka vyapar: {persona.title()}. Aapki rozana aamdani lagbhag ₹{inc:.0f} aur mukhy bikri ka din {market_day} hai. "
            "Kya yeh jankari sahi hai?"
        )
        en = (
            f"Your business: {persona.title()}. Your daily revenue is approximately ₹{inc:.0f} with peak sales on {market_day_en}. "
            "Is this accurate?"
        )
    elif step == 5:
        offer = state.get("offer", {})
        if offer and offer.get("loan_blocked"):
            hi = offer.get("reason_hindi", "Aapki pichle dino ki aamdani kam rahi hai. Hum naya karz nahi denge.")
            en = "Due to recent income fluctuations, we are offering EMI date restructuring instead of new debt."
        elif offer and offer.get("product_recommended") == "WORKING_CAPITAL_LOAN":
            amt = offer.get("details", {}).get("amount", 20000)
            hi = (
                f"Badhai ho! Aapke liye ₹{amt:,} ka working capital loan uplabdh hai. "
                f"Kisht aapke {market_day} ke bazaar din ke anusaar rahegi. Kya aap yeh offer lena chahenge?"
            )
            en = f"Congratulations! A working capital loan of ₹{amt:,} is ready for you, synced to your {market_day_en} market day. Would you like to accept?"
        else:
            hi = offer.get("reason_hindi", "Aapke liye ek surakshit Recurring Deposit (RD) bachat yojana uplabdh hai.")
            en = "A Recurring Deposit savings buffer is recommended based on your healthy surplus."
    elif step == 6:
        hi = "Antim pushti: Aapka aavedan taiyar hai. Kya aap niyam aur shartein manjoor karte hain? (Haan ya Nahi)"
        en = "Final confirmation: Your application summary is ready. Do you accept the terms? (Yes or No)"
    else:
        hi = "Aavedan safaltapoorvak poora ho gaya hai!"
        en = "Application completed successfully!"

    return hi, en


@router.post("/start")
async def start_or_resume_journey(customer_id: str = "C00000"):
    """
    Start or resume a 6-step guided loan journey for a customer.
    Ensures save & resume so user progress is never lost.
    """
    # Check existing session
    if customer_id in _customer_to_session:
        session_id = _customer_to_session[customer_id]
        if session_id in _journey_sessions:
            session = _journey_sessions[session_id]
            cust = get_customer_row(customer_id)
            hi, en = build_step_prompts(session, cust)
            session["spoken_prompt_hindi"] = hi
            session["spoken_prompt_en"] = en
            return session

    # Create new session
    session_id = f"JRN-{uuid.uuid4().hex[:8].upper()}"
    cust = get_customer_row(customer_id)
    rhythm = get_rhythm_row(customer_id)

    # Pre-calculate next-best offer for later steps
    initial_offer = None
    if cust:
        initial_offer = generate_recommendation_with_guardrail(
            customer_id=customer_id,
            customer_profile=cust,
            rhythm_features=rhythm or {},
        )

    session_data = {
        "session_id": session_id,
        "customer_id": customer_id,
        "current_step": 1,
        "total_steps": 6,
        "language": "hi",
        "mode": "voice",
        "consent": {
            "share_transactions": True,
            "verify_identity": True,
            "evaluate_offers": True,
            "granted_at": datetime.now().isoformat(),
        },
        "identity": {
            "synthetic_id": f"DEMO-{customer_id}",
            "verified": True,
        },
        "income_business": {
            "persona": cust.get("persona", "vendor") if cust else "vendor",
            "daily_income": float(cust.get("base_daily_income", 1000)) if cust else 1000.0,
            "confirmed": False,
        },
        "offer": initial_offer,
        "confirmation": None,
        "status": "IN_PROGRESS",
        "last_updated": datetime.now().isoformat(),
    }

    hi, en = build_step_prompts(session_data, cust)
    session_data["spoken_prompt_hindi"] = hi
    session_data["spoken_prompt_en"] = en

    _journey_sessions[session_id] = session_data
    _customer_to_session[customer_id] = session_id

    return session_data


@router.get("/{session_id}")
async def get_journey_status(session_id: str):
    """Get current journey state and prompts."""
    if session_id not in _journey_sessions:
        raise HTTPException(status_code=404, detail="Journey session not found")
    
    session = _journey_sessions[session_id]
    cust = get_customer_row(session["customer_id"])
    hi, en = build_step_prompts(session, cust)
    session["spoken_prompt_hindi"] = hi
    session["spoken_prompt_en"] = en
    return session


class AdvanceStepRequest(BaseModel):
    step_input: Optional[Dict[str, Any]] = None


@router.post("/{session_id}/advance")
async def advance_journey_step(session_id: str, req: AdvanceStepRequest):
    """
    Advance to the next step of the 6-step journey with business validation.
    """
    if session_id not in _journey_sessions:
        raise HTTPException(status_code=404, detail="Journey session not found")

    session = _journey_sessions[session_id]
    step = session["current_step"]
    data = req.step_input or {}
    cust = get_customer_row(session["customer_id"])

    # Step 1: Language & Mode
    if step == 1:
        if "language" in data:
            session["language"] = data["language"]
        if "mode" in data:
            session["mode"] = data["mode"]
        session["current_step"] = 2

    # Step 2: Consent Toggles
    elif step == 2:
        toggles = data.get("consent", {})
        session["consent"].update(toggles)
        if not session["consent"].get("share_transactions", True):
            raise HTTPException(status_code=400, detail="Transaction access consent is required to evaluate loan eligibility.")
        session["current_step"] = 3

    # Step 3: Identity Verification (Simulated)
    elif step == 3:
        session["identity"]["verified"] = True
        session["current_step"] = 4

    # Step 4: Income & Business Confirmation
    elif step == 4:
        session["income_business"]["confirmed"] = True
        # Check policy guardrail on offer
        offer = session.get("offer")
        if offer and offer.get("loan_blocked"):
            session["status"] = "BLOCKED_GUARDRAIL"
        session["current_step"] = 5

    # Step 5: Offer Acceptance
    elif step == 5:
        accepted = data.get("accepted", True)
        if not accepted:
            session["status"] = "OFFER_DECLINED"
            return session
        session["current_step"] = 6

    # Step 6: Final Confirmation
    elif step == 6:
        agreed = data.get("agreed", True)
        if agreed:
            session["confirmation"] = {
                "contract_id": f"CTR-{uuid.uuid4().hex[:6].upper()}",
                "agreed_at": datetime.now().isoformat(),
                "status": "APPROVED",
            }
            session["status"] = "COMPLETED"
        else:
            session["status"] = "CANCELLED"

    session["last_updated"] = datetime.now().isoformat()
    hi, en = build_step_prompts(session, cust)
    session["spoken_prompt_hindi"] = hi
    session["spoken_prompt_en"] = en

    return session


@router.post("/{session_id}/withdraw-consent")
async def withdraw_consent(session_id: str):
    """
    Privacy & User Rights Control:
    Allows user to immediately withdraw consent and purge sensitive transaction insights.
    """
    if session_id not in _journey_sessions:
        raise HTTPException(status_code=404, detail="Journey session not found")

    session = _journey_sessions[session_id]
    session["consent"] = {
        "share_transactions": False,
        "verify_identity": False,
        "evaluate_offers": False,
        "withdrawn_at": datetime.now().isoformat(),
    }
    session["offer"] = None
    session["status"] = "CONSENT_WITHDRAWN"
    session["current_step"] = 2
    session["spoken_prompt_hindi"] = "Aapka data consent wapas le liya gaya hai. Naya aavedan shuru karne ke liye sahmati dein."
    session["spoken_prompt_en"] = "Your consent has been withdrawn. Please grant consent to begin a new application."

    return session
