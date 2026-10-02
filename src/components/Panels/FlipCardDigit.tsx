import React, { useState, useEffect } from 'react';

interface FlipCardDigitProps {
  digit: number | string;
  isGiant?: boolean;
}

export const FlipCardDigit: React.FC<FlipCardDigitProps> = ({ digit, isGiant = false }) => {
  const currentStr = String(digit);
  const [prevDigit, setPrevDigit] = useState(currentStr);
  const [currDigit, setCurrDigit] = useState(currentStr);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (currentStr !== currDigit) {
      setPrevDigit(currDigit);
      setCurrDigit(currentStr);
      setIsFlipping(true);

      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 520);

      return () => clearTimeout(timer);
    }
  }, [currentStr, currDigit]);

  // Size classes: Heroic 50%+ screen sizing
  const cardSizeClasses = isGiant
    ? 'w-24 sm:w-36 md:w-48 lg:w-56 xl:w-64 h-36 sm:h-52 md:h-68 lg:h-80 xl:h-92'
    : 'w-20 sm:w-28 md:w-36 lg:w-44 xl:w-52 h-28 sm:h-40 md:h-52 lg:h-64 xl:h-72';

  const textSizeClasses = isGiant
    ? 'text-6xl sm:text-8xl md:text-[130px] lg:text-[165px] xl:text-[195px]'
    : 'text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[150px]';

  return (
    <div
      className={`relative ${cardSizeClasses} rounded-2xl sm:rounded-3xl select-none flip-card-perspective shadow-[0_20px_50px_rgba(0,0,0,0.85),0_1px_0_rgba(255,255,255,0.12)] border border-white/10 bg-[#0c0e14]`}
    >
      {/* Upper Static Half (Shows current target digit) */}
      <div className="relative w-full h-1/2 overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-[#1c1f2c] via-[#151722] to-[#10121a] border-b border-black/90">
        <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center">
          <span className={`font-mono font-black ${textSizeClasses} tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]`}>
            {currDigit}
          </span>
        </div>
        {/* Top subtle ambient lighting highlight */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      </div>

      {/* Lower Static Half (Shows previous digit while flipping, current when resting) */}
      <div className="relative w-full h-1/2 overflow-hidden rounded-b-2xl sm:rounded-b-3xl bg-gradient-to-b from-[#0c0e14] via-[#11131c] to-[#171a25]">
        <div className="absolute inset-x-0 bottom-0 h-[200%] flex items-center justify-center">
          <span className={`font-mono font-black ${textSizeClasses} tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]`}>
            {isFlipping ? prevDigit : currDigit}
          </span>
        </div>
        {/* Soft shadow cast by the upper card */}
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Animated Flipping Flaps */}
      {isFlipping && (
        <>
          {/* Top leaf folding down (showing previous digit) */}
          <div
            key={`top-${currDigit}`}
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-[#1c1f2c] via-[#151722] to-[#10121a] border-b border-black/90 animate-flip-top z-20 shadow-2xl"
          >
            <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center">
              <span className={`font-mono font-black ${textSizeClasses} tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]`}>
                {prevDigit}
              </span>
            </div>
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          </div>

          {/* Bottom leaf unfolding down (revealing current digit) */}
          <div
            key={`bot-${currDigit}`}
            className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-2xl sm:rounded-b-3xl bg-gradient-to-b from-[#0c0e14] via-[#11131c] to-[#171a25] animate-flip-bottom z-20 shadow-2xl"
          >
            <div className="absolute inset-x-0 bottom-0 h-[200%] flex items-center justify-center">
              <span className={`font-mono font-black ${textSizeClasses} tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]`}>
                {currDigit}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Central Groove Seam & Side Hinge Pins for Mechanical Authenticity */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black/95 shadow-[0_1px_0_rgba(255,255,255,0.06)] z-30 pointer-events-none" />
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-4 sm:h-5 bg-[#090b10] border-r border-white/20 rounded-r-sm z-30 shadow-md pointer-events-none" />
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-4 sm:h-5 bg-[#090b10] border-l border-white/20 rounded-l-sm z-30 shadow-md pointer-events-none" />
    </div>
  );
};
