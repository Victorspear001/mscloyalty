
import React from 'react';

interface DragonBallProps {
  index: number;
  filled: boolean;
}

const DragonBall: React.FC<DragonBallProps> = ({ index, filled }) => {
  const isMilestone = index === 2; // 3rd ball is index 2

  return (
    <div className={`dragon-ball ${filled ? 'filled' : ''} ${isMilestone && filled ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}>
      <span className={`star ${isMilestone ? 'scale-125' : ''}`}>
        {filled ? '★' : '☆'}
      </span>
      {filled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            <div className={`sparkle-effect absolute -inset-1 opacity-40 ${isMilestone ? 'bg-blue-400/20' : ''}`}></div>
        </div>
      )}
      <div className="absolute -bottom-6 text-[10px] font-bold text-blue-400 opacity-60 whitespace-nowrap">
        {isMilestone ? 'MILESTONE' : `BALL ${index + 1}`}
      </div>
    </div>
  );
};

export default DragonBall;
