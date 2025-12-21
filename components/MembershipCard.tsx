
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
      className="relative w-full aspect-[1.58/1] rounded-[2rem] overflow-hidden membership-card-shadow border border-white/20 text-white p-6 sm:p-10 holographic-glow select-none"
      style={{
        background: `linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)`
      }}
    >
      {/* Gloss Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none"></div>
      
      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-xl flex items-center justify-center overflow-hidden">
              <img src={COMPANY_LOGO_URL} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100'} />
            </div>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-widest text-white leading-none">MITHRAN</h2>
              <p className="text-[8px] font-black tracking-[0.4em] text-white/80 mt-1.5 uppercase leading-none">The Snack Kingdom</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 px-4 py-2 rounded-full flex items-center gap-2">
            {customer.redeems >= 21 ? <Crown className="w-4 h-4 text-yellow-300 fill-yellow-300" /> : <Shield className="w-4 h-4 text-white fill-white" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{rankInfo.rank}</span>
          </div>
        </div>

        <div className="mt-auto mb-8">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/60 mb-1">MEMBER IDENTITY</p>
            <h3 className="font-cinzel text-2xl sm:text-4xl font-black text-white tracking-tight uppercase truncate drop-shadow-lg">
              {customer.name}
            </h3>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-10">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">PORTAL CODE</p>
              <p className="font-mono text-base sm:text-xl font-black text-white tracking-widest">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">MAGIC LEVEL</p>
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-base sm:text-xl font-black text-white">{customer.redeems}</p>
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20">
              <img src={qrCodeUrl} alt="QR" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
