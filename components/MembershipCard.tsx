
import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';

const COMPANY_LOGO = "https://img.freepik.com/premium-vector/chef-boy-cartoon-mascot-logo-design_188253-3801.jpg";

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);
  
  const loginUrl = `${window.location.origin}?id=${customer.customer_id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loginUrl)}&bgcolor=ffffff&color=0f172a`;

  return (
    <div id="membership-card" className="relative w-full aspect-[1.6/1] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-blue-800/50 bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#0f172a] text-blue-50 p-6 holographic group transition-all duration-700">
      {/* Mystical particles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -ml-10 -mb-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl p-1 shadow-lg border border-blue-700 rotate-[-5deg]">
            <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="font-magic text-2xl font-bold tracking-tight text-white leading-none">MITHRAN</h2>
            <p className="font-magic text-[10px] tracking-widest text-cyan-400 uppercase font-bold">Arcane Member</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <div className="px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl bg-slate-900/80 backdrop-blur-sm border border-blue-700/50">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">{rankInfo.rank}</span>
            </div>
            <div className="mt-2 flex gap-1">
                <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-between items-end mt-6 relative z-10">
        <div className="space-y-3">
          <div className="bg-slate-900/40 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5 inline-block">
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 opacity-60">Master Snacker</p>
             <h3 className="font-cinzel text-2xl font-black text-white leading-none tracking-tight">{customer.name}</h3>
          </div>
          
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Passcode</p>
              <p className="font-mono text-xs font-black text-white bg-slate-900/60 px-2 py-0.5 rounded border border-white/5">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Redeems</p>
              <p className="font-mono text-xs font-black text-white bg-slate-900/60 px-2 py-0.5 rounded border border-white/5">{customer.redeems} Magic Orbs</p>
            </div>
          </div>
        </div>
        
        {/* QR Key */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-white shadow-xl overflow-hidden p-1">
                <img src={qrCodeUrl} alt="Portal Key" className="w-full h-full object-contain" />
            </div>
            <p className="text-[8px] text-white font-black uppercase tracking-widest bg-blue-900/80 px-2 py-0.5 rounded border border-white/10">PORTAL KEY</p>
        </div>
      </div>

      {/* Border glow */}
      <div className="absolute inset-0 border-[6px] border-white/5 rounded-[2rem] pointer-events-none"></div>
    </div>
  );
};

export default MembershipCard;
