"""
End-to-end integration test for the FastAPI voice endpoints.
Tests:
  1. GET /health
  2. POST /api/voice/process-text (Text -> Evon -> Timbre)
  3. POST /api/voice/process-audio (WAV -> Prisma -> Evon -> Timbre)
"""

import os
import sys

import pytest

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def test_health():
    print("\n--- Test 1: GET /health ---")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    print("Health response:", data)
    assert data["status"] == "ok"


def test_process_text():
    print("\n--- Test 2: POST /api/voice/process-text ---")
    payload = {
        "message": "Namaste, mujhe apni dukan ke liye chhota loan chahiye.",
        "customer_id": "C00000",
        "journey_step": 4,
        "synthesize_audio": True,
    }
    response = client.post("/api/voice/process-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    print("Assistant Reply:", data["assistant_reply"])
    print("Latency breakdown:", data["latency"])
    print("Audio bytes received:", len(data["audio_base64"]) if data.get("audio_base64") else 0)
    assert len(data["assistant_reply"]) > 0
    assert data["audio_base64"] is not None


def test_process_audio():
    print("\n--- Test 3: POST /api/voice/process-audio ---")
    audio_path = "tests/output/timbre_test.wav"
    if not os.path.exists(audio_path):
        pytest.skip(f"{audio_path} not found")

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    files = {"audio_file": ("test.wav", audio_bytes, "audio/wav")}
    data = {
        "customer_id": "C00000",
        "journey_step": 1,
        "synthesize_audio": "true",
    }
    response = client.post("/api/voice/process-audio", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    print("User Transcript (Prisma):", res["user_transcript"])
    print("Assistant Reply (Evon):", res["assistant_reply"])
    print("Latency breakdown:", res["latency"])
    print("Audio (Timbre) Base64 length:", len(res["audio_base64"]) if res.get("audio_base64") else 0)
    assert len(res["user_transcript"]) > 0
    assert len(res["assistant_reply"]) > 0


if __name__ == "__main__":
    print("Running voice endpoint integration tests...")
    test_health()
    test_process_text()
    test_process_audio()
    print("\n✅ All voice endpoint tests passed successfully!")
