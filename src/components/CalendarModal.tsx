'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { StudyTask, DailyLog, StudyScheduleEvent } from '@/types/study';
import { getUnitLabel, getTodayDateString } from '@/lib/storage';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StudyTask[];
  logs: DailyLog[];
  events: StudyScheduleEvent[];
  onAddEvent: (newEvent: Omit<StudyScheduleEvent, 'id' | 'createdAt'>) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleEventCompleted: (eventId: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  tasks,
  logs,
  events,
  onAddEvent,
  onDeleteEvent,
  onToggleEventCompleted,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // カレンダー表示月（YYYY-MM）
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  // 予定追加フォーム
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTaskId, setNewTaskId] = useState<string>('');
  const [newTime, setNewTime] = useState('19:00');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  // 月送り操作
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // 月の日付グリッド計算
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0(日) - 6(土)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr });
  }

  // 予定追加ハンドラー
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task = tasks.find((t) => t.id === newTaskId);

    onAddEvent({
      date: selectedDate,
      title: newTitle.trim(),
      taskId: newTaskId || undefined,
      time: newTime || undefined,
      durationMinutes: Number(newDuration) || undefined,
      notes: newNotes.trim() || undefined,
      isCompleted: false,
      color: task?.color || '#22c55e',
    });

    setNewTitle('');
    setNewNotes('');
    setIsAddingEvent(false);
  };

  // 選択日のデータ取得
  const selectedDayEvents = events.filter((e) => e.date === selectedDate);
  const selectedDayLogs = logs.filter((l) => l.date === selectedDate);
  const selectedDayDeadlines = tasks.filter((t) => t.deadline === selectedDate);

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl bg-slate-900 border border-emerald-800/40 rounded-3xl shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/50 flex-shrink-0 bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">学習カレンダー ＆ 予定管理</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* メインコンテンツ（2カラム: カレンダー + 予定詳細） */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-emerald-900/40">
            {/* 左側: カレンダー本体 (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col">
              {/* 年月ナビゲーション */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentYear}年</span>
                  <span className="text-emerald-400 text-lg">{monthNames[currentMonth]}</span>
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCurrentYear(now.getFullYear());
                      setCurrentMonth(now.getMonth());
                      setSelectedDate(todayStr);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 hover:text-white transition-colors"
                  >
                    今月
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-slate-400">
                <span className="text-rose-400">日</span>
                <span>月</span>
                <span>火</span>
                <span>水</span>
                <span>木</span>
                <span>金</span>
                <span className="text-sky-400">土</span>
              </div>

              {/* 日付グリッド */}
              <div className="grid grid-cols-7 gap-1.5 flex-1">
                {calendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-950/20" />;
                  }

                  const { day, dateStr } = item;
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayStr;

                  // その日の学習ログ
                  const dayLogs = logs.filter((l) => l.date === dateStr);
                  const hasStudyLog = dayLogs.length > 0;
                  const totalMinutes = dayLogs.reduce((sum, l) => sum + (l.amount || 0), 0);

                  // その日の予定イベント
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const hasEvents = dayEvents.length > 0;

                  // その日が期日のタスク
                  const hasDeadline = tasks.some((t) => t.deadline === dateStr);

                  return (
                    <motion.button
                      key={dateStr}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-16 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-400 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400'
                          : isToday
                          ? 'bg-slate-800/90 border-emerald-600/60'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold leading-none ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold'
                              : isSelected
                              ? 'text-emerald-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {day}
                        </span>

                        {hasDeadline && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="期日あり" />
                        )}
                      </div>

                      {/* 実績＆予定のバッジ表示 */}
                      <div className="space-y-0.5 mt-auto">
                        {hasStudyLog && (
                          <div className="text-[9px] font-semibold text-emerald-400 truncate flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            {totalMinutes > 0 ? `${totalMinutes}分` : '完了'}
                          </div>
                        )}
                        {hasEvents && (
                          <div className="text-[9px] font-medium text-amber-300/90 truncate flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            {dayEvents.length}件の予定
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 右側: 選択日の予定・実績パネル (5 cols) */}
            <div className="lg:col-span-5 p-5 flex flex-col bg-slate-900/50">
              {/* 選択日ヘッダー */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-4">
                <div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    {selectedDate === todayStr ? '本日のスケジュール' : '選択した日のスケジュール'}
                  </div>
                  <div className="text-base font-bold text-white">
                    {selectedDate}
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  予定を追加
                </button>
              </div>

              {/* 予定追加フォーム（アコーディオン展開） */}
              <AnimatePresence>
                {isAddingEvent && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateEvent}
                    className="p-4 rounded-2xl bg-slate-800/90 border border-emerald-700/50 mb-4 space-y-3 overflow-hidden"
                  >
                    <div className="text-xs font-bold text-emerald-300">新しい予定・目標の登録</div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="例: 単語テスト、第4章まとめ演習"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">関連科目</label>
                        <select
                          value={newTaskId}
                          onChange={(e) => setNewTaskId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">（指定なし）</option>
                          {tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">開始時間</label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="メモ（任意）"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingEvent(false)}
                        className="px-3 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow"
                      >
                        保存する
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* 期日リマインダー通知 */}
              {selectedDayDeadlines.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {selectedDayDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold">目標期日: </span>
                        {task.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 予定一覧リスト */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>予定・やること一覧</span>
                  <span className="text-[11px] font-normal text-slate-500">{selectedDayEvents.length}件</span>
                </div>

                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                    この日の予定はありません
                  </div>
                ) : (
                  selectedDayEvents.map((event) => {
                    const relatedTask = tasks.find((t) => t.id === event.taskId);

                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                          event.isCompleted
                            ? 'bg-slate-800/40 border-slate-800 opacity-60'
                            : 'bg-slate-800/80 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            onClick={() => onToggleEventCompleted(event.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                          >
                            {event.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="truncate">
                            <div
                              className={`text-xs font-bold truncate ${
                                event.isCompleted ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {event.title}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              {event.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-emerald-400" />
                                  {event.time}
                                </span>
                              )}
                              {relatedTask && (
                                <span
                                  className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white"
                                  style={{ backgroundColor: relatedTask.color || '#22c55e' }}
                                >
                                  {relatedTask.title}
                                </span>
                              )}
                            </div>

                            {event.notes && (
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteEvent(event.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0"
                          title="予定を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}

                {/* 実際の学習実績ログ */}
                <div className="pt-4 border-t border-emerald-900/30">
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                    <span>この日の学習実績</span>
                    <span className="text-[11px] font-normal text-emerald-400">
                      {selectedDayLogs.length > 0 ? `${selectedDayLogs.length}セッション` : '記録なし'}
                    </span>
                  </div>

                  {selectedDayLogs.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs bg-slate-800/20 rounded-2xl">
                      この日の学習記録はありません
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedDayLogs.map((log) => {
                        const task = tasks.find((t) => t.id === log.taskId);
                        const unitLabel = task ? getUnitLabel(task.unit) : '';

                        return (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: task?.color || '#22c55e' }}
                              />
                              <span className="text-white font-medium truncate">
                                {task?.title || '科目'}
                              </span>
                            </div>

                            <span className="text-emerald-300 font-bold text-xs flex-shrink-0">
                              +{log.amount} {unitLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
