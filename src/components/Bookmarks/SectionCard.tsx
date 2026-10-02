import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Folder,
  Edit2,
  Copy,
  Trash2,
  Bot,
  CheckSquare,
  Palette,
  GraduationCap,
  Share2,
  Newspaper,
  Tv,
  ShoppingBag,
  Briefcase,
  Star,
  Globe,
} from 'lucide-react';
import { Section, Bookmark, SectionLayout } from '../../types';
import { useApp } from '../../context/AppContext';
import { BookmarkCard } from './BookmarkCard';

interface SectionCardProps {
  section: Section;
  bookmarks: Bookmark[];
  onDragStartSection?: (e: React.DragEvent, section: Section) => void;
  onDragOverSection?: (e: React.DragEvent) => void;
  onDropSection?: (e: React.DragEvent, targetSection: Section) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  bookmarks,
  onDragStartSection,
  onDragOverSection,
  onDropSection,
}) => {
  const {
    toggleCollapseSection,
    deleteSection,
    duplicateSection,
    openModal,
    setTargetSectionId,
    setEditingSection,
    moveBookmark,
    reorderBookmarksInSection,
    openSectionContextMenu,
    layoutLocked,
    settings,
  } = useApp();

  const [showMenu, setShowMenu] = useState(false);
  const [dragOverSection, setDragOverSection] = useState(false);

  // Smart sort bookmarks based on section.sortMode
  const sortedBookmarks = useMemo(() => {
    const list = [...bookmarks];
    switch (section.sortMode) {
      case 'alpha':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'most-used':
        return list.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      case 'recently-added':
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case 'recently-used':
        return list.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
      case 'manual':
      default:
        return list.sort((a, b) => a.order - b.order);
    }
  }, [bookmarks, section.sortMode]);

  // Icon mapping
  const renderIcon = (iconName: string) => {
    const props = { className: 'w-3.5 h-3.5', style: { color: section.color || '#8b5cf6' } };
    switch (iconName) {
      case 'Bot':
        return <Bot {...props} />;
      case 'CheckSquare':
        return <CheckSquare {...props} />;
      case 'Palette':
        return <Palette {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'Share2':
        return <Share2 {...props} />;
      case 'Newspaper':
        return <Newspaper {...props} />;
      case 'Tv':
        return <Tv {...props} />;
      case 'ShoppingBag':
        return <ShoppingBag {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      case 'Star':
        return <Star {...props} />;
      case 'Globe':
        return <Globe {...props} />;
      default:
        return <Folder {...props} />;
    }
  };

  const handleAddBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetSectionId(section.id);
    openModal('addBookmark');
  };

  const handleEditSection = () => {
    setShowMenu(false);
    setEditingSection(section);
    openModal('editSection');
  };

  // Drag and drop for bookmarks inside & between sections
  const handleDragStartBookmark = (e: React.DragEvent, bm: Bookmark) => {
    if (layoutLocked) return;
    e.dataTransfer.setData('text/plain', bm.id);
    e.dataTransfer.setData('source-section-id', bm.sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (layoutLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverSection) setDragOverSection(true);
  };

  const handleDragLeave = () => {
    setDragOverSection(false);
  };

  const handleDrop = (e: React.DragEvent, targetBookmark?: Bookmark) => {
    if (layoutLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverSection(false);

    const draggedBmId = e.dataTransfer.getData('text/plain');
    const sourceSectionId = e.dataTransfer.getData('source-section-id');

    if (!draggedBmId) return;

    if (sourceSectionId !== section.id) {
      // Moved from a different section
      moveBookmark(draggedBmId, section.id);
    } else if (targetBookmark && draggedBmId !== targetBookmark.id) {
      // Reordering within the same section
      const currentIndex = bookmarks.findIndex((b) => b.id === draggedBmId);
      const targetIndex = bookmarks.findIndex((b) => b.id === targetBookmark.id);
      if (currentIndex !== -1 && targetIndex !== -1) {
        const reordered = [...bookmarks];
        const [moved] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        reorderBookmarksInSection(section.id, reordered);
      }
    }
  };

  // Layout Grid Classes
  const getLayoutClasses = (layout: SectionLayout) => {
    switch (layout) {
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5';
      case 'large':
        return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2';
      case 'list':
        return 'flex flex-col gap-1.5';
      case 'minimal':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5';
      case 'grid':
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2';
    }
  };

  const isCompactDensity = settings.uiDensity === 'compact';
  const isRelaxedDensity = settings.uiDensity === 'relaxed';
  const paddingClass = isCompactDensity ? 'p-2.5' : isRelaxedDensity ? 'p-4' : 'p-3 sm:p-3.5';

  return (
    <div
      data-section-card="true"
      draggable={!layoutLocked}
      onDragStart={(e) => {
        if (!layoutLocked) onDragStartSection?.(e, section);
      }}
      onDragOver={(e) => {
        if (!layoutLocked) {
          onDragOverSection?.(e);
          handleDragOver(e);
        }
      }}
      onDragLeave={handleDragLeave}
      onDrop={(e) => {
        if (!layoutLocked) {
          onDropSection?.(e, section);
          handleDrop(e);
        }
      }}
      onContextMenu={(e) => openSectionContextMenu(e, section)}
      className={`glass-panel rounded-2xl ${paddingClass} transition-all duration-300 relative ${
        dragOverSection ? 'border-purple-400/80 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 select-none">
        <div
          onClick={() => toggleCollapseSection(section.id)}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="p-1 rounded-md bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            {renderIcon(section.icon)}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs sm:text-[13px] font-semibold tracking-wide text-white group-hover:text-purple-300 transition-colors">
              {section.name}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white/50">
              {sortedBookmarks.length}
            </span>
          </div>
          <button className="text-white/40 group-hover:text-white transition-colors ml-0.5">
            {section.isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Section Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleAddBookmark}
            title="Add bookmark to this section"
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-40 w-44 glass-panel rounded-xl py-1 border border-white/15 shadow-glass-lg text-xs text-white animate-scale-in"
              >
                <button
                  onClick={handleEditSection}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Section</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    duplicateSection(section.id);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Duplicate Section</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    deleteSection(section.id);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Section</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookmarks container */}
      {!section.isCollapsed && (
        <div className="mt-1">
          {sortedBookmarks.length === 0 ? (
            <div
              onClick={handleAddBookmark}
              className="py-6 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-center cursor-pointer transition-colors"
            >
              <p className="text-xs text-white/40">No bookmarks yet</p>
              <p className="text-[11px] text-purple-400 mt-1 font-medium">+ Add bookmark or drag here</p>
            </div>
          ) : (
            <div className={getLayoutClasses(section.layout || 'grid')}>
              {sortedBookmarks.map((bm) => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  layout={section.layout || 'grid'}
                  onDragStart={handleDragStartBookmark}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e, targetBm) => handleDrop(e, targetBm)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
