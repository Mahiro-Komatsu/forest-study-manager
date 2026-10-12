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
  periodIndex?: number; // 1〜6限（任意）
  taskId?: string; // 関連する科目ID（任意）
  time?: string; // 開始時刻（例: "14:00"）
  durationMinutes?: number; // 予定時間（分）
  notes?: string;
  isCompleted?: boolean;
  color?: string;
  recurrenceGroupId?: string; // 繰り返しグループID（一括削除・管理用）
  createdAt: number;
}

export interface TimetablePeriod {
  period: number; // 1, 2, 3, 4, 5, 6
  name: string; // "1限", "2限"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
}

export interface LunchBreakSetting {
  enabled: boolean;
  afterPeriod: number; // 例: 2限の後
  startTime: string; // "12:15"
  endTime: string; // "13:05"
}

export interface TimetableSettings {
  periodCount: number; // 5 または 6
  defaultPeriodMinutes: number; // 90, 100, 50 など
  periods: TimetablePeriod[];
  lunchBreak: LunchBreakSetting;
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

export interface DisposableTimeInfo {
  totalMinutesInDay: number; // 24時間 = 1440分
  sleepMinutes: number; // 睡眠時間（分）
  eventsMinutes: number; // その日の予定の合計時間（分）
  availableMinutes: number; // 勉強可能時間（可処分時間 = max(0, 1440 - 睡眠分 - 予定分)）
  studiedMinutes: number; // すでに学習した実績時間（分）
  remainingAvailableMinutes: number; // 残り勉強可能時間 = max(0, availableMinutes - studiedMinutes)
}

export interface NotificationSettings {
  enabled: boolean; // リマインダー通知が有効か
  reminderTime: string; // 通知時刻 'HH:mm'（デフォルト '20:00'）
  timerCompletionNotice: boolean; // タイマー終了時に通知するか
  soundEnabled: boolean; // 通知音を鳴らすか
  lastNotifiedDate?: string; // 最後にノルマ通知を送信した日付 'YYYY-MM-DD'
}


