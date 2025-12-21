
import React from 'react';
import { Shield, Zap, Crown } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';
import { MSCLogo } from '../App';

interface MembershipCardProps {
  customer: Customer;
}

/**
 * Standard Credit Card Dimensions: 85.60 mm x 53.98 mm (Ratio 1.585:1)
 * Optimized for 4K Jpeg generation via html-to-image.
 */
const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  const qrData = customer.customer_id;
  // High res QR for JPG generation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.585/1] rounded-[1.8rem] overflow-hidden shadow-2xl border border-white/20 text-white p-10 flex flex-col justify-between holographic-glow select-none mx-auto bg-slate-900"
      style={{
        background: `linear-gradient(145deg, #1e40af 0%, #0369a1 100%)`
      }}
    >
      {/* Premium Overlays */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none"></div>

      {/* Decorative High-Contrast Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        
        {/* Header Section */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-5">
            <MSCLogo className="w-14 h-14 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-white/10" />
            <div className="flex flex-col">
              <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.25em] text-white leading-none drop-shadow-xl">MITHRAN</h2>
              <p className="text-[9px] font-black tracking-[0.5em] text-cyan-200 mt-2 uppercase leading-none opacity-90 drop-shadow-md">Elite Member</p>
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
            {customer.redeems >= 21 ? (
                <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
            ) : (
                <Shield className="w-5 h-5 text-white fill-white drop-shadow-lg" />
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white drop-shadow-md">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Center: Large Name Identity - Balanced for JPG visibility */}
        <div className="flex flex-col my-auto mt-2">
            <p className="text-[8px] font-black uppercase tracking-[0.6em] text-white/50 mb-2 leading-none">Magic Identity</p>
            <h3 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase truncate w-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
              {customer.name}
            </h3>
        </div>

        {/* Footer: Data & QR Code - Standardized alignment */}
        <div className="flex justify-between items-end w-full">
          <div className="flex gap-12 items-end">
            <div className="flex flex-col">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/50 mb-2">Access Key</p>
              <p className="font-mono text-lg sm:text-2xl font-black text-white tracking-[0.25em] leading-none drop-shadow-lg">{customer.customer_id}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/50 mb-2">Rewards</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg sm:text-2xl font-black text-white leading-none drop-shadow-lg">{customer.redeems}</p>
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Fixed-size QR box for perfect alignment in generated JPG */}
          <div className="bg-white p-2.5 rounded-[1.4rem] shadow-2xl flex-shrink-0 transition-transform group-hover:scale-105">
            <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden">
              <img src={qrCodeUrl} alt="QR Access" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Glossy Reflection Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[sweep_6s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
