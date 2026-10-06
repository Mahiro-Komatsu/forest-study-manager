'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Flame, Clock, Hash } from 'lucide-react';
import { StudyTask, TaskDayProgress, TimerState } from '@/types/study';
import { getUnitLabel } from '@/lib/storage';

interface TimerCircleProps {
  task: StudyTask;
  progress: TaskDayProgress;
  mode: 'timer' | 'manual';
  onModeChange: (mode: 'timer' | 'manual') => void;
  timerState: TimerState;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onCompleteTimer: () => void;
  onOpenQuickAdd: () => void;
}

export const TimerCircle: React.FC<TimerCircleProps> = ({
  task,
  progress,
  mode,
  onModeChange,
  timerState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onCompleteTimer,
  onOpenQuickAdd,
}) => {
  const size = 320;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

  // 進捗率（0〜100%）
  const percent = Math.min(100, Math.max(0, progress.progressPercent));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // タイマー残り時間のフォーマット
  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const unitLabel = getUnitLabel(task.unit);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* モード切替ピルタブ */}
      <div className="flex items-center bg-emerald-950/40 backdrop-blur-md p-1 rounded-full border border-emerald-800/40 mb-6 shadow-inner">
        <button
          onClick={() => onModeChange('timer')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            mode === 'timer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          タイマー測定
        </button>
        <button
          onClick={() => onModeChange('manual')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            mode === 'manual'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          数値直接入力
        </button>
      </div>

      {/* 円形プログレスコンテナ */}
      <div className="relative flex items-center justify-center">
        {/* 背景の柔らかな環境光（グローエフェクト） */}
        <div
          className="absolute inset-4 rounded-full blur-2xl opacity-25 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: task.color || '#22c55e' }}
        />

        {/* SVG プログレスサークル */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 drop-shadow-xl"
        >
          {/* 背景の薄い円 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* 目盛りのようなアクセント円 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(34, 197, 94, 0.15)"
            strokeWidth={strokeWidth}
            strokeDasharray="4 8"
          />
          {/* 進捗ゲージ */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={task.color || '#22c55e'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* 円の内部コンテンツ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-auto">
          <AnimatePresence mode="wait">
            {mode === 'timer' && timerState.isRunning ? (
              // タイマー稼働中表示
              <motion.div
                key="timer-running"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  集中タイマー稼働中
                </div>
                <div className="text-5xl font-mono font-bold text-white tracking-tight my-2 drop-shadow">
                  {formatTimerTime(timerState.secondsLeft)}
                </div>
                <p className="text-xs text-emerald-300/80 mb-3">
                  目標: {Math.round(timerState.targetSeconds / 60)}分 集中
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {timerState.isPaused ? (
                    <button
                      onClick={onStartTimer}
                      className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all hover:scale-105 active:scale-95"
                      title="再開"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  ) : (
                    <button
                      onClick={onPauseTimer}
                      className="p-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow transition-all hover:scale-105 active:scale-95"
                      title="一時停止"
                    >
                      <Pause className="w-4 h-4 fill-white" />
                    </button>
                  )}
                  <button
                    onClick={onCompleteTimer}
                    className="px-3 py-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-xs font-semibold text-white border border-emerald-500/40 shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    完了
                  </button>
                  <button
                    onClick={onResetTimer}
                    className="p-2.5 rounded-full bg-emerald-950/60 hover:bg-red-900/60 text-emerald-300 hover:text-red-300 border border-emerald-800/40 shadow transition-all hover:scale-105 active:scale-95"
                    title="リセット"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              // 通常/直接入力時の進捗表示
              <motion.div
                key="normal-progress"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                {/* 達成バッジ または 残り量 */}
                {progress.isCompletedToday ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    本日のノルマ達成！
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-300/80 mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    本日の残りノルマ
                  </div>
                )}

                {/* メインの残り数値表示 */}
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-5xl font-extrabold text-white tracking-tight drop-shadow-sm font-sans">
                    {progress.remainingToday}
                  </span>
                  <span className="text-lg font-semibold text-emerald-200/90">
                    {unitLabel}
                  </span>
                </div>

                {/* 達成率と日次目標 */}
                <div className="text-sm font-medium text-emerald-300/90 mt-1">
                  達成率 <span className="font-bold text-white text-base">{percent}%</span>
                </div>
                <div className="text-xs text-emerald-400/60 mt-0.5">
                  本日消化: {progress.todayCompleted} / {progress.dailyTarget} {unitLabel}
                </div>

                {mode === 'manual' && (
                  <button
                    onClick={onOpenQuickAdd}
                    className="mt-3 text-xs bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 hover:text-white px-3 py-1 rounded-full border border-emerald-600/40 transition-all hover:scale-105"
                  >
                    進捗を入力する
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
