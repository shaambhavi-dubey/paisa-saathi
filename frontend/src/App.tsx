import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { CashflowRhythm } from './components/banking/CashflowRhythm';
import { SupportiveCareBanner } from './components/banking/SupportiveCareBanner';
import { RecommendationCard } from './components/banking/RecommendationCard';
import { LoanJourneyStepper } from './components/journey/LoanJourneyStepper';
import { VoiceDock } from './components/voice/VoiceDock';
import { TranscriptDrawer } from './components/voice/TranscriptDrawer';
import { ScamAlertModal } from './components/modals/ScamAlertModal';
import { BankerDashboard } from './components/banker/BankerDashboard';
import { NativeMobileView } from './components/mobile/NativeMobileView';
import { AddPersonModal } from './components/modals/AddPersonModal';
import type { PersonaKey, Persona, ChatMessage } from './types';
import { checkBackendHealth, processVoiceText, processVoiceAudio } from './services/api';
import { Send, PiggyBank, Mic, Sparkles } from 'lucide-react';

const BASE_PERSONAS: Record<string, Persona> = {
  ramesh: {
    id: 'C00000',
    name: 'Ramesh Kumar',
    role: 'सब्जी विक्रेता • Mandi Tier-2',
    account: 'Canara Bank A/c •••• 4019',
    balance: '₹4,850',
    dailyAvg: '₹1,100',
    peakDay: 'Friday',
    peakAmount: '₹2,800',
    loanOffer: '₹20,000',
    weeklyEmi: '₹500 / week',
    contractId: 'CTR-58A7AF',
    initials: 'RK',
  },
  sunita: {
    id: 'C00119',
    name: 'Sunita Bai',
    role: 'कपास किसान • Cotton Smallholder',
    account: 'SBI Bank A/c •••• 8211',
    balance: '₹12,400',
    dailyAvg: '₹1,800',
    peakDay: 'Tuesday',
    peakAmount: '₹4,200',
    loanOffer: '₹45,000',
    weeklyEmi: '₹1,200 / Bi-weekly',
    contractId: 'CTR-33F90A',
    initials: 'SB',
  },
  amit: {
    id: 'C00305',
    name: 'Amit Rawat',
    role: 'डिलीवरी पार्टनर • Gig Worker',
    account: 'Paytm Payments Bank •••• 1092',
    balance: '₹2,150',
    dailyAvg: '₹850',
    peakDay: 'Sunday',
    peakAmount: '₹1,950',
    loanOffer: '₹15,000',
    weeklyEmi: '₹400 / Mon',
    contractId: 'CTR-90B22C',
    initials: 'AR',
  },
  vikram: {
    id: 'C00481',
    name: 'Vikram Sen',
    role: 'वेतनभोगी • Salaried Baseline',
    account: 'HDFC Bank A/c •••• 7744',
    balance: '₹38,500',
    dailyAvg: '₹2,500',
    peakDay: '1st of Month',
    peakAmount: '₹50,000',
    loanOffer: '₹1,00,000',
    weeklyEmi: '₹8,500 / Monthly',
    contractId: 'CTR-11D8E7',
    initials: 'VS',
  },
};

const loadInitialPersonas = (): Record<string, Persona> => {
  try {
    const saved = localStorage.getItem('paisa_saathi_custom_personas');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...BASE_PERSONAS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load personas from localStorage', e);
  }
  return { ...BASE_PERSONAS };
};

