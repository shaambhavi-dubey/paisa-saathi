"""
Integration test for the 6-Step Loan Journey & Consent Engine state machine.
"""

import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def test_full_6_step_loan_journey():
    print("\n--- Test: Full 6-Step Loan Journey Flow ---")
    
    # 1. Start Journey
    res = client.post("/api/journey/start?customer_id=C00000")
    assert res.status_code == 200
    state = res.json()
    session_id = state["session_id"]
    print(f"Step 1 Started: Session {session_id}, Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt (Hindi): {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 1

    # 2. Advance Step 1 (Language & Mode)
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": {"language": "hi", "mode": "voice"}})
    assert res.status_code == 200
    state = res.json()
    print(f"\nStep 2 (Consent): Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt: {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 2

    # 3. Advance Step 2 (Grant Consent)
    consent_input = {
        "consent": {
            "share_transactions": True,
            "verify_identity": True,
            "evaluate_offers": True,
        }
    }
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": consent_input})
    assert res.status_code == 200
    state = res.json()
    print(f"\nStep 3 (Identity): Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt: {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 3

    # 4. Advance Step 3 (Identity Confirmed)
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": {"verified": True}})
    assert res.status_code == 200
    state = res.json()
    print(f"\nStep 4 (Income/Business): Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt: {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 4

    # 5. Advance Step 4 (Income Confirmed)
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": {"confirmed": True}})
    assert res.status_code == 200
    state = res.json()
    print(f"\nStep 5 (Offer Presentation): Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt: {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 5
    assert state["offer"] is not None

    # 6. Advance Step 5 (Accept Offer)
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": {"accepted": True}})
    assert res.status_code == 200
    state = res.json()
    print(f"\nStep 6 (Final Confirmation): Current Step: {state['current_step']}/6")
    print(f"Spoken Prompt: {state['spoken_prompt_hindi']}")
    assert state["current_step"] == 6

    # 7. Advance Step 6 (Agreed!)
    res = client.post(f"/api/journey/{session_id}/advance", json={"step_input": {"agreed": True}})
    assert res.status_code == 200
    state = res.json()
    print(f"\nJourney Completed! Status: {state['status']}")
    print(f"Contract ID: {state['confirmation']['contract_id']}")
    assert state["status"] == "COMPLETED"
    assert state["confirmation"]["contract_id"].startswith("CTR-")

    # 8. Test Withdraw Consent
    res = client.post(f"/api/journey/{session_id}/withdraw-consent")
    assert res.status_code == 200
    state = res.json()
    print(f"\nConsent Withdrawn Test: Status: {state['status']}")
    assert state["status"] == "CONSENT_WITHDRAWN"
    assert state["consent"]["share_transactions"] is False

    print("\n✅ All 6-step journey state machine tests passed successfully!")


if __name__ == "__main__":
    test_full_6_step_loan_journey()
