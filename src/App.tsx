import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BackgroundLayer } from './components/Layout/BackgroundLayer';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { FloatingBottomNav } from './components/Layout/FloatingBottomNav';
import { QuickActionButton } from './components/Layout/QuickActionButton';
import { OnboardingBanner } from './components/Layout/OnboardingBanner';
import { Greeting } from './components/TopArea/Greeting';
import { QuoteWidget } from './components/TopArea/QuoteWidget';
import { SearchBar } from './components/Search/SearchBar';
import { CommandPalette } from './components/Search/CommandPalette';
import { BookmarkGrid } from './components/Bookmarks/BookmarkGrid';
import { BookmarkContextMenu } from './components/Bookmarks/BookmarkContextMenu';
import { SectionContextMenu } from './components/Bookmarks/SectionContextMenu';
import { CanvasContextMenu } from './components/Bookmarks/CanvasContextMenu';
import { AddBookmarkModal } from './components/Bookmarks/AddBookmarkModal';
import { QuickAddBookmarkModal } from './components/Bookmarks/QuickAddBookmarkModal';
import { AddSectionModal } from './components/Bookmarks/AddSectionModal';
import { WallpaperPickerModal } from './components/Panels/WallpaperPickerModal';
import { CustomizePanel } from './components/Panels/CustomizePanel';
import { NotesPanel } from './components/Panels/NotesPanel';
import { TodoPanel } from './components/Panels/TodoPanel';
import { FocusMode } from './components/Panels/FocusMode';
import { BookmarksManagerModal } from './components/Panels/BookmarksManagerModal';
import { ChromeImportExportModal } from './components/Panels/ChromeImportExportModal';
import { WorkspaceModal } from './components/Panels/WorkspaceModal';
import { SessionsModal } from './components/Panels/SessionsModal';
import { BackupPreviewModal } from './components/Panels/BackupPreviewModal';
import { ScreenshotEditorModal } from './components/Panels/ScreenshotEditorModal';
import { PageToolsModal } from './components/Panels/PageToolsModal';
import { TabManagerModal } from './components/Panels/TabManagerModal';
import { SavedPagesModal } from './components/Panels/SavedPagesModal';
import { DesignToolsModal } from './components/Panels/DesignToolsModal';
import { SidePanelDrawer } from './components/Panels/SidePanelDrawer';
import { Toast } from './components/UI/Toast';
import { useShortcuts } from './hooks/useShortcuts';

const MainDashboard: React.FC = () => {
  const {
    isLoading,
    openModal,
    closeModal,
    setSidebarOpen,
    sidebarOpen,
    zenMode,
    toggleZenMode,
    toggleMinimalMode,
    openQuickAddBookmark,
    openCanvasContextMenu,
    closeContextMenu,
    closeSectionContextMenu,
    closeCanvasContextMenu,
    triggerFullPageCapture,
    triggerReaderMode,
  } = useApp();

  // Full customizable keyboard shortcuts suite
  useShortcuts({
    onOpenSearch: () => openModal('commandPalette'),
    onOpenQuickBookmark: () => openQuickAddBookmark(),
    onOpenBookmarks: () => openModal('bookmarksManager'),
    onOpenBookmarkSearch: () => openModal('commandPalette'),
    onNewBookmark: () => openModal('addBookmark'),
    onNewNote: () => openModal('notes'),
    onNewTask: () => openModal('todo'),
    onToggleFocus: () => openModal('focus'),
    onWorkspaceSwitcher: () => openModal('workspaces'),
    onOpenSettings: () => openModal('customize'),
    onOpenWallpaper: () => openModal('wallpaper'),
    onToggleMinimalMode: () => toggleMinimalMode(),
    onToggleZenMode: () => toggleZenMode(),
    // Browser Toolkit Shortcuts
    onFullPageScreenshot: () => triggerFullPageCapture(),
    onSavePage: () => openModal('savedPages'),
    onReaderMode: () => triggerReaderMode(),
    onSidePanel: () => openModal('sidePanel'),
    onTabManager: () => openModal('tabManager'),
    onPageTools: () => openModal('pageTools'),
    onCloseModals: () => {
      closeModal();
      setSidebarOpen(false);
      closeContextMenu();
      closeSectionContextMenu();
      closeCanvasContextMenu();
      if (zenMode) toggleZenMode();
    },
  });

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    // Only open canvas context menu if right click wasn't already handled by a bookmark or section
    const target = e.target as HTMLElement;
    if (
      !target.closest('[data-bookmark-card]') &&
      !target.closest('[data-section-card]') &&
      !target.closest('.glass-panel')
    ) {
      openCanvasContextMenu(e);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#090b10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-xs tracking-wider uppercase font-medium">Loading MySpace V3...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onContextMenu={handleCanvasContextMenu}
      className="min-h-screen relative flex flex-col justify-between selection:bg-purple-500/30 selection:text-white"
    >
      {/* Dynamic scenic background */}
      <BackgroundLayer />

      {/* Top Header: Hidden sidebar trigger at top-left, live clock & weather at top-right */}
      <Header />

      {/* Hidden Slide-over Sidebar (revealed on ••• click) */}
      <Sidebar />

      {/* Main Dashboard Hero & Content Area */}
      <main className="flex-1 flex flex-col pt-12 md:pt-16 pb-24 z-10">
        {/* Dynamic Greeting */}
        <Greeting />

        {/* Motivational Quote */}
        <QuoteWidget />

        {/* Centered Glass Search Bar */}
        <SearchBar />

        {/* Bookmark Sections & Shortcuts */}
        <BookmarkGrid />
      </main>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav />

      {/* Floating Quick Action Button */}
      <QuickActionButton />

      {/* Subtle First-run Discovery Banner */}
      <OnboardingBanner />

      {/* Modals & Panels */}
      <CommandPalette />
      <QuickAddBookmarkModal />
      <AddBookmarkModal />
      <AddSectionModal />
      <WallpaperPickerModal />
      <CustomizePanel />
      <NotesPanel />
      <TodoPanel />
      <FocusMode />
      <BookmarksManagerModal />
      <ChromeImportExportModal />
      <WorkspaceModal />
      <SessionsModal />
      <BackupPreviewModal />

      {/* Browser Toolkit Modals & Panels */}
      <ScreenshotEditorModal />
      <PageToolsModal />
      <TabManagerModal />
      <SavedPagesModal />
      <DesignToolsModal />
      <SidePanelDrawer />

      {/* Right-click Context Menus */}
      <BookmarkContextMenu />
      <SectionContextMenu />
      <CanvasContextMenu />

      {/* System Toasts */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainDashboard />
    </AppProvider>
  );
}
