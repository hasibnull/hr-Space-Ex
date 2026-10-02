import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workspace,
  Section,
  Bookmark,
  Note,
  Task,
  Quote,
  WallpaperConfig,
  AppSettings,
  SessionPreset,
  CustomShortcuts,
  PageLayoutMode,
  BookmarkSortMode,
  SavedWebPage,
  TabSession,
  ToolboxTool,
  ScreenshotData,
  PageAnalysis,
} from '../types';
import {
  initializeDatabase,
  dbWorkspaces,
  dbSections,
  dbBookmarks,
  dbNotes,
  dbTasks,
  dbQuotes,
  dbSettings,
  dbCustomWallpapers,
  dbSessions,
  dbSavedPages,
  dbTabSessions,
  dbToolboxTools,
  exportAllData,
  importData,
} from '../db/indexedDB';
import { DEFAULT_WALLPAPER, DEFAULT_SETTINGS, WALLPAPER_PRESETS, DEFAULT_SHORTCUTS } from '../db/initialData';
import {
  getOpenBrowserTabs,
  closeDuplicateBrowserTabs,
  stitchScreenshotSlices,
  cropImageDataUrl,
} from '../utils/browserTools';

export type ActiveModal =
  | null
  | 'addBookmark'
  | 'editBookmark'
  | 'addSection'
  | 'editSection'
  | 'customize'
  | 'wallpaper'
  | 'notes'
  | 'todo'
  | 'focus'
  | 'bookmarksManager'
  | 'chromeImport'
  | 'commandPalette'
  | 'workspaces'
  | 'quickBookmark'
  | 'backupPreview'
  | 'sessions'
  | 'screenshotEditor'
  | 'pageTools'
  | 'tabManager'
  | 'webClipper'
  | 'savedPages'
  | 'designTools'
  | 'sidePanel';


interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}

interface QuickAddData {
  title?: string;
  url?: string;
  sectionId?: string;
}

interface BackupPreviewPayload {
  counts: {
    workspaces: number;
    sections: number;
    bookmarks: number;
    notes: number;
    tasks: number;
  };
  rawJson: string;
}

interface AppContextType {
  // Loading state
  isLoading: boolean;

  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (name: string, icon?: string) => Promise<Workspace>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  // Sections
  sections: Section[];
  activeSections: Section[];
  addSection: (section: Omit<Section, 'id' | 'createdAt' | 'order' | 'workspaceId'>) => Promise<Section>;
  updateSection: (section: Section) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  duplicateSection: (id: string) => Promise<void>;
  reorderSections: (newSections: Section[]) => Promise<void>;
  toggleCollapseSection: (id: string) => Promise<void>;
  setSectionSortMode: (id: string, mode: BookmarkSortMode) => Promise<void>;

