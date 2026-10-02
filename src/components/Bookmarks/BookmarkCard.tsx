import React, { useState } from 'react';
import { Star, MoreVertical } from 'lucide-react';
import { Bookmark, SectionLayout } from '../../types';
import { useApp } from '../../context/AppContext';
import { getFaviconUrl, getInitialColor, extractDomain } from '../../utils/favicon';
import { openDestinationUrl } from '../../utils/chromeApi';

interface BookmarkCardProps {
  bookmark: Bookmark;
  layout?: SectionLayout;
  onDragStart?: (e: React.DragEvent, bookmark: Bookmark) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetBookmark: Bookmark) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  layout = 'grid',
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const {
    openContextMenu,
    recordBookmarkClick,
    settings,
  } = useApp();

  const [imgError, setImgError] = useState(false);
  const faviconUrl = getFaviconUrl(bookmark.url, bookmark.favicon);
  const initialLetter = (bookmark.title || extractDomain(bookmark.url) || 'B').charAt(0).toUpperCase();
  const accentColor = bookmark.color || getInitialColor(bookmark.title || bookmark.url);
  const density = settings.uiDensity || 'normal';
  const showDesc = settings.showBookmarkDescriptions;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    recordBookmarkClick(bookmark.id);
    openDestinationUrl(bookmark.url, settings.openBookmarksInNewTab);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, bookmark);
  };

  // 1. Minimal Layout
  if (layout === 'minimal') {
    return (
      <div
        data-bookmark-card="true"
        draggable
        onDragStart={(e) => onDragStart?.(e, bookmark)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, bookmark)}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="group relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.09] border border-white/5 hover:border-white/20 transition-all duration-150 cursor-pointer select-none"
        title={`${bookmark.title} (${bookmark.url})`}
      >
        <div className="w-4 h-4 rounded flex items-center justify-center overflow-hidden shrink-0">
          {!imgError ? (
            <img
              src={faviconUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-3.5 h-3.5 object-contain"
              loading="lazy"
            />
          ) : (
            <span
              className="text-[9px] font-bold text-white w-full h-full flex items-center justify-center rounded"
              style={{ backgroundColor: accentColor }}
            >
              {initialLetter}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-white/90 group-hover:text-white truncate">
          {bookmark.title}
        </span>
        {bookmark.isFavorite && (
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 ml-auto shrink-0 opacity-70" />
        )}
      </div>
    );
  }

  // 2. List Layout
  if (layout === 'list') {
    return (
      <div
        data-bookmark-card="true"
        draggable
        onDragStart={(e) => onDragStart?.(e, bookmark)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, bookmark)}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.035] hover:bg-white/[0.1] border border-white/5 hover:border-white/20 transition-all duration-150 cursor-pointer select-none"
        title={`${bookmark.title} - ${bookmark.url}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform duration-150 group-hover:scale-105"
            style={{ backgroundColor: `${accentColor}25` }}
          >
            {!imgError ? (
              <img
                src={faviconUrl}
                alt=""
                onError={() => setImgError(true)}
                className="w-3.5 h-3.5 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-[10px] font-bold text-white" style={{ color: accentColor }}>
                {initialLetter}
              </span>
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors truncate">
              {bookmark.title}
            </p>
            {showDesc && (
              <p className="text-[10px] text-white/40 truncate">
                {bookmark.description || extractDomain(bookmark.url)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {bookmark.isFavorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 opacity-90" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openContextMenu(e, bookmark);
            }}
            className="p-0.5 rounded text-white/50 hover:text-white hover:bg-white/10"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Compact Layout
  if (layout === 'compact') {
    return (
      <div
        data-bookmark-card="true"
        draggable
        onDragStart={(e) => onDragStart?.(e, bookmark)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, bookmark)}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="group relative flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.035] hover:bg-white/[0.1] border border-white/5 hover:border-white/20 transition-all duration-150 cursor-pointer select-none"
        title={`${bookmark.title} - ${bookmark.url}`}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
          style={{ backgroundColor: `${accentColor}25` }}
        >
          {!imgError ? (
            <img
              src={faviconUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-3.5 h-3.5 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[9px] font-bold text-white" style={{ color: accentColor }}>
              {initialLetter}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-white/90 group-hover:text-white truncate">
          {bookmark.title}
        </span>
        {bookmark.isFavorite && (
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 ml-auto shrink-0 opacity-70" />
        )}
      </div>
    );
  }

  // 4. Large Icons Layout
  if (layout === 'large') {
    return (
      <div
        data-bookmark-card="true"
        draggable
        onDragStart={(e) => onDragStart?.(e, bookmark)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, bookmark)}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.035] hover:bg-white/[0.1] border border-white/5 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer select-none text-center"
        title={`${bookmark.title} - ${bookmark.url}`}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden mb-1.5 shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${accentColor}25` }}
        >
          {!imgError ? (
            <img
              src={faviconUrl}
              alt=""
              onError={() => setImgError(true)}
              className="w-4.5 h-4.5 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-bold text-white" style={{ color: accentColor }}>
              {initialLetter}
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-white/90 group-hover:text-purple-300 transition-colors truncate w-full">
          {bookmark.title}
        </p>
      </div>
    );
  }

  // 5. Default Grid Layout (App Shortcut style - sleek, compact, minimal)
  const isCompactDensity = density === 'compact';
  const isRelaxedDensity = density === 'relaxed';

  return (
    <div
      data-bookmark-card="true"
      draggable
      onDragStart={(e) => onDragStart?.(e, bookmark)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, bookmark)}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`group relative flex items-center rounded-xl bg-white/[0.035] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer select-none ${
        isCompactDensity
          ? 'gap-1.5 px-2 py-1'
          : isRelaxedDensity
          ? 'gap-2.5 px-3 py-2'
          : 'gap-2 px-2.5 py-1.5'
      }`}
      title={`${bookmark.title} - ${bookmark.url}`}
    >
      {/* Favicon container with subtle glow */}
      <div
        className={`rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white/10 transition-transform duration-150 group-hover:scale-105 ${
          isCompactDensity
            ? 'w-5 h-5'
            : isRelaxedDensity
            ? 'w-7 h-7'
            : 'w-6 h-6'
        }`}
        style={{ backgroundColor: `${accentColor}20` }}
      >
        {!imgError ? (
          <img
            src={faviconUrl}
            alt=""
            onError={() => setImgError(true)}
            className={`object-contain ${
              isCompactDensity ? 'w-3 h-3' : isRelaxedDensity ? 'w-4 h-4' : 'w-3.5 h-3.5'
            }`}
            loading="lazy"
          />
        ) : (
          <span
            className={`font-bold text-white ${isCompactDensity ? 'text-[9px]' : 'text-[10px]'}`}
            style={{ color: accentColor }}
          >
            {initialLetter}
          </span>
        )}
      </div>

      {/* Info: clean single-line title for minimal look, description only if enabled */}
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium text-white/90 group-hover:text-white transition-colors truncate ${
            isCompactDensity ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {bookmark.title}
        </p>
        {showDesc && (
          <p className="text-[10px] text-white/40 truncate leading-none mt-0.5">
            {bookmark.description || extractDomain(bookmark.url)}
          </p>
        )}
      </div>

      {/* Favorite Star */}
      {bookmark.isFavorite && (
        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0 opacity-70" />
      )}
    </div>
  );
};
