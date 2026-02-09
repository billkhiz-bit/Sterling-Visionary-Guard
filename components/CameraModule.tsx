
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { assessImageQuality } from '../utils/imageQuality';
import { haptics } from '../utils/haptics';

interface CameraModuleProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

const CameraModule: React.FC<CameraModuleProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const stabilityThreshold = 8; // Approx 4.8 seconds for high reliability

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1.7777777778 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(console.error);
      }
    } catch (err) {
      setError("Camera access denied.");
      haptics.error();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("I can't see through your camera. Please check your settings."));
    }
  };

  useEffect(() => {
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const handleCaptureInternal = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const finalQuality = assessImageQuality(canvas);
        
        if (finalQuality.quality !== 'good') {
          haptics.error();
          const msg = finalQuality.issue === 'too_dark' ? "It's a bit too dark." : 
                      finalQuality.issue === 'too_bright' ? "It's too bright." : "It's a bit blurry.";
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg + " Let's try again."));
          setStabilityCounter(0);
          return;
        }

        haptics.captured();
        onCapture(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  }, [onCapture]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = 320; 
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const quality = assessImageQuality(canvas);
          
          if (quality.quality === 'good') {
            setStabilityCounter(prev => {
              const next = prev + 1;
              if (next === 1) {
                haptics.success();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Document detected. Keep steady."));
              }
              if (next >= stabilityThreshold) {
                handleCaptureInternal();
                return 0;
              }
              return next;
            });
          } else {
            if (stabilityCounter > 3) {
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Please hold still."));
            }
            setStabilityCounter(0);
          }
        }
      }
    }, 600);
    return () => clearInterval(interval);
  }, [handleCaptureInternal, stabilityCounter]);

  // Corner styling for the "Locked on" effect
  const cornerClass = "absolute w-12 h-12 border-yellow-500 transition-all duration-300 pointer-events-none";

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-4 safe-area-inset">
      <div className="w-full flex justify-between items-center p-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter">
            {stabilityCounter > 0 ? "LOCKING ON..." : "SCANNING"}
          </h2>
          <div className="h-1 bg-zinc-800 w-32 rounded-full overflow-hidden mt-1">
             <div 
               className="h-full bg-green-500 transition-all duration-300" 
               style={{ width: `${(stabilityCounter/stabilityThreshold)*100}%` }}
             />
          </div>
        </div>
        <button 
          onClick={onCancel} 
          className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold active:scale-95 transition-all uppercase text-sm border border-white/20"
        >
          Close
        </button>
      </div>

      <div className="relative w-full flex-1 max-w-2xl bg-zinc-900 rounded-[2rem] overflow-hidden border-4 border-zinc-800 shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Dynamic Scanning Frame (Simulated Edge Detection) */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
           <div className={`relative w-full h-full border-2 border-white/10 rounded-2xl transition-all duration-500 ${stabilityCounter > 0 ? 'scale-[0.98] border-green-500/50' : 'scale-100'}`}>
              {/* Animated Corner Markers */}
              <div className={`${cornerClass} top-0 left-0 border-t-8 border-l-8 rounded-tl-3xl ${stabilityCounter > 0 ? 'scale-90 -translate-x-2 -translate-y-2' : ''}`} />
              <div className={`${cornerClass} top-0 right-0 border-t-8 border-r-8 rounded-tr-3xl ${stabilityCounter > 0 ? 'scale-90 translate-x-2 -translate-y-2' : ''}`} />
              <div className={`${cornerClass} bottom-0 left-0 border-b-8 border-l-8 rounded-bl-3xl ${stabilityCounter > 0 ? 'scale-90 -translate-x-2 translate-y-2' : ''}`} />
              <div className={`${cornerClass} bottom-0 right-0 border-b-8 border-r-8 rounded-br-3xl ${stabilityCounter > 0 ? 'scale-90 translate-x-2 translate-y-2' : ''}`} />
              
              {/* Scanner Line Effect */}
              {stabilityCounter > 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_#EAB308] animate-[scan_2s_linear_infinite]" />
              )}
           </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>

      <div className="w-full p-6 space-y-4">
        {error && <div className="p-4 bg-red-900/60 border border-red-500 rounded-2xl text-white text-center font-bold">{error}</div>}
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleCaptureInternal}
            className="bg-yellow-500 text-black w-full py-8 rounded-3xl text-3xl font-black shadow-2xl active:scale-95 transition-all uppercase tracking-tighter"
          >
            SNAP PHOTO
          </button>
          <p className="text-center text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            Hold steady to scan automatically
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.2; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default CameraModule;
