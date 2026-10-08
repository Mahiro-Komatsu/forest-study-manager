export type TaskUnit = 'minutes' | 'pages' | 'problems' | 'chapters';

export interface DailyLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  amount: number; // 達成量（分、ページなど）
  mode: 'timer' | 'manual';
  notes?: string;
  timestamp: number;
}

export type EventCategory = 'study' | 'class' | 'part_time' | 'exam' | 'other';

export interface StudyScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // 予定のタイトル（例: "授業", "バイト", "単語テスト"）
  category?: EventCategory;
  taskId?: string; // 関連する科目ID（任意）
  time?: string; // 開始時刻（例: "14:00"）
  durationMinutes?: number; // 予定時間（分）
  notes?: string;
  isCompleted?: boolean;
  color?: string;
  recurrenceGroupId?: string; // 繰り返しグループID（一括削除・管理用）
  createdAt: number;
}

export interface StudyTask {
  id: string;
  title: string;
  category?: string;
  color: string; // テーマカラー (Tailwind/HEX)
  icon?: string;
  
  // ノルマ設定
  unit: TaskUnit;
  totalQuota: number; // 全体目標（例: 300ページ, 1200分）
  dailyTarget: number; // 1日の目標量（例: 20ページ, 60分）
  
  // 進捗状況
  completedTotal: number; // これまでの累計消化量
  deadline: string; // YYYY-MM-DD
  
  // メタデータ
  createdAt: number;
  updatedAt: number;
  isArchived?: boolean;
}

export interface TaskDayProgress {
  taskId: string;
  date: string;
  todayCompleted: number;
  dailyTarget: number;
  remainingToday: number;
  progressPercent: number; // 0 - 100+
  isCompletedToday: boolean;
}

export type TimerState = {
  isRunning: boolean;
  isPaused: boolean;
  secondsLeft: number; // タイマー残り秒数
  targetSeconds: number; // 設定されたタイマー秒数
  activeTaskId: string | null;
  startedAt: number | null;
};
