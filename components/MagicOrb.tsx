
import React from 'react';
import { Star, Gift } from 'lucide-react';

interface MagicOrbProps {
  index: number;
  filled: boolean;
}

const MagicOrb: React.FC<MagicOrbProps> = ({ index, filled }) => {
  const isMilestone = index === 4; // 5th orb is index 4

  return (
    <div className={`magic-orb group ${filled ? 'filled' : ''} ${isMilestone ? 'border-amber-300' : 'border-white'}`} style={{ animationDelay: `${index * 0.2}s` }}>
      <div className="orb-swirl"></div>
      
      {filled ? (
        isMilestone ? (
            <Gift className="w-6 h-6 fill-white text-white animate-bounce" />
        ) : (
            <Star className="w-6 h-6 fill-white text-white animate-pulse" />
        )
      ) : (
        isMilestone ? (
            <Gift className="w-6 h-6 text-white/40" />
        ) : (
            <span className="text-white/40 font-bold text-lg">{index + 1}</span>
        )
      )}

      {filled && isMilestone && (
        <>
            <div className="fairy-dust" style={{ top: '-10%', left: '20%' }}></div>
            <div className="fairy-dust" style={{ bottom: '10%', right: '10%', animationDelay: '0.5s' }}></div>
            <div className="fairy-dust" style={{ top: '50%', left: '-20%', animationDelay: '1s' }}></div>
        </>
      )}

      {isMilestone && (
        <div className="absolute -bottom-7 text-[7px] font-black tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            FREE SNACK
        </div>
      )}
    </div>
  );
};

export default MagicOrb;
