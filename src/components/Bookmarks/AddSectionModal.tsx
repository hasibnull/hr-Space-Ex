import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Bot,
  CheckSquare,
  Palette,
  GraduationCap,
  Share2,
  Newspaper,
  Tv,
  ShoppingBag,
  Briefcase,
  Star,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SectionLayout } from '../../types';

export const AddSectionModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    addSection,
    updateSection,
    editingSection,
  } = useApp();

  const isEditing = activeModal === 'editSection' && !!editingSection;
  const isOpen = activeModal === 'addSection' || isEditing;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [color, setColor] = useState('#8b5cf6');
  const [description, setDescription] = useState('');
  const [layout, setLayout] = useState<SectionLayout>('grid');

  useEffect(() => {
    if (isEditing && editingSection) {
      setName(editingSection.name);
      setIcon(editingSection.icon);
      setColor(editingSection.color);
      setDescription(editingSection.description || '');
      setLayout(editingSection.layout || 'grid');
    } else if (isOpen) {
      setName('');
      setIcon('Folder');
      setColor('#8b5cf6');
      setDescription('');
      setLayout('grid');
    }
  }, [isOpen, isEditing, editingSection]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && editingSection) {
      await updateSection({
        ...editingSection,
        name: name.trim(),
        icon,
        color,
        description: description.trim() || undefined,
        layout,
      });
    } else {
      await addSection({
        name: name.trim(),
        icon,
        color,
        description: description.trim() || undefined,
        layout,
      });
    }

    closeModal();
  };

  const ICONS = [
    { name: 'Folder', component: Folder },
    { name: 'Bot', component: Bot },
    { name: 'CheckSquare', component: CheckSquare },
    { name: 'Palette', component: Palette },
    { name: 'GraduationCap', component: GraduationCap },
    { name: 'Share2', component: Share2 },
    { name: 'Newspaper', component: Newspaper },
    { name: 'Tv', component: Tv },
    { name: 'ShoppingBag', component: ShoppingBag },
    { name: 'Briefcase', component: Briefcase },
    { name: 'Star', component: Star },
    { name: 'Globe', component: Globe },
  ];

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
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? 'Edit Section' : 'Create Custom Section'}
              </h2>
              <p className="text-xs text-white/50">Organize your bookmark categories</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Section Title <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Copilots, Daily Tech, Design Resources..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Description <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Short subtitle or purpose"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {/* Select Icon */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Choose Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((item) => {
                const IconComp = item.component;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-500/60 text-white scale-105'
                        : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <IconComp className="w-4 h-4" style={{ color: isSelected ? color : undefined }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Layout row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Accent Color</label>
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

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Card Layout</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as SectionLayout)}
                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white bg-slate-900/90 focus:outline-none"
              >
                <option value="grid">Grid (App Shortcuts)</option>
                <option value="compact">Compact Grid</option>
                <option value="large">Large Icons</option>
                <option value="list">List with Details</option>
                <option value="minimal">Minimal Badges</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
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
              {isEditing ? 'Save Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
