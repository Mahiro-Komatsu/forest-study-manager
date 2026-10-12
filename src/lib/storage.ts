import { StudyTask, DailyLog, TaskDayProgress, StudyScheduleEvent, DisposableTimeInfo, NotificationSettings } from '@/types/study';

export const STORAGE_KEYS = {
  TASKS: 'forest_study_tasks_v2',
  LOGS: 'forest_study_logs_v2',
  EVENTS: 'forest_study_events_v2',
  TIMETABLE: 'forest_study_timetable_v2',
  SLEEP_HOURS: 'forest_study_sleep_hours_v2',
  ACTIVE_TASK_ID: 'forest_study_active_id_v2',
  SYNC_CODE: 'forest_study_sync_code_v2',
  NOTIFICATIONS: 'forest_study_notifications_v2',
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '20:00',
  timerCompletionNotice: true,
  soundEnabled: true,
};

export const DEFAULT_SLEEP_HOURS = 7;

// デフォルトの大学標準時間割（90分授業・昼休み50分・6限制）
export const DEFAULT_TIMETABLE_SETTINGS: import('@/types/study').TimetableSettings = {
  periodCount: 6,
  defaultPeriodMinutes: 90,
  periods: [
    { period: 1, name: '1限', startTime: '09:00', endTime: '10:30' },
    { period: 2, name: '2限', startTime: '10:45', endTime: '12:15' },
    { period: 3, name: '3限', startTime: '13:05', endTime: '14:35' },
    { period: 4, name: '4限', startTime: '14:50', endTime: '16:20' },
    { period: 5, name: '5限', startTime: '16:35', endTime: '18:05' },
    { period: 6, name: '6限', startTime: '18:20', endTime: '19:50' },
  ],
  lunchBreak: {
    enabled: true,
    afterPeriod: 2,
    startTime: '12:15',
    endTime: '13:05',
  },
};

// LocalStorage から時間割設定を取得
export const loadTimetableSettingsFromStorage = (): import('@/types/study').TimetableSettings => {
  if (typeof window === 'undefined') return DEFAULT_TIMETABLE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (!raw) {
      saveTimetableSettingsToStorage(DEFAULT_TIMETABLE_SETTINGS);
      return DEFAULT_TIMETABLE_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TIMETABLE_SETTINGS;
  }
};

// LocalStorage に時間割設定を保存
export const saveTimetableSettingsToStorage = (settings: import('@/types/study').TimetableSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save timetable settings to localStorage:', err);
  }
};

// LocalStorage から睡眠時間（時間単位、デフォルト7h）を取得
export const loadSleepHoursFromStorage = (): number => {
  if (typeof window === 'undefined') return DEFAULT_SLEEP_HOURS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_HOURS);
    if (!raw) return DEFAULT_SLEEP_HOURS;
    const parsed = parseFloat(raw);
    return isNaN(parsed) || parsed < 0 || parsed > 24 ? DEFAULT_SLEEP_HOURS : parsed;
  } catch {
    return DEFAULT_SLEEP_HOURS;
  }
};

// LocalStorage に睡眠時間を保存
export const saveSleepHoursToStorage = (hours: number) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SLEEP_HOURS, String(hours));
  } catch (err) {
    console.error('Failed to save sleep hours to localStorage:', err);
  }
};

// 6桁の同期コードを生成（例: 'FST-8932'）
export const generateSyncCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'FST-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const loadSyncCodeFromStorage = (): string => {
  if (typeof window === 'undefined') return '';
  let code = localStorage.getItem(STORAGE_KEYS.SYNC_CODE);
  if (!code) {
    code = generateSyncCode();
    localStorage.setItem(STORAGE_KEYS.SYNC_CODE, code);
  }
  return code;
};

export const saveSyncCodeToStorage = (code: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SYNC_CODE, code.toUpperCase().trim());
};

// LocalStorage から通知設定を取得
export const loadNotificationSettingsFromStorage = (): NotificationSettings => {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

// LocalStorage に通知設定を保存
export const saveNotificationSettingsToStorage = (settings: NotificationSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save notification settings to localStorage:', err);
  }
};

