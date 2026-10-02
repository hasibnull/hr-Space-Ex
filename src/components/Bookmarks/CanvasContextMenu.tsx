import React, { useEffect, useRef } from 'react';
import {
  Plus,
  FolderPlus,
  Image,
  Settings,
  Eye,
  EyeOff,
  Compass,
  Flame,
  Lock,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CanvasContextMenu: React.FC = () => {
  const {
    canvasContextMenu,
    closeCanvasContextMenu,
    openModal,
    openQuickAddBookmark,
    toggleMinimalMode,
    minimalMode,
    toggleZenMode,
    zenMode,
    toggleLayoutLock,
    layoutLocked,
    startFocusWithDuration,
  } = useApp();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeCanvasContextMenu();
      }
    };
    const handleScroll = () => closeCanvasContextMenu();

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [closeCanvasContextMenu]);

  if (!canvasContextMenu) return null;

  const { x, y } = canvasContextMenu;

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 w-52 glass-panel rounded-2xl py-1.5 border border-white/20 shadow-glass-lg text-xs text-white animate-scale-in select-none"
    >
      <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider text-white/40 border-b border-white/10 mb-1">
        Dashboard
      </div>

      <button
        onClick={() => {
          openQuickAddBookmark();
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Plus className="w-3.5 h-3.5 text-purple-400" />
        <span>Add Bookmark</span>
      </button>

      <button
        onClick={() => {
          openModal('addSection');
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
        <span>Add Section</span>
      </button>

      <button
        onClick={() => {
          openModal('wallpaper');
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Image className="w-3.5 h-3.5 text-emerald-400" />
        <span>Change Wallpaper</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          toggleMinimalMode();
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        {minimalMode ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-cyan-400" />}
        <span>{minimalMode ? 'Exit Minimal Mode' : 'Minimal Mode'}</span>
      </button>

      <button
        onClick={() => {
          toggleZenMode();
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Compass className="w-3.5 h-3.5 text-indigo-400" />
        <span>{zenMode ? 'Exit Zen Mode' : 'Zen Mode'}</span>
      </button>

      <button
        onClick={() => {
          toggleLayoutLock();
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        {layoutLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
        <span>{layoutLocked ? 'Unlock Layout' : 'Lock Layout'}</span>
      </button>

      <button
        onClick={() => {
          startFocusWithDuration(25);
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Flame className="w-3.5 h-3.5 text-amber-400" />
        <span>Start Focus Mode</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          openModal('customize');
          closeCanvasContextMenu();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Settings className="w-3.5 h-3.5 text-purple-400" />
        <span>Customize & Settings</span>
      </button>
    </div>
  );
};
