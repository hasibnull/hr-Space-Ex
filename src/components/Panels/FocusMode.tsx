import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playChimeSound, playFlipSound } from '../../utils/sound';
import { FlipCardDigit } from './FlipCardDigit';

export const FocusMode: React.FC = () => {
  const { activeModal, closeModal, activeQuote, focusPresetMinutes } = useApp();

  const [durationMinutes, setDurationMinutes] = useState<number>(focusPresetMinutes || 25);
  const [secondsLeft, setSecondsLeft] = useState<number>((focusPresetMinutes || 25) * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [focusTask, setFocusTask] = useState<string>('Deep Work Session');
  const [isEditingTask, setIsEditingTask] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('45');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(document.fullscreenElement));
  const [isMouseActive, setIsMouseActive] = useState<boolean>(true);
  const mouseTimerRef = useRef<number | null>(null);

  // Initialize duration when modal opens or preset changes
  useEffect(() => {
    if (activeModal === 'focus') {
      const initialMins = focusPresetMinutes || 25;
      setDurationMinutes(initialMins);
      setSecondsLeft(initialMins * 60);
      setIsRunning(false);
    }
  }, [activeModal, focusPresetMinutes]);

  // Keep fullscreen state in sync with browser
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Timer interval loop
  useEffect(() => {
    let interval: number | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) playChimeSound();
            return 0;
          }
          if (soundEnabled) playFlipSound();
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, soundEnabled]);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const handleSetDuration = (mins: number) => {
    setIsCustomDuration(false);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0 && val <= 180) {
      setDurationMinutes(val);
      setSecondsLeft(val * 60);
      setIsRunning(false);
      setIsCustomDuration(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    closeModal();
  };

  const handleMouseMove = () => {
    setIsMouseActive(true);
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    if (isFullscreen && isRunning) {
      mouseTimerRef.current = window.setTimeout(() => {
        setIsMouseActive(false);
      }, 3500);
    }
  };

  // Handle keyboard shortcuts inside Focus Mode (Space to pause, F to fullscreen, R to reset)
  useEffect(() => {
    if (activeModal !== 'focus') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTask) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (soundEnabled) playFlipSound();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, isEditingTask, soundEnabled, isRunning, closeModal, durationMinutes, handleReset]);

  if (activeModal !== 'focus') return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const minTens = Math.floor(minutes / 10);
  const minOnes = minutes % 10;
  const secTens = Math.floor(seconds / 10);
  const secOnes = seconds % 10;

  const progressPercent = ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between text-white select-none transition-all duration-500 animate-fade-in ${
        isFullscreen
          ? 'bg-[#040508] p-4 sm:p-8 cursor-default'
          : 'bg-[#06080d]/90 backdrop-blur-2xl p-6 sm:p-10'
      }`}
    >
      {/* Top Header Controls (fades out during fullscreen focus) */}
      <div
        className={`w-full max-w-5xl flex items-center justify-between transition-opacity duration-300 ${
          isFullscreen && isRunning && !isMouseActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-glow-violet">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white/90">
              Focus Station
            </h2>
            <p className="text-[10px] text-white/40">Pomodoro 3D Flip Clock</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={soundEnabled ? 'Mechanical Flip & Chime Sounds: Enabled (M)' : 'Sounds: Muted (M)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-purple-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-white/40" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all ${
              isFullscreen
                ? 'bg-purple-600 text-white shadow-glow-violet'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen Focus (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            title="Exit Focus Mode (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Exit (Esc)</span>
          </button>
        </div>
      </div>

      {/* Center Hero: Flip Clock (Occupies ~50% of the screen!) */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-6xl relative z-10">
        {/* Ambient violet glow backdrop behind the clock */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[350px] sm:h-[450px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

        {/* Preset duration selectors */}
        <div
          className={`flex items-center gap-2 mb-6 sm:mb-8 glass-pill p-1.5 rounded-full text-xs transition-opacity duration-300 ${
            isFullscreen && isRunning && !isMouseActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {[
            { label: '15 min', val: 15 },
            { label: '25 min', val: 25 },
            { label: '50 min', val: 50 },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => handleSetDuration(item.val)}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                durationMinutes === item.val && !isCustomDuration
                  ? 'bg-purple-600 text-white shadow-glow-violet'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Custom Duration Button */}
          {isCustomDuration ? (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-1 px-2">
              <input
                type="number"
                min="1"
                max="180"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-12 bg-white/10 border border-purple-400 rounded-lg px-2 py-0.5 text-xs text-white text-center focus:outline-none"
                autoFocus
              />
              <span className="text-[11px] text-white/60">min</span>
              <button type="submit" className="px-2 py-0.5 bg-purple-600 rounded-md text-xs font-bold">
                OK
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCustomDuration(true)}
              className="px-3 py-1.5 rounded-full text-white/60 hover:text-white"
            >
              Custom
            </button>
          )}
        </div>

        {/* Massive Split-Flap Flip Clock (50%+ screen width!) */}
        <div className="flex flex-col items-center justify-center my-2 sm:my-4 w-full">
          <div className="flex items-center justify-center gap-2.5 sm:gap-5 md:gap-8 lg:gap-10">
            {/* Minutes Digits */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
                <FlipCardDigit digit={minTens} isGiant={isFullscreen} />
                <FlipCardDigit digit={minOnes} isGiant={isFullscreen} />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.35em] text-purple-300/70 mt-4 sm:mt-5 font-bold">
                MINUTES
              </span>
            </div>

            {/* Glowing Colon Separator */}
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 px-1 sm:px-3 pb-8 sm:pb-12">
              <div
                className={`rounded-full bg-purple-400 shadow-[0_0_24px_rgba(168,85,247,1)] ${
                  isFullscreen ? 'w-3.5 sm:w-5 h-3.5 sm:h-5' : 'w-3 sm:w-4 h-3 sm:h-4'
                } ${isRunning ? 'animate-pulse' : 'opacity-80'}`}
              />
              <div
                className={`rounded-full bg-purple-400 shadow-[0_0_24px_rgba(168,85,247,1)] ${
                  isFullscreen ? 'w-3.5 sm:w-5 h-3.5 sm:h-5' : 'w-3 sm:w-4 h-3 sm:h-4'
                } ${isRunning ? 'animate-pulse' : 'opacity-80'}`}
              />
            </div>

            {/* Seconds Digits */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
                <FlipCardDigit digit={secTens} isGiant={isFullscreen} />
                <FlipCardDigit digit={secOnes} isGiant={isFullscreen} />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.35em] text-purple-300/70 mt-4 sm:mt-5 font-bold">
                SECONDS
              </span>
            </div>
          </div>

          {/* Elegant ambient progress bar */}
          <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl h-2 bg-white/10 rounded-full mt-7 sm:mt-9 overflow-hidden border border-white/5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 transition-all duration-1000 ease-linear shadow-glow-violet"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Task Target */}
        <div
          className={`max-w-md w-full mt-4 sm:mt-6 mb-6 transition-opacity duration-300 ${
            isFullscreen && isRunning && !isMouseActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {isEditingTask ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsEditingTask(false);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                placeholder="What are you focusing on?"
                className="w-full glass-input rounded-xl px-4 py-2 text-center text-sm text-white focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-purple-600 rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </form>
          ) : (
            <div
              onClick={() => setIsEditingTask(true)}
              className="group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors"
              title="Click to edit task"
            >
              <p className="text-[11px] uppercase tracking-widest text-purple-300 font-semibold mb-1">
                Current Objective
              </p>
              <p className="text-base sm:text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                "{focusTask}"
              </p>
            </div>
          )}
        </div>

        {/* Timer Play / Pause / Reset Controls */}
        <div
          className={`flex items-center gap-4 transition-opacity duration-300 ${
            isFullscreen && isRunning && !isMouseActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <button
            onClick={() => {
              if (soundEnabled) playFlipSound();
              setIsRunning(!isRunning);
            }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                : 'bg-purple-600 hover:bg-purple-500 shadow-glow-violet scale-105'
            }`}
            title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>

          <button
            onClick={handleReset}
            className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-white/70 hover:text-white transition-all"
            title="Reset Timer (R)"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer info & motivational quote */}
      <div
        className={`w-full max-w-4xl flex items-center justify-between pb-2 text-xs text-white/40 transition-opacity duration-300 ${
          isFullscreen && isRunning && !isMouseActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <span className="hidden sm:inline font-mono text-[11px]">
          Space: {isRunning ? 'Pause' : 'Start'} • F: Fullscreen • R: Reset • Esc: Exit
        </span>

        {activeQuote ? (
          <p className="italic text-white/50 mx-auto sm:mx-0 truncate max-w-md">
            "{activeQuote.text}"
          </p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};
