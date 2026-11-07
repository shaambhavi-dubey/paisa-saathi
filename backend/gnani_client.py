"""
Gnani AI API client for Paisa Saathi.

Wraps:
  - Prisma v2.5 (STT)   POST /stt/v3                   (documented)
  - Timbre v2.5 (TTS)   POST /api/v1/tts/inference     (documented)
  - LLM (Evon or any OpenAI-compatible chat endpoint)  (configurable, see below)

Endpoints for STT and TTS come from docs.gnani.ai. The docs do NOT list a hosted
Evon / chat-completions endpoint, so the LLM call is configured through env vars
and raises LLMNotConfigured until you set one.

.env example:
    GNANI_API_KEY=vach_xxxxx
    GNANI_BASE_URL=https://api.vachana.ai

    # Optional LLM (only set after Gnani confirms an Evon endpoint, or to use a fallback)
    LLM_BASE_URL=https://example.com/v1/chat/completions   # full URL
    LLM_MODEL=your-model-name
    LLM_API_KEY=your_llm_key
    LLM_AUTH_STYLE=bearer        # "bearer" (Authorization: Bearer ...) or "gnani" (X-API-Key-ID)
"""

import os

import httpx
from dotenv import load_dotenv

load_dotenv()

GNANI_API_KEY = os.getenv("GNANI_API_KEY")
GNANI_BASE_URL = os.getenv("GNANI_BASE_URL", "https://api.vachana.ai")

if not GNANI_API_KEY:
    raise ValueError(
        "GNANI_API_KEY not set. Copy .env.example to .env and add your key."
    )

HEADERS = {"X-API-Key-ID": GNANI_API_KEY}

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Evon / LLM Configuration
# Paisa Saathi is designed natively for Gnani Evon v3.3.
# When running self-hosted Evon (via vLLM/TGI) or once Gnani launches hosted Evon,
# point LLM_BASE_URL to that endpoint.
# During local development/prototyping, we use Groq as a fast drop-in driver.
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
if not LLM_BASE_URL and GROQ_API_KEY:
    LLM_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3.8-27b" if GROQ_API_KEY else "evon")
LLM_API_KEY = os.getenv("LLM_API_KEY") or GROQ_API_KEY or GNANI_API_KEY
LLM_AUTH_STYLE = os.getenv("LLM_AUTH_STYLE", "bearer").lower()


class GnaniAPIError(Exception):
    """Raised when a Gnani API returns an error. Includes the response body."""


class LLMNotConfigured(Exception):
    """Raised when no LLM endpoint is configured."""


def _check(response: httpx.Response, name: str) -> None:
    """Raise an error that includes the server's message, not just the status code."""
    if response.status_code >= 400:
        body = response.text[:500]
        raise GnaniAPIError(
            f"{name} failed: HTTP {response.status_code} at {response.request.url}\n"
            f"Response body: {body}"
        )


async def transcribe_audio(audio_bytes: bytes, language: str = "hi-IN") -> dict:
    """
    Prisma STT. Documented limits: WAV/MP3/OGG/FLAC/AAC/M4A, 8-44.1 kHz, max 60 s.

    Args:
        audio_bytes: audio file bytes
        language: BCP-47 code such as "hi-IN" or "en-IN"

    Returns:
        {"text": "<transcript>", "raw": <full JSON response>}
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Do not set Content-Type manually: httpx adds the multipart boundary.
        response = await client.post(
            f"{GNANI_BASE_URL}/stt/v3",
            headers=HEADERS,
            files={"audio_file": ("audio.wav", audio_bytes, "audio/wav")},
            data={"language_code": language},
        )
        _check(response, "Prisma STT")
        data = response.json()
        return {"text": data.get("transcript", ""), "raw": data}


async def synthesize_speech(
    text: str,
    language: str = "hi-IN",
    voice: str = "Nalini",
    sample_rate: int = 24000,
    speed: float = 1.0,
) -> bytes:
    """
    Timbre v2.5 TTS (REST). Returns WAV bytes.

    Args:
        text: text to speak
        language: BCP-47 code such as "hi-IN"
        voice: voice name from the catalog (docs.gnani.ai/api/TTS/available-voices)
        sample_rate: keep <= 44100 if you want to feed the audio back into Prisma
        speed: speaking speed multiplier
    """
    body = {
        "text": text,
        "voice": voice,
        "model": "timbre-v2.5",
        "language": language,
        "speed": speed,
        "audio_config": {
            "sample_rate": sample_rate,
            "num_channels": 1,
            "sample_width": 2,
            "encoding": "linear_pcm",
            "container": "wav",
        },
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GNANI_BASE_URL}/api/v1/tts/inference",
            headers={**HEADERS, "Content-Type": "application/json"},
            json=body,
        )
        _check(response, "Timbre TTS")
        return response.content


async def chat_with_evon(
    messages: list[dict],
    system_prompt: str = "You are Paisa Saathi, a helpful Hindi banking assistant for irregular-income customers.",
    temperature: float = 0.3,
) -> dict:
    """
    LLM chat completion via an OpenAI-compatible endpoint set in LLM_BASE_URL.

    The Gnani docs do not document a hosted Evon endpoint. Set LLM_BASE_URL only
    after Gnani confirms one for your key, or to use a fallback model.

    Returns:
        {"text": "<reply>", "raw": <full JSON response>}
    """
    if not LLM_BASE_URL:
        raise LLMNotConfigured(
            "LLM_BASE_URL is not set. Ask Gnani (Discord/support) whether a hosted "
            "Evon endpoint exists for your key, or configure a fallback LLM in .env."
        )

    if LLM_AUTH_STYLE == "gnani":
        auth = {"X-API-Key-ID": LLM_API_KEY}
    else:
        auth = {"Authorization": f"Bearer {LLM_API_KEY}"}

    payload = {
        "model": LLM_MODEL,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            LLM_BASE_URL,
            headers={**auth, "Content-Type": "application/json"},
            json=payload,
        )
        _check(response, "LLM chat")
        data = response.json()
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            text = str(data)
        return {"text": text, "raw": data}