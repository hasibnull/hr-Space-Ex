import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, Quote as QuoteIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuoteWidget: React.FC = () => {
  const { activeQuote, nextRandomQuote, addQuote, deleteQuote, settings, minimalMode, zenMode } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  if (!settings.quoteEnabled || !activeQuote || minimalMode || zenMode) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    await addQuote(newText.trim(), newAuthor.trim() || undefined);
    setNewText('');
    setNewAuthor('');
    setIsAdding(false);
  };

  return (
    <div className="group relative flex flex-col items-center justify-center my-1 select-none max-w-xl mx-auto px-4">
      {isAdding ? (
        <form onSubmit={handleAdd} className="w-full glass-card rounded-xl p-3 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Type your motivational quote..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              placeholder="Author (optional)"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-white/40 focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-purple-600/80 hover:bg-purple-600 text-white rounded-md text-xs font-medium transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2 text-center text-xs md:text-sm text-white/70 hover:text-white/95 transition-all duration-300">
          <QuoteIcon className="w-3.5 h-3.5 text-purple-400/80 shrink-0 opacity-70" />
          <span className="italic font-light tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            "{activeQuote.text}"
          </span>
          {activeQuote.author && (
            <span className="text-white/40 font-normal text-xs">
              — {activeQuote.author}
            </span>
          )}

          {/* Quick interactive action buttons visible on hover */}
          <div className="hidden group-hover:flex items-center gap-1.5 ml-2 transition-opacity duration-200">
            <button
              onClick={nextRandomQuote}
              title="Next quote"
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={() => setIsAdding(true)}
              title="Add custom quote"
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            {activeQuote.isCustom && (
              <button
                onClick={() => deleteQuote(activeQuote.id)}
                title="Delete quote"
                className="p-1 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
