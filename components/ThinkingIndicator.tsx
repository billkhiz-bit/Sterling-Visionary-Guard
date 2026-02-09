
import React, { useEffect } from 'react';

const ThinkingIndicator: React.FC = () => {
  useEffect(() => {
    const synth = window.speechSynthesis;
    // Don't interrupt if something important is already being said
    if (!synth.speaking) {
      const utterance = new SpeechSynthesisUtterance("Thinking...");
      utterance.volume = 0.2; // Very low volume for background feedback
      utterance.rate = 1.1;
      
      // Basic error handling for background speech
      utterance.onerror = (e: any) => {
        if (e.error !== 'interrupted') console.debug('Thinking TTS hint skipped');
      };

      synth.speak(utterance);
    }
  }, []);

  return (
    <div className="flex items-center gap-4 p-6 bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-sm" role="status" aria-label="Processing your request">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
      </div>
      Analyzing...
    </div>
  );
};

export default ThinkingIndicator;
