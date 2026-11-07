import React, { useState } from 'react';
import {
  LifeBuoy,
  ShieldAlert,
  FileCheck,
  Send,
  CalendarPlus,
  TrendingDown,
  Lock,
  ShieldX,
  Download,
} from 'lucide-react';

interface BankerDashboardProps {
  showToast: (msg: string) => void;
}

export const BankerDashboard: React.FC<BankerDashboardProps> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<'stress' | 'fraud' | 'dpdp'>('stress');

  const handleBatchOutreach = () => {
    showToast('Triggered automated batch outreach to 14 high-stress accounts');
  };

  const handleSendShift = (name: string) => {
    showToast(`🚀 Dispatched 10-day moratorium extension to ${name} (Zero penalty)`);
  };

  const handleFreezeVpa = (vpa: string) => {
    showToast(`🔒 VPA ${vpa} frozen across NPCI gateway and reported to Mule Registry`);
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto bg-slate-900 text-slate-100">
      {/* Banker Top Control Subbar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Banker & Relationship Manager Operations
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Branch: Canara Bank Mandi Hub #042
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Proactive non-punitive credit stress interventions & mule ring protection
          </p>
        </div>

        {/* Banker KPI Cards Row */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Evaluated Borrowers
            </span>
            <span className="text-base font-extrabold text-white font-outfit">
              2,000 <span className="text-xs text-emerald-400 font-normal">(942 Active)</span>
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">
              Early Stress Interventions
            </span>
            <span className="text-base font-extrabold text-amber-400 font-outfit">
              878 <span className="text-xs text-slate-300 font-normal">(2.4 Wk Lead)</span>
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-rose-400 uppercase font-semibold block">
              Scams Intercepted
            </span>
            <span className="text-base font-extrabold text-rose-400 font-outfit">
              78 <span className="text-xs text-slate-300 font-normal">(100% Prec.)</span>
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[10px] text-teal-400 uppercase font-semibold block">
              DPDP Opt-Ins
            </span>
            <span className="text-base font-extrabold text-teal-300 font-outfit">99.4%</span>
          </div>
        </div>
      </div>

      {/* Banker Main Content Tabs & Grid */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stress'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Early Stress Care Queue (/api/stress/queue)</span>
            <span className="bg-emerald-900/80 text-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
              14 Pending
            </span>
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'fraud'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Fraud & Mule Anomaly Watch</span>
            <span className="bg-rose-900/60 text-rose-300 px-1.5 py-0.2 rounded text-[10px]">
              3 High-Risk
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dpdp')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dpdp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>DPDP Consent Audit Ledger</span>
          </button>
        </div>

        {/* TAB 1: EARLY STRESS CARE QUEUE */}
        {activeTab === 'stress' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Proactive Restructure Queue</span>
                    <span className="text-xs font-normal text-slate-400">
                      (Triggers automated non-punitive moratorium options before default)
                    </span>
                  </h3>
                </div>
                <button
                  onClick={handleBatchOutreach}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> Batch 10-Day Moratorium Outreach
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">Customer & Trade</th>
                      <th className="p-3.5">Segment / Tier</th>
                      <th className="p-3.5">Active Loan & EMI</th>
                      <th className="p-3.5">Inflow Drop %</th>
                      <th className="p-3.5">Lead Days to EMI</th>
                      <th className="p-3.5">SHAP Rhythm Driver</th>
                      <th className="p-3.5 text-right">Proactive Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {/* Row 1: Ramesh */}
                    <tr className="hover:bg-slate-700/30 transition-colors bg-teal-950/20">
                      <td className="p-3.5">
                        <div className="font-bold text-white">Ramesh Kumar</div>
                        <div className="text-[11px] text-slate-400">
                          APMC Mandi Vegetable Stall #14
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          Vendor • Tier-2
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-white font-bold">₹20,000</div>
                        <div className="text-amber-400 text-[11px]">₹500 / Fri</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <TrendingDown className="w-3.5 h-3.5" /> -38%
                        </div>
                        <span className="text-[10px] text-slate-400">Weather disruption</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-400">12 Days</span>
                        <span className="text-[10px] text-slate-400 block">Pre-default window</span>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-300 max-w-xs">
                        <span className="bg-slate-700/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-teal-300">
                          SHAP: -0.42
                        </span>{' '}
                        Friday market footfall down 41%
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSendShift('Ramesh Kumar')}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ml-auto active:scale-95"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" /> Send 10-Day Shift
                        </button>
                      </td>
                    </tr>

                    {/* Row 2: Sunita */}
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">Sunita Bai</div>
                        <div className="text-[11px] text-slate-400">
                          Cotton Smallholder (Wardha)
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-semibold">
                          Farmer • Tier-3
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-white font-bold">₹45,000</div>
                        <div className="text-amber-400 text-[11px]">₹1,200 / Bi-weekly</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <TrendingDown className="w-3.5 h-3.5" /> -46%
                        </div>
                        <span className="text-[10px] text-slate-400">Harvest delay</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-rose-400">18 Days</span>
                        <span className="text-[10px] text-slate-400 block">Pre-default window</span>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-300 max-w-xs">
                        <span className="bg-slate-700/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-teal-300">
                          SHAP: -0.55
                        </span>{' '}
                        Mandi arrival postponed 2 weeks
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSendShift('Sunita Bai')}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ml-auto active:scale-95"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" /> Send Harvest Shift
                        </button>
                      </td>
                    </tr>

                    {/* Row 3: Amit */}
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">Amit Rawat</div>
                        <div className="text-[11px] text-slate-400">
                          Quick-Commerce Delivery Fleet
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                          Gig Worker
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-white font-bold">₹15,000</div>
                        <div className="text-amber-400 text-[11px]">₹400 / Mon</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <TrendingDown className="w-3.5 h-3.5" /> -22%
                        </div>
                        <span className="text-[10px] text-slate-400">Vehicle maintenance</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-400">8 Days</span>
                        <span className="text-[10px] text-slate-400 block">Pre-default window</span>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-300 max-w-xs">
                        <span className="bg-slate-700/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-teal-300">
                          SHAP: -0.28
                        </span>{' '}
                        Gig payout cadence shifted
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSendShift('Amit Rawat')}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ml-auto active:scale-95"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" /> Send 10-Day Shift
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FRAUD ANOMALY & MULE WATCH */}
        {activeTab === 'fraud' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Payee Fan-In Velocity & Mule Ring Interceptor</span>
                    <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
                      100% Intercept Precision
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detects rapid fan-in of low-income customer payouts to recently created synthetic UPI VPIs
                  </p>
                </div>
                <button
                  onClick={() =>
                    showToast('Graph traversal analysis complete: 3 suspicious mule nodes frozen')
                  }
                  className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" /> Freeze All High-Risk VPIs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">Target Payee VPA / Account</th>
                      <th className="p-3.5">2-Hour Fan-In Velocity</th>
                      <th className="p-3.5">Shared Device Footprint</th>
                      <th className="p-3.5">Anomaly Score</th>
                      <th className="p-3.5">Explainable AI Flag</th>
                      <th className="p-3.5 text-right">Intervention Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    <tr className="hover:bg-slate-700/30 transition-colors bg-rose-950/20">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-rose-300">
                          instantcash_help99@okaxis
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Created 4 hours ago • IP: Geo-mismatched
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-rose-400 text-sm">
                          14 unique senders
                        </span>
                        <span className="text-[10px] text-slate-400 block">Avg ₹1,500 each</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-amber-400 font-bold">3 Accounts on 1 IMEI</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-xs">
                          0.98 HIGH
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 text-[11px] max-w-xs">
                        "Predatory Ponzi loan scam targeting mandi vendors with upfront deposit fees."
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleFreezeVpa('instantcash_help99@okaxis')}
                          className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs ml-auto flex items-center gap-1 active:scale-95"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Freeze VPA
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-amber-300">
                          mandi_bonus_reward@ybl
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Created 2 days ago • Proxy Gateway
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-amber-400 text-sm">
                          9 unique senders
                        </span>
                        <span className="text-[10px] text-slate-400 block">Avg ₹450 each</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-400">2 Accounts</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-slate-950 font-black text-xs">
                          0.84 MED
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 text-[11px] max-w-xs">
                        "Lottery reward phishing scheme via unsolicited WhatsApp audio note."
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleFreezeVpa('mandi_bonus_reward@ybl')}
                          className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs ml-auto flex items-center gap-1 active:scale-95"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Freeze VPA
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DPDP CONSENT AUDIT LEDGER */}
        {activeTab === 'dpdp' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>DPDP Compliance Immutable Audit Trail</span>
                    <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded font-bold">
                      SHA-256 Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Captures customer consent grant, purpose-specification, and revocation events with
                    timestamps
                  </p>
                </div>
                <button
                  onClick={() =>
                    showToast('Exported regulatory DPDP audit package for RBI Sandbox inspection')
                  }
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Export Regulatory Package
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Data Principal (User)</th>
                      <th className="p-3.5">Consent Scope / Purpose</th>
                      <th className="p-3.5">Interaction Channel</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 font-mono">Cryptographic Audit Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        2026-10-09 18:42:10 UTC
                      </td>
                      <td className="p-3.5 font-bold text-white">Ramesh Kumar (CUST-9102)</td>
                      <td className="p-3.5 text-teal-300">
                        Transaction Rhythm & Inflow Peak Analysis
                      </td>
                      <td className="p-3.5">Voice Companion (Hindi Audio)</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        2026-10-09 18:42:15 UTC
                      </td>
                      <td className="p-3.5 font-bold text-white">Ramesh Kumar (CUST-9102)</td>
                      <td className="p-3.5 text-teal-300">
                        Synthetic Identity & APMC Mandi Registry Matching
                      </td>
                      <td className="p-3.5">Digital Loan Step 2</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        2026-10-09 16:15:02 UTC
                      </td>
                      <td className="p-3.5 font-bold text-white">Sunita Bai (CUST-8401)</td>
                      <td className="p-3.5 text-teal-300">
                        Automated Harvest Moratorium Adjustment
                      </td>
                      <td className="p-3.5">SMS + Automated IVR</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
