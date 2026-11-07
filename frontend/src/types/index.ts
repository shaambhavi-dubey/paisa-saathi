export type PersonaKey = string;

export interface Persona {
  id: string;
  name: string;
  role: string;
  account: string;
  balance: string;
  dailyAvg: string;
  peakDay: string;
  peakAmount: string;
  loanOffer: string;
  weeklyEmi: string;
  contractId: string;
  initials: string;
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  senderName: string;
  time: string;
  hindiText: string;
  englishSubtitle: string;
  audioDuration?: string;
  audioBase64?: string;
}

export interface JourneySessionState {
  session_id: string;
  customer_id: string;
  current_step: number;
  total_steps: number;
  language: string;
  mode: string;
  consent: {
    share_transactions: boolean;
    verify_identity: boolean;
    evaluate_offers: boolean;
  };
  identity: Record<string, any>;
  income_business: Record<string, any>;
  offer?: {
    product_name: string;
    product_code: string;
    approved_amount: number;
    recommended_instalment: number;
    frequency: string;
    day_of_repayment: string;
    interest_rate_monthly: number;
    tenure_weeks: number;
    reason_hindi: string;
    reason_en: string;
    affordability_ratio: number;
  };
  confirmation?: {
    contract_id: string;
    confirmed_at: string;
    status: string;
  };
  status: string;
  spoken_prompt_hindi: string;
  spoken_prompt_en: string;
}

export interface StressQueueItem {
  customer_id: string;
  persona: string;
  tier: number;
  has_loan: boolean;
  current_emi: number;
  inflow_drop_percentage: number;
  lead_days_before_emi: number | null;
  recommended_action: string;
}

export interface FraudCheckResponse {
  is_flagged: boolean;
  risk_level: string;
  risk_score: number;
  anomaly_score: number;
  explanation_hindi: string;
  explanation_en: string;
  fan_in_count: number;
  shared_devices: number;
  recommended_action: string;
}
