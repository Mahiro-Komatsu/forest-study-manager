'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, RefreshCw, Trash2, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { StudyTask, DailyLog } from '@/types/study';
import { calculateTodayProgress, getUnitLabel, recalculateDailyTarget } from '@/lib/storage';

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StudyTask[];
  logs: DailyLog[];
  onUpdateTasks: (updatedTasks: StudyTask[]) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
}

export const TaskListModal: React.FC<TaskListModalProps> = ({
  isOpen,
  onClose,
  tasks,
  logs,
  onUpdateTasks,
  onDeleteTask,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  // 全タスクの一括リスケジュール
  const handleRescheduleAll = () => {
    if (!confirm('各科目の達成期日と未消化量から、本日の日次ノルマを再計算して更新しますか？')) {
      return;
    }

    const updated = tasks.map((task) => {
      const newDailyTarget = recalculateDailyTarget(task);
      return {
        ...task,
        dailyTarget: newDailyTarget,
        updatedAt: Date.now(),
      };
    });

    onUpdateTasks(updated);
  };

  // 個別リスケジュール
  const handleRescheduleSingle = (task: StudyTask) => {
    const newDaily = recalculateDailyTarget(task);
    const updated = tasks.map((t) => (t.id === task.id ? { ...t, dailyTarget: newDaily } : t));
    onUpdateTasks(updated);
  };

  // 本日の総消化量・統計
  const totalTodayItems = tasks.reduce((sum, task) => {
    const prog = calculateTodayProgress(task, logs);
    return sum + prog.todayCompleted;
  }, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/50 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">全体計画 ＆ 進捗トラッカー</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 全体リスケジュールボタン */}
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-2xl mb-4 flex-shrink-0">
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                遅延時のスマート・リスケジュール
              </div>
              <div className="text-[11px] text-emerald-400/70">
                期日までの残り日数をもとに、今日必要な日次ノルマを自動調整します
              </div>
            </div>
            <button
              onClick={handleRescheduleAll}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              一括再計算
            </button>
          </div>

          {/* タスクリスト */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                登録されている学習タスクがありません
              </div>
            ) : (
              tasks.map((task) => {
                const todayProg = calculateTodayProgress(task, logs);
                const unitLabel = getUnitLabel(task.unit);
                const overallPercent = task.totalQuota > 0 
                  ? Math.min(100, Math.round((task.completedTotal / task.totalQuota) * 100))
                  : 0;

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-emerald-700/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: task.color || '#22c55e' }}
                        />
                        <button
                          onClick={() => {
                            onSelectTask(task.id);
                            onClose();
                          }}
                          className="font-semibold text-white text-sm hover:text-emerald-300 transition-colors text-left"
                        >
                          {task.title}
                        </button>
                        {task.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {task.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRescheduleSingle(task)}
                          title="この科目の日次目標を再計算"
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-300 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`「${task.title}」を削除しますか？`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          title="タスクを削除"
                          className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 進捗バー（全体総進捗） */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>全体進捗: {task.completedTotal} / {task.totalQuota} {unitLabel}</span>
                        <span className="font-semibold text-white">{overallPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${overallPercent}%`,
                            backgroundColor: task.color || '#22c55e',
                          }}
                        />
                      </div>
                    </div>

                    {/* 日次ノルマ ＆ 期日情報 */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-700/50 text-[11px] text-slate-300">
                      <div>
                        本日の進捗:{' '}
                        <span className="font-bold text-white">
                          {todayProg.todayCompleted} / {task.dailyTarget} {unitLabel}
                        </span>{' '}
                        ({todayProg.progressPercent}%)
                      </div>
                      <div className="text-right flex items-center justify-end gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        期日: {task.deadline}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
