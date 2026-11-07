import React from 'react';
import { Calendar } from 'lucide-react';

interface CashflowRhythmProps {
  peakDay?: string;
  peakAmount?: string;
}

export const CashflowRhythm: React.FC<CashflowRhythmProps> = ({
  peakDay = 'Friday',
  peakAmount = '₹2,800',
}) => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>Weekly Cash-Flow Rhythm</span>
            <span className="text-[10px] text-slate-400 font-normal">हफ्ते का रिदम</span>
          </h4>
          <p className="text-[10px] text-slate-500">
            Irregular weekly earnings calculated via UPI soundbox records
          </p>
        </div>
        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Peak: {peakDay}
        </span>
      </div>

      {/* Bar Chart Visualizer */}
      <div className="pt-3 pb-1">
        <div className="h-28 flex items-end justify-between gap-2 px-1 border-b border-stone-200 pb-2">
          {/* Mon */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹1.1k</span>
            <div className="w-full bg-emerald-200 rounded-t-md h-12 transition-all hover:bg-emerald-300"></div>
            <span className="text-[10px] font-medium text-slate-600">Mon</span>
          </div>
          {/* Tue */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹1.3k</span>
            <div className="w-full bg-emerald-200 rounded-t-md h-14 transition-all hover:bg-emerald-300"></div>
            <span className="text-[10px] font-medium text-slate-600">Tue</span>
          </div>
          {/* Wed */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹1.8k</span>
            <div className="w-full bg-emerald-300 rounded-t-md h-18 transition-all hover:bg-emerald-400"></div>
            <span className="text-[10px] font-medium text-slate-600">Wed</span>
          </div>
          {/* Thu */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹1.5k</span>
            <div className="w-full bg-emerald-200 rounded-t-md h-16 transition-all hover:bg-emerald-300"></div>
            <span className="text-[10px] font-medium text-slate-600">Thu</span>
          </div>
          {/* Fri (Peak Amber) */}
          <div className="flex-1 flex flex-col items-center gap-1 relative">
            <div className="absolute -top-6 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap animate-bounce">
              PEAK 🔥 {peakAmount}
            </div>
            <span className="text-[9px] font-bold text-amber-700">{peakAmount}</span>
            <div className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md h-24 ring-2 ring-amber-300 shadow-sm"></div>
            <span className="text-[10px] font-bold text-amber-900">Fri</span>
          </div>
          {/* Sat */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹2.1k</span>
            <div className="w-full bg-emerald-400 rounded-t-md h-20 transition-all hover:bg-emerald-500"></div>
            <span className="text-[10px] font-medium text-slate-600">Sat</span>
          </div>
          {/* Sun */}
          <div className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-emerald-700">₹1.9k</span>
            <div className="w-full bg-emerald-300 rounded-t-md h-19 transition-all hover:bg-emerald-400"></div>
            <span className="text-[10px] font-medium text-slate-600">Sun</span>
          </div>
        </div>
      </div>

      {/* Rhythm Insight Pill */}
      <div className="mt-2.5 bg-amber-50/80 rounded-xl p-2.5 border border-amber-200/80 flex items-start gap-2">
        <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-900 leading-tight">
          <strong>Friday Mandi Peak:</strong> Highest sales velocity detected between 6:00 AM – 11:30 AM.
          Suggested weekly EMI debits are automatically locked to <strong>Fridays</strong>.
        </p>
      </div>
    </div>
  );
};
