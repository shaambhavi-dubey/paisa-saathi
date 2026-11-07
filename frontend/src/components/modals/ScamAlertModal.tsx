import React from 'react';
import { ShieldAlert, Info, Volume2, ShieldCheck } from 'lucide-react';

interface ScamAlertModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onProceedAnyway: () => void;
  onPlayWarningAudio: () => void;
}

export const ScamAlertModal: React.FC<ScamAlertModalProps> = ({
  isOpen,
  onCancel,
  onProceedAnyway,
  onPlayWarningAudio,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border-2 border-rose-400 animate-in zoom-in-95 duration-200">
        {/* Warning Crimson Header */}
        <div className="bg-rose-600 text-white p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">⚠️ High-Risk Payee Detected</h3>
              <span className="text-[10px] text-rose-100 font-medium">
                Scam & Mule Interceptor (F3)
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Target Payee Details */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950">
            <div className="font-bold">
              Target Payee: <code className="text-rose-800 font-mono">instantcash_help99@okaxis</code>
            </div>
            <div className="text-[11px] text-rose-800 mt-1">
              Requested Amount: <strong>₹500</strong> (Purported "Registration Fee")
            </div>
          </div>

          {/* Explainable Alert Box */}
          <div className="text-xs text-slate-700 bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-rose-600" />
              <span>Explainable AI Risk Reason:</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              "This recipient account received transfers from{' '}
              <strong>14 new senders within the last 2 hours</strong> (Mule account velocity detected).
              92% probability of a predatory loan fee scam."
            </p>
          </div>

          {/* Vernacular Warning Audio Note */}
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2 text-[11px] text-amber-900">
            <button
              onClick={onPlayWarningAudio}
              className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <span>
              <strong>ऑडियो चेतावनी:</strong> "यह खाता संदिग्ध है, कृपया पैसे न भेजें।"
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={onCancel}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20 active:scale-98 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cancel Transfer (Recommended)</span>
            </button>

            <button
              onClick={onProceedAnyway}
              className="w-full bg-stone-100 hover:bg-stone-200 text-slate-600 font-semibold py-2 px-4 rounded-xl text-[11px] text-center"
            >
              Proceed Anyway (Requires Voice Confirmation)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
