import React, { useState, useEffect } from 'react';
import { X, Globe, Bookmark as BookmarkIcon, Palette } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { extractDomain, getFaviconUrl } from '../../utils/favicon';

export const AddBookmarkModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    addBookmark,
    updateBookmark,
    activeSections,
    targetSectionId,
    editingBookmark,
  } = useApp();

  const isEditing = activeModal === 'editBookmark' && !!editingBookmark;
  const isOpen = activeModal === 'addBookmark' || isEditing;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isEditing && editingBookmark) {
      setTitle(editingBookmark.title);
      setUrl(editingBookmark.url);
      setSectionId(editingBookmark.sectionId);
      setDescription(editingBookmark.description || '');
      setColor(editingBookmark.color || '#8b5cf6');
      setIsFavorite(editingBookmark.isFavorite || false);
    } else if (isOpen) {
      setTitle('');
      setUrl('');
      setSectionId(targetSectionId || activeSections[0]?.id || '');
      setDescription('');
      setColor('#8b5cf6');
      setIsFavorite(false);
    }
  }, [isOpen, isEditing, editingBookmark, targetSectionId, activeSections]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) return;

    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const finalTitle = title.trim() || extractDomain(finalUrl) || 'New Bookmark';

    if (isEditing && editingBookmark) {
      await updateBookmark({
        ...editingBookmark,
        title: finalTitle,
        url: finalUrl,
        sectionId: sectionId || activeSections[0]?.id || '',
        description: description.trim() || undefined,
        color,
        isFavorite,
      });
    } else {
      await addBookmark({
        title: finalTitle,
        url: finalUrl,
        sectionId: sectionId || activeSections[0]?.id || '',
        description: description.trim() || undefined,
        color,
        isFavorite,
      });
    }

    closeModal();
  };

  const previewDomain = url ? extractDomain(url) : 'example.com';
  const previewFavicon = url ? getFaviconUrl(url) : '';

  const ACCENT_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#6366f1'];

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? 'Edit Bookmark' : 'Add New Bookmark'}
              </h2>
              <p className="text-xs text-white/50">Save website shortcuts to your dashboard</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="my-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40 mb-2">
            Card Preview
          </p>
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: `${color}25` }}
            >
              {previewFavicon ? (
                <img
                  src={previewFavicon}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4" style={{ color }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                {title || previewDomain || 'Bookmark Title'}
              </p>
              <p className="text-[11px] text-white/50 truncate">
                {description || previewDomain}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Website URL <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. github.com or https://claude.ai"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (!title) {
                  setTitle(extractDomain(e.target.value));
                }
              }}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. GitHub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
              >
                {activeSections.map((sec) => (
                  <option key={sec.id} value={sec.id} className="bg-slate-900 text-white">
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Description <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Open Source Repositories"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {/* Accent Color & Favorite */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-white/60" />
              <div className="flex items-center gap-1.5">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-white/10 border-white/20"
              />
              <span>Favorite</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-violet transition-all"
            >
              {isEditing ? 'Save Changes' : 'Add Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
