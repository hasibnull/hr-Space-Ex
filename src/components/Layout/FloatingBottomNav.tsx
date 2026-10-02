import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Clock,
  Folder,
  Briefcase,
  User,
  Settings,
  ChevronUp,
  Compass,
  Lock,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingBottomNav: React.FC = () => {
  const {
    openModal,
    activeFilter,
    setActiveFilter,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    minimalMode,
    zenMode,
    layoutLocked,
    toggleLayoutLock,
    settings,
  } = useApp();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  // Hidden in Zen Mode and Minimal Mode for maximum clean canvas
  if (zenMode || minimalMode) return null;

  const visibilityClass =
    settings.controlsVisibility === 'auto-hide'
      ? 'opacity-30 hover:opacity-100 transition-opacity duration-300'
      : settings.controlsVisibility === 'hidden'
      ? 'opacity-0 hover:opacity-100 transition-opacity duration-300'
      : 'opacity-100 transition-opacity duration-300';

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none ${visibilityClass}`}
    >
      <div className="glass-pill px-2 py-1.5 rounded-full flex items-center gap-1 shadow-glass-lg border border-white/15">
        {/* + Add Section */}
        <button
          onClick={() => openModal('addSection')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Add a new custom section"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Add Section</span>
        </button>

        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* Most Used */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'mostUsed' ? 'all' : 'mostUsed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeFilter === 'mostUsed'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title="Filter most frequently used bookmarks"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Most Used</span>
        </button>

        {/* Recently Added */}
        <button
          onClick={() => setActiveFilter(activeFilter === 'recentlyAdded' ? 'all' : 'recentlyAdded')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeFilter === 'recentlyAdded'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title="Filter recently added bookmarks"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Recent</span>
        </button>

        {/* Sessions Launcher */}
        <button
          onClick={() => openModal('sessions')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Productivity Sessions"
        >
          <Compass className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden lg:inline">Sessions</span>
        </button>

        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* Workspaces Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            title="Switch Workspace Profile"
          >
            {activeWorkspace.name.toLowerCase().includes('personal') ? (
              <User className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{activeWorkspace.name}</span>
            <ChevronUp className="w-3 h-3 opacity-60" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-48 glass-panel rounded-2xl py-1.5 border border-white/20 shadow-glass-lg text-xs text-white animate-scale-in">
              <div className="px-3 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspaceId(ws.id);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors ${
                    activeWorkspace.id === ws.id ? 'text-purple-300 font-semibold bg-white/5' : 'text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ws.name.toLowerCase().includes('personal') ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5" />
                    )}
                    <span>{ws.name}</span>
                  </div>
                  {activeWorkspace.id === ws.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </button>
              ))}

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => {
                  setShowWorkspaceMenu(false);
                  openModal('workspaces');
                }}
                className="w-full text-left px-3 py-1.5 text-purple-400 hover:text-purple-300 text-[11px] font-medium hover:bg-white/5 transition-colors"
              >
                + Manage Workspaces
              </button>
            </div>
          )}
        </div>

        {/* Lock Layout Quick Toggle */}
        <button
          onClick={toggleLayoutLock}
          className={`p-1.5 rounded-full transition-colors ${
            layoutLocked ? 'text-amber-400 bg-amber-500/20' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title={layoutLocked ? 'Layout Locked (Click to unlock)' : 'Lock Layout'}
        >
          {layoutLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* ⚙ Customize */}
        <button
          onClick={() => openModal('customize')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Customize Theme, Wallpaper & Preferences"
        >
          <Settings className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </nav>
  );
};
