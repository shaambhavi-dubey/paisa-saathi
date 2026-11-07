"""
Voice interaction routes for Paisa Saathi.
Orchestrates:
  1. Prisma v2.5 (STT) - Speech to text
  2. Evon LLM - Persona-aware Hindi conversational reasoning
  3. Timbre v2.5 (TTS) - Text to speech with automatic text-only fallback
"""

import base64
import os
import time
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from backend.gnani_client import (
    chat_with_evon,
    synthesize_speech,
    transcribe_audio,
)

router = APIRouter(prefix="/api/voice", tags=["voice"])

# Cache customer database if generated
CUSTOMERS_CSV = "data/synthetic/customers.csv"
_customers_cache: Optional[dict[str, dict]] = None


def get_customer_profile(customer_id: str) -> Optional[dict]:
    """Retrieve synthetic customer profile if available."""
    global _customers_cache
    if _customers_cache is None:
        if os.path.exists(CUSTOMERS_CSV):
            try:
                df = pd.read_csv(CUSTOMERS_CSV)
                _customers_cache = {
                    row["customer_id"]: row.to_dict()
                    for _, row in df.iterrows()
                }
            except Exception:
                _customers_cache = {}
        else:
            _customers_cache = {}
    return _customers_cache.get(customer_id)


def build_system_prompt(customer_id: Optional[str] = None, step: Optional[int] = None) -> str:
    """Build a persona-tailored banking companion prompt in Hindi/Hinglish."""
    base_instructions = (
        "Aap Paisa Saathi hain — ek vinamra, sahayak aur bharosemand Hindi banking sathi. "
        "Aap Tier-2/Tier-3 aur aniyamit aay (vendors, gig workers, farmers) wale grahakon ki madad karte hain.\n"
        "Niyam:\n"
        "1. Bhasha: Saral Hindi ya Hinglish mein baat karein. Kathin banking shabdon ka prayog na karein.\n"
        "2. Lambai: Hamesha chhota aur spasht uttar dein (sirf 2-3 sentences).\n"
        "3. Tone: Sahayak, aadarpoorvak aur protsahak, bina kisi dabav ke.\n"
        "4. Koshish karein ki grahak ko lage ki bank unki cashflow rhythm (bazaar ka din, fasal ka samay) ko samajhta hai.\n"
        "5. Loan aavedan ke steps: Agar grahak loan ke steps, prakriya ya aavedan ke baare mein pooche, toh unhe spasht batayein:\n"
        "   Paisa Saathi par digital loan lene ke 5 aasan steps hain: 1) Bhasha chunav, 2) Data sahmati (Consent), 3) Pehchan pushti, 4) Mandi aay pushti, aur 5) Manpasand offer accept karna.\n"
        "   Grahak screen par 'Apply for Loan' button daba kar ya bolkar abhi aavedan shuru kar sakte hain.\n"
        "6. Hamesha pehle grahak ke prashna ka seedha aur vishwasniya uttar dein. Kabhi bhi bina sawal ka uttar diye default bhasha chunne ka message na doharayein."
    )

    if customer_id:
        profile = get_customer_profile(customer_id)
        if profile:
            persona = profile.get("persona", "customer")
            income = profile.get("base_daily_income", 1000)
            dow_names = ["Somwar", "Mangalwar", "Budhwar", "Guruwar", "Shukrawar", "Shaniwar", "Ravivar"]
            market_day = dow_names[int(profile.get("market_dow", 4)) % 7]
            base_instructions += (
                f"\n\nGrahak ki jankari:\n"
                f"- Grahak ID: {customer_id}\n"
                f"- Karya: {persona}\n"
                f"- Rozana aumdan: lagbhag ₹{income:.0f}\n"
                f"- Bazaar ka mukhy din: {market_day}\n"
                f"- Loan status: {'Pehle se chhota loan chal raha hai' if profile.get('has_loan') else 'Naya aawedak'}\n"
            )

    if step:
        step_contexts = {
            1: "Context: Grahak aavedan ke Step 1 (Language & Mode) par hai. Agar grahak koi prashna pooch raha hai toh pehle uska uttar dein, fir bhasha ya madhyam chunne ko kahein.",
            2: "Context: Grahak Step 2 par hai. Data consent (sahmat) ke baare mein saral Hindi mein batayein.",
            3: "Context: Identity verification — aavedan shuru karne ke liye pehchan patra ki pushti karein.",
            4: "Context: Aay aur dukan/vyapar ki jankari confirm karein.",
            5: "Context: Grahak ke anukool offer pesh karein.",
            6: "Context: Antim pushti — shart aur EMI bata kar grahak se sahmati maangein.",
        }

        ctx = step_contexts.get(step, "")
        if step == 5 and customer_id:
            try:
                from backend.models.recommender import generate_recommendation_with_guardrail
                feat_df = pd.read_csv("data/models/customer_rhythm_features.csv").set_index("customer_id")
                feat = feat_df.loc[customer_id].to_dict() if customer_id in feat_df.index else {}
                rec = generate_recommendation_with_guardrail(customer_id, get_customer_profile(customer_id) or {}, feat)
                ctx += f"\nRecommender output: {rec.get('reason_hindi')}"
            except Exception:
                pass
        base_instructions += f"\n\n{ctx}"

    return base_instructions


