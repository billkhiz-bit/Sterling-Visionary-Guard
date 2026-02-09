
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageType, DocumentAnalysis, UserSettings, EmergencyContact, StoredDocument } from './types';
import { geminiService } from './services/geminiService';
import VoiceFeedback from './components/VoiceFeedback';
import CameraModule from './components/CameraModule';
import EmergencyContactSetup from './components/EmergencyContactSetup';
import ShowcaseOverlay from './components/ShowcaseOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import ThinkingIndicator from './components/ThinkingIndicator';
import { useDocumentHistory } from './hooks/useDocumentHistory';
import { useStatistics } from './hooks/useStatistics';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useReminders } from './hooks/useReminders';
import { haptics } from './utils/haptics';
import { earcons } from './utils/audioContext';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const { history, addDocument, toggleArchived, getUnreadDocuments } = useDocumentHistory();
  const { stats, recordScan, recordArchived } = useStatistics();
  const { reminders, createReminder } = useReminders();
  
  const [settings, setSettings] = useLocalStorage<UserSettings>('vfa_settings', {
    volume: 0.3,
    autoSpeak: true,
    speechRate: 0.85,
    speechPitch: 1.05
  });
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: MessageType.ASSISTANT,
      content: "Hello! I'm Sterling, your visionary guard. I'm here to be your eyes on your paperwork and your shield against scams. Tap Scan to show me a document, or use a Voice Command.",
      timestamp: new Date()
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(settings.autoSpeak);
  const [currentSpeechText, setCurrentSpeechText] = useState(messages[0].content);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencySetup, setShowEmergencySetup] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const voices = synth.getVoices().filter(v => v.lang.startsWith('en'));
      setAvailableVoices(voices);
    };
    loadVoices();
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const parseAssistantResponse = (rawText: string): { content: string, analysis?: DocumentAnalysis } => {
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const analysis = JSON.parse(jsonMatch[1]) as DocumentAnalysis;
        const content = rawText.replace(jsonMatch[0], '').trim();
        return { content, analysis };
      } catch (e) { console.error(e); }
    }
    return { content: rawText };
  };

  const handleToggleRead = (docId: string) => {
    const doc = history.find(d => d.id === docId);
    if (!doc) return;
    
    toggleArchived(docId);
    haptics.success();
    
    if (!doc.isArchived) {
      recordArchived();
      const msg = `Got it. I've marked your ${doc.provider} document as read and moved it to your archive.`;
      triggerManualRead(msg);
      addMessage(MessageType.ASSISTANT, msg);
    }
  };

  const addMessage = (type: MessageType, rawContent: string, imageData?: string) => {
    let content = rawContent;
    let analysis: DocumentAnalysis | undefined;
    let relatedDocId: string | undefined;

    if (type === MessageType.ASSISTANT) {
      const parsed = parseAssistantResponse(rawContent);
      content = parsed.content;
      analysis = parsed.analysis;

      if (analysis) {
        if (analysis.scam_risk !== 'none') {
          earcons.alert();
          haptics.warning();
        } else {
          earcons.scanSuccess();
          haptics.success();
        }
        
        recordScan(analysis.amount || 0, analysis.scam_risk !== 'none');
        
        const storedDoc = addDocument({
          provider: analysis.provider,
          category: analysis.category,
          amount: analysis.amount,
          amountSpoken: analysis.amount_spoken,
          dueDate: analysis.due_date,
          dueDateSpoken: analysis.due_date_spoken,
          imageData
        });
        relatedDocId = storedDoc.id;

        if (analysis.document_type === 'bill' && analysis.due_date !== 'unknown') {
          createReminder(storedDoc);
        }
      }

      if (settings.autoSpeak) {
        setCurrentSpeechText(content);
        setIsSpeaking(true);
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      fullRawContent: rawContent,
      timestamp: new Date(),
      imageData,
      analysis,
      relatedDocId
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleProcessInput = async (text: string, imageData?: string) => {
    setIsProcessing(true);
    if (imageData && !text) {
      triggerManualRead("I'm using my eyes to read that photo for you now. Just a moment.");
    }

    const historySummary = history.slice(0, 10).map(d => 
      `${d.provider}: £${d.amount}. Archived: ${d.isArchived}`
    ).join('; ');

    const contextText = text + (history.length > 0 ? ` [Scanned history: ${historySummary}]` : "");

    try {
      const responseText = await geminiService.processInput(contextText, imageData);
      addMessage(MessageType.ASSISTANT, responseText);
    } catch (err) {
      haptics.error();
      addMessage(MessageType.ASSISTANT, "I'm sorry, I'm having a bit of trouble connecting to my brain. Could we try scanning it once more?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase();
    if (cmd.includes('scan') || cmd.includes('photo') || cmd.includes('camera')) {
      setShowCamera(true);
    } else if (cmd.includes('bill') || cmd.includes('unread') || cmd.includes('pending') || cmd.includes('due')) {
      const unread = getUnreadDocuments();
      if (unread.length === 0) {
        triggerManualRead("Sterling shows no unread documents in your records. You're all caught up!");
      } else {
        const next = unread[0];
        triggerManualRead(`You have ${unread.length} items waiting. The most recent is from ${next.provider}.`);
      }
    } else {
      handleProcessInput(command);
    }
  };

  const triggerManualRead = (text: string) => {
    haptics.success();
    setCurrentSpeechText(text);
    setIsSpeaking(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptics.success();
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      handleProcessInput("", result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.onstart = () => { haptics.success(); setIsListening(true); };
    recognition.onresult = (event: any) => {
      handleCommand(event.results[0][0].transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const updateSpeechParam = (key: 'speechRate' | 'speechPitch', delta: number) => {
    setSettings(prev => {
      const newVal = Math.max(0.1, Math.min(2.0, Number((prev[key] + delta).toFixed(2))));
      const name = key === 'speechRate' ? 'Speed' : 'Pitch';
      triggerManualRead(`${name} set to ${newVal}`);
      return { ...prev, [key]: newVal };
    });
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen max-w-3xl mx-auto bg-black text-white selection:bg-yellow-500 overflow-hidden font-sans antialiased">
        <VoiceFeedback 
          text={currentSpeechText} 
          isSpeaking={isSpeaking} 
          volume={settings.volume} 
          rate={settings.speechRate}
          pitch={settings.speechPitch}
          voiceId={settings.voiceId}
          onFinished={() => setIsSpeaking(false)} 
        />
        
        <header className="px-6 py-4 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 flex justify-between items-center shrink-0 safe-area-top">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-yellow-500 uppercase tracking-tighter leading-none">Sterling</h1>
            <button onClick={() => setShowShowcase(true)} className="text-[9px] font-black uppercase text-zinc-500 hover:text-yellow-500 transition-colors tracking-widest mt-1">Showcase ➔</button>
          </div>
          <div className="flex gap-3">
             {isProcessing && <ThinkingIndicator />}
             <button 
               onClick={() => { setShowSettings(true); haptics.success(); }} 
               className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 active:scale-95 transition-all text-xl"
               aria-label="Settings"
             >
               ⚙️
             </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-12">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === MessageType.USER ? 'items-end' : 'items-start'}`}>
              <div className={`p-5 rounded-[2rem] text-lg max-w-[92%] border-2 shadow-lg transition-all ${
                msg.type === MessageType.USER ? 'bg-zinc-800 border-zinc-700 rounded-br-none' : 'bg-zinc-900 border-zinc-800 rounded-tl-none'
              } ${msg.analysis?.scam_risk && msg.analysis.scam_risk !== 'none' ? 'border-red-600 ring-2 ring-red-600/20' : ''}`}>
                
                {msg.analysis?.scam_risk && msg.analysis.scam_risk !== 'none' && (
                  <div className="mb-4 bg-red-950/40 p-5 rounded-2xl border border-red-900/50 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-red-500 uppercase text-[10px] tracking-[0.3em] font-black">Scam Detected</span>
                    </div>
                    {msg.analysis.scam_reasoning && (
                      <p className="text-sm font-bold leading-snug text-red-100/90 border-l-2 border-red-600 pl-3">
                        {msg.analysis.scam_reasoning}
                      </p>
                    )}
                    <ul className="space-y-1 mt-1">
                      {msg.analysis.scam_indicators.slice(0, 3).map((ind, i) => (
                        <li key={i} className="text-[11px] font-medium text-red-300 flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-500 rounded-full" /> {ind}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.imageData && <img src={msg.imageData} className="mb-4 rounded-2xl w-full h-auto border border-zinc-800 shadow-inner" alt="Captured document" />}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {msg.relatedDocId && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <button 
                      onClick={() => handleToggleRead(msg.relatedDocId!)}
                      className={`w-full py-4 rounded-xl font-black text-sm transition-all border-2 ${
                        history.find(d => d.id === msg.relatedDocId)?.isArchived 
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-default' 
                        : 'bg-zinc-800 border-zinc-700 text-yellow-500'
                      }`}
                    >
                      {history.find(d => d.id === msg.relatedDocId)?.isArchived ? '✓ ARCHIVED' : 'MARK AS READ'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-zinc-900 border-2 border-zinc-800 p-4 rounded-full flex gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0 safe-area-bottom">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button 
              onClick={() => { setShowCamera(true); haptics.success(); }} 
              className="bg-zinc-800 text-yellow-500 py-8 rounded-[2rem] text-2xl font-black border-2 border-zinc-700 uppercase shadow-lg active:scale-95 transition-all"
            >
              Scan
            </button>
            <button 
              onClick={() => { fileInputRef.current?.click(); haptics.success(); }} 
              className="bg-zinc-800 text-blue-400 py-8 rounded-[2rem] text-2xl font-black border-2 border-zinc-700 uppercase shadow-lg active:scale-95 transition-all"
            >
              Attach
            </button>
          </div>
          <button 
            onClick={startListening} 
            className={`w-full ${isListening ? 'bg-red-600 animate-pulse' : 'bg-yellow-500'} text-black py-8 rounded-[2.5rem] text-2xl font-black uppercase shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3`}
          >
            {isListening ? (
              <>
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <span className="text-3xl">🎤</span>
                <span>Voice Command</span>
              </>
            )}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </footer>

        {showCamera && <CameraModule onCapture={(data) => { setShowCamera(false); handleProcessInput("", data); }} onCancel={() => setShowCamera(false)} />}
        {showShowcase && <ShowcaseOverlay onStartScenario={(s) => { setShowShowcase(false); handleCommand(s); }} onClose={() => setShowShowcase(false)} />}
        
        {showSettings && (
          <div className="fixed inset-0 bg-black/95 z-[200] p-6 flex flex-col items-center overflow-y-auto backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-black text-yellow-500 my-8 uppercase tracking-tighter">AI Voice Controls</h2>
            
            <div className="w-full max-w-md space-y-6 pb-20">
               <button 
                 onClick={() => setSettings({...settings, autoSpeak: !settings.autoSpeak})} 
                 className={`w-full py-6 px-8 rounded-3xl border-4 font-black text-xl flex items-center justify-between transition-all ${
                   settings.autoSpeak ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                 }`}
               >
                  <span>Auto-Read Responses</span>
                  <span className="text-sm font-black uppercase">{settings.autoSpeak ? 'On' : 'Off'}</span>
               </button>

               <div className="bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 space-y-4">
                 <h3 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Speech Speed</h3>
                 <div className="flex gap-3">
                   <button onClick={() => updateSpeechParam('speechRate', -0.1)} className="flex-1 bg-zinc-800 py-5 rounded-2xl text-lg font-black border-2 border-zinc-700 active:bg-yellow-500 active:text-black">Slower</button>
                   <button onClick={() => updateSpeechParam('speechRate', 0.1)} className="flex-1 bg-zinc-800 py-5 rounded-2xl text-lg font-black border-2 border-zinc-700 active:bg-yellow-500 active:text-black">Faster</button>
                 </div>
                 <p className="text-center font-black text-yellow-500 text-xl">{settings.speechRate.toFixed(1)}x</p>
               </div>

               <div className="bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 space-y-4">
                 <h3 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Speech Pitch</h3>
                 <div className="flex gap-3">
                   <button onClick={() => updateSpeechParam('speechPitch', -0.1)} className="flex-1 bg-zinc-800 py-5 rounded-2xl text-lg font-black border-2 border-zinc-700 active:bg-yellow-500 active:text-black">Lower</button>
                   <button onClick={() => updateSpeechParam('speechPitch', 0.1)} className="flex-1 bg-zinc-800 py-5 rounded-2xl text-lg font-black border-2 border-zinc-700 active:bg-yellow-500 active:text-black">Higher</button>
                 </div>
                 <p className="text-center font-black text-yellow-500 text-xl">{settings.speechPitch.toFixed(1)}</p>
               </div>

               {availableVoices.length > 0 && (
                 <div className="bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-800 space-y-4">
                   <h3 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Choose AI Voice</h3>
                   <div className="grid gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                     {availableVoices.map(voice => (
                       <button 
                         key={voice.voiceURI}
                         onClick={() => {
                           setSettings({...settings, voiceId: voice.voiceURI});
                           triggerManualRead("Switched to " + voice.name);
                         }}
                         className={`w-full p-4 rounded-xl text-left font-bold text-sm border-2 transition-all ${
                           settings.voiceId === voice.voiceURI ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                         }`}
                       >
                         {voice.name}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               <button 
                 onClick={() => { setShowSettings(false); haptics.success(); }} 
                 className="w-full py-8 bg-white text-black rounded-full font-black text-xl shadow-xl active:scale-95 transition-all mt-4"
               >
                 Close Settings
               </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