export const App: React.FC = () => {
  // Main Navigation State
  const [mainView, setMainView] = useState<'customer' | 'banker'>('customer');
  const [customerSubMode, setCustomerSubMode] = useState<'simulator' | 'native_hindi'>('simulator');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [personas, setPersonas] = useState<Record<string, Persona>>(loadInitialPersonas);
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<PersonaKey>('ramesh');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);

  // Customer UI State
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isStressVisible, setIsStressVisible] = useState(true);
  const [isScamModalOpen, setIsScamModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Notifications Toast State
  const [toasts, setToasts] = useState<Array<{ id: string; text: string }>>([]);

  // Active persona
  const persona = personas[selectedPersonaKey] || personas['ramesh'] || Object.values(personas)[0];

  const handleAddPersona = (newPersona: Persona) => {
    const newKey = `custom_${Date.now()}`;
    setPersonas((prev) => {
      const updated = { ...prev, [newKey]: newPersona };
      const customOnes = Object.fromEntries(
        Object.entries(updated).filter(([_, p]) => p.isCustom)
      );
      try {
        localStorage.setItem('paisa_saathi_custom_personas', JSON.stringify(customOnes));
      } catch (err) {
        console.warn('Failed to save to localStorage', err);
      }
      return updated;
    });
    setSelectedPersonaKey(newKey);
    showToast(`🎉 New profile active: ${newPersona.name} (${newPersona.role.split('•')[0].trim()})`);
  };

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      senderName: 'Ramesh',
      time: '6:42 PM',
      hindiText: 'साथी, मुझे दुकान के थोक माल के लिए ₹20,000 का छोटा लोन चाहिए।',
      englishSubtitle: 'Saathi, I need a small loan of ₹20,000 for my shop inventory.',
    },
    {
      id: '2',
      sender: 'assistant',
      senderName: 'Paisa Saathi AI',
      time: '6:42 PM',
      hindiText:
        'नमस्ते! आपके नियमित बिक्री के आधार पर हमने आपके लिए फ्लेक्सिबल लोन तैयार किया है।',
      englishSubtitle:
        'Hello! Based on your regular sales rhythm, we have pre-approved a flexible micro-loan.',
      audioDuration: '0:14',
    },
  ]);

  useEffect(() => {
    checkBackendHealth().then((ok) => setBackendConnected(ok));
  }, []);

  const showToast = (text: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const handleToggleLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    if (lang === 'hi') {
      setCustomerSubMode('native_hindi');
      showToast('भाषा बदली: हिंदी ऑडियो व नेटिव व्यू');
    } else {
      setCustomerSubMode('simulator');
      showToast('Language: English (Presentation mode with bilingual subtitles)');
    }
  };

  // Refs for real microphone recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Helper: play base64-encoded WAV audio from Timbre TTS
  const playBase64Audio = useCallback((base64: string, format: string = 'audio/wav') => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    const audioSrc = `data:${format};base64,${base64}`;
    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;
    audio.play().catch((err) => console.warn('Audio playback failed:', err));
  }, []);

  const handleMicPress = useCallback(async () => {
    // If currently recording, stop and process
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    // Request microphone permission and start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) {
          showToast('⚠️ No audio captured. Please try again.');
          return;
        }

        showToast('🔄 Processing voice... (Prisma STT → Evon LLM → Timbre TTS)');
        setIsDrawerOpen(true);

        // Send real audio to backend for STT → LLM → TTS pipeline
        const res = await processVoiceAudio(audioBlob, persona.id, 1);

        // Add user message with real transcript from Prisma STT
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          senderName: persona.name,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          hindiText: res.user_transcript,
          englishSubtitle: res.user_transcript, // STT gives us the actual transcript
        };
        setMessages((prev) => [...prev, userMsg]);

        // Add assistant reply with TTS audio
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          senderName: 'Paisa Saathi AI',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          hindiText: res.assistant_reply,
          englishSubtitle: res.assistant_reply,
          audioBase64: res.audio_base64 || undefined,
          audioDuration: '0:08',
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-play the TTS response audio if available
        if (res.audio_base64) {
          playBase64Audio(res.audio_base64);
          showToast('🔊 Playing Timbre TTS response...');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('🎙️ Recording... Tap mic again to stop. (Gnani Prisma STT)');
    } catch (err) {
      console.error('Microphone access error:', err);
      showToast('⚠️ Microphone access denied. Please allow microphone permission.');
    }
  }, [isRecording, persona.id, persona.name, showToast, playBase64Audio]);

  const handleSendManualMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: persona.name,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      hindiText: text,
      englishSubtitle: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    const res = await processVoiceText(text, persona.id, 1);
    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      senderName: 'Paisa Saathi AI',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      hindiText: res.assistant_reply,
      englishSubtitle: res.assistant_reply,
      audioBase64: res.audio_base64 || undefined,
      audioDuration: '0:08',
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Auto-play TTS audio for text messages too
    if (res.audio_base64) {
      playBase64Audio(res.audio_base64);
    }
  };

  const handlePlayAudioNote = (msg: ChatMessage) => {
    if (msg.audioBase64) {
      showToast(`🔊 Playing Timbre TTS audio: "${msg.hindiText.substring(0, 40)}..."`);
      playBase64Audio(msg.audioBase64);
    } else {
      // Fallback to browser speech synthesis only when no Timbre audio exists
      showToast(`🔊 Playing (browser TTS fallback): "${msg.hindiText.substring(0, 40)}..."`);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg.hindiText);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="bg-slate-950 text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Top Global Header (Hackathon Presentation & Mode Switcher) */}
      <Header
        currentView={mainView}
        onSwitchView={setMainView}
        selectedPersona={selectedPersonaKey}
        onSelectPersona={(p) => {
          setSelectedPersonaKey(p);
          showToast(`Switched profile: ${personas[p]?.name || p}`);
        }}
        currentLanguage={language}
        onToggleLanguage={handleToggleLanguage}
        isBackendConnected={backendConnected}
        personas={personas}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
      />

      {/* Floating Notification Toast Container */}
      <div className="fixed top-14 right-4 z-[999] pointer-events-none flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-slate-900 text-white border border-emerald-500/40 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 pointer-events-auto animate-in slide-in-from-right duration-200"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 bg-slate-900 text-slate-800 flex overflow-hidden relative">
        {/* VIEW 1: CUSTOMER MOBILE EXPERIENCE */}
        {mainView === 'customer' && (
          <section className="w-full flex-1 flex flex-col items-center justify-start py-4 px-2 sm:px-4 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            {/* Native Hindi Mobile View (When chosen) */}
            {customerSubMode === 'native_hindi' ? (
              <NativeMobileView
                onTriggerVoiceQuery={(q) => {
                  setIsDrawerOpen(true);
                  handleSendManualMessage(q);
                }}
                onOpenVoiceDrawer={() => setIsDrawerOpen(true)}
                showToast={showToast}
                onSwitchToSimulator={() => setCustomerSubMode('simulator')}
                persona={persona}
              />
            ) : (
              /* Desktop Bezel Mobile Simulator View (English-First Presentation) */
              <>
                {/* Presentation Context Controls Bar */}
                <div className="w-full max-w-md mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Mobile Voice Banking Simulator
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsStressVisible(true);
                        showToast('Simulated Cashflow Inflow Dip: -38% vs baseline.');
                      }}
                      className="text-amber-400 hover:text-amber-300 underline font-medium text-[11px] flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Test Stress Banner
                    </button>
                    <button
                      onClick={() => {
                        setIsScamModalOpen(true);
                        showToast('Triggered Transfer Risk Scam Alert Modal');
                      }}
                      className="text-rose-400 hover:text-rose-300 underline font-medium text-[11px]"
                    >
                      Test Scam Alert
                    </button>
                    <button
                      onClick={() => setCustomerSubMode('native_hindi')}
                      className="text-emerald-400 hover:underline text-[11px]"
                    >
                      Native Hindi
                    </button>
                  </div>
                </div>

                {/* Smartphone Bezel Mockup */}
                <div className="w-full max-w-[420px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 relative transition-all duration-300">
                  {/* Camera Island */}
                  <div className="w-32 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></div>
                  </div>

                  {/* Phone Inner Screen Area */}
                  <div className="w-full bg-[#FCF9F3] text-slate-800 rounded-[34px] overflow-hidden flex flex-col h-[780px] shadow-inner relative border border-slate-200">
                    {/* Screen Header / Status Bar */}
                    <div className="bg-[#FCF9F3] px-5 pt-3 pb-2 flex items-center justify-between border-b border-stone-200/60 sticky top-0 z-30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-emerald-200">
                          {persona.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs text-slate-900">{persona.name}</h3>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                              {persona.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">{persona.account}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-stone-200 text-[10px] text-slate-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>4G Soundbox 85%</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Screen Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-28">
                      {isLoanOpen ? (
                        /* 6-Step Loan Journey */
                        <LoanJourneyStepper
                          onExit={() => setIsLoanOpen(false)}
                          onSuccess={(_cid) => {
                            setTimeout(() => setIsLoanOpen(false), 2400);
                          }}
                          showToast={showToast}
                          customerName={persona.name}
                          contractId={persona.contractId}
                        />
                      ) : (
                        /* Standard Home Dashboard */
                        <>
                          {/* Account Balance Card */}
                          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-emerald-200/90 font-medium flex items-center gap-1">
                                  <span>Today's Total Inflow</span>
                                  <span className="text-[10px] bg-emerald-800/80 px-1.5 rounded text-emerald-200">
                                    आज की कमाई
                                  </span>
                                </span>
                                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                                  +18% vs Yesterday
                                </span>
                              </div>

                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-3xl font-extrabold tracking-tight font-outfit">
                                  {persona.balance}
                                  <span className="text-lg text-emerald-300/80">.00</span>
                                </span>
                                <span className="text-xs text-emerald-200/70 font-medium">
                                  34 UPI Transactions
                                </span>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-800/60 text-xs">
                                <button
                                  onClick={() => setIsScamModalOpen(true)}
                                  className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white py-1.5 px-2 rounded-xl font-medium flex items-center justify-center gap-1 border border-white/15"
                                >
                                  <Send className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Pay / Send</span>
                                </button>
                                <button
                                  onClick={() =>
                                    showToast(
                                      'Daily RD Goal: ₹150 saved today. Current balance ₹8,400.'
                                    )
                                  }
                                  className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white py-1.5 px-2 rounded-xl font-medium flex items-center justify-center gap-1 border border-white/15"
                                >
                                  <PiggyBank className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Gullak RD</span>
                                </button>
                                <button
                                  onClick={() => setIsDrawerOpen(true)}
                                  className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-slate-950 font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                                >
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>Voice Help</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* F4: Supportive Financial Stress Care Banner */}
                          <SupportiveCareBanner
                            isVisible={isStressVisible}
                            onAccept={() => {
                              setIsStressVisible(false);
                              showToast('✅ Success: EMI due date extended by 10 days with zero penalty!');
                            }}
                            onDismiss={() => {
                              setIsStressVisible(false);
                              showToast('Current Friday EMI schedule maintained.');
                            }}
                          />

                          {/* F2a: Cash-Flow Rhythm Visualizer */}
                          <CashflowRhythm
                            peakDay={persona.peakDay}
                            peakAmount={persona.peakAmount}
                          />

                          {/* F2b: Next-Best Product Recommendation */}
                          <RecommendationCard
                            onStartJourney={() => {
                              setIsLoanOpen(true);
                              showToast('Started 6-Step Guided Voice Loan Application');
                            }}
                            loanOffer={persona.loanOffer}
                            weeklyEmi={persona.weeklyEmi}
                          />

                          {/* Quick Voice Prompt Chips */}
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                              Ask Saathi in Hindi or English:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => {
                                  setIsDrawerOpen(true);
                                  handleSendManualMessage('शर्मा जी का ₹350 बाकी लिखो');
                                }}
                                className="text-[10px] bg-white border border-stone-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium"
                              >
                                "शर्मा जी का ₹350 बाकी लिखो"
                              </button>
                              <button
                                onClick={() => {
                                  setIsDrawerOpen(true);
                                  handleSendManualMessage('कल थोक आलू के लिए कितना बचेगा?');
                                }}
                                className="text-[10px] bg-white border border-stone-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium"
                              >
                                "कल थोक आलू के लिए कितना बचेगा?"
                              </button>
                              <button
                                onClick={() => {
                                  setIsDrawerOpen(true);
                                  handleSendManualMessage('₹20,000 लोन का हफ़्ते का ब्याज कितना?');
                                }}
                                className="text-[10px] bg-white border border-stone-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium"
                              >
                                "₹20,000 लोन का हफ़्ते का ब्याज कितना?"
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Global Bottom Voice Dock */}
                    <VoiceDock
                      isRecording={isRecording}
                      onPressMic={handleMicPress}
                      onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
                      isLoanOpen={isLoanOpen}
                      onToggleTab={() => setIsLoanOpen(!isLoanOpen)}
                    />

                    {/* Expandable Voice Transcript Drawer */}
                    <TranscriptDrawer
                      isOpen={isDrawerOpen}
                      onClose={() => setIsDrawerOpen(false)}
                      messages={messages}
                      onSendMessage={handleSendManualMessage}
                      onPlayAudioNote={handlePlayAudioNote}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* VIEW 2: BANKER & RM DASHBOARD */}
        {mainView === 'banker' && <BankerDashboard showToast={showToast} />}
      </main>

      {/* F3: Scam Anomaly Intercept Modal */}
      <ScamAlertModal
        isOpen={isScamModalOpen}
        onCancel={() => {
          setIsScamModalOpen(false);
          showToast('🛡️ Transfer cancelled safely. Flagged payee forwarded to Mule Interceptor.');
        }}
        onProceedAnyway={() => {
          setIsScamModalOpen(false);
          showToast('⚠️ Transfer halted: Voice confirmation failed risk safety threshold.');
        }}
        onPlayWarningAudio={() =>
          showToast('🔊 Warning Audio: "सचेत रहें! यह खाता संदिग्ध पाया गया है..."')
        }
      />

      {/* Add New Custom Profile Modal */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onAddPersona={handleAddPersona}
      />
    </div>
  );
};

export default App;
