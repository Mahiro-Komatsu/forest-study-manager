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
  Repeat,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
} from 'lucide-react';
import { StudyTask, DailyLog, StudyScheduleEvent, EventCategory, TimetableSettings, TimetablePeriod } from '@/types/study';
import { getUnitLabel, getTodayDateString, DEFAULT_TIMETABLE_SETTINGS } from '@/lib/storage';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: StudyTask[];
  logs: DailyLog[];
  events: StudyScheduleEvent[];
  timetableSettings?: TimetableSettings;
  onAddEvent: (newEvent: Omit<StudyScheduleEvent, 'id' | 'createdAt'>) => void;
  onAddBatchEvents?: (newEvents: Omit<StudyScheduleEvent, 'id' | 'createdAt'>[]) => void;
  onDeleteEvent: (eventId: string) => void;
  onDeleteRecurringGroup?: (groupId: string) => void;
  onToggleEventCompleted: (eventId: string) => void;
}

const PRESET_EVENT_TEMPLATES = [
  { title: '大学の講義・授業', category: 'class' as EventCategory, color: '#3b82f6', duration: 90 },
  { title: 'バイト・シフト', category: 'part_time' as EventCategory, color: '#f59e0b', duration: 240 },
  { title: '自習・復習セッション', category: 'study' as EventCategory, color: '#22c55e', duration: 60 },
  { title: '試験・テスト', category: 'exam' as EventCategory, color: '#ef4444', duration: 60 },
];

