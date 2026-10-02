import React from 'react';
import { getGreeting, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { useClock } from '../../hooks/useClock';

export const Greeting: React.FC = () => {
  const { zenMode, settings } = useApp();
  const { text, emoji } = getGreeting();
  const dateStr = formatDate(new Date());
  const { timeStr, period } = useClock(settings.clockFormat, settings.showClockSeconds);

  if (zenMode) {
    return (
      <div className="flex flex-col items-center justify-center text-center select-none pt-24 pb-8 animate-fade-in">
        <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight tracking-tighter text-white font-mono drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          {timeStr}
          {period && <span className="text-xl md:text-2xl font-light ml-3 opacity-60 font-sans">{period}</span>}
        </h1>
        <p className="mt-4 text-sm md:text-base font-light tracking-widest text-white/70 uppercase">
          {dateStr}
        </p>
        <p className="mt-2 text-xs font-mono text-white/30">
          Press ESC to return
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center select-none pt-8 pb-3">
      {/* Cinematic Greeting */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)] font-display">
        {text}{' '}
        <span className="inline-block transition-transform duration-300 hover:scale-125 hover:rotate-12 cursor-default">
          {emoji}
        </span>
      </h1>

      {/* Formatted Date */}
      <p className="mt-2 text-sm md:text-base font-normal tracking-wide text-white/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
        {dateStr}
      </p>
    </div>
  );
};
