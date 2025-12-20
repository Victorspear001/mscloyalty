
import React from 'react';
import { Star, Gift, Trophy } from 'lucide-react';

interface DragonBallProps {
  index: number;
  filled: boolean;
}

const DragonBall: React.FC<DragonBallProps> = ({ index, filled }) => {
  const isMilestone = index === 4; // 5th ball is index 4

  return (
    <div className={`relative flex flex-col items-center group`}>
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
        ${filled ? 'bg-gradient-to-br from-blue-400 to-indigo-700 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : 'bg-slate-900/50 border-2 border-blue-900/30'}
        ${isMilestone && filled ? 'ring-4 ring-cyan-400 ring-offset-4 ring-offset-[#020617] animate-pulse' : ''}
      `}>
        {filled ? (
          isMilestone ? (
            <Trophy className="w-6 h-6 text-white animate-bounce" />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-0.5 px-1">
              {[...Array(index + 1)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 text-white fill-white" />
              ))}
            </div>
          )
        ) : (
          isMilestone ? (
            <Gift className="w-5 h-5 text-blue-900/40" />
          ) : (
            <span className="text-blue-900/40 font-black text-sm">{index + 1}</span>
          )
        )}
        
        {/* Glow effect for filled balls */}
        {filled && (
           <div className="absolute inset-0 bg-white/10 rounded-full animate-ping pointer-events-none opacity-20"></div>
        )}
      </div>

      <div className={`mt-4 text-[7px] font-black tracking-widest uppercase transition-opacity duration-300 ${filled ? 'text-cyan-400 opacity-100' : 'text-blue-900 opacity-40'}`}>
        {isMilestone ? 'REWARD' : `BALL ${index + 1}`}
      </div>
    </div>
  );
};

export default DragonBall;
