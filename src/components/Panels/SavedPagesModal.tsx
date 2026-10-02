import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Search,
  ExternalLink,
  Trash2,
  Tag,
  Copy,
  Download,
  Calendar,
  Edit3,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SavedWebPage } from '../../types';
import { downloadFile } from '../../utils/browserTools';

export const SavedPagesModal: React.FC = () => {
  const { activeModal, closeModal, savedPages, deleteSavedPage, updateSavedPage, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');

  const isOpen = activeModal === 'savedPages';
  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(savedPages.flatMap((page) => page.tags || []))
  );

  const filteredPages = savedPages.filter((page) => {
    const matchesTag = selectedTag === 'all' || (page.tags && page.tags.includes(selectedTag));
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      page.title.toLowerCase().includes(q) ||
      page.url.toLowerCase().includes(q) ||
      (page.selectedText || '').toLowerCase().includes(q) ||
      (page.notes || '').toLowerCase().includes(q);
    return matchesTag && matchesQuery;
  });

  const handleStartEditNotes = (page: SavedWebPage) => {
    setEditingClipId(page.id);
    setEditingNotes(page.notes || '');
  };

  const handleSaveNotes = async (page: SavedWebPage) => {
    await updateSavedPage({ ...page, notes: editingNotes });
    setEditingClipId(null);
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard', 'success');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(savedPages, null, 2);
    downloadFile(`myspace-web-clips-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json');
    showToast('Saved clips exported as JSON', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b10]/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                MySpace Web Clipper Archive
                <span className="text-xs font-normal text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {savedPages.length} Saved Clips
                </span>
              </h2>
              <p className="text-xs text-white/40">
                Local-first private research repository with highlights and snapshots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              title="Export all clips as JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>

            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-white/[0.01]">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search saved clips & highlights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
            />
          </div>

          {/* Tags Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                selectedTag === 'all'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              All Clips
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition-all ${
                  selectedTag === t
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Clips Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPages.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Bookmark className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm text-white/40">No saved web clips found.</p>
              <p className="text-xs text-white/30">
                Right-click any page or text and select &quot;MySpace &rarr; Save Page&quot; to build your personal archive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 p-4 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {page.favicon ? (
                          <img
                            src={page.favicon}
                            alt=""
                            className="w-4 h-4 rounded shrink-0 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Bookmark className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                        <h3 className="text-sm font-semibold text-white/90 truncate leading-snug">
                          {page.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleCopyUrl(page.url)}
                          title="Copy URL"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in new tab"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => deleteSavedPage(page.id)}
                          title="Delete clip"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* URL */}
                    <p className="text-[11px] text-white/40 truncate font-mono">{page.url}</p>

                    {/* Screenshot thumbnail if present */}
                    {page.screenshot && (
                      <div className="rounded-lg overflow-hidden border border-white/10 max-h-36 bg-black/40">
                        <img
                          src={page.screenshot}
                          alt="Clipped page thumbnail"
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Selected text / Highlight quote */}
                    {page.selectedText && (
                      <blockquote className="text-xs text-slate-300/80 italic border-l-2 border-purple-500/50 pl-2.5 py-0.5 line-clamp-3 bg-purple-500/[0.03] rounded-r">
                        &quot;{page.selectedText}&quot;
                      </blockquote>
                    )}

                    {/* Notes Section */}
                    {editingClipId === page.id ? (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={2}
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          placeholder="Add your thoughts or takeaways..."
                          className="w-full p-2 rounded-lg bg-black/40 border border-purple-500/50 text-xs text-white placeholder:text-white/30 outline-none resize-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleSaveNotes(page)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 text-white text-xs font-medium"
                          >
                            <Check className="w-3 h-3" /> Save Note
                          </button>
                          <button
                            onClick={() => setEditingClipId(null)}
                            className="px-2 py-1 rounded-md bg-white/5 text-white/60 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : page.notes ? (
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/70 flex items-start justify-between gap-2 group/note">
                        <p className="line-clamp-2">{page.notes}</p>
                        <button
                          onClick={() => handleStartEditNotes(page)}
                          className="opacity-0 group-hover/note:opacity-100 text-white/40 hover:text-white"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditNotes(page)}
                        className="text-[11px] text-white/30 hover:text-purple-400 flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" /> Add personal note
                      </button>
                    )}
                  </div>

                  {/* Footer: Tags & Date */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                    <div className="flex items-center gap-1 flex-wrap">
                      {page.tags?.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(page.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
