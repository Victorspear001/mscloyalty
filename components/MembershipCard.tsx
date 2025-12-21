
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
 * Optimized for Premium Branding.
 */
const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  const qrData = customer.customer_id;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.585/1] rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 text-white p-12 flex flex-col justify-between holographic-glow select-none mx-auto bg-slate-900 group"
      style={{
        background: `linear-gradient(145deg, #1d4ed8 0%, #312e81 60%, #1e1b4b 100%)`
      }}
    >
      {/* Decorative Texture Overlays */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/10 pointer-events-none"></div>

      {/* Glossy Reflection Effect */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

      <div className="relative z-10 flex flex-col justify-between h-full w-full">
        
        {/* Header Section */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-6">
            <MSCLogo className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl ring-2 ring-white/20" />
            <div className="flex flex-col">
              <h2 className="font-cinzel text-2xl sm:text-3xl font-black tracking-[0.3em] text-white leading-none drop-shadow-2xl">MITHRAN</h2>
              <p className="text-[10px] font-black tracking-[0.6em] text-cyan-300 mt-3 uppercase leading-none drop-shadow-lg opacity-90">Platinum Member</p>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-xl">
            {customer.redeems >= 21 ? (
                <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
            ) : (
                <Shield className="w-6 h-6 text-white fill-white drop-shadow-lg" />
            )}
            <span className="text-[12px] font-black uppercase tracking-[0.15em] text-white drop-shadow-md">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Center: Large Name Identity */}
        <div className="flex flex-col my-auto mt-4">
            <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/40 mb-3 leading-none">Access Identity</p>
            <h3 className="font-cinzel text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase truncate w-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
              {customer.name}
            </h3>
        </div>

        {/* Footer: Data & QR Code */}
        <div className="flex justify-between items-end w-full">
          <div className="flex gap-16 items-end">
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 mb-3 leading-none">Member ID</p>
              <p className="font-mono text-xl sm:text-3xl font-black text-white tracking-[0.3em] leading-none drop-shadow-xl">{customer.customer_id}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 mb-3 leading-none">Magic Rank</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-xl sm:text-3xl font-black text-white leading-none drop-shadow-xl">{customer.redeems}</p>
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex-shrink-0 transition-all hover:scale-110 active:scale-95 ring-4 ring-white/5">
            <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center overflow-hidden rounded-xl">
              <img src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Glossy Reflection Sweep */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[sweep_7s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
