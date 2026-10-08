'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ListTodo,
  PlusCircle,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Layers,
  Settings,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyTask, DailyLog, TimerState, StudyScheduleEvent, TimetableSettings } from '@/types/study';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadLogsFromStorage,
  saveLogsToStorage,
  loadEventsFromStorage,
  saveEventsToStorage,
  loadActiveTaskId,
  saveActiveTaskId,
  loadSyncCodeFromStorage,
  saveSyncCodeToStorage,
  loadTimetableSettingsFromStorage,
  saveTimetableSettingsToStorage,
  DEFAULT_TIMETABLE_SETTINGS,
  INITIAL_TASKS,
  INITIAL_LOGS,
  INITIAL_EVENTS,
  calculateTodayProgress,
  getUnitLabel,
  getTodayDateString,
  recalculateDailyTarget,
} from '@/lib/storage';
import { fetchCloudData, saveCloudData, isSupabaseConfigured } from '@/lib/supabase';
import { TimerCircle } from './TimerCircle';
import { TaskSelectModal } from './TaskSelectModal';
import { TaskCreateModal } from './TaskCreateModal';
import { TaskListModal } from './TaskListModal';
import { QuickAddModal } from './QuickAddModal';
import { QuickConfirmModal } from './QuickConfirmModal';
import { SettingsModal } from './SettingsModal';
import { CalendarModal } from './CalendarModal';

