import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClockWidget } from '../TopArea/ClockWidget';
import { WeatherWidget } from '../TopArea/WeatherWidget';

export const Header: React.FC = () => {
  const { setSidebarOpen, sidebarOpen, minimalMode, zenMode, settings } = useApp();

  // In Zen mode, header is completely hidden
  if (zenMode) return null;

  const visibilityClass =
    settings.controlsVisibility === 'auto-hide'
      ? 'opacity-30 hover:opacity-100 transition-opacity duration-300'
      : settings.controlsVisibility === 'hidden'
      ? 'opacity-0 hover:opacity-100 transition-opacity duration-300'
      : 'opacity-100 transition-opacity duration-300';

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none ${visibilityClass}`}>
      {/* Top-Left: Small circular "•••" button */}
      <div className="pointer-events-auto">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Open sidebar menu"
          title="Open Menu (Sidebar)"
          className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-glass-sm group"
        >
          <MoreHorizontal className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
        </button>
      </div>

      {/* Top-Right: Weather (hidden in minimal mode) and Live Clock */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {!minimalMode && <WeatherWidget />}
        <ClockWidget />
      </div>
    </header>
  );
};
