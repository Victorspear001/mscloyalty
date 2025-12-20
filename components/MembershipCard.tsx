
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(loginUrl)}&bgcolor=ffffff&color=020617&margin=1`;

  return (
    <div id="membership-card" className="relative w-full aspect-[1.58/1] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] border-2 sm:border-4 border-blue-500/30 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#020617] text-white p-4 sm:p-7 holographic-glow group select-none">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-cyan-500/10 rounded-full blur-[60px] sm:blur-[80px] -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 animate-pulse"></div>
      
      {/* Card Header */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-slate-900/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-1 shadow-xl border border-blue-400/20">
            <img src={COMPANY_LOGO} alt="Mithran" className="w-full h-full object-cover rounded-lg sm:rounded-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-magic text-lg sm:text-3xl font-bold tracking-tight text-white leading-none">MITHRAN</h2>
            <p className="font-magic text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.4em] text-cyan-400 uppercase font-black opacity-90">Elite Member</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <div className={`px-2 py-1 sm:px-5 sm:py-2 rounded-full flex items-center gap-1 sm:gap-2 shadow-2xl backdrop-blur-md border border-white/10 ${rankInfo.bg.replace('bg-', 'bg-white/')} bg-opacity-10`}>
                <Shield className={`w-3 h-3 sm:w-4 sm:h-4 ${rankInfo.color}`} />
                <span className={`text-[8px] sm:text-[11px] font-black uppercase tracking-widest ${rankInfo.color}`}>{rankInfo.rank}</span>
            </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex justify-between items-end relative z-10 mt-2 sm:mt-6">
        <div className="space-y-2 sm:space-y-5 flex-1 overflow-hidden">
          <div className="bg-slate-900/60 px-3 py-1 sm:px-5 sm:py-2 rounded-lg sm:rounded-2xl backdrop-blur-md border border-white/5 inline-block">
             <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-cyan-500/80 mb-0.5 sm:mb-1">Pass-Holder</p>
             <h3 className="font-cinzel text-base sm:text-2xl font-black text-white leading-none tracking-tight truncate max-w-[150px] sm:max-w-none">{customer.name}</h3>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8 pl-1">
            <div>
              <p className="text-[7px] sm:text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none mb-1 sm:mb-2">Digital ID</p>
              <p className="font-mono text-[10px] sm:text-sm font-black text-white bg-slate-950/60 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md border border-white/5">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[7px] sm:text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none mb-1 sm:mb-2">Stars</p>
              <p className="font-mono text-[10px] sm:text-sm font-black text-white bg-slate-950/60 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md border border-white/5">{customer.redeems}</p>
            </div>
          </div>
        </div>
        
        {/* QR Access Key */}
        <div className="flex flex-col items-center gap-1 sm:gap-3 shrink-0 ml-2">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border-[3px] sm:border-[5px] border-white shadow-xl overflow-hidden">
                <img crossOrigin="anonymous" src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
            </div>
            <p className="text-[7px] sm:text-[9px] text-cyan-400 font-black uppercase tracking-widest">Portal Key</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