export const StudyDashboard: React.FC = () => {
  // 状態管理
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [events, setEvents] = useState<StudyScheduleEvent[]>([]);
  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>(DEFAULT_TIMETABLE_SETTINGS);
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [syncCode, setSyncCode] = useState<string>('');
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // モーダル管理
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isQuickConfirmOpen, setIsQuickConfirmOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // タイマー状態 (デフォルト: 25分 = 1500秒)
  const DEFAULT_TIMER_SECONDS = 25 * 60;
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    secondsLeft: DEFAULT_TIMER_SECONDS,
    targetSeconds: DEFAULT_TIMER_SECONDS,
    activeTaskId: null,
    startedAt: null,
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // クラウドから最新データをロード
  const syncFromCloud = useCallback(async (code: string) => {
    if (!isSupabaseConfigured || !code) return;
    setIsSyncing(true);
    try {
      const data = await fetchCloudData(code);
      if (data) {
        if (data.tasks_json) {
          const cloudTasks = JSON.parse(data.tasks_json);
          setTasks(cloudTasks);
          saveTasksToStorage(cloudTasks);
        }
        if (data.logs_json) {
          const cloudLogs = JSON.parse(data.logs_json);
          setLogs(cloudLogs);
          saveLogsToStorage(cloudLogs);
        }
        if (data.events_json) {
          const cloudEvents = JSON.parse(data.events_json);
          setEvents(cloudEvents);
          saveEventsToStorage(cloudEvents);
        }
        if (data.active_task_id) {
          setActiveTaskId(data.active_task_id);
          saveActiveTaskId(data.active_task_id);
        }
      }
    } catch (err) {
      console.error('Sync from cloud error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // クラウドへ保存
  const pushToCloud = useCallback(async (
    currentCode: string,
    currentTasks: StudyTask[],
    currentLogs: DailyLog[],
    currentActiveId: string,
    currentEvents: StudyScheduleEvent[]
  ) => {
    if (!isSupabaseConfigured || !currentCode) return;
    setIsSyncing(true);
    try {
      await saveCloudData(currentCode, currentTasks, currentLogs, currentActiveId, currentEvents);
    } catch (err) {
      console.error('Push to cloud error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 初期化 (LocalStorage から読み込み & クラウド同期)
  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    const loadedLogs = loadLogsFromStorage();
    const loadedEvents = loadEventsFromStorage();
    const loadedTimetable = loadTimetableSettingsFromStorage();
    const loadedActiveId = loadActiveTaskId(loadedTasks[0]?.id || '');
    const loadedSyncCode = loadSyncCodeFromStorage();

    setTasks(loadedTasks);
    setLogs(loadedLogs);
    setEvents(loadedEvents);
    setTimetableSettings(loadedTimetable);
    setActiveTaskId(loadedActiveId);
    setSyncCode(loadedSyncCode);
    setIsLoaded(true);

    if (loadedSyncCode) {
      syncFromCloud(loadedSyncCode);
    }
  }, [syncFromCloud]);

  const handleUpdateTimetableSettings = (newSettings: TimetableSettings) => {
    setTimetableSettings(newSettings);
    saveTimetableSettingsToStorage(newSettings);
  };

  // タスク状態の保存 & クラウド反映
  useEffect(() => {
    if (!isLoaded) return;
    saveTasksToStorage(tasks);
    if (syncCode) {
      pushToCloud(syncCode, tasks, logs, activeTaskId, events);
    }
  }, [tasks, isLoaded, pushToCloud, syncCode, logs, activeTaskId, events]);

  // ログ状態の保存 & クラウド反映
  useEffect(() => {
    if (!isLoaded) return;
    saveLogsToStorage(logs);
    if (syncCode) {
      pushToCloud(syncCode, tasks, logs, activeTaskId, events);
    }
  }, [logs, isLoaded, pushToCloud, syncCode, tasks, activeTaskId, events]);

  // 予定イベントの保存 & クラウド反映
  useEffect(() => {
    if (!isLoaded) return;
    saveEventsToStorage(events);
    if (syncCode) {
      pushToCloud(syncCode, tasks, logs, activeTaskId, events);
    }
  }, [events, isLoaded, pushToCloud, syncCode, tasks, logs, activeTaskId]);

  // アクティブタスクIDの保存
  useEffect(() => {
    if (!isLoaded || !activeTaskId) return;
    saveActiveTaskId(activeTaskId);
  }, [activeTaskId, isLoaded]);

  // 現在のアクティブタスク
  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];

  // タイマー処理
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.secondsLeft <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleTimerFinished(prev.targetSeconds);
            return {
              ...prev,
              isRunning: false,
              isPaused: false,
              secondsLeft: prev.targetSeconds,
            };
          }
          return {
            ...prev,
            secondsLeft: prev.secondsLeft - 1,
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // タイマー完了時処理
  const handleTimerFinished = (totalSeconds: number) => {
    if (!activeTask) return;
    const minutes = Math.round(totalSeconds / 60);

    // ログを追加
    const newLog: DailyLog = {
      id: `log-${Date.now()}`,
      taskId: activeTask.id,
      date: getTodayDateString(),
      amount: activeTask.unit === 'minutes' ? minutes : 1,
      mode: 'timer',
      timestamp: Date.now(),
    };

    setLogs((prev) => [...prev, newLog]);

    // タスクの総累計を更新
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTask.id
          ? {
              ...t,
              completedTotal: t.completedTotal + (t.unit === 'minutes' ? minutes : 1),
              updatedAt: Date.now(),
            }
          : t
      )
    );

    // 祝賀エフェクト
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // 進捗の手動追加
  const handleAddProgress = (amount: number, notes?: string) => {
    if (!activeTask) return;

    const newLog: DailyLog = {
      id: `log-${Date.now()}`,
      taskId: activeTask.id,
      date: getTodayDateString(),
      amount,
      mode: 'manual',
      notes,
      timestamp: Date.now(),
    };

    setLogs((prev) => [...prev, newLog]);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTask.id
          ? {
              ...t,
              completedTotal: t.completedTotal + amount,
              updatedAt: Date.now(),
            }
          : t
      )
    );

    // 本日の目標に達したかチェックしてconfetti
    const currentProgress = calculateTodayProgress(activeTask, logs);
    if (currentProgress.todayCompleted + amount >= activeTask.dailyTarget) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // 新規タスク作成
  const handleCreateTask = (
    newTaskData: Omit<StudyTask, 'id' | 'createdAt' | 'updatedAt' | 'completedTotal'>
  ) => {
    const newTask: StudyTask = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completedTotal: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    setActiveTaskId(newTask.id);
  };

  // タスク削除
  const handleDeleteTask = (taskId: string) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(nextTasks);
    if (activeTaskId === taskId && nextTasks.length > 0) {
      setActiveTaskId(nextTasks[0].id);
    }
  };

  // 予定イベントの追加
  const handleAddEvent = (newEventData: Omit<StudyScheduleEvent, 'id' | 'createdAt'>) => {
    const newEvent: StudyScheduleEvent = {
      ...newEventData,
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // 複数予定イベントの一括追加（時間割・シフトなど）
  const handleAddBatchEvents = (newEventsData: Omit<StudyScheduleEvent, 'id' | 'createdAt'>[]) => {
    const now = Date.now();
    const newEvents: StudyScheduleEvent[] = newEventsData.map((evData, idx) => ({
      ...evData,
      id: `event-${now}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
    }));
    setEvents((prev) => [...newEvents, ...prev]);
  };

  // 予定イベントの個別削除
  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // 繰り返しグループの予定を一括削除
  const handleDeleteRecurringGroup = (groupId: string) => {
    setEvents((prev) => prev.filter((e) => e.recurrenceGroupId !== groupId));
  };

  // 予定完了トグル
  const handleToggleEventCompleted = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e))
    );
  };

  // 全データ初期化リセット
  const handleResetAllData = () => {
    setTasks(INITIAL_TASKS);
    setLogs(INITIAL_LOGS);
    setEvents(INITIAL_EVENTS);
    setActiveTaskId(INITIAL_TASKS[0]?.id || '');
    saveTasksToStorage(INITIAL_TASKS);
    saveLogsToStorage(INITIAL_LOGS);
    saveEventsToStorage(INITIAL_EVENTS);
    saveActiveTaskId(INITIAL_TASKS[0]?.id || '');
  };

  // データインポート復元
  const handleImportData = (importedData: { tasks: StudyTask[]; logs: DailyLog[]; events: StudyScheduleEvent[] }) => {
    if (importedData.tasks && importedData.tasks.length > 0) {
      setTasks(importedData.tasks);
      saveTasksToStorage(importedData.tasks);
      setActiveTaskId(importedData.tasks[0].id);
      saveActiveTaskId(importedData.tasks[0].id);
    }
    if (importedData.logs) {
      setLogs(importedData.logs);
      saveLogsToStorage(importedData.logs);
    }
    if (importedData.events) {
      setEvents(importedData.events);
      saveEventsToStorage(importedData.events);
    }
  };

  // タイマー操作
  const startTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      activeTaskId: activeTask?.id || null,
      startedAt: prev.startedAt || Date.now(),
    }));
  };

  const pauseTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  };

  const resetTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      secondsLeft: prev.targetSeconds,
      startedAt: null,
    }));
  };

  const completeTimerNow = () => {
    const elapsedSeconds = timerState.targetSeconds - timerState.secondsLeft;
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    resetTimer();
    handleAddProgress(activeTask.unit === 'minutes' ? elapsedMins : 1, 'タイマー記録完了');
  };

  // 新しい同期コードの適用
  const handleApplyNewSyncCode = async (newCode: string): Promise<boolean> => {
    saveSyncCodeToStorage(newCode);
    setSyncCode(newCode);
    if (isSupabaseConfigured) {
      await syncFromCloud(newCode);
    }
    return true;
  };

  // 強制手動同期
  const handleForceCloudSync = async () => {
    if (syncCode) {
      await syncFromCloud(syncCode);
    }
  };

  // クイック加算ボタン（+10分 または +5単位）
  const quickAmount = activeTask?.unit === 'minutes' ? 10 : 5;
  const unitLabel = activeTask ? getUnitLabel(activeTask.unit) : '';

  // 遅延時のリスケジュール
  const handleRescheduleCurrentTask = () => {
    if (!activeTask) return;
    const newTarget = recalculateDailyTarget(activeTask);
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, dailyTarget: newTarget } : t))
    );
  };

  if (!isLoaded || !activeTask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">読み込み中...</span>
        </div>
      </div>
    );
  }

  const activeProgress = calculateTodayProgress(activeTask, logs);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: activeTask.color || '#16a34a' }}
      />

      {/* =========================================================================
          1. Top Header（上部スロット領域）
         ========================================================================= */}
      <header className="relative z-10 w-full max-w-md mx-auto pt-5 px-4 flex items-center justify-between">
        {/* 左上アイコン群: 全体計画 / カレンダー / 設定(クラウド等) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsListModalOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-emerald-900/40 text-slate-300 hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-md backdrop-blur-md"
            title="全体計画・進捗統計"
          >
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-emerald-900/40 text-slate-300 hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-md backdrop-blur-md relative"
            title="学習カレンダー・予定"
          >
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            {events.filter((e) => e.date === getTodayDateString()).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className={`p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-emerald-900/40 transition-all hover:scale-105 active:scale-95 shadow-md backdrop-blur-md flex items-center gap-1 text-xs font-semibold ${
              isSyncing ? 'text-emerald-400' : 'text-slate-300 hover:text-emerald-300'
            }`}
            title="設定・クラウド管理"
          >
            <Settings className={`w-4 h-4 sm:w-5 sm:h-5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* 中央: Forest風「学習対象スロット」ピル型ボタン */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSelectModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-emerald-700/50 shadow-lg shadow-emerald-950/40 backdrop-blur-md transition-all group"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: activeTask.color || '#22c55e' }}
          />
          <span className="text-xs font-bold text-white tracking-wide max-w-[110px] sm:max-w-[150px] truncate">
            {activeTask.title}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 group-hover:translate-y-0.5 transition-transform" />
        </motion.button>

        {/* 右上: 新規タスク作成 / 追加ボタン */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-2.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-emerald-900/40 text-slate-300 hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-md backdrop-blur-md"
          title="新しい学習タスクを登録"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </header>

      {/* =========================================================================
          2. Center Stage（中央サークル・進行状況領域）
         ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 my-2">
        <TimerCircle
          task={activeTask}
          progress={activeProgress}
          mode={mode}
          onModeChange={setMode}
          timerState={timerState}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResetTimer={resetTimer}
          onCompleteTimer={completeTimerNow}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />
      </main>

      {/* =========================================================================
          3. Bottom Controls（下部アクション領域）
         ========================================================================= */}
      <footer className="relative z-10 w-full max-w-md mx-auto pb-7 px-5 flex flex-col items-center gap-3">
        {/* メインアクションボタン */}
        {mode === 'timer' ? (
          !timerState.isRunning ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startTimer}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              学習を開始する
            </motion.button>
          ) : (
            <div className="w-full grid grid-cols-2 gap-3">
              {timerState.isPaused ? (
                <button
                  onClick={startTimer}
                  className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  再開
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  一時停止
                </button>
              )}
              <button
                onClick={completeTimerNow}
                className="py-3 rounded-2xl bg-slate-800 hover:bg-emerald-800 text-white border border-emerald-600/40 font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                消化を完了
              </button>
            </div>
          )
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsQuickAddOpen(true)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            進捗を記録する
          </motion.button>
        )}

        {/* サブアクションコントロール */}
        <div className="w-full flex items-center justify-between gap-2.5 pt-1 text-xs">
          {/* クイック+10分/+5ページ ボタン（確認画面を開く） */}
          <button
            onClick={() => setIsQuickConfirmOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-emerald-300 font-semibold flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 shadow-sm text-[11px] sm:text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            +{quickAmount} {unitLabel} 簡易記録
          </button>

          {/* リスケジュールボタン */}
          <button
            onClick={handleRescheduleCurrentTask}
            title="期日までの日数から今日のノルマを再計算"
            className="py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-emerald-300 font-medium flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 shadow-sm text-[11px] sm:text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ノルマ再計算
          </button>
        </div>
      </footer>

      {/* =========================================================================
          モーダル一覧
         ========================================================================= */}
      <TaskSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        tasks={tasks}
        logs={logs}
        activeTaskId={activeTaskId}
        onSelectTask={setActiveTaskId}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onUpdateTasks={setTasks}
      />

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <TaskListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        tasks={tasks}
        logs={logs}
        onUpdateTasks={setTasks}
        onDeleteTask={handleDeleteTask}
        onSelectTask={setActiveTaskId}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        task={activeTask}
        onAddProgress={handleAddProgress}
      />

      <QuickConfirmModal
        isOpen={isQuickConfirmOpen}
        onClose={() => setIsQuickConfirmOpen(false)}
        task={activeTask}
        currentProgress={activeProgress}
        defaultAmount={quickAmount}
        onConfirm={handleAddProgress}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        syncCode={syncCode}
        onApplyNewSyncCode={handleApplyNewSyncCode}
        onForceCloudSync={handleForceCloudSync}
        isSyncing={isSyncing}
        tasks={tasks}
        logs={logs}
        events={events}
        timetableSettings={timetableSettings}
        onUpdateTimetableSettings={handleUpdateTimetableSettings}
        onResetAllData={handleResetAllData}
        onImportData={handleImportData}
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        tasks={tasks}
        logs={logs}
        events={events}
        timetableSettings={timetableSettings}
        onAddEvent={handleAddEvent}
        onAddBatchEvents={handleAddBatchEvents}
        onDeleteEvent={handleDeleteEvent}
        onDeleteRecurringGroup={handleDeleteRecurringGroup}
        onToggleEventCompleted={handleToggleEventCompleted}
      />
    </div>
  );
};
