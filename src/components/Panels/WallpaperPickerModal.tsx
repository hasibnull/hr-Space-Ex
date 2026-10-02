import React, { useState, useRef } from 'react';
import {
  X,
  Image,
  Upload,
  Link as LinkIcon,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WALLPAPER_PRESETS, DEFAULT_WALLPAPER } from '../../db/initialData';

export const WallpaperPickerModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    wallpaper,
    updateWallpaperConfig,
    setWallpaperPreset,
    uploadCustomWallpaper,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'adjust'>('presets');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activeModal !== 'wallpaper') return null;

  const handleApplyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    await updateWallpaperConfig({
      type: 'url',
      url: urlInput.trim(),
    });
    showToast('Custom wallpaper URL applied!', 'success');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image file too large (max 10MB)', 'error');
        return;
      }
      await uploadCustomWallpaper(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadCustomWallpaper(file);
    }
  };

  const resetFilters = async () => {
    await updateWallpaperConfig({
      brightness: DEFAULT_WALLPAPER.brightness,
      blur: DEFAULT_WALLPAPER.blur,
      contrast: DEFAULT_WALLPAPER.contrast,
      saturation: DEFAULT_WALLPAPER.saturation,
      overlayOpacity: DEFAULT_WALLPAPER.overlayOpacity,
      vignette: DEFAULT_WALLPAPER.vignette,
    });
    showToast('Adjustments reset to defaults', 'info');
  };

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl glass-panel rounded-3xl p-6 border border-white/20 shadow-glass-lg animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Wallpaper Gallery</h2>
              <p className="text-xs text-white/50">Curated cinematic backgrounds & visual tuning</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 my-4 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'presets' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'upload' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Upload / Custom URL
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'adjust' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Visual Adjustments
          </button>
        </div>

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {WALLPAPER_PRESETS.map((preset) => {
              const isSelected = wallpaper.presetId === preset.id;
              const isGrad = preset.url.startsWith('linear-gradient');
              return (
                <div
                  key={preset.id}
                  onClick={() => setWallpaperPreset(preset.id)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-purple-400 ring-2 ring-purple-500/40 shadow-glow-violet scale-[1.02]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div
                    className="w-full h-28 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: isGrad ? preset.url : `url(${preset.url})`,
                    }}
                  />
                  <div className="p-2.5 bg-black/60 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-white truncate">{preset.name}</p>
                    <p className="text-[10px] text-white/50 truncate">{preset.description}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-semibold">
                      Active
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload / Custom URL Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Drag & drop upload area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-purple-400/80 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.05]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Click or drag & drop an image here</p>
              <p className="text-xs text-white/40 mt-1">Supports PNG, JPG, WebP up to 10MB</p>
            </div>

            {/* Direct URL input */}
            <form onSubmit={handleApplyUrl} className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="Or paste an image URL (e.g. Unsplash)..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                Apply URL
              </button>
            </form>
          </div>
        )}

        {/* Visual Adjustments Tab */}
        {activeTab === 'adjust' && (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs text-white/60">Tweak visual effects in real time</span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Brightness</span>
                <span className="font-mono">{wallpaper.brightness}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="150"
                value={wallpaper.brightness}
                onChange={(e) => updateWallpaperConfig({ brightness: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Blur */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Blur</span>
                <span className="font-mono">{wallpaper.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={wallpaper.blur}
                onChange={(e) => updateWallpaperConfig({ blur: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Contrast</span>
                <span className="font-mono">{wallpaper.contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={wallpaper.contrast}
                onChange={(e) => updateWallpaperConfig({ contrast: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Saturation</span>
                <span className="font-mono">{wallpaper.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={wallpaper.saturation}
                onChange={(e) => updateWallpaperConfig({ saturation: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Overlay Opacity */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Dark Tint Overlay</span>
                <span className="font-mono">{wallpaper.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={wallpaper.overlayOpacity}
                onChange={(e) => updateWallpaperConfig({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Vignette */}
            <div>
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Vignette (Edge Shadow)</span>
                <span className="font-mono">{wallpaper.vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wallpaper.vignette}
                onChange={(e) => updateWallpaperConfig({ vignette: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-glow-violet transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
