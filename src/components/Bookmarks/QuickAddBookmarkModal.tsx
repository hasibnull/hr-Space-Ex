import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Globe,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCurrentActiveTab } from '../../utils/chromeApi';

export const QuickAddBookmarkModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    activeSections,
    activeWorkspace,
    addBookmark,
    quickAddData,
    showToast,
  } = useApp();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFetchingTab, setIsFetchingTab] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'quickBookmark') {
      setTitle(quickAddData?.title || '');
      setUrl(quickAddData?.url || '');
      setTagsInput('');
      setSectionId(quickAddData?.sectionId || (activeSections[0]?.id ?? ''));

      // If URL is empty, try to fetch current active Chrome tab
      if (!quickAddData?.url) {
        setIsFetchingTab(true);
        getCurrentActiveTab().then((tab) => {
          setIsFetchingTab(false);
          if (tab?.url) {
            setUrl(tab.url);
            if (!quickAddData?.title && tab.title) {
              setTitle(tab.title);
            }
          }
        });
      }

      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activeModal, quickAddData, activeSections]);

  if (activeModal !== 'quickBookmark') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showToast('Title and URL are required', 'error');
      return;
    }

    const targetSection = sectionId || (activeSections[0]?.id ?? '');
    if (!targetSection) {
      showToast('Please select or create a section first', 'error');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await addBookmark({
      title: title.trim(),
      url: url.trim(),
      sectionId: targetSection,
      isFavorite: false,
      tags: tags.length ? tags : undefined,
    });

    closeModal();
  };

  const handleFetchCurrentTab = async () => {
    setIsFetchingTab(true);
    const tab = await getCurrentActiveTab();
    setIsFetchingTab(false);
    if (tab && tab.url) {
      setUrl(tab.url);
      if (tab.title) setTitle(tab.title);
      showToast('Loaded active tab information', 'success');
    } else {
      showToast('No active page detected or browser permission not granted', 'info');
    }
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quick Add Bookmark</h2>
              <p className="text-xs text-white/50">Press Enter to save instantly</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">Title</label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. GitHub Dashboard, Figma..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {/* URL + Current Tab Grabber */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-white/80">URL</label>
              <button
                type="button"
                onClick={handleFetchCurrentTab}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {isFetchingTab ? 'Detecting tab...' : 'Use Current Tab'}
              </button>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
            >
              {activeSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">Tags (Optional)</label>
            <div className="relative">
              <Tag className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="design, dev, tools (comma-separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-4">
            <span className="text-[11px] text-white/40">Workspace: {activeWorkspace.name}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-violet transition-all"
              >
                Save (Enter)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
