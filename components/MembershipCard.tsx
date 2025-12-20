
import React from 'react';
import { Shield, QrCode } from 'lucide-react';
import { Customer } from '../types';
import { getRankInfo } from '../constants';

interface MembershipCardProps {
  customer: Customer;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ customer }) => {
  const rankInfo = getRankInfo(customer.redeems);

  return (
    <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 group transition-transform duration-500 hover:scale-[1.02]">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h2 className="font-cinzel text-xl font-bold tracking-widest text-blue-100">MITHRAN</h2>
          <p className="font-cinzel text-[8px] tracking-[0.4em] text-blue-400 uppercase leading-tight">Snacks Corner • Loyalty</p>
        </div>
        <div className={`${rankInfo.bg} ${rankInfo.color} p-2 rounded-lg flex items-center gap-1 shadow-lg shadow-black/20`}>
          <Shield className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{rankInfo.rank}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex justify-between items-end mt-auto relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] text-blue-300 uppercase tracking-widest opacity-70">Member Name</p>
          <h3 className="font-cinzel text-2xl font-bold text-white leading-tight">{customer.name}</h3>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[8px] text-blue-300 uppercase tracking-widest opacity-70">Customer ID</p>
              <p className="font-mono text-sm font-bold text-blue-100">{customer.customer_id}</p>
            </div>
            <div>
              <p className="text-[8px] text-blue-300 uppercase tracking-widest opacity-70">Stamps</p>
              <p className="font-mono text-sm font-bold text-blue-100">{customer.stamps} / 6</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-1 rounded-md shadow-inner">
                <QrCode className="w-12 h-12 text-blue-900" />
            </div>
            <p className="text-[8px] text-blue-400 font-bold uppercase">Scan to Collect</p>
        </div>
      </div>

      {/* Holographic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:via-white/10 transition-all duration-700"></div>
    </div>
  );
};

export default MembershipCard;