const WEEKDAY_LABELS = [
  { day: 0, label: '日' },
  { day: 1, label: '月' },
  { day: 2, label: '火' },
  { day: 3, label: '水' },
  { day: 4, label: '木' },
  { day: 5, label: '金' },
  { day: 6, label: '土' },
];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  tasks,
  logs,
  events,
  timetableSettings = DEFAULT_TIMETABLE_SETTINGS,
  onAddEvent,
  onAddBatchEvents,
  onDeleteEvent,
  onDeleteRecurringGroup,
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
  const [newCategory, setNewCategory] = useState<EventCategory>('study');
  const [newPeriodIndex, setNewPeriodIndex] = useState<number | undefined>(undefined);
  const [newTaskId, setNewTaskId] = useState<string>('');
  const [newTime, setNewTime] = useState('18:00');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newNotes, setNewNotes] = useState('');
  const [newColor, setNewColor] = useState('#22c55e');

  // 繰り返し設定ステート
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]); // 選択された曜日
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4); // 何週間繰り返すか（4, 8, 12, 16）

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

  // 曜日トグル
  const toggleWeekday = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  // テンプレート適用
  const applyTemplate = (tmpl: typeof PRESET_EVENT_TEMPLATES[0]) => {
    setNewTitle(tmpl.title);
    setNewCategory(tmpl.category);
    setNewColor(tmpl.color);
    setNewDuration(tmpl.duration);
    setNewPeriodIndex(undefined);
    if (tmpl.category === 'class' || tmpl.category === 'part_time') {
      setIsRecurring(true);
    }
  };

  // 時限ボタン（1限〜6限）選択時の自動セット
  const applyPeriod = (period: TimetablePeriod) => {
    setNewPeriodIndex(period.period);
    setNewCategory('class');
    setNewTime(period.startTime);
    setNewColor('#3b82f6');
    
    // 開始・終了時刻から所要時間を計算
    const [startH, startM] = period.startTime.split(':').map(Number);
    const [endH, endM] = period.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    setNewDuration(duration > 0 ? duration : 90);
    
    if (!newTitle || newTitle === '大学の講義・授業' || newTitle.endsWith('限')) {
      setNewTitle(`${period.name}`);
    }
    setIsRecurring(true);
  };

  // 予定作成ハンドラー（単発または繰り返し一括）
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task = tasks.find((t) => t.id === newTaskId);
    const eventColor = task?.color || newColor;

    if (!isRecurring) {
      // 単発予定
      onAddEvent({
        date: selectedDate,
        title: newTitle.trim(),
        category: newCategory,
        periodIndex: newPeriodIndex,
        taskId: newTaskId || undefined,
        time: newTime || undefined,
        durationMinutes: Number(newDuration) || undefined,
        notes: newNotes.trim() || undefined,
        isCompleted: false,
        color: eventColor,
      });
    } else {
      // 繰り返し予定の一括生成
      const groupId = `group-${Date.now()}`;
      const startDate = new Date(selectedDate);
      const generatedList: Omit<StudyScheduleEvent, 'id' | 'createdAt'>[] = [];

      // 指定された週数分の日付を走査
      const totalDays = repeatWeeks * 7;
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayOfWeek = currentDate.getDay();

        if (selectedDays.includes(dayOfWeek)) {
          const dateStr = currentDate.toISOString().split('T')[0];
          generatedList.push({
            date: dateStr,
            title: newTitle.trim(),
            category: newCategory,
            periodIndex: newPeriodIndex,
            taskId: newTaskId || undefined,
            time: newTime || undefined,
            durationMinutes: Number(newDuration) || undefined,
            notes: newNotes.trim() || undefined,
            isCompleted: false,
            color: eventColor,
            recurrenceGroupId: groupId,
          });
        }
      }

      if (onAddBatchEvents) {
        onAddBatchEvents(generatedList);
      } else {
        generatedList.forEach((ev) => onAddEvent(ev));
      }
    }

    // リセット
    setNewTitle('');
    setNewNotes('');
    setNewPeriodIndex(undefined);
    setIsAddingEvent(false);
    setIsRecurring(false);
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

  // 選択日のデータ取得
  const selectedDayEvents = events.filter((e) => e.date === selectedDate);
  const selectedDayLogs = logs.filter((l) => l.date === selectedDate);
  const selectedDayDeadlines = tasks.filter((t) => t.deadline === selectedDate);

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // カテゴリに応じたアイコン表示
  const getCategoryIcon = (category?: EventCategory) => {
    switch (category) {
      case 'class':
        return <GraduationCap className="w-3.5 h-3.5 text-sky-400" />;
      case 'part_time':
        return <Briefcase className="w-3.5 h-3.5 text-amber-400" />;
      case 'exam':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl bg-slate-900 border border-emerald-800/40 rounded-3xl shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-900/50 flex-shrink-0 bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">学習カレンダー ＆ 時間割・シフト管理</h2>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  設定した1〜{timetableSettings.periodCount}限の開始時刻やバイトのシフトを一括登録できます
                </p>
              </div>
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
            <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col">
              {/* 年月ナビゲーション */}
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentYear}年</span>
                  <span className="text-emerald-400 text-lg font-extrabold">{monthNames[currentMonth]}</span>
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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

            {/* 右側: 選択日の予定・実績・一括登録パネル (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col bg-slate-900/50">
              {/* 選択日ヘッダー */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-3.5">
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
                  {isAddingEvent ? '閉じる' : '予定・時間割を追加'}
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
                    className="p-4 rounded-2xl bg-slate-800/95 border border-emerald-700/60 mb-4 space-y-3 overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        新しい予定の登録
                      </div>
                    </div>

                    {/* クイックテンプレート */}
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">クイック設定:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_EVENT_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.title}
                            type="button"
                            onClick={() => applyTemplate(tmpl)}
                            className={`py-1.5 px-2.5 rounded-xl border text-[11px] text-left truncate flex items-center gap-1.5 transition-all ${
                              newCategory === tmpl.category
                                ? 'bg-slate-700/90 border-emerald-500/80 text-white font-semibold ring-1 ring-emerald-500/50 shadow-sm'
                                : 'bg-slate-700/40 hover:bg-slate-700/80 border-slate-600/60 text-slate-300'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: tmpl.color }} />
                            <span className="truncate">{tmpl.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 🎓 授業の時限クイック選択（「大学の授業」選択時のみ表示） */}
                    <AnimatePresence>
                      {newCategory === 'class' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-1.5 pt-0.5"
                        >
                          <div className="text-[10px] font-semibold text-sky-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                              時限を選択（開始時刻・所要時間を自動入力）:
                            </span>
                            <span className="text-[9px] text-sky-400/80 font-normal">
                              {timetableSettings.periods.length}限制
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {timetableSettings.periods.map((period) => (
                              <button
                                key={period.period}
                                type="button"
                                onClick={() => applyPeriod(period)}
                                className={`py-1.5 px-1.5 rounded-xl border text-center transition-all ${
                                  newPeriodIndex === period.period
                                    ? 'bg-sky-600 border-sky-300 text-white font-bold shadow-md ring-1 ring-sky-300 scale-[1.02]'
                                    : 'bg-slate-900/90 border-slate-700 hover:border-sky-500/60 text-slate-300 hover:text-white'
                                }`}
                              >
                                <div className="text-[11px] font-bold">{period.name}</div>
                                <div className="text-[9px] text-sky-200/80 font-mono">{period.startTime}〜</div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* タイトル入力 */}
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="予定名（例: 統計学講義、英語II、カフェバイト）"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    {/* 開始時間 ＆ 所要時間 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">開始時間</label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">所要時間（分）</label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={newDuration}
                          onChange={(e) => setNewDuration(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* 関連科目 */}
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">関連する学習科目（任意）</label>
                      <select
                        value={newTaskId}
                        onChange={(e) => setNewTaskId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">（科目の指定なし / シフトなど）</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 🔁 繰り返し・固定スケジュール設定 */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                          />
                          <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                          周期的な予定（時間割・シフト）として繰り返す
                        </label>
                      </div>

                      {isRecurring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2.5 pt-1 border-t border-slate-800"
                        >
                          {/* 曜日選択 */}
                          <div>
                            <div className="text-[10px] text-slate-400 mb-1.5">繰り返す曜日を選択:</div>
                            <div className="grid grid-cols-7 gap-1">
                              {WEEKDAY_LABELS.map((w) => {
                                const isSelected = selectedDays.includes(w.day);
                                return (
                                  <button
                                    key={w.day}
                                    type="button"
                                    onClick={() => toggleWeekday(w.day)}
                                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {w.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 繰り返し期間 */}
                          <div>
                            <div className="text-[10px] text-slate-400 mb-1">繰り返し期間:</div>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { weeks: 4, label: '4週間 (1ヶ月)' },
                                { weeks: 8, label: '8週間 (2ヶ月)' },
                                { weeks: 12, label: '12週間 (1学期)' },
                                { weeks: 16, label: '16週間 (4ヶ月)' },
                              ].map((opt) => (
                                <button
                                  key={opt.weeks}
                                  type="button"
                                  onClick={() => setRepeatWeeks(opt.weeks)}
                                  className={`py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                                    repeatWeeks === opt.weeks
                                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/30 text-[10px] text-emerald-300 leading-relaxed">
                            💡 選択した曜日（{selectedDays.map((d) => WEEKDAY_LABELS.find((w) => w.day === d)?.label).join('・')}）の {newTime}〜 に今後 {repeatWeeks} 週間分（計 {selectedDays.length * repeatWeeks} 件）を一括作成します。
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="メモ（教室名、持ち物、担当など）"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingEvent(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isRecurring ? '一括登録する' : '予定を保存'}
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
                            <div className="flex items-center gap-1.5">
                              {getCategoryIcon(event.category)}
                              <div
                                className={`text-xs font-bold truncate ${
                                  event.isCompleted ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {event.title}
                              </div>
                              {event.recurrenceGroupId && (
                                <span className="p-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[9px] flex items-center gap-0.5" title="定期・繰り返し予定">
                                  <Repeat className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              {event.time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-emerald-400" />
                                  {event.time}
                                  {event.durationMinutes ? ` (${event.durationMinutes}分)` : ''}
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

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {event.recurrenceGroupId && onDeleteRecurringGroup && (
                            <button
                              onClick={() => {
                                if (confirm(`この定期予定「${event.title}」の全期間分を一括削除しますか？`)) {
                                  onDeleteRecurringGroup(event.recurrenceGroupId!);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                              title="この定期予定を一括削除"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="この予定を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
