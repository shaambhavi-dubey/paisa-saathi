import React, { useState } from 'react';
import {
  Volume2,
  FileText,
  Play,
  ShieldCheck,
  CheckCircle2,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react';
import { advanceLoanJourney, withdrawJourneyConsent } from '../../services/api';

interface LoanJourneyStepperProps {
  onExit: () => void;
  onSuccess: (contractId: string) => void;
  showToast: (msg: string) => void;
  customerName: string;
  contractId: string;
}

export const LoanJourneyStepper: React.FC<LoanJourneyStepperProps> = ({
  onExit,
  onSuccess,
  showToast,
  customerName,
  contractId,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [sessionId] = useState<string>(`JRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [consentRhythm, setConsentRhythm] = useState<boolean>(true);
  const [consentKyc, setConsentKyc] = useState<boolean>(true);
  const [consentOffers, setConsentOffers] = useState<boolean>(true);

  const stepNames = [
    'Language & Mode',
    'Granular DPDP Consent',
    'Identity & Mandi Registry',
    'Cash-Flow Rhythm',
    'Personalized Offer & Guardrails',
    'Digital Contract Sanction',
  ];

  const handleNext = async () => {
    if (currentStep < 6) {
      // Advance step via API or local state
      try {
        await advanceLoanJourney(sessionId, {
          step: currentStep,
          mode,
          consent: {
            share_transactions: consentRhythm,
            verify_identity: consentKyc,
            evaluate_offers: consentOffers,
          },
        });
      } catch (e) {
        console.error(e);
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Step 6: Final accept
      showToast(`🎉 Contract ${contractId} Sanctioned! ₹20,000 Disbursed to Canara Bank.`);
      onSuccess(contractId);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWithdrawConsent = async () => {
    await withdrawJourneyConsent(sessionId);
    showToast('Consent preferences updated in DPDP Audit Ledger. Rights respected.');
  };

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* Sticky Progress & Back Header */}
      <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800">
              Step {currentStep} of 6
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              {stepNames[currentStep - 1]}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-36 h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
        >
          Save & Exit
        </button>
      </div>

      {/* Dynamic Step Content */}
      <div className="min-h-[380px]">
        {/* STEP 1: LANGUAGE & MODE */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-2">
                🌐
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Step 1: Preferred Interaction Mode
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select how you'd like Paisa Saathi to converse with you throughout this application.
              </p>

              <div className="space-y-2 mt-4">
                <label
                  onClick={() => setMode('voice')}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    mode === 'voice'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="commMode"
                      checked={mode === 'voice'}
                      onChange={() => setMode('voice')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Voice-First Bilingual (आवाज़ और बोलकर)
                      </span>
                      <span className="text-[10px] text-slate-600">
                        Spoken Hindi/English audio guidance at every step
                      </span>
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                </label>

                <label
                  onClick={() => setMode('text')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    mode === 'text'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="commMode"
                      checked={mode === 'text'}
                      onChange={() => setMode('text')}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Text-First (लिखकर पढ़ें)
                      </span>
                      <span className="text-[10px] text-slate-600">
                        Standard visual forms with audio on-demand
                      </span>
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-slate-400" />
                </label>
              </div>

              {/* Spoken Audio Prompt Simulation */}
              <div className="mt-3.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center gap-2 text-xs">
                <button
                  onClick={() =>
                    showToast('🔊 Assistant speaking: "नमस्ते! लोन आवेदन में आपका स्वागत है।"')
                  }
                  className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </button>
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">Voice Assistant:</span> "नमस्ते! लोन
                  आवेदन में आपका स्वागत है।"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: GRANULAR DPDP CONSENT */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  DPDP Act 2023 Compliance
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                Step 2: Granular Consent Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Your financial rhythm is only analyzed with explicit consent. You hold the legal
                right to toggle or withdraw permissions anytime.
              </p>

              {/* Toggle 1 */}
              <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    1. Transaction Rhythm Analysis
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Analyze weekly UPI soundbox timings to schedule safe Friday EMIs
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={consentRhythm}
                  onChange={(e) => setConsentRhythm(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              {/* Toggle 2 */}
              <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    2. Simulated Identity Verification
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Instant Aadhaar / Demo KYC match without physical papers
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={consentKyc}
                  onChange={(e) => setConsentKyc(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              {/* Toggle 3 */}
              <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    3. Product Recommendation Matching
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Tailor repayment cycles specifically to irregular income spikes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={consentOffers}
                  onChange={(e) => setConsentOffers(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-stone-200">
                <span>
                  Audit Hash:{' '}
                  <code className="text-[10px] text-emerald-700 font-mono">0x7F92...B3A</code>
                </span>
                <button
                  onClick={handleWithdrawConsent}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Withdraw Consent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SIMULATED IDENTITY (DEMO KYC) */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base mb-2">
                🪪
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Step 3: Identity & Vendor Registry
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verified seamlessly against municipal mandi vendor records & synthetic UIDAI sandbox.
              </p>

              <div className="mt-3.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-stone-200/80">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{customerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-stone-200/80">
                  <span className="text-slate-500">Synthetic Demo ID</span>
                  <span className="font-mono font-bold text-emerald-800">DEMO-ID-84920</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-stone-200/80">
                  <span className="text-slate-500">Vendor Trade Registration</span>
                  <span className="font-semibold text-slate-800">APMC Mandi Stall #14</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">KYC Status</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </div>
              </div>

              <div className="mt-3 bg-emerald-50 text-emerald-900 text-[11px] p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Simulated synthetic environment. No live Aadhaar credentials required for
                  evaluation.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INCOME & CASH-FLOW CONFIRMATION */}
        {currentStep === 4 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base mb-2">
                📊
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Step 4: Cash-Flow Rhythm Confirmation
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pre-filled automatically from synthetic 90-day UPI soundbox transaction stream.
              </p>

              <div className="mt-3.5 space-y-2 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Average Daily Inflow</span>
                    <span className="font-extrabold text-sm text-slate-900 font-outfit">
                      ₹1,100 / day
                    </span>
                  </div>
                  <span className="text-[10px] bg-stone-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                    Soundbox Verified
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex justify-between items-center">
                  <div>
                    <span className="text-amber-800 block text-[10px] font-semibold">
                      Identified Peak Day
                    </span>
                    <span className="font-extrabold text-sm text-amber-900">
                      Friday (₹2,800 Mandi Peak)
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Safe Debit Anchor
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      Monthly Estimated Turnover
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 font-outfit">
                      ₹34,800
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">Stable Trend 🟢</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Need to adjust figures?</span>
                <button
                  onClick={() => showToast('Manual adjustment mode enabled')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Edit Inflow Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PERSONALIZED OFFER & ANTI-PREDATORY GUARDRAIL */}
        {currentStep === 5 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Anti-Predatory Guardrail Cleared
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                Step 5: Personalized Offer & Terms
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Stress-tested against historical low-inflow weeks.
              </p>

              {/* Main Loan Card */}
              <div className="mt-3 bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] text-emerald-200">Offered Principal</span>
                    <div className="text-2xl font-extrabold font-outfit">₹20,000</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-200">Fixed Rate</span>
                    <div className="text-sm font-bold">1.2% per month</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-700/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-emerald-300 text-[10px] block">Weekly Instalment</span>
                    <span className="font-extrabold text-sm font-outfit text-amber-300">
                      ₹500 / week
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block">Repayment Schedule</span>
                    <span className="font-bold text-white">Every Friday (44 Wks)</span>
                  </div>
                </div>
              </div>

              {/* Guardrail Status Badge */}
              <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Zero-Harassment Charter Included</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Includes automatic 10-day penalty-free EMI moratorium extension if two consecutive
                  mandi weeks dip below ₹1,000.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: DIGITAL SIGNATURE & CONTRACT */}
        {currentStep === 6 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-2">
                ✍️
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Step 6: Digital Signature & Sanction
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review the final terms before instant disbursement to your Canara Bank account.
              </p>

              <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-slate-500">Applicant</span>
                  <span className="font-bold text-slate-800">{customerName} (APMC #14)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-slate-500">Disbursement Account</span>
                  <span className="font-medium text-slate-800">Canara Bank •••• 4019</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-slate-500">Debit Day</span>
                  <span className="font-bold text-amber-800">Every Friday (Peak Day)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Sanction Contract ID</span>
                  <span className="font-mono font-bold text-emerald-700">{contractId}</span>
                </div>
              </div>

              {/* Spoken Confirmation Hint */}
              <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] text-slate-600 flex items-center gap-2">
                <span className="text-base">🎙️</span>
                <span>Speak <em>"हाँ, मुझे मंज़ूर है"</em> or tap Confirm to finalize.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-98"
        >
          {currentStep === 6 ? (
            <>
              <span>Confirm & Disburse ₹20,000</span>
              <Check className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
