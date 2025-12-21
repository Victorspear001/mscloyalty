
import React from 'react';
import { Shield, Zap, Crown } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';
import { MSCLogo } from '../App';

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  const qrData = customer.customer_id;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.58/1] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/30 text-white p-10 sm:p-14 holographic-glow select-none mx-auto flex flex-col justify-between"
      style={{
        background: `linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)`
      }}
    >
      {/* Decorative Texture Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/30 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        
        {/* Top Section: Branding & Rank */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-6">
            <MSCLogo className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl" />
            <div className="flex flex-col">
              <h2 className="font-cinzel text-2xl sm:text-3xl font-black tracking-[0.3em] text-white leading-none drop-shadow-lg">MITHRAN</h2>
              <p className="text-[10px] font-black tracking-[0.6em] text-white/90 mt-2.5 uppercase leading-none opacity-90 drop-shadow-md">Elite Member</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-3xl border-2 border-white/40 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl transition-transform hover:scale-105">
            {customer.redeems >= 21 ? (
                <Crown className="w-6 h-6 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
            ) : (
                <Shield className="w-6 h-6 text-white fill-white drop-shadow-lg" />
            )}
            <span className="text-[13px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Center Section: Name Identity */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left my-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/70 mb-3 leading-none drop-shadow-sm">Member Identity</p>
            <h3 className="font-cinzel text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase truncate w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
              {customer.name}
            </h3>
        </div>

        {/* Bottom Section: Data & QR Code */}
        <div className="flex justify-between items-end w-full">
          <div className="flex gap-16 items-end">
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/60 mb-3 leading-none drop-shadow-sm">Access Code</p>
              <p className="font-mono text-xl sm:text-3xl font-black text-white tracking-[0.3em] leading-none drop-shadow-lg">{customer.customer_id}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/60 mb-3 leading-none drop-shadow-sm">Magic Points</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-xl sm:text-3xl font-black text-white leading-none drop-shadow-lg">{customer.redeems}</p>
                <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-[2.2rem] shadow-[0_24px_64px_rgba(0,0,0,0.6)] group transition-all hover:scale-110 active:scale-95 flex-shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={qrCodeUrl} alt="QR Access" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Glossy Sweep Shine */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[sweep_5s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
