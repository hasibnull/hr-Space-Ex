import React from 'react';
import { Sparkles, X, ChevronRight, Palette, Bookmark, Command } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OnboardingBanner: React.FC = () => {
  const { settings, completeOnboarding, openModal, minimalMode, zenMode } = useApp();

  if (settings.onboardingCompleted || minimalMode || zenMode) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[92%] max-w-lg animate-fade-in">
      <div className="glass-panel rounded-2xl p-3 px-4 border border-purple-500/30 shadow-glow-violet backdrop-blur-xl flex items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span>Welcome to MySpace V3</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                Operating System
              </span>
            </p>
            <p className="text-[11px] text-white/60">
              1. <button onClick={() => openModal('customize')} className="text-purple-300 underline hover:text-white">Customize</button> • 2. Add Bookmarks • 3. Press <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-purple-300">⌘K</kbd>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={completeOnboarding}
            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-sm transition-all"
          >
            Got it
          </button>
          <button
            onClick={completeOnboarding}
            className="p-1 rounded-lg text-white/40 hover:text-white"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
