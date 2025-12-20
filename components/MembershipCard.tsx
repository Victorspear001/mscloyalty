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
  // Added margin=1 to the QR API to maximize square space while keeping a tiny quiet zone
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(loginUrl)}&bgcolor=ffffff&color=020617&margin=1`;

  return (
    <div id="membership-card" className="relative w-full aspect-[1.6/1] rounded-[2.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border-4 border-blue-500/30 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#020617] text-white p-7 holographic-glow group">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] -mr-16 -mt-16 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -ml-16 -mb-16 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Card Header: Logo and Rank */}
      <div className="flex justify-between items-start relative z-10 mb-auto">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-900/80 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl border border-blue-400/20 transition-transform group-hover:rotate-3 group-hover:scale-105 duration-500">
            <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-magic text-3xl font-bold tracking-tight text-white leading-none drop-shadow-lg">MITHRAN</h2>
            <p className="font-magic text-[10px] tracking-[0.4em] text-cyan-400 uppercase font-black opacity-90">Elite Member</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className={`px-5 py-2 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md border border-white/10 ${rankInfo.bg.replace('bg-', 'bg-white/')} bg-opacity-10`}>
                <Shield className={`w-4 h-4 ${rankInfo.color}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${rankInfo.color} drop-shadow-sm`}>{rankInfo.rank}</span>
            </div>
            <div className="flex gap-1.5 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <Sparkles className="w-2 h-2 text-blue-400 animate-ping" />
            </div>
        </div>
      </div>

      {/* Card Body: Info and QR Portal */}
      <div className="flex justify-between items-end relative z-10 mt-auto pt-4">
        <div className="space-y-5">
          <div className="bg-slate-900/60 px-5 py-2 rounded-2xl backdrop-blur-md border border-white/5 inline-block shadow-inner">
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/80 mb-1">Pass-Holder</p>
             <h3 className="font-cinzel text-2xl font-black text-white leading-none tracking-tight">{customer.name}</h3>
          </div>
          
          <div className="flex items-center gap-10 pl-1">
            <div className="group/item">
              <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none mb-2 group-hover/item:text-cyan-400 transition-colors">Digital ID</p>
              <p className="font-mono text-sm font-black text-white bg-slate-950/60 px-3 py-1 rounded-lg border border-white/5 shadow-sm">{customer.customer_id}</p>
            </div>
            <div className="group/item">
              <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none mb-2 group-hover/item:text-cyan-400 transition-colors">Star Rewards</p>
              <p className="font-mono text-sm font-black text-white bg-slate-950/60 px-3 py-1 rounded-lg border border-white/5 shadow-sm">{customer.redeems} ⭐</p>
            </div>
          </div>
        </div>
        
        {/* QR Access Key: Perfect Square Alignment */}
        <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center border-[6px] border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden transition-all duration-500 hover:scale-110 hover:rotate-3">
                <img src={qrCodeUrl} alt="QR Access Key" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.3em] drop-shadow-sm">Portal Key</p>
              <div className="w-8 h-0.5 bg-cyan-400/30 rounded-full mt-1"></div>
            </div>
        </div>
      </div>

      {/* Luxury Bevel Detail */}
      <div className="absolute inset-0 border-[1px] border-white/10 rounded-[2.5rem] pointer-events-none"></div>
      <div className="absolute inset-[6px] border-[1px] border-white/5 rounded-[2.2rem] pointer-events-none"></div>
    </div>
  );
};

export default MembershipCard;