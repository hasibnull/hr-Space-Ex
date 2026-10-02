import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CustomShortcuts } from '../types';

interface ShortcutHandlers {
  onOpenSearch?: () => void;
  onOpenQuickBookmark?: () => void;
  onOpenBookmarks?: () => void;
  onOpenBookmarkSearch?: () => void;
  onNewBookmark?: () => void;
  onNewNote?: () => void;
  onNewTask?: () => void;
  onToggleFocus?: () => void;
  onWorkspaceSwitcher?: () => void;
  onOpenSettings?: () => void;
  onOpenWallpaper?: () => void;
  onToggleMinimalMode?: () => void;
  onToggleZenMode?: () => void;
  onCloseModals?: () => void;
  // Browser Toolkit
  onFullPageScreenshot?: () => void;
  onSavePage?: () => void;
  onReaderMode?: () => void;
  onSidePanel?: () => void;
  onTabManager?: () => void;
  onPageTools?: () => void;
}

export function matchesShortcut(e: KeyboardEvent, shortcutStr?: string): boolean {
  if (!shortcutStr) return false;
  const parts = shortcutStr.toLowerCase().split('+').map((p) => p.trim());
  const needsCtrlOrCmd = parts.includes('ctrl') || parts.includes('control') || parts.includes('cmd') || parts.includes('meta');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt') || parts.includes('opt');

  const hasCtrlOrCmd = e.ctrlKey || e.metaKey;

  if (needsCtrlOrCmd !== hasCtrlOrCmd) return false;
  if (needsShift !== e.shiftKey) return false;
  if (needsAlt !== e.altKey) return false;

  const keyPart = parts.find(
    (p) => !['ctrl', 'control', 'cmd', 'meta', 'shift', 'alt', 'opt'].includes(p)
  );

  if (!keyPart) return false;
  return e.key.toLowerCase() === keyPart.toLowerCase();
}

export function useShortcuts(handlers: ShortcutHandlers) {
  const { settings } = useApp();
  const shortcuts: CustomShortcuts = settings.shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key always closes active panels/modals/zen mode
      if (e.key === 'Escape') {
        if (handlers.onCloseModals) {
          e.preventDefault();
          handlers.onCloseModals();
        }
        return;
      }

      // Check if user is typing inside an input or textarea
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // If user is typing regular text into an input, don't hijack simple keys
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
      if (isInputFocused && !hasModifier) {
        return;
      }

      // 1. Command Center / Global Search (Default Ctrl/Cmd + K)
      if (matchesShortcut(e, shortcuts.commandPalette)) {
        e.preventDefault();
        handlers.onOpenSearch?.();
        return;
      }

      // 2. Quick Bookmark (Default Ctrl/Cmd + Shift + K)
      if (matchesShortcut(e, shortcuts.quickBookmark)) {
        e.preventDefault();
        handlers.onOpenQuickBookmark?.();
        return;
      }

      // 3. Focus Mode (Default Ctrl/Cmd + Shift + F)
      if (matchesShortcut(e, shortcuts.focusMode)) {
        e.preventDefault();
        handlers.onToggleFocus?.();
        return;
      }

      // 4. Bookmarks Manager (Default Ctrl/Cmd + B)
      if (matchesShortcut(e, shortcuts.bookmarks)) {
        e.preventDefault();
        handlers.onOpenBookmarks?.();
        return;
      }

      // 5. Bookmark Search (Default Ctrl/Cmd + Shift + B)
      if (matchesShortcut(e, shortcuts.bookmarkSearch)) {
        e.preventDefault();
        handlers.onOpenBookmarkSearch?.();
        return;
      }

      // 6. New Bookmark Modal (Default Ctrl/Cmd + N)
      if (matchesShortcut(e, shortcuts.newBookmark)) {
        e.preventDefault();
        handlers.onNewBookmark?.();
        return;
      }

      // 7. New Note (Default Ctrl/Cmd + Shift + N)
      if (matchesShortcut(e, shortcuts.newNote)) {
        e.preventDefault();
        handlers.onNewNote?.();
        return;
      }

      // 8. New Task (Default Ctrl/Cmd + Shift + T)
      if (matchesShortcut(e, shortcuts.newTask)) {
        e.preventDefault();
        handlers.onNewTask?.();
        return;
      }

      // 9. Workspace Switcher (Default Ctrl/Cmd + Shift + W)
      if (matchesShortcut(e, shortcuts.workspaceSwitcher)) {
        e.preventDefault();
        handlers.onWorkspaceSwitcher?.();
        return;
      }

      // 10. Settings / Customize (Default Ctrl/Cmd + Shift + S or Ctrl+,)
      if (matchesShortcut(e, shortcuts.settings) || (hasModifier && e.key === ',')) {
        e.preventDefault();
        handlers.onOpenSettings?.();
        return;
      }

      // 11. Wallpaper Picker (Default Ctrl/Cmd + Shift + P)
      if (matchesShortcut(e, shortcuts.wallpaper)) {
        e.preventDefault();
        handlers.onOpenWallpaper?.();
        return;
      }

      // 12. Minimal Mode Toggle (Default Ctrl/Cmd + Shift + M)
      if (matchesShortcut(e, shortcuts.minimalMode)) {
        e.preventDefault();
        handlers.onToggleMinimalMode?.();
        return;
      }

      // 13. Zen Mode Toggle (Default Ctrl/Cmd + Shift + Z)
      if (matchesShortcut(e, shortcuts.zenMode)) {
        e.preventDefault();
        handlers.onToggleZenMode?.();
        return;
      }

      // 14. Full Page Screenshot (Default Ctrl/Cmd + Shift + F)
      if (matchesShortcut(e, shortcuts.fullPageScreenshot)) {
        e.preventDefault();
        handlers.onFullPageScreenshot?.();
        return;
      }

      // 15. Save Page (Default Ctrl/Cmd + Shift + S)
      if (matchesShortcut(e, shortcuts.savePage)) {
        e.preventDefault();
        handlers.onSavePage?.();
        return;
      }

      // 16. Reader Mode (Default Ctrl/Cmd + Shift + R)
      if (matchesShortcut(e, shortcuts.readerMode)) {
        e.preventDefault();
        handlers.onReaderMode?.();
        return;
      }

      // 17. Side Panel (Default Ctrl/Cmd + Shift + P)
      if (matchesShortcut(e, shortcuts.sidePanel)) {
        e.preventDefault();
        handlers.onSidePanel?.();
        return;
      }

      // 18. Tab Manager (Default Ctrl/Cmd + Shift + T)
      if (matchesShortcut(e, shortcuts.tabManager)) {
        e.preventDefault();
        handlers.onTabManager?.();
        return;
      }

      // 19. Page Tools (Default Ctrl/Cmd + Shift + I)
      if (matchesShortcut(e, shortcuts.pageTools)) {
        e.preventDefault();
        handlers.onPageTools?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, handlers]);
}
