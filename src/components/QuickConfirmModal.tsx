'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, BookOpen, AlertCircle, Plus, Minus, ArrowRight } from 'lucide-react';
import { StudyTask, TaskDayProgress } from '@/types/study';
import { getUnitLabel } from '@/lib/storage';

interface QuickConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask;
  currentProgress: TaskDayProgress;
  defaultAmount: number;
  onConfirm: (amount: number, notes?: string) => void;
}

export const QuickConfirmModal: React.FC<QuickConfirmModalProps> = ({
  isOpen,
  onClose,
  task,
  currentProgress,
  defaultAmount,
  onConfirm,
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount);
      setNotes('');
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const unitLabel = getUnitLabel(task.unit);

  // 記録後の予想進捗
  const newCompleted = currentProgress.todayCompleted + amount;
  const newRemaining = Math.max(0, task.dailyTarget - newCompleted);
  const newPercent = task.dailyTarget > 0
    ? Math.min(100, Math.round((newCompleted / task.dailyTarget) * 100))
    : 100;

  const handleConfirm = () => {
    if (amount > 0) {
      onConfirm(amount, notes.trim() || undefined);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-3.5 border-b border-emerald-900/50 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">進捗の簡易記録の確認</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 対象科目 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: task.color || '#22c55e' }}
              />
              <div className="truncate">
                <div className="text-[11px] text-slate-400">対象の学習科目</div>
                <div className="text-sm font-bold text-white truncate">{task.title}</div>
              </div>
            </div>

            {/* 記録量の調整カウンター */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                記録する学習量
              </label>
              <div className="flex items-center justify-between gap-3 p-2 bg-slate-800/60 border border-slate-700 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAmount((prev) => Math.max(1, prev - (task.unit === 'minutes' ? 5 : 1)))}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-all active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-extrabold text-emerald-400">+{amount}</span>
                  <span className="text-sm font-semibold text-slate-300">{unitLabel}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAmount((prev) => prev + (task.unit === 'minutes' ? 5 : 1))}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 記録前後のシミュレーションカード */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span>記録後の本日の進捗予測</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400">現在: </span>
                  <span className="font-semibold text-white">{currentProgress.todayCompleted} {unitLabel}</span>
                  <span className="text-slate-400 text-[11px]"> ({currentProgress.progressPercent}%)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-400">記録後: </span>
                  <span className="font-bold text-emerald-300">{newCompleted} {unitLabel}</span>
                  <span className="text-emerald-400 text-[11px]"> ({newPercent}%)</span>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${newPercent}%`,
                    backgroundColor: task.color || '#22c55e',
                  }}
                />
              </div>

              <div className="text-[11px] text-emerald-400/80 text-right pt-0.5">
                本日の目標 {task.dailyTarget} {unitLabel} まで残り {newRemaining} {unitLabel}
              </div>
            </div>

            {/* メモ（任意） */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                メモ（任意）
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例: 第2章の練習問題、単語復習"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                この内容で記録
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
