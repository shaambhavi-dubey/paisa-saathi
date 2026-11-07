import React, { useState } from 'react';
import { UserPlus, Sparkles, X, Check, Building2, Calendar } from 'lucide-react';
import type { Persona } from '../../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPersona: (newPersona: Persona) => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Pooja Sharma',
    role: 'किराना दुकान • Grocery Store Owner',
    bank: 'Bank of Baroda',
    accLast4: '3819',
    balance: '16500',
    dailyAvg: '2100',
    peakDay: 'Saturday',
    peakAmount: '5400',
    loanOffer: '35000',
  },
  {
    name: 'Mahesh Verma',
    role: 'ऑटो चालक • Auto Rickshaw Driver',
    bank: 'Punjab National Bank',
    accLast4: '6290',
    balance: '3400',
    dailyAvg: '950',
    peakDay: 'Monday',
    peakAmount: '2200',
    loanOffer: '15000',
  },
  {
    name: 'Lakshmi Devi',
    role: 'दूध डेयरी • Dairy Farmer & Milk Vendor',
    bank: 'Union Bank of India',
    accLast4: '7104',
    balance: '8900',
    dailyAvg: '1400',
    peakDay: 'Wednesday',
    peakAmount: '3600',
    loanOffer: '25000',
  },
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onAddPersona,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accLast4, setAccLast4] = useState('5421');
  const [balance, setBalance] = useState('12000');
  const [dailyAvg, setDailyAvg] = useState('1500');
  const [peakDay, setPeakDay] = useState('Saturday');
  const [peakAmount, setPeakAmount] = useState('3800');
  const [loanOffer, setLoanOffer] = useState('25000');

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setName(tpl.name);
    setRole(tpl.role);
    setBankName(tpl.bank);
    setAccLast4(tpl.accLast4);
    setBalance(tpl.balance);
    setDailyAvg(tpl.dailyAvg);
    setPeakDay(tpl.peakDay);
    setPeakAmount(tpl.peakAmount);
    setLoanOffer(tpl.loanOffer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate smart initials
    const words = name.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    // Unique random ID
    const randomNum = Math.floor(100 + Math.random() * 900);
    const id = `C09${randomNum}`;
    const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const contractId = `CTR-${hex}`;

    // Calculate smart weekly EMI (~2.5% of loan per week for ~44 weeks)
    const loanNum = parseInt(loanOffer.replace(/[^0-9]/g, '')) || 20000;
    const weeklyNum = Math.round(loanNum / 40);

    const newPersona: Persona = {
      id,
      name: name.trim(),
      role: role.trim() || 'स्वरोजगार • Self-Employed',
      account: `${bankName} A/c •••• ${accLast4.slice(-4) || '9999'}`,
      balance: `₹${parseInt(balance.replace(/[^0-9]/g, '') || '5000').toLocaleString('en-IN')}`,
      dailyAvg: `₹${parseInt(dailyAvg.replace(/[^0-9]/g, '') || '1000').toLocaleString('en-IN')}`,
      peakDay,
      peakAmount: `₹${parseInt(peakAmount.replace(/[^0-9]/g, '') || '2500').toLocaleString('en-IN')}`,
      loanOffer: `₹${loanNum.toLocaleString('en-IN')}`,
      weeklyEmi: `₹${weeklyNum.toLocaleString('en-IN')} / week`,
      contractId,
      initials,
      isCustom: true,
    };

    onAddPersona(newPersona);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 font-bold border border-white/10">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">नया व्यक्ति जोड़ें / Add New Person</h3>
              <p className="text-xs text-emerald-200/80">
                Create a dynamic profile tailored for your end-user testing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Template Autofill Chips */}
        <div className="bg-stone-100 px-5 py-3 border-b border-stone-200">
          <span className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            1-Click Quick Presets (Click to Auto-fill):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="text-[11px] bg-white hover:bg-emerald-50 hover:border-emerald-500 border border-stone-300 text-slate-800 px-2.5 py-1 rounded-lg font-medium transition-all shadow-2xs"
              >
                + {tpl.name} ({tpl.role.split('•')[0].trim()})
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>1. व्यक्तिगत विवरण (Personal Details)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Livelihood / Occupation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. किराना दुकान • Grocery Store"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Banking & Cash Flow */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>2. बैंक व दैनिक कमाई (Banking & Cash Flow)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={accLast4}
                  onChange={(e) => setAccLast4(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Balance (₹)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Average Daily Inflow (₹)</label>
                <input
                  type="number"
                  value={dailyAvg}
                  onChange={(e) => setDailyAvg(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Earning Rhythm & Loan Offer */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>3. आय का रिदम व लोन प्रस्ताव (Rhythm & Loan)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peak Day</label>
                <select
                  value={peakDay}
                  onChange={(e) => setPeakDay(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Monday">Monday (सोमवार)</option>
                  <option value="Tuesday">Tuesday (मंगलवार)</option>
                  <option value="Wednesday">Wednesday (बुधवार)</option>
                  <option value="Thursday">Thursday (गुरुवार)</option>
                  <option value="Friday">Friday (शुक्रवार)</option>
                  <option value="Saturday">Saturday (शनिवार)</option>
                  <option value="Sunday">Sunday (रविवार)</option>
                  <option value="1st of Month">1st of Month (वेतन दिन)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peak Day Income (₹)</label>
                <input
                  type="number"
                  value={peakAmount}
                  onChange={(e) => setPeakAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pre-approved Loan (₹)</label>
                <input
                  type="number"
                  value={loanOffer}
                  onChange={(e) => setLoanOffer(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-800/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save & Switch Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
