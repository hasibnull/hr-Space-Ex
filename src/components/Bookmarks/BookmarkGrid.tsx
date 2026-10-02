import React, { useState } from 'react';
import { Sparkles, Star, Clock, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from './SectionCard';
import { BookmarkCard } from './BookmarkCard';
import { Section } from '../../types';

export const BookmarkGrid: React.FC = () => {
  const {
    activeSections,
    activeBookmarks,
    activeFilter,
    setActiveFilter,
    openModal,
    reorderSections,
    settings,
    zenMode,
    layoutLocked,
  } = useApp();

  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // In Zen Mode, hide everything except wallpaper, time and search
  if (zenMode) return null;

  // Filtered views when "Most Used", "Recently Added", or "Favorites" are active
  if (activeFilter === 'mostUsed') {
    const mostUsed = [...activeBookmarks]
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 18);

    return (
      <div className="w-full max-w-6xl mx-auto px-4 mt-4 mb-20">
        <div className="glass-panel rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Most Used Bookmarks</h2>
              <span className="text-xs text-white/50">({mostUsed.length})</span>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Show all sections
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
            {mostUsed.map((bm) => (
              <BookmarkCard key={bm.id} bookmark={bm} layout="grid" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeFilter === 'recentlyAdded') {
    const recent = [...activeBookmarks]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 18);

    return (
      <div className="w-full max-w-6xl mx-auto px-4 mt-4 mb-20">
        <div className="glass-panel rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Recently Added Bookmarks</h2>
              <span className="text-xs text-white/50">({recent.length})</span>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Show all sections
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
            {recent.map((bm) => (
              <BookmarkCard key={bm.id} bookmark={bm} layout="grid" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeFilter === 'favorites') {
    const favorites = activeBookmarks.filter((b) => b.isFavorite);

    return (
      <div className="w-full max-w-6xl mx-auto px-4 mt-4 mb-20">
        <div className="glass-panel rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-sm font-semibold text-white">Favorite Bookmarks</h2>
              <span className="text-xs text-white/50">({favorites.length})</span>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Show all sections
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
            {favorites.map((bm) => (
              <BookmarkCard key={bm.id} bookmark={bm} layout="grid" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Section Drag and Drop Reordering
  const handleDragStartSection = (e: React.DragEvent, section: Section) => {
    if (layoutLocked) return;
    const index = activeSections.findIndex((s) => s.id === section.id);
    setDraggedSectionIndex(index);
    e.dataTransfer.setData('section-index', index.toString());
  };

  const handleDropSection = (e: React.DragEvent, targetSection: Section) => {
    if (layoutLocked) return;
    e.preventDefault();
    if (draggedSectionIndex === null) return;
    const targetIndex = activeSections.findIndex((s) => s.id === targetSection.id);
    if (targetIndex !== -1 && draggedSectionIndex !== targetIndex) {
      const reordered = [...activeSections];
      const [moved] = reordered.splice(draggedSectionIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      reorderSections(reordered);
    }
    setDraggedSectionIndex(null);
  };

  // Determine grid container classes based on layout mode
  const getGridContainerClasses = () => {
    const mode = settings.layoutMode || 'balanced';
    switch (mode) {
      case 'compact':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5';
      case 'spacious':
        return 'grid grid-cols-1 lg:grid-cols-2 gap-4';
      case 'freeform':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3';
      case 'balanced':
      default:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-3';
    }
  };

  // Sections to render: in minimal mode, show sections cleanly
  const sectionsToRender = activeSections;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-20">
      {sectionsToRender.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No sections yet</h3>
          <p className="text-xs text-white/60 mt-1 mb-6">
            Create your first custom section to organize bookmarks, AI tools, or daily apps.
          </p>
          <button
            onClick={() => openModal('addSection')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-violet transition-all"
          >
            + Create Section
          </button>
        </div>
      ) : (
        <div className={getGridContainerClasses()}>
          {sectionsToRender.map((section) => {
            const sectionBookmarks = activeBookmarks
              .filter((b) => b.sectionId === section.id)
              .sort((a, b) => a.order - b.order);

            return (
              <SectionCard
                key={section.id}
                section={section}
                bookmarks={sectionBookmarks}
                onDragStartSection={handleDragStartSection}
                onDragOverSection={(e) => e.preventDefault()}
                onDropSection={handleDropSection}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
