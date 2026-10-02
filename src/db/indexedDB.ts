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
  SavedWebPage,
  TabSession,
  ToolboxTool,
} from '../types';
import {
  DEFAULT_WORKSPACES,
  DEFAULT_SECTIONS,
  DEFAULT_BOOKMARKS,
  DEFAULT_QUOTES,
  DEFAULT_WALLPAPER,
  DEFAULT_SETTINGS,
  DEFAULT_NOTES,
  DEFAULT_TASKS,
  DEFAULT_SESSIONS,
  DEFAULT_SAVED_PAGES,
  DEFAULT_TAB_SESSIONS,
  DEFAULT_TOOLBOX_TOOLS,
} from './initialData';

const DB_NAME = 'MySpaceDB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Workspaces store
      if (!db.objectStoreNames.contains('workspaces')) {
        const wsStore = db.createObjectStore('workspaces', { keyPath: 'id' });
        wsStore.createIndex('order', 'order', { unique: false });
      }

      // Sections store
      if (!db.objectStoreNames.contains('sections')) {
        const secStore = db.createObjectStore('sections', { keyPath: 'id' });
        secStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        secStore.createIndex('order', 'order', { unique: false });
      }

      // Bookmarks store
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bmStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        bmStore.createIndex('sectionId', 'sectionId', { unique: false });
        bmStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        bmStore.createIndex('clickCount', 'clickCount', { unique: false });
        bmStore.createIndex('order', 'order', { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        noteStore.createIndex('isPinned', 'isPinned', { unique: false });
      }

      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('completed', 'completed', { unique: false });
        taskStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Quotes store
      if (!db.objectStoreNames.contains('quotes')) {
        db.createObjectStore('quotes', { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Wallpapers store (for custom uploaded images/blobs)
      if (!db.objectStoreNames.contains('wallpapers')) {
        db.createObjectStore('wallpapers', { keyPath: 'id' });
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }

      // V3 Browser Toolkit: Saved Web Pages / Web Clipper
      if (!db.objectStoreNames.contains('savedPages')) {
        const spStore = db.createObjectStore('savedPages', { keyPath: 'id' });
        spStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        spStore.createIndex('timestamp', 'timestamp', { unique: false });
        spStore.createIndex('url', 'url', { unique: false });
      }

      // V3 Browser Toolkit: Tab Sessions
      if (!db.objectStoreNames.contains('tabSessions')) {
        const tsStore = db.createObjectStore('tabSessions', { keyPath: 'id' });
        tsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // V3 Browser Toolkit: Toolbox Tools
      if (!db.objectStoreNames.contains('toolboxTools')) {
        db.createObjectStore('toolboxTools', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Helper generic for transactions
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    } catch {
      resolve([]);
    }
  });
}

async function putToStore<T>(storeName: string, item: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

async function bulkPutToStore<T>(storeName: string, items: T[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Initialization and seeding
export async function initializeDatabase(): Promise<{
  workspaces: Workspace[];
  sections: Section[];
  bookmarks: Bookmark[];
  notes: Note[];
  tasks: Task[];
  quotes: Quote[];
  settings: AppSettings;
  wallpaper: WallpaperConfig;
  sessions: SessionPreset[];
  savedPages: SavedWebPage[];
  tabSessions: TabSession[];
  toolboxTools: ToolboxTool[];
}> {
  const existingWorkspaces = await getAllFromStore<Workspace>('workspaces');

  if (existingWorkspaces.length === 0) {
    // First run seed
    await bulkPutToStore('workspaces', DEFAULT_WORKSPACES);
    await bulkPutToStore('sections', DEFAULT_SECTIONS);
    await bulkPutToStore('bookmarks', DEFAULT_BOOKMARKS);
    await bulkPutToStore('notes', DEFAULT_NOTES);
    await bulkPutToStore('tasks', DEFAULT_TASKS);
    await bulkPutToStore('quotes', DEFAULT_QUOTES);
    await bulkPutToStore('sessions', DEFAULT_SESSIONS);
    await bulkPutToStore('savedPages', DEFAULT_SAVED_PAGES);
    await bulkPutToStore('tabSessions', DEFAULT_TAB_SESSIONS);
    await bulkPutToStore('toolboxTools', DEFAULT_TOOLBOX_TOOLS);
    await putToStore('settings', { key: 'appSettings', value: DEFAULT_SETTINGS });
    await putToStore('settings', { key: 'wallpaperConfig', value: DEFAULT_WALLPAPER });

    return {
      workspaces: DEFAULT_WORKSPACES,
      sections: DEFAULT_SECTIONS,
      bookmarks: DEFAULT_BOOKMARKS,
      notes: DEFAULT_NOTES,
      tasks: DEFAULT_TASKS,
      quotes: DEFAULT_QUOTES,
      settings: DEFAULT_SETTINGS,
      wallpaper: DEFAULT_WALLPAPER,
      sessions: DEFAULT_SESSIONS,
      savedPages: DEFAULT_SAVED_PAGES,
      tabSessions: DEFAULT_TAB_SESSIONS,
      toolboxTools: DEFAULT_TOOLBOX_TOOLS as ToolboxTool[],
    };
  }

  // Load existing records
  const [
    workspaces,
    sections,
    bookmarks,
    notes,
    tasks,
    quotes,
    settingsEntries,
    loadedSessions,
    loadedSavedPages,
    loadedTabSessions,
    loadedToolboxTools,
  ] = await Promise.all([
    getAllFromStore<Workspace>('workspaces'),
    getAllFromStore<Section>('sections'),
    getAllFromStore<Bookmark>('bookmarks'),
    getAllFromStore<Note>('notes'),
    getAllFromStore<Task>('tasks'),
    getAllFromStore<Quote>('quotes'),
    getAllFromStore<{ key: string; value: any }>('settings'),
    getAllFromStore<SessionPreset>('sessions'),
    getAllFromStore<SavedWebPage>('savedPages'),
    getAllFromStore<TabSession>('tabSessions'),
    getAllFromStore<ToolboxTool>('toolboxTools'),
  ]);

  const settingsEntry = settingsEntries.find((e) => e.key === 'appSettings');
  const wallpaperEntry = settingsEntries.find((e) => e.key === 'wallpaperConfig');

  // Merge loaded settings with default settings to guarantee all V3 keys are populated
  const mergedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(settingsEntry?.value || {}),
    shortcuts: {
      ...DEFAULT_SETTINGS.shortcuts,
      ...(settingsEntry?.value?.shortcuts || {}),
    },
    commandAliases: {
      ...DEFAULT_SETTINGS.commandAliases,
      ...(settingsEntry?.value?.commandAliases || {}),
    },
    enabledToolIds: settingsEntry?.value?.enabledToolIds || DEFAULT_SETTINGS.enabledToolIds,
    favoriteToolIds: settingsEntry?.value?.favoriteToolIds || DEFAULT_SETTINGS.favoriteToolIds,
  };

  const finalSessions = loadedSessions.length > 0 ? loadedSessions : DEFAULT_SESSIONS;
  if (loadedSessions.length === 0) {
    await bulkPutToStore('sessions', DEFAULT_SESSIONS);
  }

  const finalSavedPages = loadedSavedPages.length > 0 ? loadedSavedPages : DEFAULT_SAVED_PAGES;
  if (loadedSavedPages.length === 0) {
    await bulkPutToStore('savedPages', DEFAULT_SAVED_PAGES);
  }

  const finalTabSessions = loadedTabSessions.length > 0 ? loadedTabSessions : DEFAULT_TAB_SESSIONS;
  if (loadedTabSessions.length === 0) {
    await bulkPutToStore('tabSessions', DEFAULT_TAB_SESSIONS);
  }

  const finalToolboxTools = loadedToolboxTools.length > 0 ? loadedToolboxTools : (DEFAULT_TOOLBOX_TOOLS as ToolboxTool[]);
  if (loadedToolboxTools.length === 0) {
    await bulkPutToStore('toolboxTools', DEFAULT_TOOLBOX_TOOLS);
  }

  return {
    workspaces: workspaces.sort((a, b) => a.order - b.order),
    sections: sections.sort((a, b) => a.order - b.order),
    bookmarks: bookmarks.sort((a, b) => a.order - b.order),
    notes: notes.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt),
    tasks: tasks.sort((a, b) => b.createdAt - a.createdAt),
    quotes: quotes.length ? quotes : DEFAULT_QUOTES,
    settings: mergedSettings,
    wallpaper: wallpaperEntry?.value || DEFAULT_WALLPAPER,
    sessions: finalSessions,
    savedPages: finalSavedPages.sort((a, b) => b.timestamp - a.timestamp),
    tabSessions: finalTabSessions.sort((a, b) => b.createdAt - a.createdAt),
    toolboxTools: finalToolboxTools,
  };
}

// Workspaces
export const dbWorkspaces = {
  getAll: () => getAllFromStore<Workspace>('workspaces'),
  save: (workspace: Workspace) => putToStore('workspaces', workspace),
  saveAll: (workspaces: Workspace[]) => bulkPutToStore('workspaces', workspaces),
  delete: (id: string) => deleteFromStore('workspaces', id),
};

// Sections
export const dbSections = {
  getAll: () => getAllFromStore<Section>('sections'),
  save: (section: Section) => putToStore('sections', section),
  saveAll: (sections: Section[]) => bulkPutToStore('sections', sections),
  delete: (id: string) => deleteFromStore('sections', id),
};

// Bookmarks
export const dbBookmarks = {
  getAll: () => getAllFromStore<Bookmark>('bookmarks'),
  save: (bookmark: Bookmark) => putToStore('bookmarks', bookmark),
  saveAll: (bookmarks: Bookmark[]) => bulkPutToStore('bookmarks', bookmarks),
  delete: (id: string) => deleteFromStore('bookmarks', id),
};

// Notes
export const dbNotes = {
  getAll: () => getAllFromStore<Note>('notes'),
  save: (note: Note) => putToStore('notes', note),
  delete: (id: string) => deleteFromStore('notes', id),
};

// Tasks
export const dbTasks = {
  getAll: () => getAllFromStore<Task>('tasks'),
  save: (task: Task) => putToStore('tasks', task),
  delete: (id: string) => deleteFromStore('tasks', id),
};

// Quotes
export const dbQuotes = {
  getAll: () => getAllFromStore<Quote>('quotes'),
  save: (quote: Quote) => putToStore('quotes', quote),
  delete: (id: string) => deleteFromStore('quotes', id),
};

// Sessions
export const dbSessions = {
  getAll: () => getAllFromStore<SessionPreset>('sessions'),
  save: (session: SessionPreset) => putToStore('sessions', session),
  saveAll: (sessions: SessionPreset[]) => bulkPutToStore('sessions', sessions),
  delete: (id: string) => deleteFromStore('sessions', id),
};

// V3 Browser Toolkit: Saved Web Pages / Web Clipper
export const dbSavedPages = {
  getAll: () => getAllFromStore<SavedWebPage>('savedPages'),
  save: (page: SavedWebPage) => putToStore('savedPages', page),
  saveAll: (pages: SavedWebPage[]) => bulkPutToStore('savedPages', pages),
  delete: (id: string) => deleteFromStore('savedPages', id),
};

// V3 Browser Toolkit: Tab Sessions
export const dbTabSessions = {
  getAll: () => getAllFromStore<TabSession>('tabSessions'),
  save: (session: TabSession) => putToStore('tabSessions', session),
  saveAll: (sessions: TabSession[]) => bulkPutToStore('tabSessions', sessions),
  delete: (id: string) => deleteFromStore('tabSessions', id),
};

// V3 Browser Toolkit: Toolbox Tools
export const dbToolboxTools = {
  getAll: () => getAllFromStore<ToolboxTool>('toolboxTools'),
  save: (tool: ToolboxTool) => putToStore('toolboxTools', tool),
  saveAll: (tools: ToolboxTool[]) => bulkPutToStore('toolboxTools', tools),
};

// Settings & Wallpaper
export const dbSettings = {
  getSettings: async (): Promise<AppSettings> => {
    const list = await getAllFromStore<{ key: string; value: AppSettings }>('settings');
    const entry = list.find((e) => e.key === 'appSettings');
    return {
      ...DEFAULT_SETTINGS,
      ...(entry?.value || {}),
      shortcuts: {
        ...DEFAULT_SETTINGS.shortcuts,
        ...(entry?.value?.shortcuts || {}),
      },
      commandAliases: {
        ...DEFAULT_SETTINGS.commandAliases,
        ...(entry?.value?.commandAliases || {}),
      },
    };
  },
  saveSettings: (settings: AppSettings) => putToStore('settings', { key: 'appSettings', value: settings }),
  getWallpaper: async (): Promise<WallpaperConfig> => {
    const list = await getAllFromStore<{ key: string; value: WallpaperConfig }>('settings');
    const entry = list.find((e) => e.key === 'wallpaperConfig');
    return entry?.value || DEFAULT_WALLPAPER;
  },
  saveWallpaper: (wallpaper: WallpaperConfig) => putToStore('settings', { key: 'wallpaperConfig', value: wallpaper }),
};

// Custom Wallpapers Blob Storage
export const dbCustomWallpapers = {
  save: (id: string, dataUrl: string) => putToStore('wallpapers', { id, dataUrl, createdAt: Date.now() }),
  get: async (id: string): Promise<string | null> => {
    const db = await getDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('wallpapers', 'readonly');
        const req = tx.objectStore('wallpapers').get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },
};

// Export all data as JSON
export async function exportAllData(): Promise<string> {
  const [workspaces, sections, bookmarks, notes, tasks, quotes, settings, wallpaper, sessions, savedPages, tabSessions] = await Promise.all([
    getAllFromStore('workspaces'),
    getAllFromStore('sections'),
    getAllFromStore('bookmarks'),
    getAllFromStore('notes'),
    getAllFromStore('tasks'),
    getAllFromStore('quotes'),
    dbSettings.getSettings(),
    dbSettings.getWallpaper(),
    getAllFromStore('sessions'),
    getAllFromStore('savedPages'),
    getAllFromStore('tabSessions'),
  ]);

  const payload = {
    version: '3.0.0',
    exportDate: new Date().toISOString(),
    data: {
      workspaces,
      sections,
      bookmarks,
      notes,
      tasks,
      quotes,
      settings,
      wallpaper,
      sessions,
      savedPages,
      tabSessions,
    },
  };

  return JSON.stringify(payload, null, 2);
}

// Import data from JSON
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;

    if (Array.isArray(data.workspaces)) await bulkPutToStore('workspaces', data.workspaces);
    if (Array.isArray(data.sections)) await bulkPutToStore('sections', data.sections);
    if (Array.isArray(data.bookmarks)) await bulkPutToStore('bookmarks', data.bookmarks);
    if (Array.isArray(data.notes)) await bulkPutToStore('notes', data.notes);
    if (Array.isArray(data.tasks)) await bulkPutToStore('tasks', data.tasks);
    if (Array.isArray(data.quotes)) await bulkPutToStore('quotes', data.quotes);
    if (Array.isArray(data.sessions)) await bulkPutToStore('sessions', data.sessions);
    if (Array.isArray(data.savedPages)) await bulkPutToStore('savedPages', data.savedPages);
    if (Array.isArray(data.tabSessions)) await bulkPutToStore('tabSessions', data.tabSessions);
    if (data.settings) await dbSettings.saveSettings(data.settings);
    if (data.wallpaper) await dbSettings.saveWallpaper(data.wallpaper);

    return true;
  } catch (err) {
    console.error('Failed to import data:', err);
    return false;
  }
}