  // Bookmarks
  bookmarks: Bookmark[];
  activeBookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'lastUsedAt' | 'clickCount' | 'order' | 'workspaceId'>) => Promise<Bookmark>;
  updateBookmark: (bookmark: Bookmark) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  duplicateBookmark: (id: string) => Promise<void>;
  toggleFavoriteBookmark: (id: string) => Promise<void>;
  recordBookmarkClick: (id: string) => Promise<void>;
  moveBookmark: (bookmarkId: string, targetSectionId: string) => Promise<void>;
  reorderBookmarksInSection: (sectionId: string, orderedBookmarks: Bookmark[]) => Promise<void>;

  // Wallpaper
  wallpaper: WallpaperConfig;
  updateWallpaperConfig: (config: Partial<WallpaperConfig>) => Promise<void>;
  setWallpaperPreset: (presetId: string) => Promise<void>;
  uploadCustomWallpaper: (file: File) => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Quotes
  quotes: Quote[];
  activeQuote: Quote | null;
  addQuote: (text: string, author?: string) => Promise<Quote>;
  deleteQuote: (id: string) => Promise<void>;
  nextRandomQuote: () => void;

  // Notes
  notes: Note[];
  addNote: (title: string, content: string, color?: string) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  addTask: (title: string, priority?: 'low' | 'medium' | 'high', dueDate?: string) => Promise<Task>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Sessions
  sessions: SessionPreset[];
  createSession: (name: string, focusDurationMinutes?: number, layoutMode?: PageLayoutMode) => Promise<SessionPreset>;
  launchSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // UI state & Modes
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModal: ActiveModal;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
  minimalMode: boolean;
  toggleMinimalMode: () => void;
  zenMode: boolean;
  toggleZenMode: () => void;
  layoutLocked: boolean;
  toggleLayoutLock: () => void;
  focusPresetMinutes: number;
  startFocusWithDuration: (minutes: number) => void;

  // Context Menus
  contextMenu: { x: number; y: number; bookmark: Bookmark } | null;
  openContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
  closeContextMenu: () => void;
  sectionContextMenu: { x: number; y: number; section: Section } | null;
  openSectionContextMenu: (e: React.MouseEvent, section: Section) => void;
  closeSectionContextMenu: () => void;
  canvasContextMenu: { x: number; y: number } | null;
  openCanvasContextMenu: (e: React.MouseEvent) => void;
  closeCanvasContextMenu: () => void;

  // Quick Add Bookmark prefill
  quickAddData: QuickAddData | null;
  openQuickAddBookmark: (prefill?: QuickAddData) => void;

  // Backup preview
  backupPreviewData: BackupPreviewPayload | null;
  openBackupPreview: (json: string) => boolean;
  confirmImportBackup: () => Promise<boolean>;
  cancelBackupPreview: () => void;

  // Editing state holders
  targetSectionId: string | null;
  setTargetSectionId: (id: string | null) => void;
  editingBookmark: Bookmark | null;
  setEditingBookmark: (bm: Bookmark | null) => void;
  editingSection: Section | null;
  setEditingSection: (sec: Section | null) => void;

  // Filter modes
  activeFilter: 'all' | 'favorites' | 'mostUsed' | 'recentlyAdded';
  setActiveFilter: (filter: 'all' | 'favorites' | 'mostUsed' | 'recentlyAdded') => void;

  // Search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Custom Shortcuts & Aliases
  updateShortcut: (action: keyof CustomShortcuts, keyCombo: string) => Promise<boolean>;
  resetShortcuts: () => Promise<void>;
  setCommandAlias: (alias: string, target: string) => Promise<void>;
  removeCommandAlias: (alias: string) => Promise<void>;

  // Import / Export
  exportDataJson: () => Promise<string>;
  importDataJson: (json: string) => Promise<boolean>;
  resetToDefaultData: () => Promise<void>;

  // Onboarding
  completeOnboarding: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;

  // Browser Toolkit: Saved Web Pages
  savedPages: SavedWebPage[];
  saveWebPage: (page: Omit<SavedWebPage, 'id' | 'timestamp'>) => Promise<SavedWebPage>;
  updateSavedPage: (page: SavedWebPage) => Promise<void>;
  deleteSavedPage: (id: string) => Promise<void>;

  // Browser Toolkit: Tab Sessions
  tabSessions: TabSession[];
  saveTabSession: (name: string, customTabs?: Array<{ title: string; url: string; favIconUrl?: string; pinned?: boolean }>) => Promise<TabSession>;
  restoreTabSession: (id: string) => Promise<void>;
  deleteTabSession: (id: string) => Promise<void>;

  // Browser Toolkit: Toolbox Tools Library
  toolboxTools: ToolboxTool[];
  toggleToolEnabled: (id: string) => Promise<void>;
  toggleToolFavorite: (id: string) => Promise<void>;
  updateToolAlias: (id: string, alias: string) => Promise<void>;
  updateToolShortcut: (id: string, shortcut: string) => Promise<void>;

  // Browser Toolkit: Active Screenshot & Page Analyzer States
  activeScreenshot: ScreenshotData | null;
  setActiveScreenshot: (data: ScreenshotData | null) => void;
  activePageAnalysis: PageAnalysis | null;
  setActivePageAnalysis: (data: PageAnalysis | null) => void;

  // Browser Toolkit: Quick Action Triggers
  triggerFullPageCapture: () => Promise<void>;
  triggerVisibleCapture: () => Promise<void>;
  triggerSelectedAreaCapture: () => Promise<void>;
  triggerReaderMode: () => Promise<void>;
  triggerCloseDuplicateTabs: () => Promise<number>;
  triggerPageAnalysis: () => Promise<void>;
  triggerCleanUrl: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [sessions, setSessions] = useState<SessionPreset[]>([]);
  const [wallpaper, setWallpaper] = useState<WallpaperConfig>(DEFAULT_WALLPAPER);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Browser Toolkit States
  const [savedPages, setSavedPages] = useState<SavedWebPage[]>([]);
  const [tabSessions, setTabSessions] = useState<TabSession[]>([]);
  const [toolboxTools, setToolboxTools] = useState<ToolboxTool[]>([]);
  const [activeScreenshot, setActiveScreenshot] = useState<ScreenshotData | null>(null);
  const [activePageAnalysis, setActivePageAnalysis] = useState<PageAnalysis | null>(null);

  // UI Modals & Menus
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmark: Bookmark } | null>(null);
  const [sectionContextMenu, setSectionContextMenu] = useState<{ x: number; y: number; section: Section } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [quickAddData, setQuickAddData] = useState<QuickAddData | null>(null);
  const [backupPreviewData, setBackupPreviewData] = useState<BackupPreviewPayload | null>(null);
  const [focusPresetMinutes, setFocusPresetMinutes] = useState<number>(25);

  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'mostUsed' | 'recentlyAdded'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast notification helper
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Check URL query parameters for modal/panel triggers
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const modalParam = params.get('modal');
      if (modalParam) {
        setActiveModal(modalParam as ActiveModal);
      }
      const panelParam = params.get('panel');
      if (panelParam === 'sidepanel') {
        setActiveModal('sidePanel');
      }
    } catch {}
  }, []);

  // Listen for Chrome Storage events (e.g. from background service worker)
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['myspace_active_capture', 'myspace_active_analysis', 'myspace_clipped_pages'], (res: Record<string, any>) => {
        if (res.myspace_active_capture) {
          const cap: any = res.myspace_active_capture;
          if (cap.slices && cap.slices.length > 0) {
            stitchScreenshotSlices(cap.slices, cap.width, cap.height, cap.viewportHeight).then((stitchedUrl) => {
              setActiveScreenshot({
                dataUrl: stitchedUrl,
                width: cap.width,
                height: cap.height,
                sourceUrl: cap.sourceUrl,
                pageTitle: cap.pageTitle,
                timestamp: cap.timestamp,
                mode: 'full',
              });
            }).catch(console.error);
          } else if (cap.cropRect && cap.dataUrl) {
            cropImageDataUrl(cap.dataUrl, cap.cropRect).then((croppedUrl) => {
              const dpr = cap.cropRect.dpr || 1;
              setActiveScreenshot({
                dataUrl: croppedUrl,
                width: Math.round(cap.cropRect.width * dpr),
                height: Math.round(cap.cropRect.height * dpr),
                sourceUrl: cap.sourceUrl,
                pageTitle: cap.pageTitle,
                timestamp: cap.timestamp,
                mode: 'selected',
              });
            }).catch(console.error);
          } else if (cap.dataUrl) {
            setActiveScreenshot(cap);
          }
        }
        if (res.myspace_active_analysis) {
          setActivePageAnalysis(res.myspace_active_analysis as PageAnalysis);
        }
        if (res.myspace_clipped_pages && Array.isArray(res.myspace_clipped_pages)) {
          // Merge newly clipped pages into indexedDB
          res.myspace_clipped_pages.forEach((item: SavedWebPage) => {
            dbSavedPages.save(item);
          });
        }
      });

      const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
        if (area === 'local') {
          const rawChanges = changes as Record<string, any>;
          if (rawChanges.myspace_active_capture?.newValue) {
            const cap: any = rawChanges.myspace_active_capture.newValue;
            if (cap.slices && cap.slices.length > 0) {
              stitchScreenshotSlices(cap.slices, cap.width, cap.height, cap.viewportHeight).then((stitchedUrl) => {
                setActiveScreenshot({
                  dataUrl: stitchedUrl,
                  width: cap.width,
                  height: cap.height,
                  sourceUrl: cap.sourceUrl,
                  pageTitle: cap.pageTitle,
                  timestamp: cap.timestamp,
                  mode: 'full',
                });
                setActiveModal('screenshotEditor');
              }).catch(console.error);
            } else if (cap.cropRect && cap.dataUrl) {
              cropImageDataUrl(cap.dataUrl, cap.cropRect).then((croppedUrl) => {
                const dpr = cap.cropRect.dpr || 1;
                setActiveScreenshot({
                  dataUrl: croppedUrl,
                  width: Math.round(cap.cropRect.width * dpr),
                  height: Math.round(cap.cropRect.height * dpr),
                  sourceUrl: cap.sourceUrl,
                  pageTitle: cap.pageTitle,
                  timestamp: cap.timestamp,
                  mode: 'selected',
                });
                setActiveModal('screenshotEditor');
              }).catch(console.error);
            } else if (cap.dataUrl) {
              setActiveScreenshot(cap);
              setActiveModal('screenshotEditor');
            }
          }
          if (rawChanges.myspace_active_analysis?.newValue) {
            setActivePageAnalysis(rawChanges.myspace_active_analysis.newValue as PageAnalysis);
            setActiveModal('pageTools');
          }
          if (rawChanges.myspace_clipped_pages?.newValue) {
            dbSavedPages.getAll().then((pages) => setSavedPages(pages));
          }
        }
      };

      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    async function load() {
      try {
        const initial = await initializeDatabase();
        setWorkspaces(initial.workspaces);
        setSections(initial.sections);
        setBookmarks(initial.bookmarks);
        setNotes(initial.notes);
        setTasks(initial.tasks);
        setQuotes(initial.quotes);
        setSessions(initial.sessions || []);
        setSavedPages(initial.savedPages || []);
        setTabSessions(initial.tabSessions || []);
        setToolboxTools(initial.toolboxTools || []);
        setSettings(initial.settings);

        // Check for workspace specific wallpaper or default
        const activeWs = initial.workspaces.find((w) => w.id === initial.settings.activeWorkspaceId) || initial.workspaces[0];
        if (activeWs?.wallpaperConfig) {
          setWallpaper({ ...initial.wallpaper, ...activeWs.wallpaperConfig });
        } else {
          setWallpaper(initial.wallpaper);
        }

        // Handle wallpaper rotation if enabled
        if (initial.settings.wallpaperRotation && initial.settings.wallpaperRotation !== 'disabled') {
          const now = Date.now();
          const lastRot = initial.settings.lastRotationTime || 0;
          let shouldRotate = false;

          if (initial.settings.wallpaperRotation === 'new-tab') {
            shouldRotate = true;
          } else if (initial.settings.wallpaperRotation === 'hourly' && now - lastRot > 3600000) {
            shouldRotate = true;
          } else if (initial.settings.wallpaperRotation === 'daily' && now - lastRot > 86400000) {
            shouldRotate = true;
          }

          if (shouldRotate && WALLPAPER_PRESETS.length > 0) {
            const randomPreset = WALLPAPER_PRESETS[Math.floor(Math.random() * WALLPAPER_PRESETS.length)];
            const rotated: WallpaperConfig = {
              ...initial.wallpaper,
              type: 'preset',
              presetId: randomPreset.id,
              url: randomPreset.url,
            };
            setWallpaper(rotated);
            await dbSettings.saveWallpaper(rotated);
            const updatedSettings = { ...initial.settings, lastRotationTime: now };
            setSettings(updatedSettings);
            await dbSettings.saveSettings(updatedSettings);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setIsLoading(false);
      }
    }
    load();
  }, []);


  // Active Workspace
  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => w.id === settings.activeWorkspaceId) ||
      workspaces[0] || {
        id: 'ws-work',
        name: 'Work',
        icon: 'Briefcase',
        order: 0,
        isDefault: true,
        createdAt: 0,
      }
    );
  }, [workspaces, settings.activeWorkspaceId]);

  const setActiveWorkspaceId = useCallback(
    async (id: string) => {
      const updated = { ...settings, activeWorkspaceId: id };
      setSettings(updated);
      await dbSettings.saveSettings(updated);

      const targetWs = workspaces.find((w) => w.id === id);
      if (targetWs?.wallpaperConfig) {
        setWallpaper((prev) => ({ ...prev, ...targetWs.wallpaperConfig }));
      }
      showToast(`Switched to workspace: ${targetWs?.name || id}`, 'info');
    },
    [settings, workspaces, showToast]
  );

  // Active workspace's sections & bookmarks
  const activeSections = useMemo(() => {
    return sections
      .filter((s) => s.workspaceId === activeWorkspace.id)
      .sort((a, b) => a.order - b.order);
  }, [sections, activeWorkspace.id]);

  const activeBookmarks = useMemo(() => {
    return bookmarks.filter((b) => b.workspaceId === activeWorkspace.id);
  }, [bookmarks, activeWorkspace.id]);

  // Quotes
  const activeQuote = useMemo(() => {
    if (quotes.length === 0) return null;
    if (settings.activeQuoteId) {
      const found = quotes.find((q) => q.id === settings.activeQuoteId);
      if (found) return found;
    }
    return quotes[0];
  }, [quotes, settings.activeQuoteId]);

  const nextRandomQuote = useCallback(() => {
    if (quotes.length <= 1) return;
    const currentIndex = quotes.findIndex((q) => q.id === activeQuote?.id);
    let nextIndex = Math.floor(Math.random() * quotes.length);
    if (nextIndex === currentIndex) {
      nextIndex = (currentIndex + 1) % quotes.length;
    }
    const nextQ = quotes[nextIndex];
    const newSettings = { ...settings, activeQuoteId: nextQ.id };
    setSettings(newSettings);
    dbSettings.saveSettings(newSettings);
  }, [quotes, activeQuote, settings]);

  const addQuote = useCallback(
    async (text: string, author?: string) => {
      const newQuote: Quote = {
        id: `quote-${Date.now()}`,
        text,
        author: author || 'Custom',
        isCustom: true,
      };
      const updated = [...quotes, newQuote];
      setQuotes(updated);
      await dbQuotes.save(newQuote);
      showToast('New quote added', 'success');
      return newQuote;
    },
    [quotes, showToast]
  );

  const deleteQuote = useCallback(
    async (id: string) => {
      const updated = quotes.filter((q) => q.id !== id);
      setQuotes(updated);
      await dbQuotes.delete(id);
      showToast('Quote removed', 'info');
    },
    [quotes, showToast]
  );

  // Workspaces CRUD
  const createWorkspace = useCallback(
    async (name: string, icon: string = 'Briefcase') => {
      const newWs: Workspace = {
        id: `ws-${Date.now()}`,
        name,
        icon,
        order: workspaces.length,
        isDefault: false,
        createdAt: Date.now(),
      };
      const updated = [...workspaces, newWs];
      setWorkspaces(updated);
      await dbWorkspaces.save(newWs);

      // Create a default initial section for the new workspace
      const newSec: Section = {
        id: `sec-${Date.now()}`,
        workspaceId: newWs.id,
        name: 'Quick Links',
        icon: 'Folder',
        color: '#8b5cf6',
        layout: 'grid',
        order: 0,
        createdAt: Date.now(),
      };
      setSections((prev) => [...prev, newSec]);
      await dbSections.save(newSec);

      await setActiveWorkspaceId(newWs.id);
      showToast(`Workspace "${name}" created!`, 'success');
      return newWs;
    },
    [workspaces, setActiveWorkspaceId, showToast]
  );

  const updateWorkspace = useCallback(
    async (workspace: Workspace) => {
      const updated = workspaces.map((w) => (w.id === workspace.id ? workspace : w));
      setWorkspaces(updated);
      await dbWorkspaces.save(workspace);
      showToast('Workspace updated', 'success');
    },
    [workspaces, showToast]
  );

  const deleteWorkspace = useCallback(
    async (id: string) => {
      if (workspaces.length <= 1) {
        showToast('You must keep at least one workspace', 'error');
        return;
      }
      const updated = workspaces.filter((w) => w.id !== id);
      setWorkspaces(updated);
      await dbWorkspaces.delete(id);

      const remainingSections = sections.filter((s) => s.workspaceId !== id);
      setSections(remainingSections);
      const remainingBookmarks = bookmarks.filter((b) => b.workspaceId !== id);
      setBookmarks(remainingBookmarks);

      if (settings.activeWorkspaceId === id) {
        await setActiveWorkspaceId(updated[0].id);
      }
      showToast('Workspace deleted', 'info');
    },
    [workspaces, sections, bookmarks, settings.activeWorkspaceId, setActiveWorkspaceId, showToast]
  );

  // Sections CRUD
  const addSection = useCallback(
    async (secData: Omit<Section, 'id' | 'createdAt' | 'order' | 'workspaceId'>) => {
      const newSec: Section = {
        ...secData,
        id: `sec-${Date.now()}`,
        workspaceId: activeWorkspace.id,
        order: activeSections.length,
        createdAt: Date.now(),
      };
      const updated = [...sections, newSec];
      setSections(updated);
      await dbSections.save(newSec);
      showToast(`Section "${newSec.name}" created`, 'success');
      return newSec;
    },
    [sections, activeWorkspace.id, activeSections.length, showToast]
  );

  const updateSection = useCallback(
    async (section: Section) => {
      const updated = sections.map((s) => (s.id === section.id ? section : s));
      setSections(updated);
      await dbSections.save(section);
      showToast(`Section "${section.name}" updated`, 'success');
    },
    [sections, showToast]
  );

  const deleteSection = useCallback(
    async (id: string) => {
      const secToDelete = sections.find((s) => s.id === id);
      const updatedSections = sections.filter((s) => s.id !== id);
      setSections(updatedSections);
      await dbSections.delete(id);

      const updatedBookmarks = bookmarks.filter((b) => b.sectionId !== id);
      setBookmarks(updatedBookmarks);

      showToast(`Deleted section "${secToDelete?.name || ''}" and its bookmarks`, 'info');
    },
    [sections, bookmarks, showToast]
  );

  const duplicateSection = useCallback(
    async (id: string) => {
      const sec = sections.find((s) => s.id === id);
      if (!sec) return;
      const newSecId = `sec-${Date.now()}`;
      const duplicatedSec: Section = {
        ...sec,
        id: newSecId,
        name: `${sec.name} (Copy)`,
        order: sec.order + 1,
        createdAt: Date.now(),
      };
      const updatedSecs = [...sections, duplicatedSec];
      setSections(updatedSecs);
      await dbSections.save(duplicatedSec);

      const secBookmarks = bookmarks.filter((b) => b.sectionId === id);
      const duplicatedBookmarks: Bookmark[] = secBookmarks.map((b) => ({
        ...b,
        id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sectionId: newSecId,
        createdAt: Date.now(),
        clickCount: 0,
      }));

      if (duplicatedBookmarks.length > 0) {
        setBookmarks((prev) => [...prev, ...duplicatedBookmarks]);
        await dbBookmarks.saveAll(duplicatedBookmarks);
      }

      showToast(`Duplicated section "${sec.name}"`, 'success');
    },
    [sections, bookmarks, showToast]
  );

  const reorderSections = useCallback(
    async (newSections: Section[]) => {
      const updatedOrder = newSections.map((s, idx) => ({ ...s, order: idx }));
      const otherWorkspaceSections = sections.filter((s) => s.workspaceId !== activeWorkspace.id);
      const merged = [...otherWorkspaceSections, ...updatedOrder];
      setSections(merged);
      await dbSections.saveAll(updatedOrder);
    },
    [sections, activeWorkspace.id]
  );

  const toggleCollapseSection = useCallback(
    async (id: string) => {
      const sec = sections.find((s) => s.id === id);
      if (!sec) return;
      const updated = { ...sec, isCollapsed: !sec.isCollapsed };
      const updatedList = sections.map((s) => (s.id === id ? updated : s));
      setSections(updatedList);
      await dbSections.save(updated);
    },
    [sections]
  );

  const setSectionSortMode = useCallback(
    async (id: string, mode: BookmarkSortMode) => {
      const sec = sections.find((s) => s.id === id);
      if (!sec) return;
      const updated = { ...sec, sortMode: mode };
      const updatedList = sections.map((s) => (s.id === id ? updated : s));
      setSections(updatedList);
      await dbSections.save(updated);
      showToast(`Sorting set to: ${mode}`, 'info');
    },
    [sections, showToast]
  );

  // Bookmarks CRUD
  const addBookmark = useCallback(
    async (bmData: Omit<Bookmark, 'id' | 'createdAt' | 'lastUsedAt' | 'clickCount' | 'order' | 'workspaceId'>) => {
      const newBm: Bookmark = {
        ...bmData,
        id: `bm-${Date.now()}`,
        workspaceId: activeWorkspace.id,
        clickCount: 0,
        order: bookmarks.filter((b) => b.sectionId === bmData.sectionId).length,
        createdAt: Date.now(),
        lastUsedAt: 0,
      };
      const updated = [...bookmarks, newBm];
      setBookmarks(updated);
      await dbBookmarks.save(newBm);
      showToast(`Added "${newBm.title}"`, 'success');
      return newBm;
    },
    [bookmarks, activeWorkspace.id, showToast]
  );

  const updateBookmark = useCallback(
    async (bookmark: Bookmark) => {
      const updated = bookmarks.map((b) => (b.id === bookmark.id ? bookmark : b));
      setBookmarks(updated);
      await dbBookmarks.save(bookmark);
      showToast(`Saved "${bookmark.title}"`, 'success');
    },
    [bookmarks, showToast]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      const bm = bookmarks.find((b) => b.id === id);
      const updated = bookmarks.filter((b) => b.id !== id);
      setBookmarks(updated);
      await dbBookmarks.delete(id);
      showToast(`Deleted "${bm?.title || 'bookmark'}"`, 'info');
    },
    [bookmarks, showToast]
  );

  const duplicateBookmark = useCallback(
    async (id: string) => {
      const bm = bookmarks.find((b) => b.id === id);
      if (!bm) return;
      const duplicated: Bookmark = {
        ...bm,
        id: `bm-${Date.now()}`,
        title: `${bm.title} (Copy)`,
        order: bm.order + 1,
        clickCount: 0,
        createdAt: Date.now(),
      };
      const updated = [...bookmarks, duplicated];
      setBookmarks(updated);
      await dbBookmarks.save(duplicated);
      showToast(`Duplicated "${bm.title}"`, 'success');
    },
    [bookmarks, showToast]
  );

  const toggleFavoriteBookmark = useCallback(
    async (id: string) => {
      const bm = bookmarks.find((b) => b.id === id);
      if (!bm) return;
      const updated = { ...bm, isFavorite: !bm.isFavorite };
      const updatedList = bookmarks.map((b) => (b.id === id ? updated : b));
      setBookmarks(updatedList);
      await dbBookmarks.save(updated);
      showToast(updated.isFavorite ? `Favorited "${bm.title}"` : `Removed from favorites`, 'info');
    },
    [bookmarks, showToast]
  );

  const recordBookmarkClick = useCallback(
    async (id: string) => {
      const bm = bookmarks.find((b) => b.id === id);
      if (!bm) return;
      const updated: Bookmark = {
        ...bm,
        clickCount: (bm.clickCount || 0) + 1,
        lastUsedAt: Date.now(),
      };
      const updatedList = bookmarks.map((b) => (b.id === id ? updated : b));
      setBookmarks(updatedList);
      await dbBookmarks.save(updated);
    },
    [bookmarks]
  );

  const moveBookmark = useCallback(
    async (bookmarkId: string, targetSecId: string) => {
      const bm = bookmarks.find((b) => b.id === bookmarkId);
      if (!bm || bm.sectionId === targetSecId) return;

      const targetSectionBookmarks = bookmarks.filter((b) => b.sectionId === targetSecId);
      const updated: Bookmark = {
        ...bm,
        sectionId: targetSecId,
        order: targetSectionBookmarks.length,
      };
      const updatedList = bookmarks.map((b) => (b.id === bookmarkId ? updated : b));
      setBookmarks(updatedList);
      await dbBookmarks.save(updated);
      showToast(`Moved to ${sections.find((s) => s.id === targetSecId)?.name || 'section'}`, 'info');
    },
    [bookmarks, sections, showToast]
  );

  const reorderBookmarksInSection = useCallback(
    async (sectionId: string, orderedBookmarks: Bookmark[]) => {
      const reindexed = orderedBookmarks.map((b, idx) => ({ ...b, order: idx }));
      const otherBookmarks = bookmarks.filter((b) => b.sectionId !== sectionId);
      const merged = [...otherBookmarks, ...reindexed];
      setBookmarks(merged);
      await dbBookmarks.saveAll(reindexed);
    },
    [bookmarks]
  );

  // Wallpaper
  const updateWallpaperConfig = useCallback(
    async (config: Partial<WallpaperConfig>) => {
      const updated: WallpaperConfig = { ...wallpaper, ...config };
      setWallpaper(updated);
      await dbSettings.saveWallpaper(updated);
    },
    [wallpaper]
  );

  const setWallpaperPreset = useCallback(
    async (presetId: string) => {
      const preset = WALLPAPER_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const updated: WallpaperConfig = {
        ...wallpaper,
        type: 'preset',
        presetId,
        url: preset.url,
      };
      setWallpaper(updated);
      await dbSettings.saveWallpaper(updated);
      showToast(`Wallpaper set: ${preset.name}`, 'success');
    },
    [wallpaper, showToast]
  );

  const uploadCustomWallpaper = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;
        const id = `custom-wp-${Date.now()}`;
        await dbCustomWallpapers.save(id, dataUrl);
        const updated: WallpaperConfig = {
          ...wallpaper,
          type: 'upload',
          presetId: id,
          url: dataUrl,
          dataUrl,
        };
        setWallpaper(updated);
        await dbSettings.saveWallpaper(updated);
        showToast('Custom wallpaper applied!', 'success');
      };
      reader.readAsDataURL(file);
    },
    [wallpaper, showToast]
  );

  // Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated: AppSettings = { ...settings, ...newSettings };
      setSettings(updated);
      await dbSettings.saveSettings(updated);
    },
    [settings]
  );

  // Notes
  const addNote = useCallback(
    async (title: string, content: string, color: string = '#8b5cf6') => {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title,
        content,
        isPinned: false,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [newNote, ...notes];
      setNotes(updated);
      await dbNotes.save(newNote);
      showToast('Note created', 'success');
      return newNote;
    },
    [notes, showToast]
  );

  const updateNote = useCallback(
    async (note: Note) => {
      const updatedNote = { ...note, updatedAt: Date.now() };
      const updated = notes.map((n) => (n.id === note.id ? updatedNote : n));
      setNotes(updated);
      await dbNotes.save(updatedNote);
    },
    [notes]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      await dbNotes.delete(id);
      showToast('Note deleted', 'info');
    },
    [notes, showToast]
  );

  const togglePinNote = useCallback(
    async (id: string) => {
      const n = notes.find((item) => item.id === id);
      if (!n) return;
      const updatedNote = { ...n, isPinned: !n.isPinned, updatedAt: Date.now() };
      const updated = notes.map((item) => (item.id === id ? updatedNote : item));
      setNotes(updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt));
      await dbNotes.save(updatedNote);
    },
    [notes]
  );

  // Tasks
  const addTask = useCallback(
    async (title: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string) => {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        completed: false,
        priority,
        dueDate: dueDate || 'Today',
        createdAt: Date.now(),
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      await dbTasks.save(newTask);
      showToast('Task added', 'success');
      return newTask;
    },
    [tasks, showToast]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const t = tasks.find((task) => task.id === id);
      if (!t) return;
      const updatedTask = { ...t, completed: !t.completed };
      const updated = tasks.map((task) => (task.id === id ? updatedTask : task));
      setTasks(updated);
      await dbTasks.save(updatedTask);
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      await dbTasks.delete(id);
      showToast('Task removed', 'info');
    },
    [tasks, showToast]
  );

  // Sessions CRUD
  const createSession = useCallback(
    async (name: string, focusDurationMinutes: number = 25, layoutMode: PageLayoutMode = 'balanced') => {
      const newSession: SessionPreset = {
        id: `session-${Date.now()}`,
        name,
        workspaceId: activeWorkspace.id,
        focusDurationMinutes,
        layoutMode,
        createdAt: Date.now(),
      };
      const updated = [...sessions, newSession];
      setSessions(updated);
      await dbSessions.save(newSession);
      showToast(`Session preset "${name}" created!`, 'success');
      return newSession;
    },
    [sessions, activeWorkspace.id, showToast]
  );

  const launchSession = useCallback(
    async (id: string) => {
      const ses = sessions.find((s) => s.id === id);
      if (!ses) return;
      if (ses.workspaceId !== activeWorkspace.id) {
        await setActiveWorkspaceId(ses.workspaceId);
      }
      if (ses.layoutMode) {
        await updateSettings({ layoutMode: ses.layoutMode });
      }
      if (ses.focusDurationMinutes) {
        setFocusPresetMinutes(ses.focusDurationMinutes);
        setActiveModal('focus');
      }
      showToast(`Launched session: "${ses.name}"`, 'success');
    },
    [sessions, activeWorkspace.id, setActiveWorkspaceId, updateSettings, showToast]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      await dbSessions.delete(id);
      showToast('Session preset removed', 'info');
    },
    [sessions, showToast]
  );

  // Modals & Navigation
  const openModal = useCallback((modal: ActiveModal) => {
    setActiveModal(modal);
    setSidebarOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setTargetSectionId(null);
    setEditingBookmark(null);
    setEditingSection(null);
    setQuickAddData(null);
    setBackupPreviewData(null);
  }, []);

  // Modes
  const minimalMode = !!settings.minimalMode;
  const toggleMinimalMode = useCallback(() => {
    const nextVal = !settings.minimalMode;
    updateSettings({ minimalMode: nextVal });
    showToast(nextVal ? 'Minimal Mode enabled' : 'Minimal Mode disabled', 'info');
  }, [settings.minimalMode, updateSettings, showToast]);

  const zenMode = !!settings.zenMode;
  const toggleZenMode = useCallback(() => {
    const nextVal = !settings.zenMode;
    updateSettings({ zenMode: nextVal });
    showToast(nextVal ? 'Zen Mode enabled (Press Esc to exit)' : 'Zen Mode disabled', 'info');
  }, [settings.zenMode, updateSettings, showToast]);

  const layoutLocked = !!settings.layoutLocked;
  const toggleLayoutLock = useCallback(() => {
    const nextVal = !settings.layoutLocked;
    updateSettings({ layoutLocked: nextVal });
    showToast(nextVal ? 'Layout locked' : 'Layout unlocked', 'info');
  }, [settings.layoutLocked, updateSettings, showToast]);

  const startFocusWithDuration = useCallback((minutes: number) => {
    setFocusPresetMinutes(minutes);
    openModal('focus');
  }, [openModal]);

  // Context Menus
  const openContextMenu = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 340),
      bookmark,
    });
    setSectionContextMenu(null);
    setCanvasContextMenu(null);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const openSectionContextMenu = useCallback((e: React.MouseEvent, section: Section) => {
    e.preventDefault();
    e.stopPropagation();
    setSectionContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 340),
      section,
    });
    setContextMenu(null);
    setCanvasContextMenu(null);
  }, []);

  const closeSectionContextMenu = useCallback(() => {
    setSectionContextMenu(null);
  }, []);

  const openCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCanvasContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 300),
    });
    setContextMenu(null);
    setSectionContextMenu(null);
  }, []);

  const closeCanvasContextMenu = useCallback(() => {
    setCanvasContextMenu(null);
  }, []);

  // Quick Add Bookmark
  const openQuickAddBookmark = useCallback((prefill?: QuickAddData) => {
    setQuickAddData(prefill || null);
    openModal('quickBookmark');
  }, [openModal]);

  // Backup Preview & Import Confirmation
  const openBackupPreview = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      const counts = {
        workspaces: Array.isArray(data.workspaces) ? data.workspaces.length : 0,
        sections: Array.isArray(data.sections) ? data.sections.length : 0,
        bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks.length : 0,
        notes: Array.isArray(data.notes) ? data.notes.length : 0,
        tasks: Array.isArray(data.tasks) ? data.tasks.length : 0,
      };

      setBackupPreviewData({ counts, rawJson: jsonString });
      openModal('backupPreview');
      return true;
    } catch {
      showToast('Invalid JSON file format', 'error');
      return false;
    }
  }, [openModal, showToast]);

  const confirmImportBackup = useCallback(async () => {
    if (!backupPreviewData) return false;
    const ok = await importData(backupPreviewData.rawJson);
    if (ok) {
      const initial = await initializeDatabase();
      setWorkspaces(initial.workspaces);
      setSections(initial.sections);
      setBookmarks(initial.bookmarks);
      setNotes(initial.notes);
      setTasks(initial.tasks);
      setQuotes(initial.quotes);
      setSessions(initial.sessions || []);
      setSettings(initial.settings);
      setWallpaper(initial.wallpaper);
      closeModal();
      showToast('Data imported and restored successfully!', 'success');
      return true;
    } else {
      showToast('Import failed. Invalid data structure.', 'error');
      return false;
    }
  }, [backupPreviewData, closeModal, showToast]);

  const cancelBackupPreview = useCallback(() => {
    setBackupPreviewData(null);
    closeModal();
  }, [closeModal]);

  // Shortcuts & Aliases
  const updateShortcut = useCallback(
    async (action: keyof CustomShortcuts, keyCombo: string): Promise<boolean> => {
      // Check conflict
      const currentShortcuts = settings.shortcuts || DEFAULT_SHORTCUTS;
      const normalizedCombo = keyCombo.toLowerCase().trim();
      const existing = Object.entries(currentShortcuts).find(
        ([act, combo]) => act !== action && combo.toLowerCase().trim() === normalizedCombo
      );

      if (existing) {
        showToast(`Shortcut conflict with "${existing[0]}"!`, 'error');
        return false;
      }

      const updatedShortcuts = { ...currentShortcuts, [action]: normalizedCombo };
      await updateSettings({ shortcuts: updatedShortcuts });
      showToast(`Shortcut for "${action}" updated to ${keyCombo}`, 'success');
      return true;
    },
    [settings.shortcuts, updateSettings, showToast]
  );

  const resetShortcuts = useCallback(async () => {
    await updateSettings({ shortcuts: DEFAULT_SHORTCUTS });
    showToast('Shortcuts reset to default configuration', 'info');
  }, [updateSettings, showToast]);

  const setCommandAlias = useCallback(
    async (alias: string, target: string) => {
      const current = settings.commandAliases || {};
      const updated = { ...current, [alias.toLowerCase().trim()]: target.trim() };
      await updateSettings({ commandAliases: updated });
      showToast(`Alias "${alias}" saved!`, 'success');
    },
    [settings.commandAliases, updateSettings, showToast]
  );

  const removeCommandAlias = useCallback(
    async (alias: string) => {
      const current = { ...(settings.commandAliases || {}) };
      delete current[alias.toLowerCase().trim()];
      await updateSettings({ commandAliases: current });
      showToast(`Alias "${alias}" deleted`, 'info');
    },
    [settings.commandAliases, updateSettings, showToast]
  );

  // Onboarding
  const completeOnboarding = useCallback(() => {
    updateSettings({ onboardingCompleted: true });
  }, [updateSettings]);

  // Export & Import
  const exportDataJson = useCallback(async () => {
    return exportAllData();
  }, []);

  const importDataJson = useCallback(
    async (json: string) => {
      return openBackupPreview(json);
    },
    [openBackupPreview]
  );

  const resetToDefaultData = useCallback(async () => {
    const db = await (await import('../db/indexedDB')).getDB();
    const stores = ['workspaces', 'sections', 'bookmarks', 'notes', 'tasks', 'quotes', 'settings', 'wallpapers', 'sessions'];
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach((s) => {
      if (db.objectStoreNames.contains(s)) {
        tx.objectStore(s).clear();
      }
    });
    await new Promise((resolve) => (tx.oncomplete = resolve));

    const initial = await initializeDatabase();
    setWorkspaces(initial.workspaces);
    setSections(initial.sections);
    setBookmarks(initial.bookmarks);
    setNotes(initial.notes);
    setTasks(initial.tasks);
    setQuotes(initial.quotes);
    setSessions(initial.sessions || []);
    setSettings(initial.settings);
    setWallpaper(initial.wallpaper);
    showToast('Reset to default configuration', 'info');
  }, [showToast]);

  // Browser Toolkit: Saved Web Pages / Clipper
  const saveWebPage = useCallback(
    async (pageData: Omit<SavedWebPage, 'id' | 'timestamp'>): Promise<SavedWebPage> => {
      const newPage: SavedWebPage = {
        ...pageData,
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
      };
      await dbSavedPages.save(newPage);
      setSavedPages((prev) => [newPage, ...prev]);
      showToast('Page saved to MySpace Web Clipper!', 'success');
      return newPage;
    },
    [showToast]
  );

  const updateSavedPage = useCallback(
    async (page: SavedWebPage) => {
      await dbSavedPages.save(page);
      setSavedPages((prev) => prev.map((p) => (p.id === page.id ? page : p)));
      showToast('Saved clip updated', 'info');
    },
    [showToast]
  );

  const deleteSavedPage = useCallback(
    async (id: string) => {
      await dbSavedPages.delete(id);
      setSavedPages((prev) => prev.filter((p) => p.id !== id));
      showToast('Clip deleted', 'info');
    },
    [showToast]
  );

  // Browser Toolkit: Tab Sessions
  const saveTabSession = useCallback(
    async (
      name: string,
      customTabs?: Array<{ title: string; url: string; favIconUrl?: string; pinned?: boolean }>
    ): Promise<TabSession> => {
      let tabsToSave: Array<{ title: string; url: string; favIconUrl?: string; pinned?: boolean }> = [];
      if (customTabs && customTabs.length > 0) {
        tabsToSave = customTabs;
      } else {
        const openTabs = await getOpenBrowserTabs();
        tabsToSave = openTabs
          .filter((t) => t.url && !t.url.startsWith('chrome://'))
          .map((t) => ({
            title: t.title || 'Tab',
            url: t.url || '',
            favIconUrl: t.favIconUrl,
            pinned: t.pinned || false,
          }));
      }

      const session: TabSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: name || `Session ${new Date().toLocaleDateString()}`,
        tabCount: tabsToSave.length,
        tabs: tabsToSave,
        createdAt: Date.now(),
        workspaceId: activeWorkspace.id,
      };

      await dbTabSessions.save(session);
      setTabSessions((prev) => [session, ...prev]);
      showToast(`Saved session "${session.name}" with ${session.tabCount} tabs!`, 'success');
      return session;
    },
    [activeWorkspace.id, showToast]
  );

  const restoreTabSession = useCallback(
    async (id: string) => {
      const session = tabSessions.find((s) => s.id === id);
      if (!session || session.tabs.length === 0) {
        showToast('No tabs found in this session', 'error');
        return;
      }

      const urls = session.tabs.map((t) => t.url);
      if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.create) {
        await chrome.windows.create({ url: urls });
      } else {
        urls.forEach((u) => window.open(u, '_blank'));
      }
      showToast(`Restored ${session.tabCount} tabs from "${session.name}"`, 'success');
    },
    [tabSessions, showToast]
  );

  const deleteTabSession = useCallback(
    async (id: string) => {
      await dbTabSessions.delete(id);
      setTabSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('Tab session removed', 'info');
    },
    [showToast]
  );

  // Browser Toolkit: Toolbox Tools Library
  const toggleToolEnabled = useCallback(
    async (id: string) => {
      const updated = toolboxTools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
      setToolboxTools(updated);
      await dbToolboxTools.saveAll(updated);
      const enabledIds = updated.filter((t) => t.enabled).map((t) => t.id);
      await updateSettings({ enabledToolIds: enabledIds });
    },
    [toolboxTools, updateSettings]
  );

  const toggleToolFavorite = useCallback(
    async (id: string) => {
      const updated = toolboxTools.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
      setToolboxTools(updated);
      await dbToolboxTools.saveAll(updated);
      const favIds = updated.filter((t) => t.isFavorite).map((t) => t.id);
      await updateSettings({ favoriteToolIds: favIds });
    },
    [toolboxTools, updateSettings]
  );

  const updateToolAlias = useCallback(
    async (id: string, alias: string) => {
      const updated = toolboxTools.map((t) => (t.id === id ? { ...t, alias } : t));
      setToolboxTools(updated);
      await dbToolboxTools.saveAll(updated);
    },
    [toolboxTools]
  );

  const updateToolShortcut = useCallback(
    async (id: string, shortcut: string) => {
      const updated = toolboxTools.map((t) => (t.id === id ? { ...t, customShortcut: shortcut } : t));
      setToolboxTools(updated);
      await dbToolboxTools.saveAll(updated);
    },
    [toolboxTools]
  );

  // Browser Toolkit: Quick Action Triggers via Background Service Worker
  const triggerFullPageCapture = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      showToast('Initiating Full Page Capture...', 'info');
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'capture-full-page' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Full Page Capture: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        }
      });
    } else {
      showToast('Full Page Capture is available in Chrome extension mode', 'info');
    }
  }, [showToast]);

  const triggerVisibleCapture = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      showToast('Capturing visible area...', 'info');
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'capture-visible' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Visible Capture: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        }
      });
    } else {
      showToast('Visible Capture is available in Chrome extension mode', 'info');
    }
  }, [showToast]);

  const triggerSelectedAreaCapture = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'capture-selected' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Area Capture: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        }
      });
    } else {
      showToast('Area Capture is available in Chrome extension mode', 'info');
    }
  }, [showToast]);

  const triggerReaderMode = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'reader-mode' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Reader Mode: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        } else {
          showToast('Reader Mode toggled on active webpage', 'success');
        }
      });
    } else {
      showToast('Reader Mode runs on regular web pages in extension mode', 'info');
    }
  }, [showToast]);

  const triggerCloseDuplicateTabs = useCallback(async (): Promise<number> => {
    const count = await closeDuplicateBrowserTabs();
    if (count > 0) {
      showToast(`Closed ${count} duplicate tabs!`, 'success');
    } else {
      showToast('No duplicate tabs found across windows.', 'info');
    }
    return count;
  }, [showToast]);

  const triggerPageAnalysis = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      showToast('Analyzing active page metrics...', 'info');
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'page-tools' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Page Analysis: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res?.success && res.data) {
          setActivePageAnalysis(res.data);
          setActiveModal('pageTools');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        }
      });
    } else {
      setActiveModal('pageTools');
    }
  }, [showToast]);

  const triggerCleanUrl = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'clean-url' }, (res) => {
        if (chrome.runtime.lastError) {
          showToast(`Clean URL: ${chrome.runtime.lastError.message}`, 'error');
        } else if (res?.success && res.cleanUrl) {
          showToast('Clean URL copied to clipboard!', 'success');
        } else if (res && !res.success && res.error) {
          showToast(res.error, 'error');
        }
      });
    }
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        workspaces,
        activeWorkspace,
        setActiveWorkspaceId,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        sections,
        activeSections,
        addSection,
        updateSection,
        deleteSection,
        duplicateSection,
        reorderSections,
        toggleCollapseSection,
        setSectionSortMode,
        bookmarks,
        activeBookmarks,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        duplicateBookmark,
        toggleFavoriteBookmark,
        recordBookmarkClick,
        moveBookmark,
        reorderBookmarksInSection,
        wallpaper,
        updateWallpaperConfig,
        setWallpaperPreset,
        uploadCustomWallpaper,
        settings,
        updateSettings,
        quotes,
        activeQuote,
        addQuote,
        deleteQuote,
        nextRandomQuote,
        notes,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        sessions,
        createSession,
        launchSession,
        deleteSession,
        sidebarOpen,
        setSidebarOpen,
        activeModal,
        openModal,
        closeModal,
        minimalMode,
        toggleMinimalMode,
        zenMode,
        toggleZenMode,
        layoutLocked,
        toggleLayoutLock,
        focusPresetMinutes,
        startFocusWithDuration,
        contextMenu,
        openContextMenu,
        closeContextMenu,
        sectionContextMenu,
        openSectionContextMenu,
        closeSectionContextMenu,
        canvasContextMenu,
        openCanvasContextMenu,
        closeCanvasContextMenu,
        quickAddData,
        openQuickAddBookmark,
        backupPreviewData,
        openBackupPreview,
        confirmImportBackup,
        cancelBackupPreview,
        targetSectionId,
        setTargetSectionId,
        editingBookmark,
        setEditingBookmark,
        editingSection,
        setEditingSection,
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        updateShortcut,
        resetShortcuts,
        setCommandAlias,
        removeCommandAlias,
        completeOnboarding,
        exportDataJson,
        importDataJson,
        resetToDefaultData,
        toasts,
        showToast,
        // Browser Toolkit
        savedPages,
        saveWebPage,
        updateSavedPage,
        deleteSavedPage,
        tabSessions,
        saveTabSession,
        restoreTabSession,
        deleteTabSession,
        toolboxTools,
        toggleToolEnabled,
        toggleToolFavorite,
        updateToolAlias,
        updateToolShortcut,
        activeScreenshot,
        setActiveScreenshot,
        activePageAnalysis,
        setActivePageAnalysis,
        triggerFullPageCapture,
        triggerVisibleCapture,
        triggerSelectedAreaCapture,
        triggerReaderMode,
        triggerCloseDuplicateTabs,
        triggerPageAnalysis,
        triggerCleanUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
