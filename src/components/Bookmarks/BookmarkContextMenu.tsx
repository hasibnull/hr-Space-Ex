import React, { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Globe,
  Star,
  Copy,
  Edit2,
  Files,
  Trash2,
  FolderInput,
  Type,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openDestinationUrl } from '../../utils/chromeApi';

export const BookmarkContextMenu: React.FC = () => {
  const {
    contextMenu,
    closeContextMenu,
    toggleFavoriteBookmark,
    deleteBookmark,
    duplicateBookmark,
    moveBookmark,
    setEditingBookmark,
    openModal,
    recordBookmarkClick,
    activeSections,
    showToast,
  } = useApp();

  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const handleScroll = () => closeContextMenu();

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [closeContextMenu]);

  if (!contextMenu) return null;

  const { bookmark, x, y } = contextMenu;

  const handleOpenNewTab = () => {
    recordBookmarkClick(bookmark.id);
    openDestinationUrl(bookmark.url, true);
    closeContextMenu();
  };

  const handleOpenCurrentTab = () => {
    recordBookmarkClick(bookmark.id);
    openDestinationUrl(bookmark.url, false);
    closeContextMenu();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      showToast('URL copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy URL', 'error');
    }
    closeContextMenu();
  };

  const handleCopyName = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.title);
      showToast('Bookmark name copied', 'success');
    } catch {
      showToast('Failed to copy name', 'error');
    }
    closeContextMenu();
  };

  const handleEdit = () => {
    setEditingBookmark(bookmark);
    openModal('editBookmark');
    closeContextMenu();
  };

  const handleDuplicate = () => {
    duplicateBookmark(bookmark.id);
    closeContextMenu();
  };

  const handleToggleFavorite = () => {
    toggleFavoriteBookmark(bookmark.id);
    closeContextMenu();
  };

  const handleMoveTo = (targetSectionId: string) => {
    moveBookmark(bookmark.id, targetSectionId);
    closeContextMenu();
  };

  const handleDelete = () => {
    deleteBookmark(bookmark.id);
    closeContextMenu();
  };

  const otherSections = activeSections.filter((s) => s.id !== bookmark.sectionId);

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 w-56 glass-panel rounded-2xl py-1.5 border border-white/20 shadow-glass-lg text-xs text-white animate-scale-in select-none"
    >
      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
        <p className="font-semibold text-white truncate">{bookmark.title}</p>
        <p className="text-[10px] text-white/50 truncate font-mono">{bookmark.url}</p>
      </div>

      <button
        onClick={handleOpenNewTab}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
        <span>Open in New Tab</span>
      </button>

      <button
        onClick={handleOpenCurrentTab}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Globe className="w-3.5 h-3.5 text-blue-400" />
        <span>Open in Current Tab</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleCopyUrl}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Copy className="w-3.5 h-3.5 text-cyan-400" />
        <span>Copy URL</span>
      </button>

      <button
        onClick={handleCopyName}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Type className="w-3.5 h-3.5 text-indigo-400" />
        <span>Copy Name</span>
      </button>

      <button
        onClick={handleToggleFavorite}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Star
          className={`w-3.5 h-3.5 ${
            bookmark.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white/60'
          }`}
        />
        <span>{bookmark.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
      </button>

      {/* Move to Section */}
      {otherSections.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setShowMoveSubmenu(true)}
          onMouseLeave={() => setShowMoveSubmenu(false)}
        >
          <button
            className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-white/10 transition-colors text-white/90 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <FolderInput className="w-3.5 h-3.5 text-emerald-400" />
              <span>Move to Section</span>
            </div>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>

          {showMoveSubmenu && (
            <div className="absolute left-full top-0 ml-1 w-44 glass-panel rounded-xl py-1 border border-white/20 shadow-glass-lg animate-scale-in">
              {otherSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleMoveTo(sec.id)}
                  className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 truncate transition-colors"
                >
                  {sec.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleEdit}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Edit Bookmark</span>
      </button>

      <button
        onClick={handleDuplicate}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 transition-colors text-white/90 hover:text-white"
      >
        <Files className="w-3.5 h-3.5 text-indigo-400" />
        <span>Duplicate</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={handleDelete}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
};
