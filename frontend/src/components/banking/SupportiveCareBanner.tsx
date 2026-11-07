import React from 'react';
import { HeartHandshake, Check } from 'lucide-react';

interface SupportiveCareBannerProps {
  isVisible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export const SupportiveCareBanner: React.FC<SupportiveCareBannerProps> = ({
  isVisible,
  onAccept,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-teal-50 border-2 border-teal-300 text-teal-900 rounded-2xl p-3.5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <HeartHandshake className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-950 flex items-center gap-1">
              🤝 Supportive Care • Zero-Penalty Restructure
            </span>
            <span className="text-[10px] font-bold bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded">
              Proactive
            </span>
          </div>
          <p className="text-xs text-teal-800 mt-1 leading-relaxed">
            "Inflows dipped this week due to mandi heavy rains. Would you like to shift your ₹500 weekly
            EMI due date by <strong>10 days</strong> with <strong>zero penalty</strong>?"
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <button
              onClick={onAccept}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-transform active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Extend Due Date by 10 Days
            </button>
            <button
              onClick={onDismiss}
              className="bg-white text-teal-800 border border-teal-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg hover:bg-teal-50"
            >
              Keep Current Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
