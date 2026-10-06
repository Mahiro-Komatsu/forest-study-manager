'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { StudyTask } from '@/types/study';
import { getUnitLabel } from '@/lib/storage';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask;
  onAddProgress: (amount: number, notes?: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddProgress,
}) => {
  const [customAmount, setCustomAmount] = useState<number | ''>(
    task.unit === 'minutes' ? 15 : 5
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const unitLabel = getUnitLabel(task.unit);

  // プリセットボタン
  const presets = task.unit === 'minutes' ? [10, 25, 45, 60] : [1, 5, 10, 20];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (val > 0) {
      onAddProgress(val, notes.trim() || undefined);
      onClose();
    }
  };

  const handleQuickSubmit = (amt: number) => {
    onAddProgress(amt);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/50 mb-4">
            <h2 className="text-base font-bold text-white">進捗を手動記録</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            対象: <span className="font-semibold text-white">{task.title}</span>
          </p>

          {/* クイック選択 */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-slate-400 mb-2">
              クイック追加
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickSubmit(amt)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-700/60 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold text-emerald-300 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  +{amt} {unitLabel}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                消化量を指定
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">
                  {unitLabel}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                メモ（任意）
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例: 第2節まで完了、問題演習"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              進捗を反映する
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
