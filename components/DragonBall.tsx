
import React from 'react';
import { Star, Gift, Trophy } from 'lucide-react';

interface DragonBallProps {
  index: number;
  filled: boolean;
}

const DragonBall: React.FC<DragonBallProps> = ({ index, filled }) => {
  const isMilestone = index === 4;

  return (
    <div className="flex flex-col items-center">
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700
        ${filled ? 'bg-gradient-to-br from-blue-500 to-indigo-700 shadow-xl scale-110' : 'bg-slate-100 border border-slate-200'}
        ${isMilestone && filled ? 'ring-4 ring-yellow-400 ring-offset-4' : ''}
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
            <Gift className="w-5 h-5 text-slate-300" />
          ) : (
            <span className="text-slate-400 font-black text-sm">{index + 1}</span>
          )
        )}
      </div>
      <div className={`mt-4 text-[8px] font-black tracking-widest uppercase ${filled ? 'text-blue-600' : 'text-slate-300'}`}>
        {isMilestone ? 'REWARD' : `BALL ${index + 1}`}
      </div>
    </div>
  );
};

export default DragonBall;
