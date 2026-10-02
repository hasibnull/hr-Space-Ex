import React, { useState, useMemo } from 'react';
import {
  X,
  Palette,
  Image,
  Layout,
  Bookmark,
  Layers,
  Sliders,
  Clock,
  CloudSun,
  Search,
  RotateCcw,
  Download,
  Upload,
  Keyboard,
  Shield,
  Zap,
  FileText,
  CheckSquare,
  Flame,
  Wrench,
  Star,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SearchEngine,
  WeatherUnit,
  CardRadius,
  UIDensity,
  PageLayoutMode,
  ControlsVisibility,
  WallpaperRotation,
  CustomShortcuts,
  ThemePreset,
} from '../../types';
import { DEFAULT_SHORTCUTS } from '../../db/initialData';

type SettingsCategory =
  | 'appearance'
  | 'wallpaper'
  | 'layout'
  | 'toolbox'
  | 'bookmarks'
  | 'sections'
  | 'workspaces'
  | 'shortcuts'
  | 'search'
  | 'weather'
  | 'clock'
  | 'focus'
  | 'notes'
  | 'tasks'
  | 'privacy'
  | 'performance'
  | 'data'
  | 'advanced';

const CATEGORIES: Array<{ id: SettingsCategory; label: string; icon: any; keywords: string[] }> = [
  { id: 'appearance', label: 'Appearance', icon: Palette, keywords: ['theme', 'accent', 'glass', 'blur', 'dark mode', 'radius', 'density', 'color', 'opacity'] },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image, keywords: ['wallpaper', 'background', 'photo', 'rotation', 'brightness', 'contrast', 'saturation', 'vignette'] },
  { id: 'layout', label: 'Layout', icon: Layout, keywords: ['layout', 'compact', 'balanced', 'spacious', 'freeform', 'lock layout', 'density', 'spacing'] },
  { id: 'toolbox', label: 'Browser Toolbox', icon: Wrench, keywords: ['toolbox', 'tools', 'screenshot', 'clipper', 'reader', 'eyedropper', 'ruler', 'qr', 'tabs', 'aliases'] },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, keywords: ['bookmark', 'links', 'new tab', 'sort', 'click count', 'favicons'] },
  { id: 'sections', label: 'Sections', icon: Layers, keywords: ['section', 'categories', 'collapse', 'folder', 'reorder'] },
  { id: 'workspaces', label: 'Workspaces', icon: Layers, keywords: ['workspace', 'profile', 'switch', 'personal', 'work'] },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, keywords: ['shortcut', 'keyboard', 'hotkey', 'ctrl+k', 'binding', 'key'] },
  { id: 'search', label: 'Search', icon: Search, keywords: ['search engine', 'google', 'duckduckgo', 'bing', 'brave', 'ecosia', 'voice'] },
  { id: 'weather', label: 'Weather', icon: CloudSun, keywords: ['weather', 'temperature', 'celsius', 'fahrenheit', 'city', 'location'] },
  { id: 'clock', label: 'Clock', icon: Clock, keywords: ['clock', 'time', '12h', '24h', 'seconds', 'format'] },
  { id: 'focus', label: 'Focus Mode', icon: Flame, keywords: ['focus', 'pomodoro', 'timer', 'deep work', 'sound'] },
  { id: 'notes', label: 'Notes', icon: FileText, keywords: ['notes', 'markdown', 'memo', 'scratchpad'] },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, keywords: ['task', 'todo', 'priority', 'checklist', 'due date'] },
  { id: 'privacy', label: 'Privacy', icon: Shield, keywords: ['privacy', 'local', 'data', 'telemetry', 'offline', 'security'] },
  { id: 'performance', label: 'Performance', icon: Zap, keywords: ['performance', 'speed', 'reduce motion', 'animation', 'hardware acceleration', 'cache'] },
  { id: 'data', label: 'Data & Backup', icon: Download, keywords: ['export', 'import', 'backup', 'json', 'restore', 'save'] },
  { id: 'advanced', label: 'Advanced', icon: Sliders, keywords: ['reset', 'danger zone', 'defaults', 'chrome bookmarks'] },
];

