import { StudyTask, DailyLog, StudyScheduleEvent, NotificationSettings } from '@/types/study';
import { calculateTodayProgress, calculateDisposableTime, formatMinutesToHours, getTodayDateString, getUnitLabel } from './storage';

/**
 * ブラウザが Notification API に対応しているか判定
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * 現在の通知許可状態を取得
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * 通知許可をリクエスト
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

/**
 * Web Audio API による心地よいチャイム音の再生
 */
export const playNotificationChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // 2トーンの心地よい和音（E5: 659.25Hz -> A5: 880Hz）
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(659.25, now, 0.4);       // E5
    playTone(880.00, now + 0.15, 0.6); // A5
  } catch (e) {
    // AudioContext の初期化失敗等は無視
    console.warn('Audio playback not allowed or failed:', e);
  }
};

/**
 * 安全にブラウザ通知を送信
 */
export const sendBrowserNotification = (
  title: string,
  options?: NotificationOptions & { playSound?: boolean }
): Notification | null => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    if (options?.playSound !== false) {
      playNotificationChime();
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Failed to send browser notification:', err);
    return null;
  }
};

/**
 * 今日のノルマ進捗サマリーの取得
 */
export const getDailyQuotaSummary = (
  tasks: StudyTask[],
  logs: DailyLog[],
  events: StudyScheduleEvent[],
  sleepHours: number
) => {
  const todayStr = getTodayDateString();
  const disposableTime = calculateDisposableTime(todayStr, events, logs, tasks, sleepHours);

  const activeTasks = tasks.filter((t) => !t.isArchived);
  const taskProgresses = activeTasks.map((t) => calculateTodayProgress(t, logs, todayStr));

  const pendingTasks = taskProgresses.filter((p) => !p.isCompletedToday);
  const completedTasks = taskProgresses.filter((p) => p.isCompletedToday);

  return {
    todayStr,
    totalCount: activeTasks.length,
    completedCount: completedTasks.length,
    pendingCount: pendingTasks.length,
    isAllCompleted: pendingTasks.length === 0 && activeTasks.length > 0,
    disposableTime,
    pendingTasks: pendingTasks.map((p) => {
      const task = activeTasks.find((t) => t.id === p.taskId);
      return {
        taskName: task?.title || '科目',
        unitLabel: task ? getUnitLabel(task.unit) : '分',
        remainingToday: p.remainingToday,
        dailyTarget: p.dailyTarget,
        todayCompleted: p.todayCompleted,
      };
    }),
  };
};

/**
 * 今日のノルマ通知を送信
 */
export const sendDailyQuotaNotification = (
  tasks: StudyTask[],
  logs: DailyLog[],
  events: StudyScheduleEvent[],
  sleepHours: number,
  isTest = false
) => {
  const summary = getDailyQuotaSummary(tasks, logs, events, sleepHours);

  let title = '🌲 今日の学習ノルマ';
  if (isTest) title = '🔔 [テスト] 今日の学習ノルマ通知';

  let body = '';

  if (summary.totalCount === 0) {
    body = '登録されている学習科目がありません。新しい科目を追加してみましょう！';
  } else if (summary.isAllCompleted) {
    title = isTest ? '🎉 [テスト] 本日のノルマ達成！' : '🎉 本日の学習ノルマ達成！';
    body = `お見事！すべての科目（全${summary.totalCount}科目）の今日のノルマをクリアしました！✨`;
  } else {
    // 未達成科目の一覧
    const pendingText = summary.pendingTasks
      .slice(0, 3)
      .map((item) => `・${item.taskName}: あと ${item.remainingToday}${item.unitLabel}`)
      .join('\n');

    const moreText = summary.pendingTasks.length > 3 ? `\n...他 ${summary.pendingTasks.length - 3} 科目` : '';
    const availableText = `\n🕒 残り勉強可能時間: ${formatMinutesToHours(summary.disposableTime.remainingAvailableMinutes)}`;

    body = `本日の残りノルマ (${summary.completedCount}/${summary.totalCount} 完了):\n${pendingText}${moreText}${availableText}`;
  }

  return sendBrowserNotification(title, {
    body,
    tag: isTest ? 'test-quota-notification' : 'daily-quota-notification',
  });
};

/**
 * タイマー終了通知を送信
 */
export const sendTimerFinishedNotification = (taskName: string, minutes: number) => {
  return sendBrowserNotification('⏱️ 学習セッション終了！', {
    body: `「${taskName}」の学習（${minutes}分）が完了しました！お疲れ様でした🎉`,
    tag: `timer-finish-${Date.now()}`,
  });
};
