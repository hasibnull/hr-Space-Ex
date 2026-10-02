import React, { useState } from 'react';
import {
  X,
  Plus,
  Check,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskPriority } from '../../types';

export const TodoPanel: React.FC = () => {
  const {
    activeModal,
    closeModal,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'today' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const newDueDate = 'Today';

  if (activeModal !== 'todo') return null;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'today') return !t.completed && (t.dueDate === 'Today' || !t.dueDate);
    return true;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addTask(newTitle.trim(), newPriority, newDueDate);
    setNewTitle('');
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-medium">High</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-medium">Med</span>;
      case 'low':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-medium">Low</span>;
    }
  };

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
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">To-Do & Tasks</h2>
              <p className="text-xs text-white/50">Minimal local task checklist</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 my-3 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded-xl font-medium transition-all ${
              filter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`flex-1 py-1 rounded-xl font-medium transition-all ${
              filter === 'today' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Today ({tasks.filter((t) => !t.completed && (t.dueDate === 'Today' || !t.dueDate)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-1 rounded-xl font-medium transition-all ${
              filter === 'completed' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Done ({tasks.filter((t) => t.completed).length})
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 glass-input rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
            autoFocus
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="glass-input rounded-xl px-2 py-2 text-xs text-white bg-slate-900/90 focus:outline-none"
          >
            <option value="high">High</option>
            <option value="medium">Med</option>
            <option value="low">Low</option>
          </select>
          <button
            type="submit"
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Tasks List */}
        <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-xs text-white/40">
              No tasks in this view. Great job!
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-white/30 hover:border-purple-400 bg-white/5'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <span
                    className={`text-xs truncate transition-all ${
                      task.completed ? 'line-through text-white/40' : 'text-white/90'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {getPriorityBadge(task.priority)}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
