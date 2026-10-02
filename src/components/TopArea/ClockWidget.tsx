import React from 'react';
import { useClock } from '../../hooks/useClock';
import { useApp } from '../../context/AppContext';

export const ClockWidget: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const { timeStr, period } = useClock(settings.clockFormat, settings.showClockSeconds);

  const toggleFormat = () => {
    updateSettings({
      clockFormat: settings.clockFormat === '12h' ? '24h' : '12h',
    });
  };

  return (
    <div
      onClick={toggleFormat}
      title="Click to toggle 12h/24h format"
      className="glass-pill px-3 py-1.5 rounded-xl flex items-baseline gap-1.5 cursor-pointer hover:bg-white/10 transition-all duration-200 select-none shadow-glass-sm"
    >
      <span className="font-mono text-sm md:text-base font-semibold tracking-wider text-white">
        {timeStr}
      </span>
      {period && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
          {period}
        </span>
      )}
    </div>
  );
};
