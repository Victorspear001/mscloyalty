
import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';

const COMPANY_LOGO = "https://img.freepik.com/premium-vector/chef-boy-cartoon-mascot-logo-design_188253-3801.jpg"; // Placeholder for the attached mascot logo

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);

  return (
    <div id="membership-card" className="relative w-full aspect-[1.6/1] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50 bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#feada6] text-blue-900 p-6 holographic group transition-all duration-700 hover:rotate-1">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-2xl p-1 shadow-lg border border-pink-100 rotate-[-5deg] group-hover:rotate-0 transition-transform">
            <img src={COMPANY_LOGO} alt="Mithran Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="font-magic text-2xl font-bold tracking-tight text-blue-900 leading-none">MITHRAN</h2>
            <p className="font-magic text-[10px] tracking-widest text-pink-600 uppercase font-bold">Magic Member</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl bg-white/80 backdrop-blur-sm border border-white`}>
                <Shield className={`w-3 h-3 ${rankInfo.color}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${rankInfo.color}`}>{rankInfo.rank}</span>
            </div>
            <div className="mt-2 flex gap-1">
                {[...Array(3)].map((_, i) => <Sparkles key={i} className="w-2 h-2 text-yellow-500 animate-pulse" style={{ animationDelay: `${i*0.5}s` }} />)}
            </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex justify-between items-end mt-6 relative z-10">
        <div className="space-y-3">
          <div className="bg-white/40 px-3 py-1 rounded-lg backdrop-blur-sm inline-block">
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 opacity-60">Elite Snacker</p>
             <h3 className="font-cinzel text-2xl font-black text-blue-900 leading-none tracking-tight">{customer.name}</h3>
          </div>
          
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest leading-none mb-1">Passcode</p>
              <p className="font-mono text-xs font-black text-blue-900 bg-white/30 px-2 py-0.5 rounded">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest leading-none mb-1">Magic Level</p>
              <p className="font-mono text-xs font-black text-blue-900 bg-white/30 px-2 py-0.5 rounded">{customer.redeems} Stars</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white shadow-xl transition-transform group-hover:scale-110">
                <div className="w-10 h-10 border-2 border-blue-900/10 rounded-lg flex items-center justify-center opacity-40">
                    <Shield className="w-6 h-6 text-blue-900" />
                </div>
            </div>
            <p className="text-[8px] text-blue-900 font-black uppercase tracking-tighter bg-white/50 px-2 rounded">Scan for Joy</p>
        </div>
      </div>

      {/* Magical Border */}
      <div className="absolute inset-0 border-[6px] border-white/20 rounded-[2rem] pointer-events-none"></div>
    </div>
  );
};

export default MembershipCard;
