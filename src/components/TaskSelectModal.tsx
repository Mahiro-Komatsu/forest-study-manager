'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, BookOpen, Clock, Layers } from 'lucide-react';
import { StudyTask, DailyLog } from '@/types/study';
import { calculateTodayProgress, getUnitLabel } from '@/lib/storage';

interface TaskSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StudyTask[];
  logs: DailyLog[];
  activeTaskId: string;
  onSelectTask: (taskId: string) => void;
  onOpenCreateModal: () => void;
}

export const TaskSelectModal: React.FC<TaskSelectModalProps> = ({
  isOpen,
  onClose,
  tasks,
  logs,
  activeTaskId,
  onSelectTask,
  onOpenCreateModal,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-md bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/50 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">学習対象の切り替え</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* タスク一覧 */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const progress = calculateTodayProgress(task, logs);
              const isActive = task.id === activeTaskId;
              const unitLabel = getUnitLabel(task.unit);

              return (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    onSelectTask(task.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                      : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 hover:border-emerald-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: task.color || '#22c55e' }}
                    />
                    <div className="truncate">
                      <div className="font-semibold text-white text-sm truncate">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>本日残り: {progress.remainingToday} {unitLabel}</span>
                        <span>•</span>
                        <span className={progress.isCompletedToday ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                          {progress.progressPercent}% 完了
                        </span>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex-shrink-0 p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* フッターアクション */}
          <div className="mt-5 pt-3 border-t border-emerald-900/50">
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              新しい科目を登録
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
