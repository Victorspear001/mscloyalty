
import React from 'react';
import { Star, Gift, Trophy, Sparkles } from 'lucide-react';

interface DragonBallProps {
  index: number;
  filled: boolean;
}

const DragonBall: React.FC<DragonBallProps> = ({ index, filled }) => {
  // Logic: 0, 1, 2, 3 are standard balls. The 5th (unshown in progress bar usually but implicit) is the reward.
  // Actually, we show 4 balls. When all 4 filled, next is free.
  
  return (
    <div className="flex flex-col items-center">
      <div className={`
        relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700
        ${filled 
          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.6)] scale-110 border-2 border-white/20' 
          : 'bg-white border-2 border-slate-100 shadow-inner'}
        group
      `}>
        {filled ? (
          <div className="flex flex-col items-center justify-center gap-0.5 animate-in zoom-in-50 duration-500">
            <div className="flex gap-0.5">
              {[...Array(index + 1)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 drop-shadow-sm" />
              ))}
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-blue-400 opacity-50" />
          </div>
        ) : (
          <span className="text-slate-300 font-black text-lg font-cinzel opacity-50">{index + 1}</span>
        )}
      </div>
      <div className={`mt-5 text-[9px] font-black tracking-[0.2em] uppercase transition-colors ${filled ? 'text-blue-700' : 'text-slate-300'}`}>
        BALL {index + 1}
      </div>
    </div>
  );
};

export default DragonBall;
