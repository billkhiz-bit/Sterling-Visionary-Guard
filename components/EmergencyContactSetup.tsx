
import React, { useState } from 'react';
import { EmergencyContact } from '../types';
import { haptics } from '../utils/haptics';

interface EmergencyContactSetupProps {
  initialContact?: EmergencyContact;
  onSave: (contact: EmergencyContact) => void;
  onCancel: () => void;
  isRequired?: boolean;
}

const EmergencyContactSetup: React.FC<EmergencyContactSetupProps> = ({ 
  initialContact, 
  onSave, 
  onCancel,
  isRequired 
}) => {
  const [name, setName] = useState(initialContact?.name || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      haptics.success();
      onSave({ name: name.trim(), phone: phone.trim() });
    } else {
      haptics.error();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[150] flex flex-col p-8 items-center justify-center animate-in fade-in zoom-in duration-200"
      role="dialog"
      aria-labelledby="setup-title"
    >
      <div className="w-full max-w-lg space-y-10">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 id="setup-title" className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Emergency Setup</h2>
          <p className="text-2xl text-zinc-400 font-bold leading-tight">
            Please add a trusted contact (like a relative or friend) to help you verify suspicious documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-lg font-black text-yellow-500 uppercase tracking-widest ml-4">Full Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-zinc-900 border-4 border-zinc-800 rounded-[2rem] px-8 py-7 text-3xl text-white outline-none focus:border-yellow-500 transition-all shadow-inner"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-3">
            <label className="text-lg font-black text-yellow-500 uppercase tracking-widest ml-4">UK Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07..."
              className="w-full bg-zinc-900 border-4 border-zinc-800 rounded-[2rem] px-8 py-7 text-3xl text-white outline-none focus:border-yellow-500 transition-all shadow-inner"
              required
              aria-required="true"
            />
          </div>

          <div className="pt-8 space-y-4">
            <button 
              type="submit"
              className="w-full py-10 bg-yellow-500 text-black rounded-full text-4xl font-black shadow-[0_10px_40px_rgba(234,179,8,0.3)] active:scale-95 transition-all uppercase tracking-tighter"
            >
              Confirm Contact
            </button>
            
            {!isRequired && (
              <button 
                type="button"
                onClick={onCancel}
                className="w-full py-6 text-zinc-500 rounded-full text-2xl font-black active:scale-95 transition-all uppercase tracking-widest"
              >
                Go Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyContactSetup;
