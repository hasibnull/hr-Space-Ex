import React, { useState } from 'react';
import {
  X,
  Search,
  Bookmark,
  Sparkles,
  Camera,
  BookOpen,
  BarChart2,
  Pipette,
  Layers,
  FileText,
  CheckSquare,
  QrCode,
  ExternalLink,
  Trash2,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openDestinationUrl } from '../../utils/chromeApi';

type SidePanelTab = 'actions' | 'tools' | 'bookmarks' | 'notes' | 'tasks' | 'clips' | 'sessions';

export const SidePanelDrawer: React.FC<{ isStandalone?: boolean }> = ({ isStandalone = false }) => {
  const {
    activeModal,
    closeModal,
    openModal,
    bookmarks,
    notes,
    tasks,
    savedPages,
    tabSessions,
    settings,
    triggerFullPageCapture,
    triggerVisibleCapture,
    triggerReaderMode,
    triggerCloseDuplicateTabs,
    triggerPageAnalysis,
    addNote,
    addTask,
    toggleTask,
    deleteTask,
    restoreTabSession,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SidePanelTab>('actions');
  const [panelSearch, setPanelSearch] = useState<string>('');
  const [quickNoteTitle, setQuickNoteTitle] = useState<string>('');
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>('');

  const isOpen = isStandalone || activeModal === 'sidePanel';
  if (!isOpen) return null;

  const handleAddQuickNote = async () => {
    if (!quickNoteTitle.trim()) return;
    await addNote(quickNoteTitle.trim(), '');
    setQuickNoteTitle('');
    showToast('Note added', 'success');
  };

  const handleAddQuickTask = async () => {
    if (!quickTaskTitle.trim()) return;
    await addTask(quickTaskTitle.trim(), 'medium', 'Today');
    setQuickTaskTitle('');
    showToast('Task added', 'success');
  };

  return (
    <div
      className={
        isStandalone
          ? 'w-full h-full flex flex-col bg-[#0f1117] text-slate-200 overflow-hidden'
          : 'fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0f1117]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-250'
      }
    >
      {/* Header */}
      <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">MySpace Companion</h2>
            <p className="text-[11px] text-white/40">Contextual Browser Toolkit</p>
          </div>
        </div>

        {!isStandalone && (
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Tabs Navigation */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 bg-white/[0.01]">
        {[
          { id: 'actions', label: 'Actions', icon: Sparkles },
          { id: 'tools', label: 'Tools', icon: Layers },
          { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'clips', label: 'Clips', icon: Bookmark },
          { id: 'sessions', label: 'Tabs', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SidePanelTab)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                isActive
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar for items */}
      {activeTab !== 'actions' && (
        <div className="p-3 border-b border-white/5 bg-black/20 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: CONTEXTUAL ACTIONS */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block">
                Current Page Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    triggerFullPageCapture();
                    if (!isStandalone) closeModal();
                  }}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
                >
                  <Camera className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Full Screenshot</span>
                  <span className="text-[10px] text-white/40">Scroll & stitch PNG</span>
                </button>

                <button
                  onClick={() => {
                    triggerVisibleCapture();
                    if (!isStandalone) closeModal();
                  }}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
                >
                  <Camera className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Visible Snapshot</span>
                  <span className="text-[10px] text-white/40">Instant viewport</span>
                </button>

                <button
                  onClick={() => {
                    triggerReaderMode();
                    if (!isStandalone) closeModal();
                  }}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-left group"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Reader Mode</span>
                  <span className="text-[10px] text-white/40">Clean article view</span>
                </button>

                <button
                  onClick={() => {
                    triggerPageAnalysis();
                    if (!isStandalone) closeModal();
                  }}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/[0.02] hover:bg-pink-500/10 border border-white/5 hover:border-pink-500/30 transition-all text-left group"
                >
                  <BarChart2 className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Page Analyzer</span>
                  <span className="text-[10px] text-white/40">Words, links, tags</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block">
                Quick Tools
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    openModal('designTools');
                    closeModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-white/80 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Pipette className="w-4 h-4 text-purple-400" />
                    <span>Color Eyedropper & Swatches</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">color</span>
                </button>

                <button
                  onClick={() => {
                    openModal('tabManager');
                    closeModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-white/80 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Tab Manager & Deduplicator</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">tabs</span>
                </button>

                <button
                  onClick={async () => {
                    await triggerCloseDuplicateTabs();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-white/80 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Close Duplicate Tabs</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">dedup</span>
                </button>

                <button
                  onClick={() => {
                    openModal('designTools');
                    closeModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-white/80 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Generate Page QR Code</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">qr</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-1.5">
            {bookmarks
              .filter((bm) => !panelSearch || bm.title.toLowerCase().includes(panelSearch.toLowerCase()))
              .slice(0, 30)
              .map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => {
                    openDestinationUrl(bm.url, settings.openBookmarksInNewTab);
                    closeModal();
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer text-xs group transition-all"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Bookmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-white/90 font-medium truncate">{bm.title}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white shrink-0" />
                </div>
              ))}
          </div>
        )}

        {/* TAB 3: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="New quick note..."
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickNote()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddQuickNote}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs"
                >
                  <h4 className="font-semibold text-white/90 truncate">{note.title}</h4>
                  {note.content && <p className="text-[11px] text-white/50 line-clamp-2">{note.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="New today task..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTask()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddQuickTask}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs group"
                >
                  <div
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="rounded border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`${task.completed ? 'line-through text-white/30' : 'text-white/90 font-medium'}`}>
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-1 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SAVED CLIPS */}
        {activeTab === 'clips' && (
          <div className="space-y-2">
            {savedPages.map((clip) => (
              <div
                key={clip.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 space-y-1 text-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90 truncate">{clip.title}</span>
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/40 hover:text-white"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {clip.selectedText && (
                  <p className="text-[11px] text-white/50 italic line-clamp-2">&quot;{clip.selectedText}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-2">
            {tabSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-white/90">{session.name}</h4>
                  <span className="text-[11px] text-white/40">{session.tabCount} tabs</span>
                </div>
                <button
                  onClick={() => restoreTabSession(session.id)}
                  className="px-2.5 py-1 rounded-md bg-purple-600/30 text-purple-300 text-xs font-medium hover:bg-purple-600/50 transition-all"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
