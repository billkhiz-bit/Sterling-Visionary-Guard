
import React, { useEffect, useState, useCallback, useRef } from 'react';

interface VoiceFeedbackProps {
  text: string;
  isSpeaking: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceId?: string;
  onFinished: () => void;
}

const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({ 
  text, 
  isSpeaking, 
  volume, 
  rate, 
  pitch, 
  voiceId, 
  onFinished 
}) => {
  const [synth] = useState(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    synth.cancel();

    if (!text || !isSpeaking) {
      return;
    }

    const cleanedText = text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    
    if (!cleanedText) {
      onFinished();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const setVoice = () => {
      const voices = synth.getVoices();
      let selectedVoice = null;

      if (voiceId) {
        selectedVoice = voices.find(v => v.voiceURI === voiceId);
      }

      if (!selectedVoice) {
        // Fallback to preferred UK voices
        selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Natural')) || 
                        voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) || 
                        voices.find(v => v.lang === 'en-GB') ||
                        voices[0];
      }

      if (selectedVoice) utterance.voice = selectedVoice;
    };

    setVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = setVoice;
    }

    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        onFinished();
      }
    };

    utterance.onerror = (event: any) => {
      console.warn('SpeechSynthesisUtterance error:', event.error);
      onFinished();
    };

    // Small delay helps with iOS/iPadOS Safari quirks
    setTimeout(() => {
      if (isSpeaking) {
        synth.speak(utterance);
      }
    }, 100);

  }, [text, isSpeaking, volume, rate, pitch, voiceId, synth, onFinished]);

  useEffect(() => {
    speak();
    return () => {
      synth.cancel();
      utteranceRef.current = null;
    };
  }, [speak, synth]);

  return null;
};

export default VoiceFeedback;