class TextChatRequest(BaseModel):
    message: str
    customer_id: Optional[str] = "C00000"
    journey_step: Optional[int] = None
    language: str = "hi-IN"
    synthesize_audio: bool = True


class VoiceResponse(BaseModel):
    user_transcript: str
    assistant_reply: str
    audio_base64: Optional[str] = None
    audio_format: str = "audio/wav"
    latency: dict
    step: Optional[int] = None


@router.post("/process-audio", response_model=VoiceResponse)
async def process_audio(
    audio_file: UploadFile = File(...),
    customer_id: Optional[str] = Form("C00000"),
    journey_step: Optional[int] = Form(None),
    language: str = Form("hi-IN"),
    synthesize_audio: bool = Form(True),
):
    """
    End-to-End Voice Interaction Loop:
      1. Receives audio from user microphone (WAV/WebM/MP3)
      2. Transcribes via Gnani Prisma v2.5 (STT)
      3. Processes intent with Evon LLM (persona-aware banking companion)
      4. Synthesizes Hindi voice response with Gnani Timbre v2.5 (TTS)
      5. Returns transcript, reply text, audio (base64) & latency metrics
    """
    t_start = time.time()
    latency_breakdown = {}

    # Read uploaded audio
    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    # Step 1: Prisma STT
    t0 = time.time()
    try:
        stt_result = await transcribe_audio(audio_bytes, language=language)
        user_transcript = stt_result.get("text", "").strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Prisma STT failed: {e}")
    latency_breakdown["stt_seconds"] = round(time.time() - t0, 2)

    if not user_transcript:
        user_transcript = "..."

    # Step 2: Evon LLM Reasoning
    t1 = time.time()
    system_prompt = build_system_prompt(customer_id, journey_step)
    try:
        llm_result = await chat_with_evon(
            messages=[{"role": "user", "content": user_transcript}],
            system_prompt=system_prompt,
        )
        assistant_reply = llm_result.get("text", "Kshama karein, main abhi samajh nahi payi.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Evon LLM reasoning failed: {e}")
    latency_breakdown["llm_seconds"] = round(time.time() - t1, 2)

    # Step 3: Timbre TTS (with graceful fallback)
    audio_b64 = None
    if synthesize_audio:
        t2 = time.time()
        try:
            tts_audio = await synthesize_speech(
                text=assistant_reply,
                language=language,
                voice="Nalini",
            )
            audio_b64 = base64.b64encode(tts_audio).decode("utf-8")
            latency_breakdown["tts_seconds"] = round(time.time() - t2, 2)
        except Exception as e:
            # Non-blocking fallback: return text even if TTS fails
            latency_breakdown["tts_error"] = str(e)
            latency_breakdown["tts_seconds"] = round(time.time() - t2, 2)

    latency_breakdown["total_seconds"] = round(time.time() - t_start, 2)

    return VoiceResponse(
        user_transcript=user_transcript,
        assistant_reply=assistant_reply,
        audio_base64=audio_b64,
        audio_format="audio/wav",
        latency=latency_breakdown,
        step=journey_step,
    )


@router.post("/process-text", response_model=VoiceResponse)
async def process_text(req: TextChatRequest):
    """
    Text-In, Voice-Out endpoint (for testing or text-fallback mode).
    """
    t_start = time.time()
    latency_breakdown = {}

    # LLM Reasoning
    t1 = time.time()
    system_prompt = build_system_prompt(req.customer_id, req.journey_step)
    try:
        llm_result = await chat_with_evon(
            messages=[{"role": "user", "content": req.message}],
            system_prompt=system_prompt,
        )
        assistant_reply = llm_result.get("text", "")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Evon LLM reasoning failed: {e}")
    latency_breakdown["llm_seconds"] = round(time.time() - t1, 2)

    # Timbre TTS
    audio_b64 = None
    if req.synthesize_audio:
        t2 = time.time()
        try:
            tts_audio = await synthesize_speech(
                text=assistant_reply,
                language=req.language,
                voice="Nalini",
            )
            audio_b64 = base64.b64encode(tts_audio).decode("utf-8")
            latency_breakdown["tts_seconds"] = round(time.time() - t2, 2)
        except Exception as e:
            latency_breakdown["tts_error"] = str(e)
            latency_breakdown["tts_seconds"] = round(time.time() - t2, 2)

    latency_breakdown["total_seconds"] = round(time.time() - t_start, 2)

    return VoiceResponse(
        user_transcript=req.message,
        assistant_reply=assistant_reply,
        audio_base64=audio_b64,
        audio_format="audio/wav",
        latency=latency_breakdown,
        step=req.journey_step,
    )


@router.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    language: str = Form("hi-IN"),
    voice: str = Form("Nalini"),
):
    """Direct TTS endpoint."""
    audio_bytes = await synthesize_speech(text=text, language=language, voice=voice)
    return {
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
        "format": "audio/wav",
        "size_bytes": len(audio_bytes),
    }


@router.post("/stt")
async def speech_to_text(
    audio_file: UploadFile = File(...),
    language: str = Form("hi-IN"),
):
    """Direct STT endpoint."""
    audio_bytes = await audio_file.read()
    result = await transcribe_audio(audio_bytes, language=language)
    return result
