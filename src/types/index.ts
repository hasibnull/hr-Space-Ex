export type SectionLayout = 'grid' | 'compact' | 'large' | 'list' | 'minimal';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ClockFormat = '12h' | '24h';
export type WeatherUnit = 'c' | 'f';
export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'brave' | 'ecosia';
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type UIDensity = 'compact' | 'normal' | 'relaxed';
export type AnimationIntensity = 'minimal' | 'smooth' | 'rich';
export type PageLayoutMode = 'compact' | 'balanced' | 'spacious' | 'freeform';
export type ControlsVisibility = 'always' | 'auto-hide' | 'hidden';
export type WallpaperRotation = 'disabled' | 'new-tab' | 'hourly' | 'daily';
export type BookmarkSortMode = 'manual' | 'alpha' | 'most-used' | 'recently-added' | 'recently-used';
export type ThemePreset = 'midnight' | 'aurora' | 'sunset' | 'cyber' | 'minimal' | 'forest' | 'monochrome' | 'pureblack';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  order: number;
  isDefault: boolean;
  createdAt: number;
  wallpaperConfig?: Partial<WallpaperConfig>;
  themePreset?: ThemePreset;
  accentColor?: string;
  layoutMode?: PageLayoutMode;
}

export interface Section {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  layout: SectionLayout;
  isCollapsed?: boolean;
  order: number;
  createdAt: number;
  sortMode?: BookmarkSortMode;
}

export interface Bookmark {
  id: string;
  workspaceId: string;
  sectionId: string;
  title: string;
  url: string;
  favicon?: string;
  description?: string;
  color?: string;
  isFavorite: boolean;
  clickCount: number;
  order: number;
  createdAt: number;
  lastUsedAt: number;
  tags?: string[];
  pinned?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  color?: string;
  updatedAt: number;
  createdAt: number;
  tags?: string[];
  isArchived?: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: number;
  category?: string;
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  isCustom?: boolean;
}

export interface WallpaperConfig {
  type: 'preset' | 'upload' | 'url' | 'gradient';
  presetId: string;
  url?: string;
  dataUrl?: string;
  brightness: number; // 0 - 150 (100 is default)
  blur: number; // 0 - 25px
  contrast: number; // 50 - 150
  saturation: number; // 0 - 200
  overlayOpacity: number; // 0 - 90
  vignette: number; // 0 - 100
  fit: 'cover' | 'contain';
}

export interface CustomShortcuts {
  commandPalette: string;      // default: 'ctrl+k' / 'meta+k'
  quickBookmark: string;       // default: 'ctrl+shift+k' / 'meta+shift+k'
  bookmarks: string;           // default: 'ctrl+b' / 'meta+b'
  bookmarkSearch: string;      // default: 'ctrl+shift+b' / 'meta+shift+b'
  newBookmark: string;         // default: 'ctrl+n' / 'meta+n'
  newNote: string;             // default: 'ctrl+shift+n' / 'meta+shift+n'
  newTask: string;             // default: 'ctrl+shift+t' / 'meta+shift+t'
  focusMode: string;           // default: 'ctrl+alt+f' / 'meta+alt+f'
  workspaceSwitcher: string;   // default: 'ctrl+shift+w' / 'meta+shift+w'
  settings: string;            // default: 'ctrl+alt+s' / 'meta+alt+s'
  wallpaper: string;           // default: 'ctrl+alt+p' / 'meta+alt+p'
  minimalMode: string;         // default: 'ctrl+shift+m' / 'meta+shift+m'
  zenMode: string;             // default: 'ctrl+shift+z' / 'meta+shift+z'
  // Browser Toolkit Shortcuts
  fullPageScreenshot: string;  // default: 'ctrl+shift+f' / 'meta+shift+f'
  savePage: string;            // default: 'ctrl+shift+s' / 'meta+shift+s'
  readerMode: string;          // default: 'ctrl+shift+r' / 'meta+shift+r'
  sidePanel: string;           // default: 'ctrl+shift+p' / 'meta+shift+p'
  tabManager: string;          // default: 'ctrl+shift+t' / 'meta+shift+t'
  pageTools: string;           // default: 'ctrl+shift+i' / 'meta+shift+i'
}

