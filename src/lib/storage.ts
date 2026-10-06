import { StudyTask, DailyLog, TaskDayProgress } from '@/types/study';

export const STORAGE_KEYS = {
  TASKS: 'forest_study_tasks_v2',
  LOGS: 'forest_study_logs_v2',
  ACTIVE_TASK_ID: 'forest_study_active_id_v2',
  SYNC_CODE: 'forest_study_sync_code_v2',
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

// 今日の日付 (YYYY-MM-DD)
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// デフォルト期日計算（日数後）
const getFutureDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// オーソドックスな初期タスクデータ
export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'task-1',
    title: '英語学習（英単語・リスニング）',
    category: '語学・英語',
    color: '#22c55e', // Forest green
    unit: 'minutes',
    totalQuota: 600,
    dailyTarget: 30,
    completedTotal: 150,
    deadline: getFutureDate(14),
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'task-2',
    title: '数学（基礎問題演習）',
    category: '数学・理数',
    color: '#3b82f6', // Ocean Blue
    unit: 'problems',
    totalQuota: 100,
    dailyTarget: 10,
    completedTotal: 35,
    deadline: getFutureDate(21),
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'task-3',
    title: '読書・参考書（教養・専門書）',
    category: '読書',
    color: '#f59e0b', // Amber
    unit: 'pages',
    totalQuota: 200,
    dailyTarget: 15,
    completedTotal: 50,
    deadline: getFutureDate(28),
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'task-4',
    title: '資格試験対策（過去問演習）',
    category: '資格・IT',
    color: '#a855f7', // Purple
    unit: 'minutes',
    totalQuota: 900,
    dailyTarget: 45,
    completedTotal: 200,
    deadline: getFutureDate(14),
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  }
];

export const INITIAL_LOGS: DailyLog[] = [
  {
    id: 'log-1',
    taskId: 'task-1',
    date: getTodayDateString(),
    amount: 15,
    mode: 'timer',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'log-2',
    taskId: 'task-2',
    date: getTodayDateString(),
    amount: 4,
    mode: 'manual',
    timestamp: Date.now() - 3600000 * 3,
  }
];

// LocalStorage からタスク一覧を取得
export const loadTasksFromStorage = (): StudyTask[] => {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      saveTasksToStorage(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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
