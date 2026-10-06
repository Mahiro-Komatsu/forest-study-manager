import { StudyTask, DailyLog, TaskDayProgress } from '@/types/study';

export const STORAGE_KEYS = {
  TASKS: 'forest_study_tasks_v1',
  LOGS: 'forest_study_logs_v1',
  ACTIVE_TASK_ID: 'forest_study_active_id_v1',
};

// 今日の日付 (YYYY-MM-DD)
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 初期モックデータ
export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'task-1',
    title: '統計学 第3章（確率分布）',
    category: '数学・データサイエンス',
    color: '#22c55e', // Emerald / Forest green
    unit: 'pages',
    totalQuota: 80,
    dailyTarget: 15,
    completedTotal: 25,
    deadline: '2026-10-15',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'task-2',
    title: 'ML特論（深層学習モデル実装）',
    category: '機械学習',
    color: '#3b82f6', // Ocean Blue
    unit: 'minutes',
    totalQuota: 600,
    dailyTarget: 60,
    completedTotal: 180,
    deadline: '2026-10-20',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'task-3',
    title: 'TOEIC リーディング演習',
    category: '語学',
    color: '#f59e0b', // Amber / Sun
    unit: 'problems',
    totalQuota: 100,
    dailyTarget: 20,
    completedTotal: 40,
    deadline: '2026-10-05',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  }
];

export const INITIAL_LOGS: DailyLog[] = [
  {
    id: 'log-1',
    taskId: 'task-1',
    date: getTodayDateString(),
    amount: 5,
    mode: 'manual',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'log-2',
    taskId: 'task-2',
    date: getTodayDateString(),
    amount: 25,
    mode: 'timer',
    timestamp: Date.now() - 3600000 * 4,
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
