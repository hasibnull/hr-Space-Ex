import React, { useEffect, useRef, useState } from 'react';
import {
  Edit2,
  Files,
  ArrowUp,
  ArrowDown,
  Minimize2,
  Maximize2,
  Palette,
  Trash2,
  Plus,
  LayoutGrid,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SectionLayout, BookmarkSortMode } from '../../types';

export const SectionContextMenu: React.FC = () => {
  const {
    sectionContextMenu,
    closeSectionContextMenu,
    setEditingSection,
    duplicateSection,
    deleteSection,
    toggleCollapseSection,
    updateSection,
    setSectionSortMode,
    openModal,
    setTargetSectionId,
    activeSections,
    reorderSections,
    showToast,
  } = useApp();

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeSectionContextMenu();
      }
    };
    const handleScroll = () => closeSectionContextMenu();

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [closeSectionContextMenu]);

  if (!sectionContextMenu) return null;

  const { section, x, y } = sectionContextMenu;

  const handleEdit = () => {
    setEditingSection(section);
    openModal('editSection');
    closeSectionContextMenu();
  };

  const handleDuplicate = () => {
    duplicateSection(section.id);
    closeSectionContextMenu();
  };

  const handleAddBookmark = () => {
    setTargetSectionId(section.id);
    openModal('addBookmark');
    closeSectionContextMenu();
  };

  const handleToggleCollapse = () => {
    toggleCollapseSection(section.id);
    closeSectionContextMenu();
  };

  const handleMoveUp = () => {
    const idx = activeSections.findIndex((s) => s.id === section.id);
    if (idx > 0) {
      const copy = [...activeSections];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      reorderSections(copy);
      showToast(`Moved "${section.name}" up`, 'info');
    }
    closeSectionContextMenu();
  };

  const handleMoveDown = () => {
    const idx = activeSections.findIndex((s) => s.id === section.id);
    if (idx < activeSections.length - 1) {
      const copy = [...activeSections];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      reorderSections(copy);
      showToast(`Moved "${section.name}" down`, 'info');
    }
    closeSectionContextMenu();
  };

  const handleChangeLayout = (layout: SectionLayout) => {
    updateSection({ ...section, layout });
    showToast(`Layout changed to: ${layout}`, 'info');
    closeSectionContextMenu();
  };

  const handleChangeSort = (sortMode: BookmarkSortMode) => {
    setSectionSortMode(section.id, sortMode);
    closeSectionContextMenu();
  };

  const handleDelete = () => {
    deleteSection(section.id);
    closeSectionContextMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 w-56 glass-panel rounded-2xl py-1.5 border border-white/20 shadow-glass-lg text-xs text-white animate-scale-in select-none"
    >
      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
        <p className="font-semibold text-white truncate">{section.name}</p>
        <p className="text-[10px] text-white/50">Section Settings</p>
      </div>

      <button
        onClick={handleAddBookmark}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Plus className="w-3.5 h-3.5 text-purple-400" />
        <span>Add Bookmark</span>
      </button>

      <button
        onClick={handleEdit}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
        <span>Rename & Customize</span>
      </button>

      {/* Change Layout Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setShowLayoutMenu(true)}
        onMouseLeave={() => setShowLayoutMenu(false)}
      >
        <button
          className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-white/10 transition-colors text-white/90 hover:text-white"
        >
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Layout: <span className="capitalize text-white/60">{section.layout}</span></span>
          </div>
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>

        {showLayoutMenu && (
          <div className="absolute left-full top-0 ml-1 w-36 glass-panel rounded-xl py-1 border border-white/20 shadow-glass-lg animate-scale-in">
            {(['grid', 'compact', 'large', 'list', 'minimal'] as SectionLayout[]).map((lay) => (
              <button
                key={lay}
                onClick={() => handleChangeLayout(lay)}
                className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-white/10 transition-colors ${
                  section.layout === lay ? 'text-purple-400 font-semibold bg-white/5' : 'text-white/80'
                }`}
              >
                {lay}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Smart Sort Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setShowSortMenu(true)}
        onMouseLeave={() => setShowSortMenu(false)}
      >
        <button
          className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-white/10 transition-colors text-white/90 hover:text-white"
        >
          <div className="flex items-center gap-2.5">
            <ListFilter className="w-3.5 h-3.5 text-amber-400" />
            <span>Sort Bookmarks</span>
          </div>
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>

        {showSortMenu && (
          <div className="absolute left-full top-0 ml-1 w-40 glass-panel rounded-xl py-1 border border-white/20 shadow-glass-lg animate-scale-in">
            {[
              { id: 'manual', label: 'Manual Order' },
              { id: 'alpha', label: 'Alphabetical' },
              { id: 'most-used', label: 'Most Used' },
              { id: 'recently-added', label: 'Recently Added' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChangeSort(item.id as BookmarkSortMode)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${
                  (section.sortMode || 'manual') === item.id ? 'text-purple-400 font-semibold bg-white/5' : 'text-white/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleToggleCollapse}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        {section.isCollapsed ? (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Expand Section</span>
          </>
        ) : (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Collapse Section</span>
          </>
        )}
      </button>

      <button
        onClick={handleMoveUp}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
        <span>Move Up</span>
      </button>

      <button
        onClick={handleMoveDown}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
        <span>Move Down</span>
      </button>

      <button
        onClick={handleDuplicate}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Files className="w-3.5 h-3.5 text-indigo-400" />
        <span>Duplicate Section</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleDelete}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete Section</span>
      </button>
    </div>
  );
};
