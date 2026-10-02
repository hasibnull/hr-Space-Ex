import React, { useState, useRef } from 'react';
import { Search, Mic, MicOff, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isLikelyUrl, buildSearchUrl } from '../../utils/formatters';
import { openDestinationUrl } from '../../utils/chromeApi';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { SearchEngine } from '../../types';

export const SearchBar: React.FC = () => {
  const { settings, updateSettings, openModal } = useApp();
  const [query, setQuery] = useState('');
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExecuteSearch = (searchVal: string) => {
    const val = searchVal.trim();
    if (!val) return;

    if (isLikelyUrl(val)) {
      openDestinationUrl(val, settings.openBookmarksInNewTab);
    } else {
      const url = buildSearchUrl(val, settings.searchEngine);
      openDestinationUrl(url, settings.openBookmarksInNewTab);
    }
  };

  const { isListening, supported: speechSupported, startListening } = useSpeechRecognition((transcript) => {
    setQuery(transcript);
    handleExecuteSearch(transcript);
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch(query);
    }
  };

  const selectEngine = (engine: SearchEngine) => {
    updateSettings({ searchEngine: engine });
    setShowEngineMenu(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 my-4 z-20">
      <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-3 transition-all duration-300 hover:border-white/25 focus-within:border-purple-400/60 focus-within:shadow-[0_0_30px_rgba(139,92,246,0.25)]">
        {/* Search Engine Selector Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEngineMenu(!showEngineMenu)}
            className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
            title={`Active search engine: ${settings.searchEngine}`}
          >
            <Search className="w-4 h-4 text-purple-400" />
            <span className="capitalize hidden sm:inline">{settings.searchEngine}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showEngineMenu && (
            <div className="absolute left-0 top-12 z-50 w-44 glass-panel rounded-xl py-1 shadow-glass-lg border border-white/15 text-xs text-white animate-scale-in">
              {(['google', 'duckduckgo', 'bing', 'brave', 'ecosia'] as SearchEngine[]).map((eng) => (
                <button
                  key={eng}
                  onClick={() => selectEngine(eng)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between capitalize hover:bg-white/10 transition-colors ${
                    settings.searchEngine === eng ? 'text-purple-400 font-semibold bg-white/5' : 'text-white/80'
                  }`}
                >
                  <span>{eng}</span>
                  {settings.searchEngine === eng && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search Google or type a URL..."
          className="flex-1 bg-transparent border-none text-white text-sm md:text-base placeholder-white/40 focus:outline-none px-1 py-2 font-normal"
          autoFocus
        />

        {/* Action icons: Voice Search, Quick Command Palette, Shortcut Hint */}
        <div className="flex items-center gap-1.5 pr-2">
          {/* Web Speech Voice Search */}
          {speechSupported && (
            <button
              type="button"
              onClick={startListening}
              title={isListening ? 'Listening...' : 'Voice Search'}
              className={`p-2 rounded-xl text-white/60 hover:text-white transition-all ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'hover:bg-white/10'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => openModal('commandPalette')}
            title="Global Search & Quick Actions (Ctrl/Cmd + K)"
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-purple-400/80" />
          </button>

          {/* Keyboard shortcut badge */}
          <kbd
            onClick={() => openModal('commandPalette')}
            className="hidden md:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono text-white/40 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
    </div>
  );
};