// 今日の日付 (YYYY-MM-DD)
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// デフォルト期日計算（日数後）
export const getFutureDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// デフォルトの初期タスクデータ（案内用の1科目のみ、学習時間は0）
export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'task-1',
    title: 'ここに科目名を入力（タップして編集）',
    category: '学習科目',
    color: '#22c55e', // Forest green
    unit: 'minutes',
    totalQuota: 600,
    dailyTarget: 30,
    completedTotal: 0,
    deadline: getFutureDate(30),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export const INITIAL_LOGS: DailyLog[] = [];

// 初期予定イベントデータ（初期状態は空）
export const INITIAL_EVENTS: import('@/types/study').StudyScheduleEvent[] = [];

// LocalStorage から予定一覧を取得
export const loadEventsFromStorage = (): import('@/types/study').StudyScheduleEvent[] => {
  if (typeof window === 'undefined') return INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      saveEventsToStorage(INITIAL_EVENTS);
      return INITIAL_EVENTS;
    }
    const parsed: import('@/types/study').StudyScheduleEvent[] = JSON.parse(raw);
    // 初期サンプルとして紛れ込んでいた古いイベント（event-1, event-2, event-3）を自動クリーンアップ
    const cleaned = parsed.filter((e) => e.id !== 'event-1' && e.id !== 'event-2' && e.id !== 'event-3');
    if (cleaned.length !== parsed.length) {
      saveEventsToStorage(cleaned);
    }
    return cleaned;
  } catch {
    return INITIAL_EVENTS;
  }
};

// LocalStorage に予定一覧を保存
export const saveEventsToStorage = (events: import('@/types/study').StudyScheduleEvent[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
};

// LocalStorage からタスク一覧を取得
export const loadTasksFromStorage = (): StudyTask[] => {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      saveTasksToStorage(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const parsed: StudyTask[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      // タスクが0件の場合は初期標準タスク（学習時間0）を自動復元してアプリを安全に起動
      saveTasksToStorage(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    // 古いデフォルト4科目（英語、数学、読書、資格対策）のまま残っている場合は新しい1科目に更新
    const isOldDefaultFourTasks =
      parsed.length === 4 &&
      parsed.some((t) => t.id === 'task-1' && (t.title.includes('英語学習') || t.title.includes('英語'))) &&
      parsed.some((t) => t.id === 'task-2' && (t.title.includes('数学') || t.title.includes('数学・理数')));

    if (isOldDefaultFourTasks) {
      saveTasksToStorage(INITIAL_TASKS);
      saveActiveTaskId(INITIAL_TASKS[0].id);
      return INITIAL_TASKS;
    }
    return parsed;
  } catch {
    return INITIAL_TASKS;
  }
};

// LocalStorage にタスク一覧を保存
export const saveTasksToStorage = (tasks: StudyTask[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
};

// LocalStorage から進捗ログ一覧を取得
export const loadLogsFromStorage = (): DailyLog[] => {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      saveLogsToStorage(INITIAL_LOGS);
      return INITIAL_LOGS;
    }
    const parsed: DailyLog[] = JSON.parse(raw);
    // 過去のデフォルトサンプルログ（log-1, log-2）を自動クリーンアップ
    const cleaned = parsed.filter((l) => l.id !== 'log-1' && l.id !== 'log-2');
    if (cleaned.length !== parsed.length) {
      saveLogsToStorage(cleaned);
    }
    return cleaned;
  } catch {
    return INITIAL_LOGS;
  }
};

// LocalStorage に進捗ログ一覧を保存
export const saveLogsToStorage = (logs: DailyLog[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs to localStorage:', err);
  }
};

// アクティブタスクIDの保存・取得
export const loadActiveTaskId = (defaultId: string): string => {
  if (typeof window === 'undefined') return defaultId;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK_ID) || defaultId;
};

export const saveActiveTaskId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TASK_ID, id);
};

// タスクごとの今日の進捗を計算
export const calculateTodayProgress = (
  task: StudyTask,
  logs: DailyLog[],
  date: string = getTodayDateString()
): TaskDayProgress => {
  const todayLogs = logs.filter(
    (log) => log.taskId === task.id && log.date === date
  );
  const todayCompleted = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  const dailyTarget = task.dailyTarget;
  const remainingToday = Math.max(0, dailyTarget - todayCompleted);
  const progressPercent = dailyTarget > 0 
    ? Math.min(100, Math.round((todayCompleted / dailyTarget) * 100))
    : 100;

  return {
    taskId: task.id,
    date,
    todayCompleted,
    dailyTarget,
    remainingToday,
    progressPercent,
    isCompletedToday: todayCompleted >= dailyTarget,
  };
};

