
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
        relative w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500
        ${filled ? 'bg-gradient-to-br from-blue-400 to-indigo-700 shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110' : 'bg-slate-900/50 border-2 border-blue-900/30'}
        ${isMilestone && filled ? 'ring-2 sm:ring-4 ring-cyan-400 ring-offset-2 sm:ring-offset-4 ring-offset-[#020617] animate-pulse' : ''}
      `}>
        {filled ? (
          isMilestone ? (
            <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-bounce" />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-0.5 px-0.5 sm:px-1">
              {[...Array(index + 1)].map((_, i) => (
                <Star key={i} className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white fill-white" />
              ))}
            </div>
          )
        ) : (
          isMilestone ? (
            <Gift className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-900/40" />
          ) : (
            <span className="text-blue-900/40 font-black text-[10px] sm:text-sm">{index + 1}</span>
          )
        )}
        
        {/* Glow effect */}
        {filled && (
           <div className="absolute inset-0 bg-white/10 rounded-full animate-ping pointer-events-none opacity-20"></div>
        )}
      </div>

      <div className={`mt-2 sm:mt-4 text-[6px] sm:text-[7px] font-black tracking-widest uppercase transition-opacity duration-300 ${filled ? 'text-cyan-400 opacity-100' : 'text-blue-900 opacity-40'}`}>
        {isMilestone ? 'GIFT' : `B${index + 1}`}
      </div>
    </div>
  );
};

export default DragonBall;
