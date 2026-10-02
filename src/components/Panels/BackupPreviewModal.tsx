import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Folder,
  Bookmark,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BackupPreviewModal: React.FC = () => {
  const {
    activeModal,
    backupPreviewData,
    confirmImportBackup,
    cancelBackupPreview,
  } = useApp();

  if (activeModal !== 'backupPreview' || !backupPreviewData) return null;

  const { counts } = backupPreviewData;

  return (
    <div
      onClick={cancelBackupPreview}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Confirm Backup Restore</h2>
              <p className="text-xs text-white/50">Preview items before importing</p>
            </div>
          </div>
          <button
            onClick={cancelBackupPreview}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="my-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p>
            Importing this backup will restore the entities listed below into your local database.
          </p>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
            <Layers className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-lg font-bold text-white font-mono">{counts.workspaces}</p>
              <p className="text-[11px] text-white/50">Workspaces</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
            <Folder className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-lg font-bold text-white font-mono">{counts.sections}</p>
              <p className="text-[11px] text-white/50">Sections</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
            <Bookmark className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-lg font-bold text-white font-mono">{counts.bookmarks}</p>
              <p className="text-[11px] text-white/50">Bookmarks</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-lg font-bold text-white font-mono">{counts.notes}</p>
              <p className="text-[11px] text-white/50">Notes</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3 col-span-2">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-white font-mono">{counts.tasks}</p>
              <p className="text-[11px] text-white/50">Tasks & Checklists</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={cancelBackupPreview}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmImportBackup}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-violet transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};
