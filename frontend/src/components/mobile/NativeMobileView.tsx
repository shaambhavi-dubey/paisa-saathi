import React, { useState } from 'react';
import {
  Volume2,
  TrendingUp,
  Bell,
  Lightbulb,
  Mic,
  Activity,
  RotateCcw,
  Store,
  BookOpen,
  Headphones,
} from 'lucide-react';

import type { Persona } from '../../types';

interface NativeMobileViewProps {
  onTriggerVoiceQuery: (query: string) => void;
  onOpenVoiceDrawer: () => void;
  showToast: (msg: string) => void;
  onSwitchToSimulator: () => void;
  persona?: Persona;
}

export const NativeMobileView: React.FC<NativeMobileViewProps> = ({
  onTriggerVoiceQuery,
  onOpenVoiceDrawer,
  showToast,
  onSwitchToSimulator,
  persona,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'khata' | 'voice' | 'help'>('home');
  const [isMicActive, setIsMicActive] = useState(false);

  const handleMicClick = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      showToast('साथी सुन रहा है... स्पष्ट हिंदी में बोलें');
      if (navigator.vibrate) navigator.vibrate(40);
      setTimeout(() => {
        setIsMicActive(false);
        onOpenVoiceDrawer();
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#FCF9F3] text-slate-800 min-h-screen flex flex-col relative pb-28 font-vietnam shadow-2xl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FCF9F3]/90 backdrop-blur-xl border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00452e] to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#00452e]">पैसा साथी</span>
              <span className="text-[10px] text-slate-500 font-medium">• Home</span>
            </div>
            <span className="text-[11px] text-slate-600 block">
              नमस्ते {persona?.name || 'रमेश'} जी ({persona?.role.split('•')[0].trim() || 'सब्जी विक्रेता'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToSimulator}
            className="text-[10px] bg-emerald-100 text-[#00452e] px-2 py-1 rounded-lg font-bold border border-emerald-300 active:scale-95 transition-all"
          >
            Desktop Bezel View
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-200">
            {persona?.initials || 'RK'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-3.5 flex-1">
        {/* Status & Soundbox Alert Banner */}
        <div className="bg-[#F6F3ED] rounded-xl p-3 shadow-xs flex items-center justify-between gap-2 border border-stone-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#A8F2CD] flex items-center justify-center text-[#00452e] shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00452e] animate-pulse"></span>
                <span className="text-xs font-bold text-[#00452e] truncate">
                  साउंडबॉक्स 4G कनेक्टेड
                </span>
              </div>
              <span className="text-[11px] text-slate-600 truncate block">
                85% बैटरी • आवाज़ तेज़
              </span>
            </div>
          </div>
          <button
            onClick={() => showToast('🔊 टेस्ट साउंड: "केनरा बैंक में ₹4,850 प्राप्त हुए"')}
            className="px-2.5 py-1 bg-white rounded-full shadow-2xs flex items-center gap-1 text-[#984700] hover:bg-stone-50 text-xs font-bold border border-stone-200"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>चेक</span>
          </button>
        </div>

        {/* Today's Earnings Card (Hero Metric) */}
        <div className="bg-[#00452e] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-200 uppercase tracking-wide font-medium">
                  आज की कुल कमाई
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#984700] text-white text-[10px] font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +18% कल से
                </span>
              </div>
              <button
                onClick={() =>
                  showToast('🔊 ऑडियो: "आज शाम तक कुल ₹4,850 की कमाई हुई है"')
                }
                className="w-8 h-8 rounded-full bg-[#0d5e42] text-white flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold tracking-tight font-outfit">{persona?.balance || '₹4,850'}</span>
              <span className="text-sm text-emerald-200 font-medium">.00</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-xs text-emerald-100">
              <span>34 ग्राहक (31 UPI + 3 नकद)</span>
              <span className="text-[11px] text-emerald-300 font-semibold">शाम 6:45 तक</span>
            </div>
          </div>
        </div>

        {/* Split: Balance & Udhaar */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Bank Balance */}
          <div className="bg-white rounded-xl p-3 shadow-xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-600">बैंक बैलेंस</span>
              <span className="text-[#00452e] font-bold text-xs">₹</span>
            </div>
            <div>
              <span className="text-base font-extrabold text-[#00452e] block font-outfit">
                ₹24,320
              </span>
              <span className="text-[10px] text-slate-500">केनरा बैंक खाते में</span>
            </div>
            <button
              onClick={() => showToast('केनरा बैंक बैलेंस: ₹24,320')}
              className="mt-2 w-full py-1 bg-stone-100 rounded-lg text-[11px] text-[#00452e] font-bold hover:bg-stone-200 flex items-center justify-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> सुनें
            </button>
          </div>

          {/* Market Udhaar */}
          <div className="bg-white rounded-xl p-3 shadow-xs border border-stone-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-600">बाज़ार उधार</span>
              <span className="text-amber-700 font-bold text-xs">📖</span>
            </div>
            <div>
              <span className="text-base font-extrabold text-amber-900 block font-outfit">
                ₹1,840
              </span>
              <span className="text-[10px] text-slate-500">5 ग्राहकों का बाकी</span>
            </div>
            <button
              onClick={() => showToast('शर्मा जी सहित 5 ग्राहकों का तगादा SMS भेजा गया')}
              className="mt-2 w-full py-1 bg-amber-50 rounded-lg text-[11px] text-amber-900 font-bold hover:bg-amber-100 flex items-center justify-center gap-1"
            >
              <Bell className="w-3 h-3" /> तगादा
            </button>
          </div>
        </div>

        {/* Cashflow Rhythm Widget (कैशफ्लो रिदम) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>हफ्ते का कैशफ्लो रिदम</span>
                <span className="text-[10px] text-slate-500 font-normal">मंडी चक्र</span>
              </h3>
              <p className="text-[10px] text-slate-500">बिक्री और आवक का दैनिक रुझान</p>
            </div>
            <span className="text-[10px] font-bold bg-[#FFDBC8] text-[#984700] px-2 py-0.5 rounded-full">
              पीक: शुक्रवार
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="h-28 flex items-end justify-between gap-1 px-1 bg-[#F6F3ED] rounded-xl pt-3 pb-1 border border-stone-200/60">
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600 font-semibold">3.2k</span>
              <div className="w-full max-w-[24px] bg-[#8DD5B2] rounded-t-md h-12"></div>
              <span className="text-[9px] text-slate-700 font-medium">सोम</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600 font-semibold">2.9k</span>
              <div className="w-full max-w-[24px] bg-[#8DD5B2] rounded-t-md h-10"></div>
              <span className="text-[9px] text-slate-700 font-medium">मंगल</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600 font-semibold">4.1k</span>
              <div className="w-full max-w-[24px] bg-[#8DD5B2] rounded-t-md h-16"></div>
              <span className="text-[9px] text-slate-700 font-medium">बुध</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600 font-semibold">3.8k</span>
              <div className="w-full max-w-[24px] bg-[#8DD5B2] rounded-t-md h-14"></div>
              <span className="text-[9px] text-slate-700 font-medium">गुरु</span>
            </div>
            {/* Friday Peak */}
            <div className="flex-1 flex flex-col items-center gap-0.5 relative">
              <span className="absolute -top-3.5 bg-[#984700] text-white text-[7px] font-bold px-1 rounded shadow-xs">
                पीक 🔥
              </span>
              <span className="text-[8px] font-bold text-[#984700]">8.4k</span>
              <div className="w-full max-w-[24px] bg-[#984700] rounded-t-md h-22 shadow-xs"></div>
              <span className="text-[9px] font-bold text-[#984700]">शुक्र</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600 font-semibold">6.1k</span>
              <div className="w-full max-w-[24px] bg-[#8DD5B2] rounded-t-md h-18"></div>
              <span className="text-[9px] text-slate-700 font-medium">शनि</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-[#00452e]">4.8k</span>
              <div className="w-full max-w-[24px] bg-[#00452e] rounded-t-md h-15 shadow-xs"></div>
              <span className="text-[9px] font-bold text-[#00452e]">आज</span>
            </div>
          </div>

          {/* Smart Advice */}
          <div className="bg-[#F0EEE8] rounded-xl p-2.5 flex items-start gap-2 border border-stone-200">
            <Lightbulb className="w-4 h-4 text-[#984700] shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-800 leading-tight">
              <strong>स्मार्ट सलाह: शुक्रवार महा-मंडी तैयारी</strong>
              <p className="text-[10px] text-slate-600 mt-0.5">
                शुक्रवार को आपकी कमाई सबसे अधिक (₹8,420) रहती है। थोक लॉट के लिए गुरुवार रात ₹5,000 अलग रखें।
              </p>
            </div>
          </div>
        </div>

        {/* Voice Query Suggestions */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-[#984700]" /> बोलकर आज़माएं
            </span>
            <span className="text-[10px] text-slate-500">टैप करके पूछें</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onTriggerVoiceQuery('आज का कुल हिसाब बताओ')}
              className="bg-white border border-stone-200 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-800 shadow-2xs hover:bg-stone-50 active:scale-95"
            >
              "आज का कुल हिसाब बताओ"
            </button>
            <button
              onClick={() => onTriggerVoiceQuery('शर्मा जी का ₹350 बाकी लिखो')}
              className="bg-white border border-stone-200 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-800 shadow-2xs hover:bg-stone-50 active:scale-95"
            >
              "शर्मा जी का ₹350 बाकी लिखो"
            </button>
            <button
              onClick={() => onTriggerVoiceQuery('कल मंडी के लिए कितना बचेगा?')}
              className="bg-white border border-stone-200 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-800 shadow-2xs hover:bg-stone-50 active:scale-95"
            >
              "कल मंडी के लिए कितना बचेगा?"
            </button>
          </div>
        </div>

        {/* Dialogue and Accounting Diary */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00452e]"></span>
              <h4 className="text-xs font-bold text-slate-900">बातचीत और हिसाब डायरी</h4>
            </div>
            <span className="text-[10px] bg-[#A8F2CD] text-[#00452e] px-2 py-0.5 rounded-full font-bold">
              लाइव
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Ramesh message */}
            <div className="bg-[#EBE8E2] p-2.5 rounded-xl rounded-tr-xs ml-4 text-slate-900">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="font-bold text-slate-700">रमेश (आप) • 6:42 PM</span>
                <Activity className="w-3 h-3 text-[#00452e]" />
              </div>
              <p>"साथी, आज शाम तक कितना पैसा आया और शर्मा जी ने कुछ दिया क्या?"</p>
            </div>

            {/* AI Assistant reply */}
            <div className="bg-[#F0EEE8] p-3 rounded-xl rounded-tl-xs mr-2 text-slate-900 border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-[10px] text-[#984700] font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#984700]"></span>
                <span>पैसा साथी AI • 6:42 PM</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                "रमेश जी, आज शाम तक कुल <strong className="text-[#00452e]">₹4,850</strong> आए हैं। और हाँ,
                शर्मा जी ने दोपहर 2:15 बजे UPI से <strong className="text-[#00452e]">₹500</strong> चुका दिए
                हैं! अब उनका केवल <strong className="text-amber-800">₹120</strong> बाकी है।"
              </p>
              <button
                onClick={() =>
                  showToast('🔊 ऑडियो: "रमेश जी, आज शाम तक कुल ₹4,850 आए हैं..."')
                }
                className="mt-2 py-1 px-2.5 bg-[#FFDBC8] text-[#984700] rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-[#ffb68a]"
              >
                <Volume2 className="w-3 h-3" /> आवाज़ में सुनें (14s)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Hero Bottom Voice Pod (Fixed) */}
      <div className="fixed bottom-16 inset-x-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-stone-200/80 flex items-center justify-between gap-3">
          {/* Wave animation indicator */}
          <div className="flex items-center gap-2 pl-2">
            <div className="flex items-end gap-1 h-5">
              <span className="w-1 bg-[#984700] rounded-full animate-pulse h-3"></span>
              <span className="w-1 bg-[#00452e] rounded-full animate-pulse h-5"></span>
              <span className="w-1 bg-[#984700] rounded-full animate-pulse h-2"></span>
              <span className="w-1 bg-[#00452e] rounded-full animate-pulse h-4"></span>
            </div>
            <div>
              <span className="text-[11px] text-[#00452e] font-bold block">साथी सुन रहा है...</span>
              <span className="text-[9px] text-slate-500">स्पष्ट हिंदी में बोलें</span>
            </div>
          </div>

          {/* Center Mic Button */}
          <button
            onClick={handleMicClick}
            className={`w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all ${
              isMicActive ? 'bg-[#00452e] scale-105' : 'bg-[#984700] hover:scale-105'
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>

          {/* Quick replay */}
          <button
            onClick={() => showToast('🔊 पिछला हिसाब पुनः दोहराया जा रहा है...')}
            className="px-3 py-1.5 bg-[#F0EEE8] rounded-xl flex flex-col items-center justify-center text-slate-700 hover:bg-stone-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">दोबारा</span>
          </button>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#FCF9F3]/95 backdrop-blur-xl border-t border-stone-200/80 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'home' ? 'text-[#00452e] font-bold' : 'text-slate-500'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px]">होम</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('khata');
              showToast('बही खाता: 34 लेन-देन आज के');
            }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'khata' ? 'text-[#00452e] font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">बही खाता</span>
          </button>
          <button
            onClick={onOpenVoiceDrawer}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'voice' ? 'text-[#984700] font-bold' : 'text-[#984700]'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px]">आवाज़</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('help');
              showToast('सहायता केंद्र: बैंक शाखा प्रतिनिधि 1800-425-0018');
            }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'help' ? 'text-[#00452e] font-bold' : 'text-slate-500'
            }`}
          >
            <Headphones className="w-5 h-5" />
            <span className="text-[10px]">मदद</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
