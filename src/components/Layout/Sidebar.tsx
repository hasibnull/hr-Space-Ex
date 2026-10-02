import React, { useEffect, useRef } from 'react';
import {
  Home,
  Bookmark,
  Layers,
  Image,
  Flame,
  FileText,
  CheckSquare,
  Puzzle,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  Command,
  Compass,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openDestinationUrl } from '../../utils/chromeApi';

export const Sidebar: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    openModal,
    minimalMode,
    toggleMinimalMode,
  } = useApp();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen, setSidebarOpen]);

  if (!sidebarOpen) return null;

  const NAV_ITEMS = [
    {
      id: 'cmd',
      label: 'Command Center',
      icon: Command,
      shortcut: '⌘K',
      action: () => openModal('commandPalette'),
      desc: 'Global search & shortcuts',
    },
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      action: () => setSidebarOpen(false),
      desc: 'Main homepage overview',
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks Manager',
      icon: Bookmark,
      shortcut: '⌘B',
      action: () => openModal('bookmarksManager'),
      desc: 'All links & Chrome sync',
    },
    {
      id: 'sections',
      label: 'Add Section',
      icon: Layers,
      action: () => openModal('addSection'),
      desc: 'Create category group',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: Compass,
      action: () => openModal('sessions'),
      desc: 'Launch workflow environments',
    },
    {
      id: 'focus',
      label: 'Focus Mode',
      icon: Flame,
      shortcut: '⌘⇧F',
      action: () => openModal('focus'),
      desc: 'Pomodoro deep work station',
    },
    {
      id: 'wallpaper',
      label: 'Wallpaper Gallery',
      icon: Image,
      shortcut: '⌘⇧P',
      action: () => openModal('wallpaper'),
      desc: 'Presets & real-time tuning',
    },
    {
      id: 'notes',
      label: 'Quick Notes',
      icon: FileText,
      shortcut: '⌘⇧N',
      action: () => openModal('notes'),
      desc: 'Memos & markdown ideas',
    },
    {
      id: 'todo',
      label: 'To-Do & Tasks',
      icon: CheckSquare,
      shortcut: '⌘⇧T',
      action: () => openModal('todo'),
      desc: 'Checklists & priorities',
    },
    {
      id: 'minimal',
      label: minimalMode ? 'Exit Minimal Mode' : 'Minimal Mode',
      icon: Eye,
      shortcut: '⌘⇧M',
      action: () => {
        toggleMinimalMode();
        setSidebarOpen(false);
      },
      desc: 'Peaceful distraction-free view',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      shortcut: '⌘⇧S',
      action: () => openModal('customize'),
      desc: 'Themes, shortcuts & backup',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in flex">
      {/* Slide-over panel */}
      <div
        ref={sidebarRef}
        className="w-72 sm:w-80 h-full glass-panel border-r border-white/15 p-6 flex flex-col justify-between shadow-2xl animate-slide-in-left select-none relative"
      >
        {/* Top Branding & Close Button */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-glow-violet text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white font-display">
                  MySpace V3
                </h2>
                <p className="text-[11px] text-white/50">Productivity System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Close sidebar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-3 space-y-0.5 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/80 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-purple-600/25 group-hover:text-purple-300 transition-colors shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{item.label}</p>
                      <p className="text-[10px] text-white/40 truncate">{item.desc}</p>
                    </div>
                  </div>
                  {item.shortcut ? (
                    <kbd className="text-[10px] font-mono text-purple-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                      {item.shortcut}
                    </kbd>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer shortcuts info */}
        <div className="pt-3 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between">
          <span>Local-First V3</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
