"""
Gnani API test script for Paisa Saathi.

Order: Timbre (TTS) -> Prisma (STT, using Timbre's audio) -> LLM (optional).

Usage:
  python tests/test_gnani_apis.py

Prints the server's error body on failure, so you can see exactly what went wrong.
Saves Timbre output to tests/output/timbre_test.wav so you can listen to it.
"""

import asyncio
import os
import sys
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.gnani_client import (  # noqa: E402
    GNANI_API_KEY,
    GNANI_BASE_URL,
    LLM_BASE_URL,
    LLMNotConfigured,
    chat_with_evon,
    synthesize_speech,
    transcribe_audio,
)

OUTPUT_DIR = "tests/output"
TTS_PATH = f"{OUTPUT_DIR}/timbre_test.wav"
HINDI_TEXT = "नमस्ते, मैं पैसा साथी हूँ। मैं आपकी कैसे मदद कर सकती हूँ?"


def header(title: str):
    print(f"\n{'=' * 60}\n  {title}\n{'=' * 60}\n")


def report(name: str, status: str, latency: float, details: str):
    icon = {"pass": "PASS", "fail": "FAIL", "skip": "SKIP"}[status]
    print(f"  [{icon}] {name}")
    if latency:
        print(f"  Latency: {latency:.2f}s")
    print(f"  Details: {details}\n")


async def test_timbre():
    header("Test 1: Timbre v2.5 (TTS)")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    last_error = None
    # 24000 is the default; fall back to other rates if the server rejects it
    for rate in (24000, 16000, 44100):
        start = time.time()
        try:
            audio = await synthesize_speech(HINDI_TEXT, sample_rate=rate)
            latency = time.time() - start
            with open(TTS_PATH, "wb") as f:
                f.write(audio)
            report(
                "Timbre TTS", "pass", latency,
                f"{len(audio)} bytes at {rate} Hz saved to {TTS_PATH}. Listen to check quality.",
            )
            return True
        except Exception as e:  # noqa: BLE001
            last_error = e
            print(f"  (sample_rate {rate} failed)\n  {e}\n")
    report("Timbre TTS", "fail", 0,
           f"All sample rates failed. Last error:\n  {last_error}\n"
           "  If this keeps failing, use pre-generated audio clips for the demo.")
    return False


async def test_prisma():
    header("Test 2: Prisma v2.5 (STT)")
    path = None
    if os.path.exists("tests/test_audio.wav"):
        path = "tests/test_audio.wav"
        print("  Using your recording: tests/test_audio.wav\n")
    elif os.path.exists(TTS_PATH):
        path = TTS_PATH
        print("  Using Timbre output as test audio (round trip).\n")
    else:
        report("Prisma STT", "skip", 0,
               "No audio. Record a short Hindi WAV (under 60 s) and save it as "
               "tests/test_audio.wav, or fix the Timbre test first.")
        return False

    start = time.time()
    try:
        with open(path, "rb") as f:
            audio = f.read()
        result = await transcribe_audio(audio, language="hi-IN")
        latency = time.time() - start
        ok = bool(result["text"].strip())
        report("Prisma STT", "pass" if ok else "fail", latency,
               f"Transcript: {result['text'][:200]!r}"
               + ("" if ok else "\n  Empty transcript. Check the audio file."))
        return ok
    except Exception as e:  # noqa: BLE001
        report("Prisma STT", "fail", time.time() - start, str(e))
        return False


async def test_llm():
    header("Test 3: LLM (Evon or fallback, optional)")
    if not LLM_BASE_URL:
        report("LLM", "skip", 0,
               "LLM_BASE_URL not set. The Gnani docs list no hosted Evon endpoint. "
               "Ask Gnani on Discord, or configure a fallback LLM in .env.")
        return None

    start = time.time()
    try:
        result = await chat_with_evon(
            messages=[{"role": "user",
                       "content": "Mujhe sabzi ki dukan ke liye chhota loan chahiye. Kya options hain?"}],
            system_prompt="You are Paisa Saathi, a Hindi banking assistant. Reply in Hindi/Hinglish in 2-3 sentences.",
        )
        report("LLM", "pass", time.time() - start, f"Reply: {result['text'][:200]}")
        return True
    except LLMNotConfigured as e:
        report("LLM", "skip", 0, str(e))
        return None
    except Exception as e:  # noqa: BLE001
        report("LLM", "fail", time.time() - start, str(e))
        return False


async def main():
    print("\n" + "=" * 60)
    print("  PAISA SAATHI - Gnani API Test Suite")
    print("=" * 60)
    print(f"\n  API key:  {GNANI_API_KEY[:5]}...{GNANI_API_KEY[-4:]}")
    print(f"  Base URL: {GNANI_BASE_URL}")
    print(f"  Time:     {time.strftime('%Y-%m-%d %H:%M:%S')}")

    timbre_ok = await test_timbre()
    prisma_ok = await test_prisma()
    llm_ok = await test_llm()

    header("SUMMARY")
    label = {True: "PASS", False: "FAIL", None: "SKIP"}
    print(f"  Timbre (TTS): {label[timbre_ok]}")
    print(f"  Prisma (STT): {label[prisma_ok]}")
    print(f"  LLM:          {label[llm_ok]}\n")

    if timbre_ok and prisma_ok:
        print("  Voice loop (speech in, speech out) is viable.")
    if llm_ok is None:
        print("  Next: get an LLM answer from Gnani (Evon endpoint) or choose a fallback.")
    print("  Also check your dashboard for credits used by these calls.\n")


if __name__ == "__main__":
    asyncio.run(main())