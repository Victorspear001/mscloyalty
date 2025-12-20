
import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  // In a real app, we would use a library like html5-qrcode. 
  // For this demonstration, we'll simulate a scan after a short delay.
  const [status, setStatus] = useState('Initializing Camera...');

  React.useEffect(() => {
    const timer = setTimeout(() => {
        setStatus('Searching for MSC ID...');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6">
      <div className="relative w-full max-w-sm aspect-square border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-blue-400/10 animate-pulse"></div>
        <div className="text-white text-center p-4">
          <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-cinzel tracking-widest">{status}</p>
          <p className="text-xs mt-2 text-white/60">Position QR Code within the frame</p>
        </div>
        {/* Animated Scan Line */}
        <div className="absolute w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] top-0 animate-[scan_3s_linear_infinite]"></div>
      </div>
      
      <button 
        onClick={onClose}
        className="mt-12 bg-white/10 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all"
      >
        <X className="w-5 h-5" /> Cancel
      </button>

      <style>{`
        @keyframes scan {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