// 単位の日本語ラベル
export const getUnitLabel = (unit: StudyTask['unit']): string => {
  switch (unit) {
    case 'minutes':
      return '分';
    case 'pages':
      return 'ページ';
    case 'problems':
      return '問';
    case 'chapters':
      return '章';
    default:
      return '';
  }
};

// 期日までの残り日数から日次目標を再計算（リスケジュールロジック）
export const recalculateDailyTarget = (task: StudyTask): number => {
  const remainingTotal = Math.max(0, task.totalQuota - task.completedTotal);
  if (remainingTotal === 0) return 0;
  
  const today = new Date();
  const deadline = new Date(task.deadline);
  
  // ミリ秒差分から日数を算出 (最低1日)
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  return Math.ceil(remainingTotal / diffDays);
};

/**
 * 指定日の可処分時間（勉強可能時間）と内訳を算出
 * 可処分時間 = 24時間(1440分) - (睡眠時間 * 60) - その日の予定時間合計(分)
 */
export const calculateDisposableTime = (
  dateStr: string,
  events: StudyScheduleEvent[],
  logs: DailyLog[],
  tasks: StudyTask[],
  sleepHours: number = DEFAULT_SLEEP_HOURS
): DisposableTimeInfo => {
  const sleepMinutes = Math.round(sleepHours * 60);

  // その日のカレンダー予定の所要時間合計 (分)
  const dayEvents = events.filter((e) => e.date === dateStr);
  const eventsMinutes = dayEvents.reduce((sum, ev) => sum + (ev.durationMinutes || 0), 0);

  // 勉強可能時間（可処分時間）
  const availableMinutes = Math.max(0, 1440 - sleepMinutes - eventsMinutes);

  // その日すでに実施・記録した学習時間 (分)
  const dayLogs = logs.filter((l) => l.date === dateStr);
  const studiedMinutes = dayLogs.reduce((sum, l) => {
    // minutes unit のタスクまたはタイマー記録の場合
    const task = tasks.find((t) => t.id === l.taskId);
    if (!task || task.unit === 'minutes') {
      return sum + (l.amount || 0);
    }
    // ページや問題数の場合も、もしタイマー記録があれば所要時間を推計、基本はそのまま記録分または考慮
    return sum;
  }, 0);

  const remainingAvailableMinutes = Math.max(0, availableMinutes - studiedMinutes);

  return {
    totalMinutesInDay: 1440,
    sleepMinutes,
    eventsMinutes,
    availableMinutes,
    studiedMinutes,
    remainingAvailableMinutes,
  };
};

/**
 * 分を「X時間Y分」形式にフォーマット
 */
export const formatMinutesToHours = (minutes: number): string => {
  if (minutes <= 0) return '0時間';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
};

/**
 * 全データをデフォルト初期状態にリセット（消去）する
 * - 科目: 初期デフォルト科目4つ（各進捗0）
 * - ログ: 0件
 * - 予定: 0件
 * - 時間割: デフォルト大学90分6限
 * - 睡眠時間: 7時間
 */
export const resetAllDataToDefault = () => {
  saveTasksToStorage(INITIAL_TASKS);
  saveLogsToStorage([]);
  saveEventsToStorage([]);
  saveTimetableSettingsToStorage(DEFAULT_TIMETABLE_SETTINGS);
  saveSleepHoursToStorage(DEFAULT_SLEEP_HOURS);
  saveActiveTaskId(INITIAL_TASKS[0]?.id || '');
};

/**
 * データを初期デフォルト状態に消去・リセットする
 */
export const clearAllDataCompletely = () => {
  resetAllDataToDefault();
};

/**
 * 学習進捗ログ・記録のみを消去して0にする（科目と予定は維持）
 */
export const clearLogsOnly = (currentTasks: StudyTask[]): StudyTask[] => {
  saveLogsToStorage([]);
  const resetTasks = currentTasks.map((t) => ({ ...t, completedTotal: 0 }));
  saveTasksToStorage(resetTasks);
  return resetTasks;
};