const THEME_PRESETS: Array<{ id: ThemePreset; name: string; color: string; desc: string }> = [
  { id: 'midnight', name: 'Midnight', color: '#8b5cf6', desc: 'Dark cinematic glass' },
  { id: 'aurora', name: 'Aurora', color: '#10b981', desc: 'Emerald northern glow' },
  { id: 'sunset', name: 'Sunset', color: '#f59e0b', desc: 'Warm dusk twilight' },
  { id: 'cyber', name: 'Cyber', color: '#06b6d4', desc: 'High-tech neon cyan' },
  { id: 'minimal', name: 'Minimal', color: '#94a3b8', desc: 'Pure subtle grayscale' },
  { id: 'forest', name: 'Forest', color: '#14b8a6', desc: 'Deep evergreen moss' },
  { id: 'monochrome', name: 'Monochrome', color: '#e2e8f0', desc: 'Architectural studio black/white' },
  { id: 'pureblack', name: 'Pure Black', color: '#38bdf8', desc: 'OLED absolute dark' },
];

const ACCENT_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#6366f1'];

export const CustomizePanel: React.FC = () => {
  const {
    activeModal,
    closeModal,
    settings,
    updateSettings,
    wallpaper,
    updateWallpaperConfig,
    resetToDefaultData,
    openModal,
    exportDataJson,
    importDataJson,
    updateShortcut,
    resetShortcuts,
    showToast,
    toolboxTools,
    toggleToolEnabled,
    toggleToolFavorite,
    updateToolAlias,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [toolboxCategory, setToolboxCategory] = useState<string>('all');
  const [editingShortcutAction, setEditingShortcutAction] = useState<keyof CustomShortcuts | null>(null);
  const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
  const [tempAlias, setTempAlias] = useState('');

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.includes(q))
    );
  }, [searchQuery]);

  if (activeModal !== 'customize') return null;

  const handleSelectCategory = (catId: SettingsCategory) => {
    setActiveCategory(catId);
  };

  const handleKeyDownRecording = async (e: React.KeyboardEvent, action: keyof CustomShortcuts) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingShortcutAction(null);
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');

    const keyName = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(keyName)) {
      parts.push(keyName);
      const combo = parts.join('+');
      const ok = await updateShortcut(action, combo);
      if (ok) {
        setEditingShortcutAction(null);
      }
    }
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all bookmarks, sections, and settings to factory defaults?')) {
      await resetToDefaultData();
      closeModal();
    }
  };

  const handleExportJson = async () => {
    try {
      const json = await exportDataJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Full backup downloaded!', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[640px] glass-panel rounded-3xl border border-white/20 shadow-glass-lg animate-scale-in flex flex-col overflow-hidden"
      >
        {/* Header with Settings Search */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">System Settings</h2>
              <p className="text-xs text-white/50">Personalize your MySpace productivity OS</p>
            </div>
          </div>

          {/* Live Settings Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search settings (e.g. blur, clock, shortcuts)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const q = e.target.value.toLowerCase().trim();
                if (q) {
                  const matched = CATEGORIES.find(
                    (cat) => cat.label.toLowerCase().includes(q) || cat.keywords.some((k) => k.includes(q))
                  );
                  if (matched) setActiveCategory(matched.id);
                }
              }}
              className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Layout: Sidebar Categories + Active Category Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-52 border-r border-white/10 p-2.5 overflow-y-auto space-y-0.5 shrink-0 bg-black/10">
            {filteredCategories.length === 0 ? (
              <div className="p-3 text-xs text-white/40 text-center">No categories found</div>
            ) : (
              filteredCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-300' : 'text-white/50'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Settings Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 1. APPEARANCE */}
            {activeCategory === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Theme Presets</h3>
                  <p className="text-xs text-white/50 mb-3">Curated color palettes and atmospheric tones</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {THEME_PRESETS.map((t) => {
                      const isSelected = settings.themePreset === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            updateSettings({ themePreset: t.id, accentColor: t.color });
                            showToast(`Applied theme: ${t.name}`, 'success');
                          }}
                          className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-purple-600/25 border-purple-400 shadow-glow-violet scale-[1.02]'
                              : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                            <span className="text-xs font-semibold text-white">{t.name}</span>
                          </div>
                          <p className="text-[10px] text-white/50">{t.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-2">Accent Color</label>
                  <div className="flex items-center gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateSettings({ accentColor: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          settings.accentColor === c ? 'scale-125 ring-2 ring-white/80' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateSettings({ accentColor: e.target.value })}
                      className="w-7 h-7 rounded-lg bg-transparent cursor-pointer ml-2"
                      title="Custom Hex Picker"
                    />
                  </div>
                </div>

                {/* Glass Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Glass Opacity</span>
                      <span className="font-mono">{settings.glassOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={settings.glassOpacity}
                      onChange={(e) => updateSettings({ glassOpacity: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Backdrop Blur</span>
                      <span className="font-mono">{settings.blurStrength}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="32"
                      value={settings.blurStrength}
                      onChange={(e) => updateSettings({ blurStrength: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>

                {/* Card Radius & UI Density */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Card Radius</label>
                    <select
                      value={settings.cardRadius}
                      onChange={(e) => updateSettings({ cardRadius: e.target.value as CardRadius })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
                    >
                      <option value="sm">Small (Rounded)</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large (Default)</option>
                      <option value="2xl">2X Large (Smooth Bubble)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">UI Density</label>
                    <select
                      value={settings.uiDensity}
                      onChange={(e) => updateSettings({ uiDensity: e.target.value as UIDensity })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
                    >
                      <option value="compact">Compact (More items visible)</option>
                      <option value="normal">Normal (Balanced)</option>
                      <option value="relaxed">Relaxed (Spacious)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. WALLPAPER */}
            {activeCategory === 'wallpaper' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Wallpaper Engine</h3>
                    <p className="text-xs text-white/50">Tune visual background and auto-rotation</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('wallpaper');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                  >
                    Open Gallery
                  </button>
                </div>

                {/* Rotation Schedule */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <label className="block text-xs font-semibold text-white">Wallpaper Rotation Schedule</label>
                  <select
                    value={settings.wallpaperRotation || 'disabled'}
                    onChange={(e) => updateSettings({ wallpaperRotation: e.target.value as WallpaperRotation })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
                  >
                    <option value="disabled">Disabled (Keep current wallpaper)</option>
                    <option value="new-tab">Random on every New Tab</option>
                    <option value="hourly">Random every hour</option>
                    <option value="daily">Random every day</option>
                  </select>
                </div>

                {/* Sliders: Brightness, Contrast, Saturation, Vignette */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono">{wallpaper.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={wallpaper.brightness}
                      onChange={(e) => updateWallpaperConfig({ brightness: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Contrast</span>
                      <span className="font-mono">{wallpaper.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={wallpaper.contrast}
                      onChange={(e) => updateWallpaperConfig({ contrast: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Saturation</span>
                      <span className="font-mono">{wallpaper.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={wallpaper.saturation}
                      onChange={(e) => updateWallpaperConfig({ saturation: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Vignette Darkness</span>
                      <span className="font-mono">{wallpaper.vignette}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={wallpaper.vignette}
                      onChange={(e) => updateWallpaperConfig({ vignette: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. LAYOUT */}
            {activeCategory === 'layout' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Dashboard Layout Mode</h3>
                  <p className="text-xs text-white/50 mb-3">Select section arrangement density</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['compact', 'balanced', 'spacious', 'freeform'] as PageLayoutMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSettings({ layoutMode: mode })}
                        className={`p-3 rounded-2xl border text-left capitalize transition-all ${
                          (settings.layoutMode || 'balanced') === mode
                            ? 'bg-purple-600/25 border-purple-400 text-white shadow-glow-violet'
                            : 'bg-white/[0.03] border-white/5 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-semibold">{mode}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lock Layout */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Lock Layout</p>
                    <p className="text-[11px] text-white/50">Prevent accidental drag and drop repositioning of sections</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.layoutLocked}
                    onChange={(e) => updateSettings({ layoutLocked: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                {/* Auto-Hide Controls */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Navigation Controls Visibility</label>
                  <select
                    value={settings.controlsVisibility || 'always'}
                    onChange={(e) => updateSettings({ controlsVisibility: e.target.value as ControlsVisibility })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
                  >
                    <option value="always">Always Visible</option>
                    <option value="auto-hide">Auto Hide (Fades out when mouse is inactive)</option>
                    <option value="hidden">Hidden by Default (Clean peaceful canvas)</option>
                  </select>
                </div>

                {/* Show Quick Action Button */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Floating Quick Action Trigger</p>
                    <p className="text-[11px] text-white/50">Show floating shortcut button at the bottom-right</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showQuickActionBtn}
                    onChange={(e) => updateSettings({ showQuickActionBtn: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>
              </div>
            )}

            {/* 3.5. TOOLBOX */}
            {activeCategory === 'toolbox' && (
              <div className="space-y-5 animate-fade-in">
                {/* Header Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/10 border border-purple-500/20">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-purple-400" />
                      Personal Browser Toolbox
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Enable, disable, or personalize custom triggers for every browser tool.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium">
                      {toolboxTools.filter((t) => t.enabled).length} / {toolboxTools.length} Active
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {toolboxTools.filter((t) => t.isFavorite).length}
                    </span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['all', 'Capture', 'Research', 'Reading', 'Design', 'Tabs', 'Productivity', 'Utilities'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setToolboxCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                        toolboxCategory === cat
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat === 'all' ? 'All Tools' : cat}
                    </button>
                  ))}
                </div>

                {/* Tool Cards */}
                <div className="space-y-2.5">
                  {toolboxTools
                    .filter((t) => {
                      if (toolboxCategory !== 'all' && t.category !== toolboxCategory) return false;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        return (
                          t.name.toLowerCase().includes(q) ||
                          t.description.toLowerCase().includes(q) ||
                          (t.alias && t.alias.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    })
                    .map((tool) => {
                      const isEditingAlias = editingAliasId === tool.id;

                      const categoryColors: Record<string, string> = {
                        Capture: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                        Research: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                        Reading: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                        Design: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
                        Tabs: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                        Productivity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                        Utilities: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                      };

                      return (
                        <div
                          key={tool.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            tool.enabled
                              ? 'bg-white/[0.04] border-white/10 hover:border-white/20'
                              : 'bg-white/[0.01] border-white/5 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleToolFavorite(tool.id)}
                                title={tool.isFavorite ? 'Remove favorite' : 'Set as favorite'}
                                className="mt-0.5 text-white/40 hover:text-amber-400 transition-colors"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    tool.isFavorite
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'hover:text-amber-400'
                                  }`}
                                />
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {tool.name}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                      categoryColors[tool.category] || 'bg-white/10 text-white/60 border-white/10'
                                    }`}
                                  >
                                    {tool.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">
                                  {tool.description}
                                </p>

                                {/* Triggers & Custom Alias */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {/* Shortcut */}
                                  {(tool.customShortcut || tool.defaultShortcut) && (
                                    <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-purple-300">
                                      {tool.customShortcut || tool.defaultShortcut}
                                    </span>
                                  )}

                                  {/* Alias editor */}
                                  <div className="flex items-center gap-1 text-[11px] text-white/40">
                                    <span>⌘K alias:</span>
                                    {isEditingAlias ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={tempAlias}
                                          onChange={(e) => setTempAlias(e.target.value.toLowerCase().trim())}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              updateToolAlias(tool.id, tempAlias);
                                              setEditingAliasId(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingAliasId(null);
                                            }
                                          }}
                                          autoFocus
                                          placeholder="e.g. fps"
                                          className="w-20 px-1.5 py-0.5 rounded bg-black/60 border border-purple-500 text-white text-[11px] font-mono focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateToolAlias(tool.id, tempAlias);
                                            setEditingAliasId(null);
                                          }}
                                          className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px]"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingAliasId(tool.id);
                                          setTempAlias(tool.alias || '');
                                        }}
                                        title="Click to edit Command Center alias"
                                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/80 hover:text-white transition-colors"
                                      >
                                        {tool.alias ? `>${tool.alias}` : '+ set alias'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Enable Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={tool.enabled}
                                onChange={() => toggleToolEnabled(tool.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Privacy & Permissions Card */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-white">Privacy & Chrome Permissions Transparency</h4>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    MySpace is built strictly on a <strong className="text-white">local-first philosophy</strong>. No screenshots, notes, clips, bookmarks, or browsing history are ever transmitted to external servers. All operations happen directly in your browser.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-white/60">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-purple-300 font-semibold block mb-0.5">activeTab & scripting</span>
                      Executes full-page scroll capture, in-page reader mode typography, and DOM structure analysis on the active tab only when invoked.
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-purple-300 font-semibold block mb-0.5">sidePanel</span>
                      Provides instant persistent tools drawer side-by-side with your browsing without interrupting workflow.
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-purple-300 font-semibold block mb-0.5">tabs</span>
                      Enables cross-window tab search, 1-click duplicate tab cleaner, and tab session save/restore.
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-purple-300 font-semibold block mb-0.5">contextMenus & downloads</span>
                      Adds a single organized "MySpace" context menu and downloads stitched full-page screenshots locally.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BOOKMARKS */}
            {activeCategory === 'bookmarks' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Bookmarks Behavior</h3>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Open in New Tab</p>
                    <p className="text-[11px] text-white/50">Launch clicked bookmark in a new browser tab</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.openBookmarksInNewTab}
                    onChange={(e) => updateSettings({ openBookmarksInNewTab: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Show Bookmark Descriptions</p>
                    <p className="text-[11px] text-white/50">Display secondary subtitles inside bookmark cards (disable for ultra-minimal look)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showBookmarkDescriptions ?? false}
                    onChange={(e) => updateSettings({ showBookmarkDescriptions: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('bookmarksManager');
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Manage All Bookmarks
                  </button>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('chromeImport');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-all"
                  >
                    Import Chrome Bookmarks
                  </button>
                </div>
              </div>
            )}

            {/* 5. SECTIONS */}
            {activeCategory === 'sections' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Section Management</h3>
                    <p className="text-xs text-white/50">Organize and structure bookmark categories</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('addSection');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    + Add Section
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Tip: You can right-click any section card on the homepage to instantly rename, change layout, duplicate, or reorder it.
                </p>
              </div>
            )}

            {/* 6. WORKSPACES */}
            {activeCategory === 'workspaces' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Workspace Profiles</h3>
                    <p className="text-xs text-white/50">Separate environments for Work, Study, and Personal life</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('workspaces');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Manage Workspaces
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-purple-300">⌘⇧W</kbd> anytime to switch workspaces instantly.
                </p>
              </div>
            )}

            {/* 7. SHORTCUTS */}
            {activeCategory === 'shortcuts' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
                    <p className="text-xs text-white/50">Customize every command keybinding</p>
                  </div>
                  <button
                    onClick={resetShortcuts}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(settings.shortcuts || DEFAULT_SHORTCUTS).map(([act, combo]) => {
                    const isRecording = editingShortcutAction === act;
                    return (
                      <div
                        key={act}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white capitalize">
                            {act.replace(/([A-Z])/g, ' $1')}
                          </p>
                        </div>

                        {isRecording ? (
                          <div
                            onKeyDown={(e) => handleKeyDownRecording(e, act as keyof CustomShortcuts)}
                            tabIndex={0}
                            autoFocus
                            className="px-3 py-1 bg-purple-600/40 border border-purple-400 text-white text-xs rounded-lg animate-pulse outline-none"
                          >
                            Press key combination (Esc to cancel)...
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingShortcutAction(act as keyof CustomShortcuts)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/90 font-mono text-xs rounded-lg border border-white/10 transition-colors"
                            title="Click to rebind"
                          >
                            {combo}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. SEARCH */}
            {activeCategory === 'search' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Search Preferences</h3>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Default Search Engine</label>
                  <select
                    value={settings.searchEngine}
                    onChange={(e) => updateSettings({ searchEngine: e.target.value as SearchEngine })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none capitalize"
                  >
                    <option value="google">Google</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="bing">Bing</option>
                    <option value="brave">Brave Search</option>
                    <option value="ecosia">Ecosia</option>
                  </select>
                </div>
              </div>
            )}

            {/* 9. WEATHER */}
            {activeCategory === 'weather' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Weather Widget</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ weatherLocationMode: 'auto' })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      settings.weatherLocationMode === 'auto'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    Auto Geolocation
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ weatherLocationMode: 'manual' })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      settings.weatherLocationMode === 'manual'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    Manual City
                  </button>
                </div>

                {settings.weatherLocationMode === 'manual' && (
                  <input
                    type="text"
                    placeholder="Enter city (e.g. London, Tokyo, New York)"
                    value={settings.manualCity}
                    onChange={(e) => updateSettings({ manualCity: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                )}

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Temperature Unit</label>
                  <select
                    value={settings.weatherUnit}
                    onChange={(e) => updateSettings({ weatherUnit: e.target.value as WeatherUnit })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
                  >
                    <option value="c">Celsius (°C)</option>
                    <option value="f">Fahrenheit (°F)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 10. CLOCK */}
            {activeCategory === 'clock' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Time & Date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ clockFormat: '12h' })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      settings.clockFormat === '12h'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    12-Hour Format (AM/PM)
                  </button>
                  <button
                    onClick={() => updateSettings({ clockFormat: '24h' })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      settings.clockFormat === '24h'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    24-Hour Military Format
                  </button>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Show Live Seconds</p>
                    <p className="text-[11px] text-white/50">Display second counter in header clock</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showClockSeconds}
                    onChange={(e) => updateSettings({ showClockSeconds: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>
              </div>
            )}

            {/* 11. FOCUS */}
            {activeCategory === 'focus' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Focus Mode (Pomodoro)</h3>
                    <p className="text-xs text-white/50">Full-screen timer and objective distraction blocker</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('focus');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Launch Focus
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Tip: Type <code className="text-purple-300">focus 25</code> in the Command Center (⌘K) to start a 25-minute session immediately.
                </p>
              </div>
            )}

            {/* 12. NOTES */}
            {activeCategory === 'notes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Quick Notes</h3>
                    <p className="text-xs text-white/50">Markdown memo storage and scratchpad</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('notes');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Open Notes Panel
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Use <code className="text-purple-300">n:query</code> in Command Center to search your notes instantly.
                </p>
              </div>
            )}

            {/* 13. TASKS */}
            {activeCategory === 'tasks' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Task Checklist</h3>
                    <p className="text-xs text-white/50">Priority action items and daily objectives</p>
                  </div>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('todo');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Open To-Do Panel
                  </button>
                </div>
                <p className="text-xs text-white/60">
                  Type <code className="text-purple-300">task Finish presentation</code> in Command Center to add a task in 2 seconds.
                </p>
              </div>
            )}

            {/* 14. PRIVACY */}
            {activeCategory === 'privacy' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Local-First Architecture</h3>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Zero Tracking & 100% Local Storage</span>
                  </p>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    MySpace never communicates with external tracking servers. All bookmarks, notes, tasks, custom wallpapers, and preferences are stored exclusively on your device using browser IndexedDB and Chrome storage APIs.
                  </p>
                </div>
              </div>
            )}

            {/* 15. PERFORMANCE */}
            {activeCategory === 'performance' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Speed & Animation Tuning</h3>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Reduce Motion</p>
                    <p className="text-[11px] text-white/50">Disable micro-animations for maximum performance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>
              </div>
            )}

            {/* 16. DATA */}
            {activeCategory === 'data' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Backup & Restore</h3>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <p className="text-xs text-white/70">
                    Export your complete MySpace database (bookmarks, sections, notes, tasks, settings, sessions) into a portable JSON backup file.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Backup (JSON)</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import Backup (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const content = event.target?.result as string;
                              if (content) importDataJson(content);
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 17. ADVANCED */}
            {activeCategory === 'advanced' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-semibold text-white">Advanced & Danger Zone</h3>

                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <h4 className="text-xs font-semibold text-red-400">Factory Reset</h4>
                  <p className="text-[11px] text-white/50">
                    Revert all bookmarks, custom wallpapers, notes, tasks, and settings back to initial factory demo state.
                  </p>
                  <button
                    onClick={handleResetData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-all mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Data to Defaults</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 shrink-0 bg-black/20 text-xs">
          <span className="text-white/40">MySpace V3 • Maximum functionality. Minimum visible UI.</span>
          <button
            onClick={closeModal}
            className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-glow-violet transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
