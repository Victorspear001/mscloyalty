
import React, { useState } from 'react';
import { Shield, Zap, Crown, Flame } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';

const COMPANY_LOGO = "logo.png";

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const [logoError, setLogoError] = useState(false);
  const rankInfo = getRankInfo(customer.redeems);
  const qrData = customer.customer_id;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=020617&margin=2`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.58/1] rounded-[1.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.95)] border border-white/10 bg-[#020617] text-white p-6 sm:p-9 holographic-glow select-none"
      style={{
        background: `linear-gradient(145deg, #020617 0%, #080c14 30%, #1e3a8a 100%)`
      }}
    >
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Central Brand Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 opacity-[0.02] pointer-events-none flex items-center justify-center">
         {!logoError ? (
           <img src={COMPANY_LOGO} className="w-full h-full object-contain grayscale brightness-200" alt="" />
         ) : (
           <Flame className="w-full h-full text-white" />
         )}
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {!logoError ? (
                <img 
                  src={COMPANY_LOGO} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                  crossOrigin="anonymous" 
                  onError={() => setLogoError(true)} 
                />
              ) : (
                <Flame className="text-blue-400 w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-widest text-white leading-none">MITHRAN</h2>
              <p className="text-[7px] sm:text-[9px] font-black tracking-[0.4em] text-cyan-400 mt-1.5 uppercase opacity-90">Elite Lounge Member</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full backdrop-blur-2xl border border-white/10 shadow-2xl bg-white/5`}>
            {customer.redeems >= 21 ? <Crown className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 ${rankInfo.color}`} /> : <Shield className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 ${rankInfo.color}`} />}
            <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.25em] ${rankInfo.color}`}>{rankInfo.rank}</span>
          </div>
        </div>

        {/* Name Area */}
        <div className="mt-4 sm:mt-0 px-2">
            <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-blue-400/60 mb-2">Authenticated Magician</p>
            <h3 className="font-cinzel text-2xl sm:text-4xl font-black text-white tracking-tight uppercase truncate">
              {customer.name}
            </h3>
        </div>

        {/* Footer Info & QR */}
        <div className="flex justify-between items-end">
          <div className="flex gap-8 sm:gap-14 pb-1">
            <div className="space-y-1.5">
              <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/40">Portal ID</p>
              <p className="font-mono text-sm sm:text-xl font-black text-blue-100 tracking-widest">
                {customer.customer_id}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/40">Rewards</p>
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-sm sm:text-xl font-black text-white">{customer.redeems}</p>
                <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-3 bg-gradient-to-tr from-blue-600 via-cyan-400 to-blue-500 rounded-2xl opacity-10 blur-md"></div>
            <div className="relative bg-white p-1.5 rounded-xl sm:rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20">
              <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden rounded-lg">
                <img crossOrigin="anonymous" src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[sweep_4s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
