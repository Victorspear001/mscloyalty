
import React from 'react';
import { Star, Gift, Sparkles, Trophy } from 'lucide-react';

interface MagicOrbProps {
  index: number;
  filled: boolean;
}

const MagicOrb: React.FC<MagicOrbProps> = ({ index, filled }) => {
  const isMilestone = index === 4; // 5th orb

  return (
    <div className={`magic-orb group ${filled ? 'filled' : ''}`} style={{ animationDelay: `${index * 0.2}s` }}>
      {filled ? (
        isMilestone ? (
            <Trophy className="w-6 h-6 text-white animate-bounce" />
        ) : (
            <Star className="w-5 h-5 text-white fill-white animate-pulse" />
        )
      ) : (
        isMilestone ? (
            <Gift className="w-5 h-5 text-blue-500/30" />
        ) : (
            <span className="text-blue-500/30 font-bold text-sm">{index + 1}</span>
        )
      )}

      {isMilestone && (
        <div className="absolute -bottom-8 text-[7px] font-black tracking-widest text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-blue-900 shadow-sm whitespace-nowrap">
            REWARD
        </div>
      )}
    </div>
  );
};

export default MagicOrb;
