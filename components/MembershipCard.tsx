
import React from 'react';
import { Shield, Zap, Crown } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo, COMPANY_LOGO_URL } from '../constants';

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  const qrData = customer.customer_id;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.58/1] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(37,99,235,0.4)] border border-white/20 text-white p-8 sm:p-12 holographic-glow select-none mx-auto"
      style={{
        background: `linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)`
      }}
    >
      {/* Decorative Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>
      <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-white/10 blur-[100px] rounded-full"></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Top Branding Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-center overflow-hidden border border-white/40">
              <img 
                src={COMPANY_LOGO_URL} 
                alt="Logo" 
                className="w-full h-full object-contain" 
                onError={(e) => {
                   (e.target as HTMLImageElement).src = 'logo.png';
                   (e.target as HTMLImageElement).onerror = () => {
                     (e.target as HTMLImageElement).src = 'https://img.icons8.com/fluency/96/sparkling.png';
                   };
                }}
              />
            </div>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.2em] text-white leading-none">MITHRAN</h2>
              <p className="text-[9px] font-black tracking-[0.5em] text-white/80 mt-2 uppercase leading-none opacity-90">Elite Lounge</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-3xl border border-white/30 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-xl">
            {customer.redeems >= 21 ? (
                <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300 drop-shadow-sm" />
            ) : (
                <Shield className="w-5 h-5 text-white fill-white drop-shadow-sm" />
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Identity Section - Centered Vertically in available space */}
        <div className="mt-auto mb-12">
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/60 mb-2 leading-none">Magic Identity</p>
            <h3 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase truncate drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
              {customer.name}
            </h3>
        </div>

        {/* Bottom Data Bar */}
        <div className="flex justify-between items-end">
          <div className="flex gap-14 items-end">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/50 mb-2">Portal ID</p>
              <p className="font-mono text-lg sm:text-2xl font-black text-white tracking-[0.2em] leading-none drop-shadow-sm">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/50 mb-2">Rewards</p>
              <div className="flex items-center gap-2.5">
                <p className="font-mono text-lg sm:text-2xl font-black text-white leading-none drop-shadow-sm">{customer.redeems}</p>
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] group transition-all hover:scale-105 hover:-rotate-1">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Glossy Sweep Shine */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[sweep_5s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
