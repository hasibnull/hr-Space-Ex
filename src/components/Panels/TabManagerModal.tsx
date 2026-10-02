import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Layers,
  Search,
  Trash2,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Bookmark,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getOpenBrowserTabs, cleanUrl } from '../../utils/browserTools';

export const TabManagerModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    tabSessions,
    saveTabSession,
    restoreTabSession,
    deleteTabSession,
    triggerCloseDuplicateTabs,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'openTabs' | 'sessions'>('openTabs');
  const [openTabsList, setOpenTabsList] = useState<chrome.tabs.Tab[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);

  const isOpen = activeModal === 'tabManager';

  const refreshTabs = useCallback(async () => {
    const tabs = await getOpenBrowserTabs();
    setOpenTabsList(tabs);

    // Calculate duplicate count
    const seen = new Set<string>();
    let dupes = 0;
    for (const t of tabs) {
      if (!t.url) continue;
      const clean = cleanUrl(t.url).replace(/\/$/, '');
      if (seen.has(clean)) dupes++;
      else seen.add(clean);
    }
    setDuplicatesCount(dupes);
  }, []);

  // Fetch open browser tabs when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshTabs();
    }
  }, [isOpen, refreshTabs]);

  const filteredTabs = openTabsList.filter((tab) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (tab.title || '').toLowerCase().includes(q) ||
      (tab.url || '').toLowerCase().includes(q)
    );
  });

  const handleCloseTab = async (tabId?: number) => {
    if (!tabId) return;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.remove) {
      await chrome.tabs.remove(tabId);
      setOpenTabsList((prev) => prev.filter((t) => t.id !== tabId));
      showToast('Tab closed', 'info');
    } else {
      setOpenTabsList((prev) => prev.filter((t) => t.id !== tabId));
    }
  };

  const handleFocusTab = (tab: chrome.tabs.Tab) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update && tab.id) {
      chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId && chrome.windows) {
        chrome.windows.update(tab.windowId, { focused: true });
      }
      closeModal();
    } else if (tab.url) {
      window.open(tab.url, '_blank');
    }
  };

  const handleCloseDuplicates = async () => {
    await triggerCloseDuplicateTabs();
    await refreshTabs();
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      showToast('Please enter a session name', 'error');
      return;
    }
    await saveTabSession(newSessionName.trim());
    setNewSessionName('');
    setIsSavingSession(false);
    setActiveTab('sessions');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b10]/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Tab Manager & Sessions
                <span className="text-xs font-normal text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {openTabsList.length} Tabs Open
                </span>
              </h2>
              <p className="text-xs text-white/40">
                Search open tabs, close duplicates, and manage saved workspaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {duplicatesCount > 0 && (
              <button
                onClick={handleCloseDuplicates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-medium transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                Close {duplicatesCount} Duplicates
              </button>
            )}

            <button
              onClick={() => setIsSavingSession(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-600/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Session
            </button>

            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Save Session Drawer Input */}
        {isSavingSession && (
          <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-3 animate-in slide-in-from-top-2 duration-150">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder='e.g. "CSE Research" or "Market Analysis"'
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
                if (e.key === 'Escape') setIsSavingSession(false);
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
            />
            <button
              onClick={handleCreateSession}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all"
            >
              Save ({openTabsList.length} Tabs)
            </button>
            <button
              onClick={() => setIsSavingSession(false)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-6 py-2 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('openTabs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'openTabs'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Open Tabs ({openTabsList.length})
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sessions'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Tab Sessions ({tabSessions.length})
            </button>
          </div>

          {/* Quick Search */}
          {activeTab === 'openTabs' && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search tabs by title/URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: OPEN TABS */}
          {activeTab === 'openTabs' && (
            <div className="space-y-2">
              {filteredTabs.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  No matching open tabs found.
                </div>
              ) : (
                filteredTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-xs group"
                  >
                    <div
                      onClick={() => handleFocusTab(tab)}
                      className="flex items-center gap-3 overflow-hidden mr-4 cursor-pointer flex-1"
                    >
                      {tab.favIconUrl ? (
                        <img
                          src={tab.favIconUrl}
                          alt=""
                          className="w-4 h-4 rounded shrink-0 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                          <Layers className="w-2.5 h-2.5 text-purple-400" />
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-white/90 font-medium truncate">{tab.title || 'Untitled Tab'}</p>
                          {tab.pinned && (
                            <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 font-semibold uppercase">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 truncate font-mono">{tab.url}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleFocusTab(tab)}
                        title="Switch to tab"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCloseTab(tab.id)}
                        title="Close tab"
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: SAVED TAB SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              {tabSessions.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  No saved tab sessions yet. Click &quot;Save Session&quot; above to store your current tabs collection!
                </div>
              ) : (
                tabSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{session.name}</h3>
                          <p className="text-[11px] text-white/40">
                            {session.tabCount} tabs • Saved {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => restoreTabSession(session.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore All Tabs
                        </button>
                        <button
                          onClick={() => deleteTabSession(session.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview of tabs in session */}
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      {session.tabs.slice(0, 5).map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-white/60 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 shrink-0" />
                          <span className="truncate">{t.title || t.url}</span>
                        </div>
                      ))}
                      {session.tabs.length > 5 && (
                        <span className="text-[10px] text-white/30 italic pl-3.5">
                          + {session.tabs.length - 5} more tabs
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
