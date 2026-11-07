import React from 'react';
import { Mic, MessageSquareText, Home, ArrowLeft } from 'lucide-react';

interface VoiceDockProps {
  isRecording: boolean;
  onPressMic: () => void;
  onToggleDrawer: () => void;
  isLoanOpen: boolean;
  onToggleTab: () => void;
}

export const VoiceDock: React.FC<VoiceDockProps> = ({
  isRecording,
  onPressMic,
  onToggleDrawer,
  isLoanOpen,
  onToggleTab,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-3 absolute bottom-0 left-0 right-0 z-40 shadow-lg">
      {/* Voice wave active visualizer (shown while speaking) */}
      {isRecording && (
        <div className="mb-2.5 bg-emerald-950 text-white px-3 py-1.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold text-emerald-200 text-[11px]">
              Listening in Hindi/English... (Prisma STT)
            </span>
          </div>
          {/* Equalizer Bouncing Bars */}
          <div className="flex items-center gap-1 h-6">
            <span className="w-1 bg-emerald-400 rounded-full animate-wave-1"></span>
            <span className="w-1 bg-teal-300 rounded-full animate-wave-2"></span>
            <span className="w-1 bg-emerald-300 rounded-full animate-wave-3"></span>
            <span className="w-1 bg-amber-400 rounded-full animate-wave-4"></span>
            <span className="w-1 bg-emerald-400 rounded-full animate-wave-5"></span>
          </div>
        </div>
      )}

      {/* Dock Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Home / Back Switcher */}
        <button
          onClick={onToggleTab}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 text-[10px] font-semibold w-12"
        >
          {isLoanOpen ? (
            <>
              <ArrowLeft className="w-5 h-5 mb-0.5" />
              <span>Back</span>
            </>
          ) : (
            <>
              <Home className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </>
          )}
        </button>

        {/* Center: Central Pulsing Green Mic Button (64px) */}
        <div className="relative flex items-center justify-center -mt-5">
          <button
            onClick={onPressMic}
            className={`w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-900/40 border-4 border-white active:scale-90 transition-all focus:outline-none ${
              isRecording ? 'scale-105 ring-4 ring-emerald-400' : 'mic-pulse-ring'
            }`}
          >
            <Mic className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Right: Open Voice Conversation Drawer / Text Fallback */}
        <button
          onClick={onToggleDrawer}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 text-[10px] font-semibold w-12 relative"
        >
          <MessageSquareText className="w-5 h-5 mb-0.5" />
          <span>Transcript</span>
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>
    </div>
  );
};
