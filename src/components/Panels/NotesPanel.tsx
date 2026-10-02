import React, { useState } from 'react';
import {
  X,
  Plus,
  Pin,
  Trash2,
  Search,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Note } from '../../types';

export const NotesPanel: React.FC = () => {
  const {
    activeModal,
    closeModal,
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');

  if (activeModal !== 'notes') return null;

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;
    const note = await addNote(
      newTitle.trim() || 'Untitled Note',
      newContent.trim(),
      newColor
    );
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
    setSelectedNote(note);
  };

  const handleUpdateCurrent = (field: 'title' | 'content', val: string) => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, [field]: val };
    setSelectedNote(updated);
    updateNote(updated);
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl h-[560px] glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quick Notes</h2>
              <p className="text-xs text-white/50">Memos, thoughts & scratchpad</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body layout: Sidebar notes list + Editor */}
        <div className="flex flex-1 min-h-0 pt-3 gap-4">
          {/* Notes List Column */}
          <div className="w-1/3 border-r border-white/10 pr-3 flex flex-col">
            {/* Search & Add button */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-input rounded-xl pl-8 pr-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setSelectedNote(null);
                }}
                title="Create Note"
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40">No notes found</div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNote(note);
                        setIsCreating(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-purple-600/25 border-purple-500/40 text-white'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] text-white/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold truncate flex-1">
                          {note.title || 'Untitled Note'}
                        </span>
                        {note.isPinned && (
                          <Pin className="w-3 h-3 text-purple-300 fill-purple-300 ml-1 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-2">{note.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Note Editor Column */}
          <div className="flex-1 flex flex-col pl-1">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex flex-col h-full">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-white placeholder-white/40 pb-2 border-b border-white/10 focus:outline-none mb-3"
                  autoFocus
                />
                <textarea
                  placeholder="Write your note here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="flex-1 w-full bg-transparent text-xs text-white/90 placeholder-white/30 resize-none focus:outline-none leading-relaxed"
                />
                <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          newColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </form>
            ) : selectedNote ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdateCurrent('title', e.target.value)}
                    className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePinNote(selectedNote.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        selectedNote.isPinned
                          ? 'text-purple-400 bg-purple-500/20'
                          : 'text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                      title={selectedNote.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteNote(selectedNote.id);
                        setSelectedNote(null);
                      }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => handleUpdateCurrent('content', e.target.value)}
                  placeholder="Write your note here..."
                  className="flex-1 w-full bg-transparent text-xs text-white/90 placeholder-white/30 resize-none focus:outline-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-white/40">
                <FileText className="w-10 h-10 mb-2 opacity-40 text-purple-400" />
                <p className="text-xs">Select a note from the left or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
