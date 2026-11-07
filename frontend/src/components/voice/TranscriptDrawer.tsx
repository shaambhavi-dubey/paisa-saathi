import React, { useState } from 'react';
import { AudioLines, X, Send, Play } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onPlayAudioNote: (msg: ChatMessage) => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onPlayAudioNote,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-16 bg-white/95 backdrop-blur-xl z-50 rounded-t-[28px] border-t border-stone-300 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            <AudioLines className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Bilingual Voice Transcript & Chat</h4>
            <p className="text-[10px] text-slate-500">Hindi Audio + Real-Time English Subtitles</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-stone-100 text-slate-600 hover:bg-stone-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in`}
          >
            {msg.sender === 'user' ? (
              <div className="max-w-[85%] bg-stone-100 border border-stone-200 rounded-2xl rounded-tr-xs p-3 text-slate-900 shadow-2xs">
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">{msg.senderName} (Voice in Hindi)</span>
                  <span>{msg.time}</span>
                </div>
                <p className="font-semibold text-xs text-slate-900">"{msg.hindiText}"</p>
                {/* Real-Time English Subtitle */}
                <div className="mt-1.5 pt-1.5 border-t border-stone-200/80 text-[11px] text-emerald-900 font-medium">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1 rounded mr-1">
                    EN Subtitle:
                  </span>
                  "{msg.englishSubtitle}"
                </div>
              </div>
            ) : (
              <div className="max-w-[88%] bg-emerald-900 text-white rounded-2xl rounded-tl-xs p-3.5 shadow-md shadow-emerald-950/20">
                <div className="flex items-center justify-between gap-3 text-[10px] text-emerald-200 mb-1">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> पैसा साथी AI
                  </span>
                  <span>{msg.time}</span>
                </div>
                <p className="font-medium text-xs leading-relaxed text-emerald-50">
                  "{msg.hindiText}"
                </p>
                {/* Real-Time English Subtitle */}
                <div className="mt-2 pt-2 border-t border-emerald-700/80 text-[11px] text-emerald-100">
                  <span className="text-[9px] uppercase font-bold text-amber-300 bg-emerald-950/60 px-1 rounded mr-1">
                    EN Subtitle:
                  </span>
                  "{msg.englishSubtitle}"
                </div>

                {/* Audio Scrubber Chip */}
                <div className="mt-2.5 bg-emerald-950/60 p-2 rounded-xl flex items-center gap-2 text-[10px]">
                  <button
                    onClick={() => onPlayAudioNote(msg)}
                    className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 active:scale-95"
                  >
                    <Play className="w-3 h-3 ml-0.5" />
                  </button>
                  <div className="flex-1">
                    <div className="h-1 bg-emerald-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-1/2"></div>
                    </div>
                  </div>
                  <span className="font-mono text-emerald-300">
                    {msg.audioDuration || '0:14'} / Timbre TTS
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drawer Text Fallback Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type here in Hindi or English (text fallback)..."
          className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-xl active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
