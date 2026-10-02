import React, { useState, useMemo } from 'react';
import {
  X,
  Bookmark as BookmarkIcon,
  Search,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openDestinationUrl } from '../../utils/chromeApi';
import { getFaviconUrl } from '../../utils/favicon';

export const BookmarksManagerModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    activeBookmarks,
    activeSections,
    deleteBookmark,
    toggleFavoriteBookmark,
    setEditingBookmark,
    openModal,
    settings,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostUsed' | 'alphabetical'>('newest');

  const filteredBookmarks = useMemo(() => {
    let result = activeBookmarks.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.url.toLowerCase().includes(query.toLowerCase());
      const matchesSection = selectedSection === 'all' || b.sectionId === selectedSection;
      return matchesSearch && matchesSection;
    });

    switch (sortBy) {
      case 'alphabetical':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'mostUsed':
        return result.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      case 'oldest':
        return result.sort((a, b) => a.createdAt - b.createdAt);
      case 'newest':
      default:
        return result.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [activeBookmarks, query, selectedSection, sortBy]);

  if (activeModal !== 'bookmarksManager') return null;

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[600px] glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Bookmarks Manager</h2>
              <p className="text-xs text-white/50">
                {activeBookmarks.length} custom bookmarks in current workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeModal();
                openModal('chromeImport');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span>Import / Export</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Section Filter, Sort */}
        <div className="flex flex-wrap items-center gap-2.5 my-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bookmarks by name or URL..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-white/50" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-900/90 focus:outline-none"
            >
              <option value="all">All Sections</option>
              {activeSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/50" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-900/90 focus:outline-none"
            >
              <option value="newest">Recently Added</option>
              <option value="mostUsed">Most Used</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 text-xs text-white/40">
              No bookmarks found matching your criteria.
            </div>
          ) : (
            filteredBookmarks.map((bm) => {
              const sec = activeSections.find((s) => s.id === bm.sectionId);
              return (
                <div
                  key={bm.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={getFaviconUrl(bm.url, bm.favicon)}
                      alt=""
                      className="w-4 h-4 object-contain rounded shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{bm.title}</p>
                      <p className="text-[11px] text-white/40 truncate">{bm.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {sec && (
                      <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/50 border border-white/5">
                        {sec.name}
                      </span>
                    )}

                    <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                      {bm.clickCount || 0} clicks
                    </span>

                    <button
                      onClick={() => toggleFavoriteBookmark(bm.id)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/10 transition-colors"
                      title={bm.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          bm.isFavorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => openDestinationUrl(bm.url, settings.openBookmarksInNewTab)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="Open website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingBookmark(bm);
                        openModal('editBookmark');
                      }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-purple-300 hover:bg-white/10 transition-colors"
                      title="Edit bookmark"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteBookmark(bm.id)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
