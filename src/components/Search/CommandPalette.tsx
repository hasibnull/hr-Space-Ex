import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Bookmark as BookmarkIcon,
  Folder,
  FileText,
  CheckSquare,
  ArrowRight,
  ExternalLink,
  Flame,
  X,
  Layers,
  Settings,
  Image,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Compass,
  Zap,
  Camera,
  Maximize,
  Crop,
  BookOpen,
  BarChart2,
  Link2,
  Pipette,
  Ruler,
  Inspect,
  Smartphone,
  QrCode,
  Sidebar,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openDestinationUrl } from '../../utils/chromeApi';
import { isLikelyUrl, buildSearchUrl } from '../../utils/formatters';
import { cleanUrl } from '../../utils/browserTools';

interface CommandItem {
  id: string;
  category: 'Commands' | 'Bookmarks' | 'Sections' | 'Notes' | 'Tasks' | 'Workspaces' | 'System' | 'Web Search';
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
}

const RECENT_COMMANDS_KEY = 'myspace_recent_commands_v3';

export const CommandPalette: React.FC = () => {
  const {
    activeModal,
    closeModal,
    bookmarks,
    sections,
    notes,
    tasks,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    openModal,
    recordBookmarkClick,
    settings,
    toggleMinimalMode,
    minimalMode,
    toggleZenMode,
    zenMode,
    toggleLayoutLock,
    layoutLocked,
    startFocusWithDuration,
    openQuickAddBookmark,
    addTask,
    addNote,
    exportDataJson,
    showToast,
    triggerFullPageCapture,
    triggerVisibleCapture,
    triggerSelectedAreaCapture,
    triggerReaderMode,
    triggerCloseDuplicateTabs,
    triggerPageAnalysis,
    triggerCleanUrl,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const saveRecentCommand = (id: string) => {
    try {
      const updated = [id, ...recentCommandIds.filter((item) => item !== id)].slice(0, 6);
      setRecentCommandIds(updated);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (activeModal === 'commandPalette') {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [activeModal]);

  // Command items builder
  const results = useMemo(() => {
    const raw = query.trim();
    const q = raw.toLowerCase();
    const items: CommandItem[] = [];

    // Prefix filtering check
    const isBookmarkPrefix = q.startsWith('b:') || q.startsWith('b ');
    const isNotePrefix = q.startsWith('n:') || q.startsWith('n ');
    const isTaskPrefix = q.startsWith('t:') || q.startsWith('t ');
    const isWorkspacePrefix = q.startsWith('w:') || q.startsWith('w ');
    const isSectionPrefix = q.startsWith('s:') || q.startsWith('s ');

    const cleanQuery = isBookmarkPrefix || isNotePrefix || isTaskPrefix || isWorkspacePrefix || isSectionPrefix
      ? q.slice(2).trim()
      : q;

    // 1. Natural Deterministic Commands check
    // "add <name>"
    if (q.startsWith('add ') || q.startsWith('new bookmark ')) {
      const term = raw.replace(/^(add|new bookmark)\s+/i, '').trim();
      items.push({
        id: 'cmd-add-prefill',
        category: 'Commands',
        title: `Add Bookmark: "${term}"`,
        subtitle: 'Open quick bookmark creator with this title',
        icon: BookmarkIcon,
        shortcut: 'Enter',
        action: () => {
          closeModal();
          openQuickAddBookmark({ title: term });
        },
      });
    }

    // "focus <minutes>"
    const focusMatch = q.match(/^(?:focus|pomodoro)\s*(\d+)?$/i);
    if (focusMatch) {
      const mins = focusMatch[1] ? parseInt(focusMatch[1], 10) : 25;
      items.push({
        id: `cmd-focus-${mins}`,
        category: 'Commands',
        title: `Start ${mins}-Minute Focus Session`,
        subtitle: 'Enter distraction-free Pomodoro mode',
        icon: Flame,
        shortcut: '⌘⇧F',
        action: () => {
          closeModal();
          startFocusWithDuration(mins);
        },
      });
    }

    // "task <title>" or "new task <title>"
    if (q.startsWith('task ') || q.startsWith('new task ')) {
      const taskTitle = raw.replace(/^(task|new task)\s+/i, '').trim();
      if (taskTitle) {
        items.push({
          id: 'cmd-create-task',
          category: 'Tasks',
          title: `Create Task: "${taskTitle}"`,
          subtitle: 'Add directly to your today checklist',
          icon: CheckSquare,
          shortcut: 'Enter',
          action: () => {
            addTask(taskTitle, 'medium', 'Today');
            closeModal();
          },
        });
      }
    }

    // "note <title>" or "new note <title>"
    if (q.startsWith('note ') || q.startsWith('new note ')) {
      const noteTitle = raw.replace(/^(note|new note)\s+/i, '').trim();
      if (noteTitle) {
        items.push({
          id: 'cmd-create-note',
          category: 'Notes',
          title: `Create Note: "${noteTitle}"`,
          subtitle: 'Save a quick markdown memo',
          icon: FileText,
          shortcut: 'Enter',
          action: () => {
            addNote(noteTitle, '');
            closeModal();
            openModal('notes');
          },
        });
      }
    }

    // Aliases check (e.g. fps, save, reader, tabs, color, ruler, qr, analyze, links, panel, clean, yt, gpt, gh)
    const aliases = settings.commandAliases || {};
    if (aliases[q]) {
      const target = aliases[q];
      if (target === 'tool:full-page') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Capture Full Page Screenshot (Alias: "${q}")`,
          subtitle: 'Programmatically scroll and stitch entire page',
          icon: Camera,
          shortcut: 'Enter',
          action: () => {
            triggerFullPageCapture();
            closeModal();
          },
        });
      } else if (target === 'tool:save-page') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Web Clipper / Save Page (Alias: "${q}")`,
          subtitle: 'Open saved research clips archive',
          icon: BookmarkIcon,
          shortcut: 'Enter',
          action: () => {
            openModal('savedPages');
            closeModal();
          },
        });
      } else if (target === 'tool:reader-mode') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Toggle Reader Mode (Alias: "${q}")`,
          subtitle: 'Distraction-free typography reader view',
          icon: BookOpen,
          shortcut: 'Enter',
          action: () => {
            triggerReaderMode();
            closeModal();
          },
        });
      } else if (target === 'tool:tab-manager') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Tab Manager (Alias: "${q}")`,
          subtitle: 'Search open tabs & manage sessions',
          icon: Layers,
          shortcut: 'Enter',
          action: () => {
            openModal('tabManager');
            closeModal();
          },
        });
      } else if (target === 'tool:color-picker') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Color Eyedropper (Alias: "${q}")`,
          subtitle: 'Sample pixel color from screen',
          icon: Pipette,
          shortcut: 'Enter',
          action: () => {
            openModal('designTools');
            closeModal();
          },
        });
      } else if (target === 'tool:screen-ruler') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Screen Ruler (Alias: "${q}")`,
          subtitle: 'Launch crosshair pixel measuring guides',
          icon: Ruler,
          shortcut: 'Enter',
          action: () => {
            openModal('designTools');
            closeModal();
          },
        });
      } else if (target === 'tool:qr-generator') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `QR Code Generator (Alias: "${q}")`,
          subtitle: 'Generate crisp QR code for URL or text',
          icon: QrCode,
          shortcut: 'Enter',
          action: () => {
            openModal('designTools');
            closeModal();
          },
        });
      } else if (target === 'tool:page-analyzer') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Page Tools & Analyzer (Alias: "${q}")`,
          subtitle: 'Inspect DOM metrics, words, and headings',
          icon: BarChart2,
          shortcut: 'Enter',
          action: () => {
            openModal('pageTools');
            closeModal();
          },
        });
      } else if (target === 'tool:link-extractor') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Link Extractor (Alias: "${q}")`,
          subtitle: 'Scan internal & external links with CSV export',
          icon: Link2,
          shortcut: 'Enter',
          action: () => {
            openModal('pageTools');
            closeModal();
          },
        });
      } else if (target === 'tool:side-panel') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `MySpace Side Panel (Alias: "${q}")`,
          subtitle: 'Open persistent companion drawer',
          icon: Sidebar,
          shortcut: 'Enter',
          action: () => {
            openModal('sidePanel');
            closeModal();
          },
        });
      } else if (target === 'tool:clean-url') {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Clean URL (Alias: "${q}")`,
          subtitle: 'Strip tracking parameters from current URL',
          icon: Sparkles,
          shortcut: 'Enter',
          action: () => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
              chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                if (tab?.url) {
                  const cleaned = cleanUrl(tab.url);
                  navigator.clipboard.writeText(cleaned);
                  showToast('Clean URL copied to clipboard!', 'success');
                }
              });
            }
            closeModal();
          },
        });
      } else {
        items.push({
          id: `alias-${q}`,
          category: 'Commands',
          title: `Open Alias "${q}" → ${target}`,
          subtitle: 'Configured shortcut alias',
          icon: Zap,
          shortcut: 'Enter',
          action: () => {
            openDestinationUrl(target, settings.openBookmarksInNewTab);
            closeModal();
          },
        });
      }
    }

    // When empty query: show primary actions + top bookmarks
    if (!q) {
      items.push({
        id: 'action-quick-bm',
        category: 'Commands',
        title: 'Quick Bookmark',
        subtitle: 'Save a link or current tab instantly',
        icon: BookmarkIcon,
        shortcut: '⌘⇧K',
        action: () => {
          closeModal();
          openQuickAddBookmark();
        },
      });
      items.push({
        id: 'action-focus',
        category: 'Commands',
        title: 'Start Focus Mode',
        subtitle: 'Enter 25-minute Pomodoro deep work block',
        icon: Flame,
        shortcut: '⌘⇧F',
        action: () => {
          closeModal();
          startFocusWithDuration(25);
        },
      });
      items.push({
        id: 'action-wallpaper',
        category: 'Commands',
        title: 'Change Wallpaper',
        subtitle: 'Switch cinematic scenery or visual adjustments',
        icon: Image,
        shortcut: '⌘⇧P',
        action: () => {
          closeModal();
          openModal('wallpaper');
        },
      });
      items.push({
        id: 'action-minimal-mode',
        category: 'Commands',
        title: minimalMode ? 'Exit Minimal Mode' : 'Toggle Minimal Mode',
        subtitle: 'Show only wallpaper, clock, search & essential bookmarks',
        icon: minimalMode ? Eye : EyeOff,
        shortcut: '⌘⇧M',
        action: () => {
          toggleMinimalMode();
          closeModal();
        },
      });
      items.push({
        id: 'action-zen-mode',
        category: 'Commands',
        title: zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode',
        subtitle: 'Ultra-minimal distraction-free view (Only time & search)',
        icon: Compass,
        shortcut: '⌘⇧Z',
        action: () => {
          toggleZenMode();
          closeModal();
        },
      });
      items.push({
        id: 'action-settings',
        category: 'Commands',
        title: 'Open Settings & Customization',
        subtitle: 'Theme, layouts, shortcuts, weather & preferences',
        icon: Settings,
        shortcut: '⌘⇧S',
        action: () => {
          closeModal();
          openModal('customize');
        },
      });

      // Top 4 Most Used Bookmarks
      const topBookmarks = [...bookmarks]
        .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
        .slice(0, 4);

      for (const bm of topBookmarks) {
        items.push({
          id: `bm-${bm.id}`,
          category: 'Bookmarks',
          title: bm.title,
          subtitle: bm.url,
          icon: BookmarkIcon,
          action: () => {
            recordBookmarkClick(bm.id);
            openDestinationUrl(bm.url, settings.openBookmarksInNewTab);
            closeModal();
          },
        });
      }

      return items;
    }

    // 2. Global Actions & System Commands matching cleanQuery
    const SYSTEM_COMMANDS: Array<{
      id: string;
      keywords: string[];
      title: string;
      subtitle: string;
      icon: any;
      shortcut?: string;
      action: () => void;
    }> = [
      {
        id: 'sys-add-bm',
        keywords: ['add bookmark', 'new bookmark', 'create bookmark', 'save link'],
        title: 'Add New Bookmark',
        subtitle: 'Create a new bookmark in current workspace',
        icon: BookmarkIcon,
        shortcut: '⌘N',
        action: () => {
          closeModal();
          openModal('addBookmark');
        },
      },
      {
        id: 'sys-quick-bm',
        keywords: ['quick bookmark', 'quick add'],
        title: 'Quick Bookmark',
        subtitle: 'Save a link or current tab rapidly',
        icon: BookmarkIcon,
        shortcut: '⌘⇧K',
        action: () => {
          closeModal();
          openQuickAddBookmark();
        },
      },
      {
        id: 'sys-add-sec',
        keywords: ['add section', 'new section', 'create section', 'category'],
        title: 'Create New Section',
        subtitle: 'Add a new group for organizing bookmarks',
        icon: Folder,
        action: () => {
          closeModal();
          openModal('addSection');
        },
      },
      {
        id: 'sys-notes',
        keywords: ['notes', 'open notes', 'memo', 'scratchpad'],
        title: 'Open Notes',
        subtitle: 'View and edit local markdown notes',
        icon: FileText,
        shortcut: '⌘⇧N',
        action: () => {
          closeModal();
          openModal('notes');
        },
      },
      {
        id: 'sys-todo',
        keywords: ['todo', 'tasks', 'open tasks', 'checklist'],
        title: 'Open Tasks & To-Do',
        subtitle: 'Manage upcoming tasks and daily priorities',
        icon: CheckSquare,
        shortcut: '⌘⇧T',
        action: () => {
          closeModal();
          openModal('todo');
        },
      },
      {
        id: 'sys-focus',
        keywords: ['focus', 'pomodoro', 'timer', 'deep work'],
        title: 'Start Focus Mode',
        subtitle: 'Pomodoro timer with task objective',
        icon: Flame,
        shortcut: '⌘⇧F',
        action: () => {
          closeModal();
          startFocusWithDuration(25);
        },
      },
      {
        id: 'sys-wallpaper',
        keywords: ['wallpaper', 'background', 'photo', 'theme image'],
        title: 'Customize Wallpaper',
        subtitle: 'Scenery gallery, upload custom images & tuning',
        icon: Image,
        shortcut: '⌘⇧P',
        action: () => {
          closeModal();
          openModal('wallpaper');
        },
      },
      {
        id: 'sys-minimal',
        keywords: ['minimal mode', 'toggle minimal', 'clean view'],
        title: minimalMode ? 'Disable Minimal Mode' : 'Enable Minimal Mode',
        subtitle: 'Show only essential elements',
        icon: minimalMode ? Eye : EyeOff,
        shortcut: '⌘⇧M',
        action: () => {
          toggleMinimalMode();
          closeModal();
        },
      },
      {
        id: 'sys-zen',
        keywords: ['zen mode', 'ultra minimal', 'distraction free'],
        title: zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode',
        subtitle: 'Ultra clean view showing only wallpaper and clock',
        icon: Compass,
        shortcut: '⌘⇧Z',
        action: () => {
          toggleZenMode();
          closeModal();
        },
      },
      {
        id: 'sys-lock-layout',
        keywords: ['lock layout', 'unlock layout', 'prevent drag'],
        title: layoutLocked ? 'Unlock Layout' : 'Lock Layout',
        subtitle: layoutLocked ? 'Allow moving and reordering sections' : 'Lock sections and prevent accidental moving',
        icon: layoutLocked ? Unlock : Lock,
        action: () => {
          toggleLayoutLock();
          closeModal();
        },
      },
      {
        id: 'sys-settings',
        keywords: ['settings', 'preferences', 'customize', 'options', 'toolbox'],
        title: 'Open Settings & Toolbox',
        subtitle: 'Theme, glass blur, layouts, shortcuts, toolbox and data',
        icon: Settings,
        shortcut: '⌘⇧S',
        action: () => {
          closeModal();
          openModal('customize');
        },
      },
      // Browser Toolkit Commands
      {
        id: 'sys-capture-full',
        keywords: ['capture full page', 'full page screenshot', 'fps', 'screenshot full', 'scroll capture'],
        title: 'Capture Full Page Screenshot',
        subtitle: 'Programmatically scroll and stitch entire webpage to high-res PNG',
        icon: Camera,
        shortcut: '⌘⇧F',
        action: () => {
          triggerFullPageCapture();
          closeModal();
        },
      },
      {
        id: 'sys-capture-visible',
        keywords: ['capture visible', 'screenshot', 'snapshot', 'vis', 'screen grab'],
        title: 'Capture Visible Viewport',
        subtitle: 'Instant snapshot of active screen in Screenshot Editor',
        icon: Maximize,
        shortcut: '⌘⇧V',
        action: () => {
          triggerVisibleCapture();
          closeModal();
        },
      },
      {
        id: 'sys-capture-selected',
        keywords: ['capture selected', 'crop screen', 'select area', 'crop', 'marquee'],
        title: 'Capture Selected Area',
        subtitle: 'Interactive crosshair marquee to crop & annotate region',
        icon: Crop,
        action: () => {
          triggerSelectedAreaCapture();
          closeModal();
        },
      },
      {
        id: 'sys-save-page',
        keywords: ['save page', 'clip page', 'save', 'web clipper', 'bookmark page'],
        title: 'Save Page to Web Clipper',
        subtitle: 'Store page title, url, favicon, and highlights in local archive',
        icon: BookmarkIcon,
        shortcut: '⌘⇧S',
        action: () => {
          if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: 'MYSPACE_EXECUTE_TOOL', action: 'save-page' }, (res) => {
              if (res?.success) showToast('Page saved to Web Clipper!', 'success');
            });
          }
          openModal('savedPages');
          closeModal();
        },
      },
      {
        id: 'sys-reader-mode',
        keywords: ['reader mode', 'reader', 'distraction free', 'article view', 'read'],
        title: 'Toggle Reader Mode',
        subtitle: 'Distraction-free typography article view with progress bar',
        icon: BookOpen,
        shortcut: '⌘⇧R',
        action: () => {
          triggerReaderMode();
          closeModal();
        },
      },
      {
        id: 'sys-page-tools',
        keywords: ['page tools', 'page info', 'analyze', 'word count', 'dom analyzer', 'headings'],
        title: 'Page Tools & Analyzer',
        subtitle: 'Word count, reading time, heading hierarchy, and media audit',
        icon: BarChart2,
        shortcut: '⌘⇧I',
        action: () => {
          triggerPageAnalysis();
          closeModal();
        },
      },
      {
        id: 'sys-link-tools',
        keywords: ['link tools', 'extract links', 'links', 'export csv', 'all links'],
        title: 'Extract Links from Page',
        subtitle: 'Scan internal & external hyperlinks with 1-click CSV/TXT export',
        icon: Link2,
        action: () => {
          triggerPageAnalysis();
          closeModal();
        },
      },
      {
        id: 'sys-tab-manager',
        keywords: ['tab manager', 'tab search', 'tabs', 'open tabs', 'switch tab'],
        title: 'Tab Manager & Search',
        subtitle: 'Search all open tabs across windows and switch instantly',
        icon: Layers,
        shortcut: '⌘⇧T',
        action: () => {
          openModal('tabManager');
          closeModal();
        },
      },
      {
        id: 'sys-close-duplicates',
        keywords: ['close duplicate tabs', 'close duplicates', 'dedup tabs', 'clean tabs', 'dedup'],
        title: 'Close Duplicate Tabs',
        subtitle: 'Find and close identical open tabs across all browser windows',
        icon: Sparkles,
        action: () => {
          triggerCloseDuplicateTabs();
          closeModal();
        },
      },
      {
        id: 'sys-save-session',
        keywords: ['save session', 'save tabs', 'tab session', 'create session'],
        title: 'Save Tab Session',
        subtitle: 'Save open tabs as a named collection (e.g. "CSE Research")',
        icon: Save,
        action: () => {
          openModal('tabManager');
          closeModal();
        },
      },
      {
        id: 'sys-restore-session',
        keywords: ['restore session', 'open session', 'load tabs'],
        title: 'Restore Tab Session',
        subtitle: 'Restore a previously saved collection of research tabs',
        icon: RotateCcw,
        action: () => {
          openModal('tabManager');
          closeModal();
        },
      },
      {
        id: 'sys-color-picker',
        keywords: ['color picker', 'eyedropper', 'color', 'hex', 'sample color'],
        title: 'Color Eyedropper',
        subtitle: 'Sample pixel colors from screen with HEX/RGB copy and palette history',
        icon: Pipette,
        action: () => {
          openModal('designTools');
          closeModal();
        },
      },
      {
        id: 'sys-screen-ruler',
        keywords: ['screen ruler', 'ruler', 'measure', 'dimensions', 'guides'],
        title: 'Screen Ruler',
        subtitle: 'Live pixel crosshair guides to measure dimensions on webpage',
        icon: Ruler,
        action: () => {
          openModal('designTools');
          closeModal();
        },
      },
      {
        id: 'sys-element-inspector',
        keywords: ['element inspector', 'inspector', 'inspect', 'box model'],
        title: 'Element Inspector Lite',
        subtitle: 'Hover inspection showing box model dimensions, tags, and structure',
        icon: Inspect,
        action: () => {
          openModal('designTools');
          closeModal();
        },
      },
      {
        id: 'sys-viewport-preview',
        keywords: ['viewport preview', 'responsive', 'mobile preview', 'viewport', 'devices'],
        title: 'Responsive Viewport Preview',
        subtitle: 'Test web page layout in mobile, tablet, laptop, and desktop framing',
        icon: Smartphone,
        action: () => {
          openModal('designTools');
          closeModal();
        },
      },
      {
        id: 'sys-qr-generator',
        keywords: ['qr generator', 'qr code', 'qr', 'generate qr'],
        title: 'QR Code Generator',
        subtitle: 'Generate crisp QR codes for URLs or text with 1-click PNG copy',
        icon: QrCode,
        action: () => {
          openModal('designTools');
          closeModal();
        },
      },
      {
        id: 'sys-side-panel',
        keywords: ['side panel', 'open side panel', 'companion', 'panel'],
        title: 'Open MySpace Side Panel',
        subtitle: 'Persistent contextual side companion for quick tools and notes',
        icon: Sidebar,
        shortcut: '⌘⇧P',
        action: () => {
          openModal('sidePanel');
          closeModal();
        },
      },
      {
        id: 'sys-clean-url',
        keywords: ['clean url', 'copy clean url', 'strip utm', 'clean', 'sanitize url'],
        title: 'Copy Clean URL',
        subtitle: 'Remove tracking query parameters (utm, fbclid, ref) from URL',
        icon: Sparkles,
        action: () => {
          triggerCleanUrl();
          closeModal();
        },
      },
      {
        id: 'sys-export',
        keywords: ['export', 'backup', 'download backup', 'save json'],
        title: 'Export Everything (JSON)',
        subtitle: 'Download complete backup of bookmarks, notes and settings',
        icon: Download,
        action: async () => {
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
            showToast('Backup JSON downloaded!', 'success');
          } catch {
            showToast('Export failed', 'error');
          }
          closeModal();
        },
      },
      {
        id: 'sys-import',
        keywords: ['import', 'restore', 'load backup', 'chrome bookmarks'],
        title: 'Import Bookmarks & Backup',
        subtitle: 'Import from Google Chrome or restore JSON backup',
        icon: Upload,
        action: () => {
          closeModal();
          openModal('chromeImport');
        },
      },
    ];

    if (!isBookmarkPrefix && !isNotePrefix && !isTaskPrefix && !isWorkspacePrefix && !isSectionPrefix) {
      for (const cmd of SYSTEM_COMMANDS) {
        if (cmd.keywords.some((k) => k.includes(cleanQuery)) || cmd.title.toLowerCase().includes(cleanQuery)) {
          items.push({
            id: cmd.id,
            category: 'Commands',
            title: cmd.title,
            subtitle: cmd.subtitle,
            icon: cmd.icon,
            shortcut: cmd.shortcut,
            action: cmd.action,
          });
        }
      }
    }

    // 3. Search Bookmarks
    if (!isNotePrefix && !isTaskPrefix && !isWorkspacePrefix && !isSectionPrefix) {
      for (const bm of bookmarks) {
        if (
          bm.title.toLowerCase().includes(cleanQuery) ||
          bm.url.toLowerCase().includes(cleanQuery) ||
          (bm.description && bm.description.toLowerCase().includes(cleanQuery)) ||
          (bm.tags && bm.tags.some((t) => t.toLowerCase().includes(cleanQuery)))
        ) {
          items.push({
            id: `bm-${bm.id}`,
            category: 'Bookmarks',
            title: bm.title,
            subtitle: bm.url,
            icon: BookmarkIcon,
            action: () => {
              recordBookmarkClick(bm.id);
              openDestinationUrl(bm.url, settings.openBookmarksInNewTab);
              closeModal();
            },
          });
        }
      }
    }

    // 4. Search Sections
    if (!isBookmarkPrefix && !isNotePrefix && !isTaskPrefix && !isWorkspacePrefix) {
      for (const sec of sections) {
        if (sec.name.toLowerCase().includes(cleanQuery) || (sec.description && sec.description.toLowerCase().includes(cleanQuery))) {
          items.push({
            id: `sec-${sec.id}`,
            category: 'Sections',
            title: `Section: ${sec.name}`,
            subtitle: `${sec.description || 'Bookmark Section'}`,
            icon: Folder,
            action: () => {
              closeModal();
            },
          });
        }
      }
    }

    // 5. Search Notes
    if (!isBookmarkPrefix && !isTaskPrefix && !isWorkspacePrefix && !isSectionPrefix) {
      for (const note of notes) {
        if (note.title.toLowerCase().includes(cleanQuery) || note.content.toLowerCase().includes(cleanQuery)) {
          items.push({
            id: `note-${note.id}`,
            category: 'Notes',
            title: note.title || 'Untitled Note',
            subtitle: note.content.slice(0, 70),
            icon: FileText,
            action: () => {
              closeModal();
              openModal('notes');
            },
          });
        }
      }
    }

    // 6. Search Tasks
    if (!isBookmarkPrefix && !isNotePrefix && !isWorkspacePrefix && !isSectionPrefix) {
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(cleanQuery)) {
          items.push({
            id: `task-${task.id}`,
            category: 'Tasks',
            title: task.title,
            subtitle: task.completed ? 'Completed' : `Priority: ${task.priority}`,
            icon: CheckSquare,
            action: () => {
              closeModal();
              openModal('todo');
            },
          });
        }
      }
    }

    // 7. Search Workspaces
    if (!isBookmarkPrefix && !isNotePrefix && !isTaskPrefix && !isSectionPrefix) {
      for (const ws of workspaces) {
        if (ws.name.toLowerCase().includes(cleanQuery) || cleanQuery.startsWith('workspace') || cleanQuery.startsWith('ws')) {
          items.push({
            id: `ws-${ws.id}`,
            category: 'Workspaces',
            title: `Workspace: ${ws.name}`,
            subtitle: ws.id === activeWorkspace.id ? 'Currently active workspace' : 'Click to switch',
            icon: Layers,
            action: () => {
              setActiveWorkspaceId(ws.id);
              closeModal();
            },
          });
        }
      }
    }

    // 8. Fallback Web Search
    items.push({
      id: 'action-web-search',
      category: 'Web Search',
      title: isLikelyUrl(cleanQuery) ? `Go to ${cleanQuery}` : `Search "${cleanQuery}" on ${settings.searchEngine}`,
      subtitle: isLikelyUrl(cleanQuery) ? 'Direct URL navigation' : 'Web Search Engine',
      icon: ExternalLink,
      action: () => {
        if (isLikelyUrl(cleanQuery)) {
          openDestinationUrl(cleanQuery, settings.openBookmarksInNewTab);
        } else {
          openDestinationUrl(buildSearchUrl(cleanQuery, settings.searchEngine), settings.openBookmarksInNewTab);
        }
        closeModal();
      },
    });

    return items;
  }, [
    query,
    bookmarks,
    sections,
    notes,
    tasks,
    workspaces,
    activeWorkspace.id,
    minimalMode,
    zenMode,
    layoutLocked,
    settings,
    closeModal,
    openModal,
    recordBookmarkClick,
    setActiveWorkspaceId,
    startFocusWithDuration,
    toggleMinimalMode,
    toggleZenMode,
    toggleLayoutLock,
    openQuickAddBookmark,
    addTask,
    addNote,
    exportDataJson,
    showToast,
    triggerFullPageCapture,
    triggerVisibleCapture,
    triggerSelectedAreaCapture,
    triggerReaderMode,
    triggerCloseDuplicateTabs,
    triggerPageAnalysis,
    triggerCleanUrl,
  ]);

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    closeModal();
  };

  // Keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        saveRecentCommand(results[selectedIndex].id);
        const action = results[selectedIndex].action;
        handleClose();
        action();
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Ensure active element is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (activeModal !== 'commandPalette') return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl glass-panel rounded-3xl border border-white/20 shadow-glass-lg overflow-hidden animate-scale-in flex flex-col max-h-[580px]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 shrink-0">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, bookmark, 'focus 25', 'task ...', or prefix (b:, n:, t:, w:)..."
            className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-xs">No matching commands or links found</div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => {
                    saveRecentCommand(item.id);
                    const action = item.action;
                    handleClose();
                    action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-600/30 border border-purple-400/40 text-white shadow-sm'
                      : 'hover:bg-white/5 text-white/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-500 text-white shadow-glow-violet'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{item.title}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'opacity-100 translate-x-0.5 text-purple-300' : 'opacity-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-black/20 text-[11px] text-white/40 shrink-0">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Prefixes:</span>
            <span className="font-mono text-purple-400">b:</span> bookmarks
            <span className="font-mono text-purple-400">n:</span> notes
            <span className="font-mono text-purple-400">t:</span> tasks
            <span className="font-mono text-purple-400">w:</span> workspaces
          </div>
        </div>
      </div>
    </div>
  );
};
