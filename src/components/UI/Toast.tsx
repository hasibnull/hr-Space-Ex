import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = 'text-cyan-400 border-cyan-500/30';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          colorClass = 'text-emerald-400 border-emerald-500/30';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          colorClass = 'text-red-400 border-red-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs text-white shadow-glass-lg border ${colorClass} animate-slide-in-left`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
