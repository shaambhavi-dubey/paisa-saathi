import React from 'react';
import { Sparkles, Mic } from 'lucide-react';

interface RecommendationCardProps {
  onStartJourney: () => void;
  loanOffer?: string;
  weeklyEmi?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  onStartJourney,
  loanOffer = '₹20,000',
  weeklyEmi = '₹500',
}) => {
  return (
    <div className="bg-gradient-to-b from-white to-amber-50/40 border-2 border-amber-300 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" /> Next-Best Match (F2b)
        </span>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Pre-Approved
        </span>
      </div>

      <h4 className="text-sm font-extrabold text-slate-900 mt-1">
        Weekly Micro-Business Loan — {loanOffer}
      </h4>
      <p className="text-xs text-slate-600 mt-0.5">
        Customized for mandi inventory bulk purchase
      </p>

      {/* Explainable AI Box */}
      <div className="mt-3 bg-white/90 p-3 rounded-xl border border-stone-200 text-xs text-slate-700 space-y-1.5">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <span className="text-amber-500">💡</span> Why this fits your cash-flow:
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          "Your soundbox data shows strong <strong>Friday revenues (avg ₹2,800)</strong>. A weekly repayment of{' '}
          <strong>{weeklyEmi} every Friday</strong> takes only <strong>18% of your peak day inflow</strong>,
          keeping you completely debt-safe."
        </p>

        {/* Safe Affordability Meter */}
        <div className="pt-1.5">
          <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
            <span>Safe Affordability Ratio</span>
            <span className="text-emerald-700 font-bold">18% (Well under 35% Stress Gate)</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '18%' }}></div>
          </div>
        </div>
      </div>

      {/* Call to action: Starts 6-Step Loan Journey */}
      <button
        onClick={onStartJourney}
        className="mt-3.5 w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-900/20 text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
      >
        <Mic className="w-4 h-4 text-emerald-300" />
        <span>Start 6-Step Voice Application (बोलकर शुरू करें)</span>
      </button>
    </div>
  );
};
