import React, { useState } from 'react';
import {
  X,
  Briefcase,
  User,
  Trash2,
  GraduationCap,
  Code,
  Sparkles,
  BookOpen,
  Music,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WorkspaceModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    createWorkspace,
    deleteWorkspace,
  } = useApp();

  const [newWsName, setNewWsName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');

  if (activeModal !== 'workspaces') return null;

  const ICONS = [
    { name: 'Briefcase', icon: Briefcase },
    { name: 'User', icon: User },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'Code', icon: Code },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Music', icon: Music },
  ];

  const renderIcon = (name: string) => {
    switch (name) {
      case 'User':
        return <User className="w-4 h-4 text-indigo-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      case 'Code':
        return <Code className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-pink-400" />;
      case 'Music':
        return <Music className="w-4 h-4 text-rose-400" />;
      case 'Briefcase':
      default:
        return <Briefcase className="w-4 h-4 text-purple-400" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await createWorkspace(newWsName.trim(), selectedIcon);
    setNewWsName('');
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Workspace Profiles</h2>
              <p className="text-xs text-white/50">Separate environments, sections and bookmarks</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create workspace form */}
        <form onSubmit={handleCreate} className="my-4 space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Workspace name (e.g. University, Coding, Freelance)..."
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Create
            </button>
          </div>

          {/* Icon picker */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-white/50">Icon:</span>
            {ICONS.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedIcon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIcon(item.name)}
                  className={`p-1.5 rounded-lg transition-all ${
                    isSelected ? 'bg-purple-600 text-white scale-110 shadow-sm' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                  title={item.name}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </form>

        {/* Workspaces list */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspace.id;
            return (
              <div
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-purple-600/25 border-purple-500/50 text-white shadow-glow-violet'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5">
                    {renderIcon(ws.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{ws.name}</p>
                    {isActive && (
                      <span className="text-[10px] text-purple-300 font-medium">
                        Active Workspace
                      </span>
                    )}
                  </div>
                </div>

                {workspaces.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(ws.id);
                    }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