export interface SessionPreset {
  id: string;
  name: string;
  workspaceId: string;
  focusDurationMinutes?: number;
  layoutMode?: PageLayoutMode;
  notesSummary?: string;
  createdAt: number;
}

export interface AppSettings {
  activeWorkspaceId: string;
  searchEngine: SearchEngine;
  openBookmarksInNewTab: boolean;
  clockFormat: ClockFormat;
  showClockSeconds: boolean;
  weatherUnit: WeatherUnit;
  weatherLocationMode: 'auto' | 'manual';
  manualCity: string;
  manualLat?: number;
  manualLon?: number;
  quoteEnabled: boolean;
  activeQuoteId?: string;
  themePreset: ThemePreset;
  accentColor: string;
  glassOpacity: number;
  blurStrength: number;
  cardRadius: CardRadius;
  uiDensity: UIDensity;
  animationIntensity: AnimationIntensity;
  isDarkMode: boolean;
  defaultSectionLayout: SectionLayout;
  // V3 Additions
  minimalMode: boolean;
  zenMode: boolean;
  layoutMode: PageLayoutMode;
  layoutLocked: boolean;
  controlsVisibility: ControlsVisibility;
  showQuickActionBtn: boolean;
  reduceMotion: boolean;
  wallpaperRotation: WallpaperRotation;
  lastRotationTime?: number;
  commandAliases: Record<string, string>;
  shortcuts: CustomShortcuts;
  onboardingCompleted: boolean;
  showCmdKHint: boolean;
  showBookmarkDescriptions?: boolean;
  // Browser Toolkit Settings
  enabledToolIds: string[];
  favoriteToolIds: string[];
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  weatherCode: number;
  iconName: string;
  windSpeed: number;
  humidity: number;
  high?: number;
  low?: number;
  lastUpdated: number;
}

export interface ChromeBookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: ChromeBookmarkNode[];
  dateAdded?: number;
}

// ==========================================
// MYSPACE BROWSER TOOLKIT TYPES
// ==========================================

export type ToolCategory =
  | 'Capture'
  | 'Research'
  | 'Reading'
  | 'Design'
  | 'Tabs'
  | 'Productivity'
  | 'Utilities';

export interface ToolboxTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  defaultShortcut?: string;
  customShortcut?: string;
  alias?: string;
  enabled: boolean;
  isFavorite: boolean;
}

export interface SavedWebPage {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  timestamp: number;
  screenshot?: string;
  selectedText?: string;
  content?: string;
  tags: string[];
  workspaceId: string;
  sectionId?: string;
  notes?: string;
}

export interface TabSessionItem {
  title: string;
  url: string;
  favIconUrl?: string;
  pinned?: boolean;
}

export interface TabSession {
  id: string;
  name: string;
  tabCount: number;
  tabs: TabSessionItem[];
  createdAt: number;
  workspaceId?: string;
}

export interface HeadingItem {
  level: number;
  text: string;
}

export interface PageAnalysis {
  title: string;
  url: string;
  domain: string;
  protocol?: string;
  wordCount: number;
  charCount: number;
  estimatedReadingTimeMinutes: number;
  headings: HeadingItem[];
  headingCounts: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesWithoutAlt: number;
  description?: string;
  canonicalUrl?: string;
  lang?: string;
  favicon?: string;
  extractedLinks?: ExtractedLink[];
}

export interface ExtractedLink {
  text: string;
  url: string;
  isExternal: boolean;
  domain: string;
}

export type ScreenshotMode = 'full' | 'visible' | 'selected' | 'element';

export interface ScreenshotData {
  dataUrl: string;
  width: number;
  height: number;
  sourceUrl: string;
  pageTitle: string;
  timestamp: number;
  mode: ScreenshotMode;
}

