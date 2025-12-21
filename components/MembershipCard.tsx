
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
  // White background for QR ensures it works with any bright card color
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.58/1] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(37,99,235,0.3)] border border-white/30 text-white p-8 sm:p-12 holographic-glow select-none mx-auto"
      style={{
        background: `linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)`
      }}
    >
      {/* Visual Depth Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-center overflow-hidden">
              <img src={COMPANY_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-widest text-white leading-none">MITHRAN</h2>
              <p className="text-[9px] font-black tracking-[0.4em] text-white/80 mt-2 uppercase leading-none">The Snack Empire</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-2xl border border-white/40 px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-xl">
            {customer.redeems >= 21 ? <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300" /> : <Shield className="w-5 h-5 text-white fill-white" />}
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Identity Section */}
        <div className="mt-auto mb-10">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/60 mb-2">Member Identity</p>
            <h3 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-tight uppercase truncate drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              {customer.name}
            </h3>
        </div>

        {/* Footer Data */}
        <div className="flex justify-between items-end">
          <div className="flex gap-12">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/50 mb-1.5">Portal Code</p>
              <p className="font-mono text-lg sm:text-2xl font-black text-white tracking-widest leading-none">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/50 mb-1.5">Magic Level</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg sm:text-2xl font-black text-white leading-none">{customer.redeems}</p>
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-[1.5rem] shadow-2xl group transition-transform hover:scale-105">
            <div className="w-16 h-16 sm:w-24 sm:h-24">
              <img src={qrCodeUrl} alt="QR" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Shine Sweep Animation */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[sweep_4s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
