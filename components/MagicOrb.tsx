
import React from 'react';
import { Star, Gift, Sparkles } from 'lucide-react';

interface MagicOrbProps {
  index: number;
  filled: boolean;
}

const MagicOrb: React.FC<MagicOrbProps> = ({ index, filled }) => {
  const isMilestone = index === 4; // 5th orb

  return (
    <div className={`magic-orb group ${filled ? 'filled' : ''}`} style={{ animationDelay: `${index * 0.2}s` }}>
      <div className="orb-swirl"></div>
      
      {filled ? (
        isMilestone ? (
            <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
        ) : (
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
        )
      ) : (
        isMilestone ? (
            <Gift className="w-6 h-6 text-blue-900/40" />
        ) : (
            <span className="text-blue-900/40 font-bold text-lg">{index + 1}</span>
        )
      )}

      {filled && (
        <div className="fairy-dust" style={{ top: '-10%', left: '20%' }}></div>
      )}

      {isMilestone && (
        <div className="absolute -bottom-7 text-[7px] font-black tracking-widest text-cyan-400 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800 shadow-sm whitespace-nowrap">
            FREE SNACK
        </div>
      )}
    </div>
  );
};

// Internal fix for Trophy icon
const Trophy = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

export default MagicOrb;
