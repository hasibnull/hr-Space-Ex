import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  Bookmark as BookmarkIcon,
  CheckCircle2,
  Folder,
  FileJson,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getChromeBookmarksTree,
  convertChromeBookmarks,
} from '../../utils/chromeApi';
import { dbSections, dbBookmarks } from '../../db/indexedDB';
import { ChromeBookmarkNode } from '../../types';

export const ChromeImportExportModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    activeWorkspace,
    exportDataJson,
    importDataJson,
    showToast,
  } = useApp();

  const [chromeNodes, setChromeNodes] = useState<ChromeBookmarkNode[]>([]);
  const [loadingChrome, setLoadingChrome] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedSummary, setImportedSummary] = useState<{ sections: number; bookmarks: number } | null>(null);

  useEffect(() => {
    if (activeModal === 'chromeImport') {
      setLoadingChrome(true);
      getChromeBookmarksTree()
        .then((tree) => {
          setChromeNodes(tree);
          setLoadingChrome(false);
        })
        .catch(() => setLoadingChrome(false));
    }
  }, [activeModal]);

  if (activeModal !== 'chromeImport') return null;

  const handleImportChrome = async () => {
    setImporting(true);
    try {
      const { sections, bookmarks } = convertChromeBookmarks(chromeNodes, activeWorkspace.id);

      if (sections.length > 0) {
        await dbSections.saveAll(sections);
      }
      if (bookmarks.length > 0) {
        await dbBookmarks.saveAll(bookmarks);
      }

      setImportedSummary({
        sections: sections.length,
        bookmarks: bookmarks.length,
      });

      showToast(`Imported ${bookmarks.length} bookmarks and ${sections.length} sections!`, 'success');
      // Trigger full state reload in parent
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e) {
      console.error(e);
      showToast('Error importing bookmarks', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const json = await exportDataJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup JSON file downloaded!', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = await importDataJson(content);
        if (ok) {
          closeModal();
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Import & Export Bookmarks</h2>
              <p className="text-xs text-white/50">Chrome bookmarks integration and JSON backup</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chrome Bookmarks Section */}
        <div className="my-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-purple-400" />
                <span>Import from Chrome Bookmarks</span>
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                Automatically organize Chrome bookmark folders into MySpace sections.
              </p>
            </div>
            <button
              onClick={handleImportChrome}
              disabled={importing || loadingChrome}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-glow-violet transition-all shrink-0"
            >
              {importing ? 'Importing...' : 'Import into MySpace'}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300/90">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Your existing Chrome bookmarks will NOT be modified or deleted. They are safely copied into your MySpace dashboard.
            </span>
          </div>

          {importedSummary && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Success! Added {importedSummary.bookmarks} bookmarks and {importedSummary.sections} sections.
              </span>
            </div>
          )}
        </div>

        {/* JSON Backup & Restore */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-cyan-400" />
              <span>Backup & Restore (JSON)</span>
            </h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Export all workspaces, bookmarks, wallpapers, and notes into an offline backup file.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup (JSON)</span>
            </button>

            <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
