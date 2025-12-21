
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=0f172a&margin=2`;

  return (
    <div 
      id="membership-card" 
      className="relative w-full aspect-[1.58/1] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/30 text-white p-10 sm:p-14 holographic-glow select-none mx-auto"
      style={{
        background: `linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)`
      }}
    >
      {/* Texture Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')` }}></div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <MSCLogo className="w-16 h-16 sm:w-20 sm:h-20" />
            <div>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-black tracking-[0.3em] text-white leading-none drop-shadow-lg">MITHRAN</h2>
              <p className="text-[10px] font-black tracking-[0.6em] text-white/90 mt-2.5 uppercase leading-none drop-shadow-md">Elite Lounge</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-3xl border-2 border-white/40 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
            {customer.redeems >= 21 ? (
                <Crown className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            ) : (
                <Shield className="w-6 h-6 text-white fill-white" />
            )}
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">{rankInfo.rank}</span>
          </div>
        </div>

        {/* Identity Section */}
        <div className="mt-auto mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.7em] text-white/60 mb-3 leading-none drop-shadow-sm">Member Identity</p>
            <h3 className="font-cinzel text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase truncate drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]">
              {customer.name}
            </h3>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-end">
          <div className="flex gap-16 items-end">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/50 mb-3">Portal Code</p>
              <p className="font-mono text-xl sm:text-3xl font-black text-white tracking-[0.3em] leading-none drop-shadow-lg">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/50 mb-3">Magic Level</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-xl sm:text-3xl font-black text-white leading-none drop-shadow-lg">{customer.redeems}</p>
                <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-[2rem] shadow-[0_24px_64px_rgba(0,0,0,0.5)] transition-all hover:scale-110 active:scale-95">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden">
              <img src={qrCodeUrl} alt="Portal QR" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[sweep_5s_infinite_linear]"></div>
    </div>
  );
};

export default MembershipCard;
