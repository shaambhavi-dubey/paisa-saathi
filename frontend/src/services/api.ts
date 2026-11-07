import type { JourneySessionState, StressQueueItem, FraudCheckResponse } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api`;

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Voice Endpoints (Prisma STT + Evon LLM + Timbre TTS)
// -------------------------------------------------------------
export async function processVoiceText(
  message: string,
  customerId: string = 'C00000',
  journeyStep?: number
): Promise<{ assistant_reply: string; audio_base64?: string; latency?: Record<string, number> }> {
  try {
    const res = await fetch(`${API_BASE}/voice/process-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        customer_id: customerId,
        journey_step: journeyStep ?? null,
        synthesize_audio: true,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend process-text unreachable, using companion intelligence:', err);
    return {
      assistant_reply: `नमस्ते! Paisa Saathi पर लोन लेने के 5 आसान चरण हैं: भाषा चुनाव, सहमति, पहचान पुष्टि, आय पुष्टि और ऑफर स्वीकारना।`,
    };
  }
}

export async function processVoiceAudio(
  audioBlob: Blob,
  customerId: string = 'C00000',
  journeyStep?: number
): Promise<{ user_transcript: string; assistant_reply: string; audio_base64?: string }> {
  try {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('customer_id', customerId);
    if (journeyStep !== undefined && journeyStep !== null) {
      formData.append('journey_step', String(journeyStep));
    }
    formData.append('synthesize_audio', 'true');

    const res = await fetch(`${API_BASE}/voice/process-audio`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend process-audio unreachable, fallback to simulation:', err);
    return {
      user_transcript: 'मुझे दुकान के लिए छोटा लोन चाहिए',
      assistant_reply: 'नमस्ते रमेश जी! आपके शुक्रवार के बाज़ार के हिसाब से हमने ₹20,000 का लोन तैयार किया है।',
    };
  }
}

// -------------------------------------------------------------
// 6-Step Loan Journey Endpoints
// -------------------------------------------------------------
export async function startLoanJourneySession(customerId: string = 'C00000'): Promise<JourneySessionState> {
  try {
    const res = await fetch(`${API_BASE}/journey/start?customer_id=${customerId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Journey backend unreachable, starting local state:', err);
    return {
      session_id: `JRN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customer_id: customerId,
      current_step: 1,
      total_steps: 6,
      language: 'hi',
      mode: 'voice',
      consent: { share_transactions: true, verify_identity: true, evaluate_offers: true },
      identity: { verified: true, demo_id: 'DEMO-ID-84920' },
      income_business: { daily_income: 1100, peak_day: 'Friday', persona: 'vendor' },
      status: 'IN_PROGRESS',
      spoken_prompt_hindi: 'नमस्ते! मैं पैसा साथी हूँ। आप किस भाषा में बात करना चाहेंगे?',
      spoken_prompt_en: 'Hello! I am Paisa Saathi. Which language would you prefer?',
    };
  }
}

export async function advanceLoanJourney(
  sessionId: string,
  stepInput: Record<string, any>
): Promise<JourneySessionState> {
  try {
    const res = await fetch(`${API_BASE}/journey/${sessionId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_input: stepInput }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Advance journey fallback:', err);
    return {
      session_id: sessionId,
      customer_id: 'C00000',
      current_step: 2,
      total_steps: 6,
      language: 'hi',
      mode: 'voice',
      consent: { share_transactions: true, verify_identity: true, evaluate_offers: true },
      identity: { verified: true },
      income_business: {},
      status: 'IN_PROGRESS',
      spoken_prompt_hindi: 'आगे बढ़ने के लिए सहमति दें।',
      spoken_prompt_en: 'Please confirm consent to proceed.',
    };
  }
}

export async function withdrawJourneyConsent(sessionId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/journey/${sessionId}/withdraw-consent`, {
      method: 'POST',
    });
    return await res.json();
  } catch {
    return { status: 'CONSENT_WITHDRAWN' };
  }
}

// -------------------------------------------------------------
// Recommendations & Policy Layer
// -------------------------------------------------------------
export async function getCustomerRecommendation(customerId: string = 'C00000'): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/recommendations/${customerId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      product_name: 'Weekly Micro-Business Loan',
      approved_amount: 20000,
      recommended_instalment: 500,
      day_of_repayment: 'Friday',
      reason_hindi: 'आपकी सबसे ज़्यादा कमाई शुक्रवार को होती है, इसलिए ₹500/हफ्ते की किस्त सबसे सुरक्षित है।',
      reason_en: 'Your peak inflows occur on Friday, making a weekly ₹500 installment safe and stress-free.',
      affordability_ratio: 0.18,
    };
  }
}

// -------------------------------------------------------------
// Stress & Proactive Care
// -------------------------------------------------------------
export async function getStressQueue(limit: number = 20): Promise<{ queue: StressQueueItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/stress/queue?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      queue: [
        {
          customer_id: 'C00042',
          persona: 'vendor',
          tier: 2,
          has_loan: true,
          current_emi: 500,
          inflow_drop_percentage: 38.4,
          lead_days_before_emi: 12,
          recommended_action: 'Offer 10-day EMI date shift (Care outreach)',
        },
        {
          customer_id: 'C00119',
          persona: 'farmer',
          tier: 3,
          has_loan: true,
          current_emi: 1200,
          inflow_drop_percentage: 46.2,
          lead_days_before_emi: 18,
          recommended_action: 'Harvest moratorium shift (Care outreach)',
        },
        {
          customer_id: 'C00305',
          persona: 'gig_worker',
          tier: 1,
          has_loan: true,
          current_emi: 400,
          inflow_drop_percentage: 22.0,
          lead_days_before_emi: 8,
          recommended_action: 'Offer 10-day EMI date shift (Care outreach)',
        },
      ],
    };
  }
}

// -------------------------------------------------------------
// Fraud Risk & Transfer Check
// -------------------------------------------------------------
export async function checkTransferRisk(
  amount: number,
  payeeId: string,
  customerId: string = 'C00000'
): Promise<FraudCheckResponse> {
  try {
    const res = await fetch(`${API_BASE}/fraud/check-transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payee_id: payeeId, customer_id: customerId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      is_flagged: true,
      risk_level: 'HIGH',
      risk_score: 0.98,
      anomaly_score: 0.98,
      explanation_hindi: 'सावधान! इस खाते को पिछले 2 घंटे में 14 नए खातों से पैसे मिले हैं।',
      explanation_en: 'This recipient account received transfers from 14 new senders within the last 2 hours (Mule account velocity detected).',
      fan_in_count: 14,
      shared_devices: 3,
      recommended_action: 'WARN_AND_CONFIRM',
    };
  }
}
