'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Calendar, Target, Clock, BookOpen, Save } from 'lucide-react';
import { StudyTask, TaskUnit } from '@/types/study';
import { getTodayDateString } from '@/lib/storage';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask | null;
  onSaveTask: (updatedTask: StudyTask) => void;
}

const PRESET_COLORS = [
  '#22c55e', // Emerald / Forest green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Rose/Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState<TaskUnit>('minutes');
  const [totalQuota, setTotalQuota] = useState(120);
  const [dailyTarget, setDailyTarget] = useState(30);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [deadline, setDeadline] = useState(getTodayDateString());
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // タスクが切り替わったときにフォームの初期値をセット
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category || '');
      setUnit(task.unit);
      setTotalQuota(task.totalQuota);
      setDailyTarget(task.dailyTarget);
      setCompletedTotal(task.completedTotal || 0);
      setDeadline(task.deadline || getTodayDateString());
      setColor(task.color || PRESET_COLORS[0]);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveTask({
      ...task,
      title: title.trim(),
      category: category.trim() || undefined,
      unit,
      totalQuota: Number(totalQuota) || 0,
      dailyTarget: Number(dailyTarget) || 0,
      completedTotal: Number(completedTotal) || 0,
      deadline,
      color,
      updatedAt: Date.now(),
    });

    onClose();
  };

  // 期日と未消化ノルマから日次目標を自動再計算
  const handleAutoCalculateDaily = () => {
    const today = new Date();
    const targetDate = new Date(deadline);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const remainingQuota = Math.max(0, totalQuota - completedTotal);
    const suggested = Math.ceil(remainingQuota / diffDays);
    setDailyTarget(suggested);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/50 mb-5">
            <div className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">科目の設定・目標を編集</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 科目名 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                科目名 / タスク名 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 英語学習（英単語）、数学基礎"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                カテゴリー（任意）
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例: 語学、数学、IT・資格"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* 進捗の単位 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                進捗の単位
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'minutes', label: '時間（分）' },
                  { id: 'pages', label: 'ページ' },
                  { id: 'problems', label: '問題数' },
                  { id: 'chapters', label: '章' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUnit(item.id as TaskUnit)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                      unit === item.id
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ノルマ設定: 1日の目標 ＆ 総ノルマ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    1日の目標ノルマ <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateDaily}
                    className="text-[10px] text-emerald-400 hover:underline"
                    title="期日までの未消化分から自動計算"
                  >
                    自動計算
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                    {unit === 'minutes' ? '分/日' : unit === 'pages' ? 'p/日' : '問/日'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  総ノルマ（全体目標）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalQuota}
                    onChange={(e) => setTotalQuota(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                    {unit === 'minutes' ? '分' : unit === 'pages' ? 'p' : '問'}
                  </span>
                </div>
              </div>
            </div>

            {/* 累計消化量の修正 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                現在の累計消化量（修正が必要な場合）
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={completedTotal}
                  onChange={(e) => setCompletedTotal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">
                  {unit === 'minutes' ? '分' : unit === 'pages' ? 'p' : '問'}
                </span>
              </div>
            </div>

            {/* 期日（デッドライン） */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                達成期日（目標期限）
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* テーマカラー選択 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                テーマカラー
              </label>
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                変更を保存する
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
