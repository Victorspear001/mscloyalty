
import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';

const COMPANY_LOGO = "logo.png";

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  const loginUrl = `${window.location.origin}?id=${customer.customer_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loginUrl)}&bgcolor=ffffff&color=020617`;

  return (
    <div id="membership-card" className="relative w-full aspect-[1.6/1] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-blue-800/50 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#020617] text-white p-6 holographic-glow group">
      {/* Fantasy Background Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl p-1 shadow-2xl border border-blue-700/50 transition-transform group-hover:rotate-6">
            <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="font-magic text-2xl font-bold tracking-tight text-white leading-none">MITHRAN</h2>
            <p className="font-magic text-[9px] tracking-[0.3em] text-cyan-400 uppercase font-bold">Arcane Member</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <div className="px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl bg-slate-900/60 backdrop-blur-sm border border-blue-700/30">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-100">{rankInfo.rank}</span>
            </div>
            <div className="mt-2 flex gap-1">
                <Sparkles className="w-2 h-2 text-cyan-500 animate-pulse" />
            </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex justify-between items-end mt-4 relative z-10">
        <div className="space-y-4">
          <div className="bg-slate-900/40 px-4 py-1 rounded-lg backdrop-blur-sm border border-white/5 inline-block">
             <p className="text-[8px] font-black uppercase tracking-widest text-cyan-600 mb-1">Elite Magician</p>
             <h3 className="font-cinzel text-2xl font-black text-white leading-none tracking-tighter">{customer.name}</h3>
          </div>
          
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Passcode</p>
              <p className="font-mono text-xs font-black text-white bg-slate-900/50 px-2 rounded">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Redeems</p>
              <p className="font-mono text-xs font-black text-white bg-slate-900/50 px-2 rounded">{customer.redeems} Stars</p>
            </div>
          </div>
        </div>
        
        {/* QR Access Key */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border-2 border-white shadow-2xl overflow-hidden p-1.5 transition-transform hover:scale-110">
                <img src={qrCodeUrl} alt="QR Key" className="w-full h-full object-contain" />
            </div>
            <p className="text-[8px] text-cyan-400 font-black uppercase tracking-widest opacity-80">Portal Key</p>
        </div>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 border-[6px] border-white/5 rounded-[2rem] pointer-events-none"></div>
    </div>
  );
};

export default MembershipCard;
