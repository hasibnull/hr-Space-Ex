import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Bookmark,
  FolderPlus,
  FileText,
  CheckSquare,
  Flame,
  Search,
  Layers,
  Image,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickActionButton: React.FC = () => {
  const {
    settings,
    openModal,
    openQuickAddBookmark,
    startFocusWithDuration,
    minimalMode,
    zenMode,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (!settings.showQuickActionBtn || zenMode || minimalMode) return null;

  const ACTIONS = [
    {
      id: 'quick-bm',
      label: 'Add Bookmark',
      icon: Bookmark,
      color: 'text-purple-400',
      action: () => {
        openQuickAddBookmark();
        setIsOpen(false);
      },
    },
    {
      id: 'add-sec',
      label: 'Add Section',
      icon: FolderPlus,
      color: 'text-blue-400',
      action: () => {
        openModal('addSection');
        setIsOpen(false);
      },
    },
    {
      id: 'new-note',
      label: 'New Note',
      icon: FileText,
      color: 'text-emerald-400',
      action: () => {
        openModal('notes');
        setIsOpen(false);
      },
    },
    {
      id: 'new-task',
      label: 'New Task',
      icon: CheckSquare,
      color: 'text-amber-400',
      action: () => {
        openModal('todo');
        setIsOpen(false);
      },
    },
    {
      id: 'focus',
      label: 'Focus Timer',
      icon: Flame,
      color: 'text-red-400',
      action: () => {
        startFocusWithDuration(25);
        setIsOpen(false);
      },
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      color: 'text-cyan-400',
      action: () => {
        openModal('commandPalette');
        setIsOpen(false);
      },
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: Layers,
      color: 'text-indigo-400',
      action: () => {
        openModal('workspaces');
        setIsOpen(false);
      },
    },
    {
      id: 'wallpaper',
      label: 'Wallpaper',
      icon: Image,
      color: 'text-pink-400',
      action: () => {
        openModal('wallpaper');
        setIsOpen(false);
      },
    },
  ];

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40 pointer-events-auto">
      {/* Expanded Quick Action Menu */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-52 glass-panel rounded-2xl p-2 border border-white/20 shadow-glass-lg text-xs text-white animate-scale-in mb-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/10 mb-1">
            Quick Actions
          </div>
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors text-left"
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close Quick Actions' : 'Quick Actions'}
        className={`w-10 h-10 rounded-full glass-pill flex items-center justify-center transition-all duration-200 shadow-glass-lg ${
          isOpen
            ? 'bg-purple-600/40 text-white scale-105 border-purple-400/50'
            : 'text-white/70 hover:text-white hover:scale-105 opacity-80 hover:opacity-100'
        }`}
      >
        {isOpen ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
      </button>
    </div>
  );
};
