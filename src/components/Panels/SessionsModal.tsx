import React, { useState } from 'react';
import {
  X,
  Play,
  Plus,
  Trash2,
  Clock,
  Layout,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageLayoutMode } from '../../types';

export const SessionsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    sessions,
    createSession,
    launchSession,
    deleteSession,
    activeWorkspace,
    settings,
  } = useApp();

  const [name, setName] = useState('');
  const [focusMins, setFocusMins] = useState<number>(25);
  const [layout, setLayout] = useState<PageLayoutMode>(settings.layoutMode || 'balanced');
  const [isCreating, setIsCreating] = useState(false);

  if (activeModal !== 'sessions') return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createSession(name.trim(), focusMins, layout);
    setName('');
    setIsCreating(false);
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in flex flex-col max-h-[560px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Productivity Sessions</h2>
              <p className="text-xs text-white/50">Save & launch tailored workspace environments</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {/* Create Button or Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/15 hover:border-purple-400/50 flex items-center justify-center gap-2 text-xs font-semibold text-white/80 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Save Current Environment as New Session</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">New Session Preset</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Session name (e.g. Deep Coding, Exam Prep)..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Focus Timer</label>
                  <select
                    value={focusMins}
                    onChange={(e) => setFocusMins(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-900/90 focus:outline-none"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={25}>25 Minutes (Standard)</option>
                    <option value={50}>50 Minutes (Deep Work)</option>
                    <option value={90}>90 Minutes (Sprint)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Layout Mode</label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as PageLayoutMode)}
                    className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-900/90 focus:outline-none capitalize"
                  >
                    <option value="compact">Compact</option>
                    <option value="balanced">Balanced</option>
                    <option value="spacious">Spacious</option>
                    <option value="freeform">Freeform</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-glow-violet transition-all"
                >
                  Save Preset
                </button>
              </div>
            </form>
          )}

          {/* Sessions List */}
          <div className="space-y-2">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{ses.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      {ses.focusDurationMinutes || 25}m focus
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Layout className="w-3 h-3" />
                      <span className="capitalize">{ses.layoutMode || 'balanced'}</span>
                    </span>
                    {ses.notesSummary && <span className="truncate max-w-[160px]">{ses.notesSummary}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      launchSession(ses.id);
                      closeModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-xs font-medium transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Launch</span>
                  </button>

                  <button
                    onClick={() => deleteSession(ses.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
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
