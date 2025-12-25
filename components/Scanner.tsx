
import React, { useEffect, useState, useRef } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const elementId = "reader";
    const element = document.getElementById(elementId);
    
    // Safety check if element exists (it should in React)
    if (!element) return;

    const html5QrCode = new Html5Qrcode(elementId);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
        try {
            await html5QrCode.start(
                { facingMode: "environment" }, 
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                }, 
                (decodedText) => {
                    // Success callback
                    if (mountedRef.current) {
                        html5QrCode.stop().then(() => {
                            onScan(decodedText);
                        }).catch(err => {
                            console.warn("Scanner stop error", err);
                            // Even if stop fails, we still want to process the scan
                            onScan(decodedText);
                        });
                    }
                },
                (errorMessage) => {
                    // Error callback (called frequently if no QR found) - ignore to keep console clean
                }
            );
        } catch (err) {
            if (mountedRef.current) {
                console.error("Scanner start error", err);
                setError("Camera access failed. Please ensure you have granted camera permissions.");
            }
        }
    };

    startScanner();

    return () => {
        mountedRef.current = false;
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
            scannerRef.current.clear();
        }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm relative flex flex-col items-center">
        <h2 className="text-white font-cinzel text-xl mb-6 font-bold tracking-widest drop-shadow-lg flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-400" />
            SCAN QR
        </h2>
        
        <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
            <div id="reader" className="w-full h-full"></div>
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_#60a5fa] animate-[scan_2s_linear_infinite] z-10 opacity-70"></div>
        </div>

        {error && (
            <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-950/30 px-4 py-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">{error}</span>
            </div>
        )}

        <button 
          onClick={() => {
              if (scannerRef.current?.isScanning) {
                  scannerRef.current.stop().then(onClose).catch(() => onClose());
              } else {
                  onClose();
              }
          }}
          className="mt-8 bg-white/10 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all font-bold tracking-widest text-xs uppercase backdrop-blur-md border border-white/10 active:scale-95"
        >
          <X className="w-4 h-4" /> Cancel Scan
        </button>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        #reader video {
            object-fit: cover;
            width: 100% !important;
            height: 100% !important;
            border-radius: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
