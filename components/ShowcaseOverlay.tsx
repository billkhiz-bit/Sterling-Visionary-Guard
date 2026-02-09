
import React, { useState, useEffect } from 'react';
import { haptics } from '../utils/haptics';
import { earcons } from '../utils/audioContext';

interface ShowcaseOverlayProps {
  onStartScenario: (scenario: 'scam' | 'receipt' | 'calendar') => void;
  onClose: () => void;
}

const ShowcaseOverlay: React.FC<ShowcaseOverlayProps> = ({ onStartScenario, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Feature Showcase</h2>
        <p className="text-2xl text-zinc-400 font-bold">Experience how Sterling acts as your eyes and your shield through three interactive simulations.</p>

        <div className="grid gap-4">
          <button 
            onClick={() => { haptics.success(); onStartScenario('scam'); }}
            className="w-full p-8 bg-red-600/20 border-4 border-red-600 rounded-[2rem] text-left group active:scale-95 transition-all"
          >
            <div className="text-red-500 font-black uppercase tracking-widest text-sm mb-1">Scenario 1</div>
            <div className="text-white text-3xl font-black uppercase">The Scam Letter</div>
            <div className="text-red-200/60 font-bold mt-2 text-lg">See how I spot red flags in a fake tax bill to keep you safe.</div>
          </button>

          <button 
            onClick={() => { haptics.success(); onStartScenario('receipt'); }}
            className="w-full p-8 bg-zinc-900 border-4 border-zinc-800 rounded-[2rem] text-left active:scale-95 transition-all hover:border-yellow-500"
          >
            <div className="text-yellow-500 font-black uppercase tracking-widest text-sm mb-1">Scenario 2</div>
            <div className="text-white text-3xl font-black uppercase">Spending Tracker</div>
            <div className="text-zinc-500 font-bold mt-2 text-lg">Watch me use my visionary eye to read and track a grocery receipt.</div>
          </button>

          <button 
            onClick={() => { haptics.success(); onStartScenario('calendar'); }}
            className="w-full p-8 bg-zinc-900 border-4 border-zinc-800 rounded-[2rem] text-left active:scale-95 transition-all hover:border-blue-500"
          >
            <div className="text-blue-500 font-black uppercase tracking-widest text-sm mb-1">Scenario 3</div>
            <div className="text-white text-3xl font-black uppercase">Voice Command</div>
            <div className="text-zinc-500 font-bold mt-2 text-lg">Check your upcoming bills securely using only your voice.</div>
          </button>
        </div>

        <button 
          onClick={() => { haptics.success(); onClose(); }}
          className="w-full py-8 text-zinc-500 text-2xl font-black uppercase tracking-widest"
        >
          Return to App
        </button>
      </div>
    </div>
  );
};

export default ShowcaseOverlay;
