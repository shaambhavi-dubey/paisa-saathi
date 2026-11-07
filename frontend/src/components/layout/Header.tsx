import React from 'react';
import { Smartphone, LayoutDashboard, UserPlus } from 'lucide-react';
import type { PersonaKey, Persona } from '../../types';

interface HeaderProps {
  currentView: 'customer' | 'banker';
  onSwitchView: (view: 'customer' | 'banker') => void;
  selectedPersona: PersonaKey;
  onSelectPersona: (p: PersonaKey) => void;
  currentLanguage: 'en' | 'hi';
  onToggleLanguage: (lang: 'en' | 'hi') => void;
  isBackendConnected: boolean;
  personas?: Record<PersonaKey, Persona>;
  onOpenAddPerson?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSwitchView,
  selectedPersona,
  onSelectPersona,
  currentLanguage,
  onToggleLanguage,
  isBackendConnected,
  personas = {},
  onOpenAddPerson,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 px-4 lg:px-6 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & AI Engine Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 font-bold text-white tracking-wider">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  पैसा साथी{' '}
                  <span className="text-emerald-400 font-semibold font-outfit">Paisa Saathi</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> AI Voice Banking
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Financial Health Companion for Irregular-Income Earners
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

          {/* Gnani Engine Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-[11px] text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-teal-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span>
              Gnani Engine: <strong className="text-teal-300">Prisma STT</strong> •{' '}
              <strong className="text-emerald-300">Evon LLM</strong> •{' '}
              <strong className="text-amber-300">Timbre TTS</strong>
            </span>
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 rounded font-mono">
              24ms Latency
            </span>
          </div>
        </div>

        {/* Controls: Persona Dropdown, Language Toggle, View Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Persona Selector & Add User */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={selectedPersona}
                onChange={(e) => onSelectPersona(e.target.value as PersonaKey)}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer max-w-[210px] sm:max-w-[260px] truncate"
              >
                {Object.entries(personas).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.isCustom ? '⭐ ' : '👤 '}{p.name} — {p.role.split('•')[0].trim()}
                  </option>
                ))}
              </select>
            </div>

            {onOpenAddPerson && (
              <button
                onClick={onOpenAddPerson}
                title="नया व्यक्ति जोड़ें (Add New Custom Profile)"
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ New Person</span>
                <span className="sm:hidden">+</span>
              </button>
            )}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => onToggleLanguage('en')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                currentLanguage === 'en'
                  ? 'text-emerald-400 bg-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onToggleLanguage('hi')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                currentLanguage === 'hi'
                  ? 'text-emerald-400 bg-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* View Switcher: Customer App vs Banker RM Portal */}
          <div className="flex items-center bg-emerald-950/80 p-1 rounded-xl border border-emerald-500/40">
            <button
              onClick={() => onSwitchView('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'customer'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>
            <button
              onClick={() => onSwitchView('banker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'banker'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Banker RM Portal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
