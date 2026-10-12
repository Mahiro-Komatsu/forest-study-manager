'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Cloud,
  Smartphone,
  Laptop,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Info,
  GraduationCap,
  Clock,
  Utensils,
  Save,
  Sparkles,
  Moon,
  Trash2,
  AlertTriangle,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StudyTask, DailyLog, StudyScheduleEvent, TimetableSettings, NotificationSettings } from '@/types/study';
import { DEFAULT_TIMETABLE_SETTINGS, DEFAULT_SLEEP_HOURS, DEFAULT_NOTIFICATION_SETTINGS, formatMinutesToHours } from '@/lib/storage';
import {
  isNotificationSupported,
  getNotificationPermission,
  getDetailedNotificationStatus,
  NotificationPermissionStatus,
  isIosDevice,
  requestNotificationPermission,
  sendDailyQuotaNotification,
  getDailyQuotaSummary,
} from '@/lib/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  onApplyNewSyncCode: (newCode: string) => Promise<boolean>;
  onForceCloudSync: () => Promise<void>;
  isSyncing: boolean;
  tasks: StudyTask[];
  logs: DailyLog[];
  events: StudyScheduleEvent[];
  timetableSettings: TimetableSettings;
  sleepHours: number;
  notificationSettings?: NotificationSettings;
  onUpdateTimetableSettings: (settings: TimetableSettings) => void;
  onUpdateSleepHours: (hours: number) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onResetAllData: (mode?: 'default' | 'clear_all' | 'logs_only') => void;
  onImportData: (importedData: { tasks: StudyTask[]; logs: DailyLog[]; events: StudyScheduleEvent[] }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  onApplyNewSyncCode,
  onForceCloudSync,
  isSyncing,
  tasks,
  logs,
  events,
  timetableSettings,
  sleepHours = DEFAULT_SLEEP_HOURS,
  notificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
  onUpdateTimetableSettings,
  onUpdateSleepHours,
  onUpdateNotificationSettings,
  onResetAllData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'notifications' | 'sync' | 'data' | 'about'>('timetable');
  const [inputCode, setInputCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 時間割設定 & 睡眠時間のローカル編集用ステート
  const [tempTimetable, setTempTimetable] = useState<TimetableSettings>(timetableSettings);
  const [tempSleepHours, setTempSleepHours] = useState<number>(sleepHours);

  // 通知設定のローカル編集用ステート
  const [tempNotifications, setTempNotifications] = useState<NotificationSettings>(notificationSettings);
  const [permissionState, setPermissionState] = useState<NotificationPermissionStatus>('default');
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // コンポーネント表示時に最新の通知許可状態を取得
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionState(getDetailedNotificationStatus());
    }
  }, [isOpen]);

  // props が変わった時にローカルステートを同期
  React.useEffect(() => {
    setTempNotifications(notificationSettings);
  }, [notificationSettings]);

  if (!isOpen) return null;

  // 通知権限の許可をブラウザにリクエスト
  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    const detailed = getDetailedNotificationStatus();
    setPermissionState(detailed);
    if (res === 'granted') {
      const updated = { ...tempNotifications, enabled: true };
      setTempNotifications(updated);
      onUpdateNotificationSettings(updated);
      setStatusMessage({
        type: 'success',
        text: 'ブラウザ通知が許可されました！毎日のノルマ通知を受け取れます。',
      });
    } else if (res === 'denied') {
      setStatusMessage({
        type: 'error',
        text: isIosDevice()
          ? '通知が許可されていません。iPhoneの「設定」アプリ ＞ 「通知」 ＞ 「学習の要」から通知を許可してください。'
          : '通知がブロックされています。ブラウザのアドレスバーの鍵アイコンから通知を許可してください。',
      });
    }
  };

  // 通知設定の保存
  const handleSaveNotifications = () => {
    onUpdateNotificationSettings(tempNotifications);
    setStatusMessage({
      type: 'success',
      text: '通知設定を保存しました！',
    });
    setTimeout(() => {
      setStatusMessage(null);
    }, 2500);
  };

  // テスト通知の送信
  const handleSendTestNotification = async () => {
    if (permissionState !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionState(res);
      if (res !== 'granted') {
        setStatusMessage({
          type: 'error',
          text: '通知が許可されていないため、テスト通知を送信できませんでした。',
        });
        return;
      }
    }

    setIsTestingNotification(true);
    sendDailyQuotaNotification(tasks, logs, events, tempSleepHours, true);
    setStatusMessage({
      type: 'success',
      text: 'テスト通知を送信しました！デスクトップや画面右上に通知が表示されたかご確認ください。',
    });
    setTimeout(() => {
      setIsTestingNotification(false);
    }, 2000);
  };

  // 同期コードコピー
  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 別の同期コードを連携
  const handleLinkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setStatusMessage(null);
    const success = await onApplyNewSyncCode(inputCode.trim().toUpperCase());
    if (success) {
      setStatusMessage({
        type: 'success',
        text: '同期コードを連携しました！データを読み込んでいます...',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: '同期コードが見つからないか、エラーが発生しました。',
      });
    }
  };

  // 時間割の各時限の時刻変更
  const handlePeriodTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...tempTimetable.periods];
    updated[index] = { ...updated[index], [field]: value };
    setTempTimetable({ ...tempTimetable, periods: updated });
  };

  // 5限制・6限制の切り替え
  const handlePeriodCountChange = (count: number) => {
    let updatedPeriods = [...tempTimetable.periods];
    if (count === 5 && updatedPeriods.length > 5) {
      updatedPeriods = updatedPeriods.slice(0, 5);
    } else if (count === 6 && updatedPeriods.length === 5) {
      updatedPeriods.push({
        period: 6,
        name: '6限',
        startTime: '18:20',
        endTime: '19:50',
      });
    }
    setTempTimetable({
      ...tempTimetable,
      periodCount: count,
      periods: updatedPeriods,
    });
  };

  // プリセット適用
  const handleApplyPreset = (type: 'univ90' | 'univ100' | 'high50') => {
    if (type === 'univ90') {
      setTempTimetable(DEFAULT_TIMETABLE_SETTINGS);
    } else if (type === 'univ100') {
      setTempTimetable({
        periodCount: 5,
        defaultPeriodMinutes: 100,
        periods: [
          { period: 1, name: '1限', startTime: '09:00', endTime: '10:40' },
          { period: 2, name: '2限', startTime: '10:55', endTime: '12:35' },
          { period: 3, name: '3限', startTime: '13:25', endTime: '15:05' },
          { period: 4, name: '4限', startTime: '15:20', endTime: '17:00' },
          { period: 5, name: '5限', startTime: '17:15', endTime: '18:55' },
        ],
        lunchBreak: {
          enabled: true,
          afterPeriod: 2,
          startTime: '12:35',
          endTime: '13:25',
        },
      });
    } else if (type === 'high50') {
      setTempTimetable({
        periodCount: 6,
        defaultPeriodMinutes: 50,
        periods: [
          { period: 1, name: '1限', startTime: '08:50', endTime: '09:40' },
          { period: 2, name: '2限', startTime: '09:50', endTime: '10:40' },
          { period: 3, name: '3限', startTime: '10:50', endTime: '11:40' },
          { period: 4, name: '4限', startTime: '11:50', endTime: '12:40' },
          { period: 5, name: '5限', startTime: '13:25', endTime: '14:15' },
          { period: 6, name: '6限', startTime: '14:25', endTime: '15:15' },
        ],
        lunchBreak: {
          enabled: true,
          afterPeriod: 4,
          startTime: '12:40',
          endTime: '13:25',
        },
      });
    }
  };

  // 時間割 & 睡眠時間設定の保存
  const handleSaveTimetable = () => {
    onUpdateTimetableSettings(tempTimetable);
    onUpdateSleepHours(tempSleepHours);
    setStatusMessage({
      type: 'success',
      text: '時間割と生活リズム（睡眠時間）設定を保存しました！',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // バックアップJSONのエクスポート
  const handleExportData = () => {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      tasks,
      logs,
      events,
      timetableSettings: tempTimetable,
      sleepHours: tempSleepHours,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-study-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // バックアップJSONのインポート
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tasks && Array.isArray(json.tasks)) {
          onImportData({
            tasks: json.tasks || [],
            logs: json.logs || [],
            events: json.events || [],
          });
          if (json.timetableSettings) {
            setTempTimetable(json.timetableSettings);
            onUpdateTimetableSettings(json.timetableSettings);
          }
          if (typeof json.sleepHours === 'number') {
            setTempSleepHours(json.sleepHours);
            onUpdateSleepHours(json.sleepHours);
          }
          setStatusMessage({
            type: 'success',
            text: 'バックアップデータを正常に復元しました！',
          });
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: 'ファイルの形式が正しくありません。',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-3.5 border-b border-emerald-900/50 mb-3.5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">設定 ＆ 時間割管理</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 設定タブナビゲーション */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-2xl border border-slate-800 mb-3.5 flex-shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex-1 min-w-[70px] py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'timetable'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">時間割</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 min-w-[70px] py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">通知</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex-1 min-w-[60px] py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'sync'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">同期</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 min-w-[60px] py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'data'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">データ</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 min-w-[60px] py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'about'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">情報</span>
            </button>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* =========================================================
                タブ 0: 授業時間割・時限 & 睡眠時間設定（可処分時間の算出）
               ========================================================= */}
            {activeTab === 'timetable' && (
              <div className="space-y-4">
                {/* 🛌 1日の睡眠時間設定（可処分時間算出用） */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          1日の睡眠時間設定
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 font-normal">可処分時間計算用</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          24時間 - 睡眠時間 - 予定時間 = その日の「勉強可能時間」
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-indigo-500/40">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={tempSleepHours}
                        onChange={(e) => setTempSleepHours(Math.max(0, Math.min(24, parseFloat(e.target.value) || 0)))}
                        className="w-10 text-center text-xs font-bold text-indigo-200 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-indigo-300/80 font-semibold">時間</span>
                    </div>
                  </div>

                  {/* クイック目安ボタン */}
                  <div className="flex items-center gap-1 pt-1 border-t border-indigo-900/40">
                    <span className="text-[10px] text-slate-400 flex-shrink-0">クイック選択:</span>
                    {[6, 6.5, 7, 7.5, 8].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTempSleepHours(h)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                          tempSleepHours === h
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {h}h{h === DEFAULT_SLEEP_HOURS ? ' (標準)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 説明 ＆ プリセット */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      時間割の標準プリセット
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('univ90')}
                      className="py-1.5 px-2 rounded-xl bg-slate-700/60 hover:bg-emerald-600/30 hover:border-emerald-500 border border-slate-600 text-[11px] font-semibold text-slate-200 transition-all text-center"
                    >
                      大学 90分 (6限)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('univ100')}
                      className="py-1.5 px-2 rounded-xl bg-slate-700/60 hover:bg-emerald-600/30 hover:border-emerald-500 border border-slate-600 text-[11px] font-semibold text-slate-200 transition-all text-center"
                    >
                      大学 100分 (5限)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('high50')}
                      className="py-1.5 px-2 rounded-xl bg-slate-700/60 hover:bg-emerald-600/30 hover:border-emerald-500 border border-slate-600 text-[11px] font-semibold text-slate-200 transition-all text-center"
                    >
                      高校 50分 (6限)
                    </button>
                  </div>
                </div>

                {/* 5限制・6限制の選択 */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-300">時限制の選択</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => handlePeriodCountChange(5)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        tempTimetable.periodCount === 5
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      5限制
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodCountChange(6)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        tempTimetable.periodCount === 6
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      6限制
                    </button>
                  </div>
                </div>

                {/* 各時限（1〜5 or 6限）とお昼休みの時刻リスト */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>各時限の開始・終了時刻</span>
                    <span className="text-[11px] font-normal text-emerald-400">カレンダーの講義登録と連動</span>
                  </div>

                  {tempTimetable.periods.map((period, idx) => {
                    const isAfterLunch = tempTimetable.lunchBreak.enabled && tempTimetable.lunchBreak.afterPeriod === period.period;

                    return (
                      <React.Fragment key={period.period}>
                        {/* 時限カード */}
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {period.period}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{period.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <input
                              type="time"
                              value={period.startTime}
                              onChange={(e) => handlePeriodTimeChange(idx, 'startTime', e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-slate-500">〜</span>
                            <input
                              type="time"
                              value={period.endTime}
                              onChange={(e) => handlePeriodTimeChange(idx, 'endTime', e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* お昼休み表示 */}
                        {isAfterLunch && (
                          <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <Utensils className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <span className="font-bold text-amber-300">🍱 お昼休み</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-mono">
                              <input
                                type="time"
                                value={tempTimetable.lunchBreak.startTime}
                                onChange={(e) =>
                                  setTempTimetable({
                                    ...tempTimetable,
                                    lunchBreak: { ...tempTimetable.lunchBreak, startTime: e.target.value },
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-slate-900 border border-amber-800/60 text-amber-200 text-xs focus:outline-none focus:border-amber-400"
                              />
                              <span className="text-amber-500">〜</span>
                              <input
                                type="time"
                                value={tempTimetable.lunchBreak.endTime}
                                onChange={(e) =>
                                  setTempTimetable({
                                    ...tempTimetable,
                                    lunchBreak: { ...tempTimetable.lunchBreak, endTime: e.target.value },
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-slate-900 border border-amber-800/60 text-amber-200 text-xs focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* 保存ボタン */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTimetable}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    時間割・生活設定を保存する
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                タブ: 通知・ノルマ設定
               ========================================================= */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* ブラウザ通知権限カード */}
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">ブラウザ通知の許可状態</span>
                    </div>
                    {permissionState === 'granted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        許可済み
                      </span>
                    ) : permissionState === 'ios_pwa_required' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ホーム画面追加が必要
                      </span>
                    ) : permissionState === 'denied' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        ブロック中
                      </span>
                    ) : permissionState === 'unsupported' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                        非対応ブラウザ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        未許可
                      </span>
                    )}
                  </div>

                  {permissionState === 'granted' ? (
                    <p className="text-[11px] text-emerald-300/90">
                      ✓ ブラウザ通知が許可されています。定時リマインダーやタイマー完了通知が正常に届きます。
                    </p>
                  ) : permissionState === 'ios_pwa_required' ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                          <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>iPhone (iOS) で通知を受け取る手順</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">
                          Apple（iOS）の仕様により、通常のSafariタブからはWeb通知が制限されています。
                          <strong>「ホーム画面に追加」</strong>してアプリとして開くと通知を有効化できます。
                        </p>
                      </div>

                      {/* 手順リスト */}
                      <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2 text-[11px]">
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            1
                          </span>
                          <span className="text-slate-200">
                            Safari画面下の <strong>共有ボタン</strong>（四角から上矢印 <Share2 className="inline w-3 h-3 text-emerald-400 mx-0.5" />）をタップ
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            2
                          </span>
                          <span className="text-slate-200">
                            メニューから <strong>「ホーム画面に追加」</strong> を選択して右上の「追加」をタップ
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            3
                          </span>
                          <span className="text-slate-200">
                            ホーム画面に追加された <strong>「学習の要」アプリアイコン</strong> をタップして起動
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            4
                          </span>
                          <span className="text-slate-200">
                            設定 ＞ 「通知」から <strong>「ブラウザ通知を許可する」</strong> をタップ！
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : permissionState === 'denied' ? (
                    <div className="text-[11px] text-rose-300 space-y-1">
                      <p>⚠️ 通知がブロックされています。</p>
                      {isIosDevice() ? (
                        <p className="text-slate-300 text-[10px] leading-relaxed">
                          iPhoneの <strong>「設定」アプリ ＞ 「通知」 ＞ 「学習の要（またはSafari）」</strong> を開き、「通知を許可」をONにしてください。
                        </p>
                      ) : (
                        <p className="text-slate-400 text-[10px]">
                          通知を受け取るには、ブラウザのURLアドレスバー左側の鍵アイコン（またはサイト設定）をクリックし、「通知」を「許可」に変更してください。
                        </p>
                      )}
                    </div>
                  ) : permissionState === 'unsupported' ? (
                    <div className="text-[11px] text-slate-400">
                      お使いのブラウザはWeb Notification APIに対応していません。Google ChromeやEdge、またはホーム画面に追加したiOSアプリでご利用ください。
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] text-slate-300 mb-2.5">
                        毎日のノルマ通知やタイマー終了の通知を受け取るには、ブラウザの通知許可が必要です。
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        ブラウザ通知を許可する
                      </button>
                    </div>
                  )}
                </div>

                {/* 毎日のノルマ通知設定 */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        毎日のノルマ通知（定時リマインダー）
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        毎日指定の時刻に、今日の未達成ノルマと残り可能時間をお知らせします
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={tempNotifications.enabled}
                        onChange={(e) =>
                          setTempNotifications({ ...tempNotifications, enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* 通知時刻の選択 */}
                  {tempNotifications.enabled && (
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-300 font-medium">通知を届ける時刻</span>
                      </div>
                      <input
                        type="time"
                        value={tempNotifications.reminderTime}
                        onChange={(e) =>
                          setTempNotifications({ ...tempNotifications, reminderTime: e.target.value })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* その他の通知オプション */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
                  {/* タイマー完了通知 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        タイマー完了通知
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        勉強タイマー終了時にデスクトップ/ブラウザ通知でお知らせ
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={tempNotifications.timerCompletionNotice}
                        onChange={(e) =>
                          setTempNotifications({
                            ...tempNotifications,
                            timerCompletionNotice: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* 通知チャイム音 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        通知チャイム音
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        通知受信時に心地よいチャイム音（ポロン♪）を再生
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={tempNotifications.soundEnabled}
                        onChange={(e) =>
                          setTempNotifications({
                            ...tempNotifications,
                            soundEnabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* 通知プレビュー＆テスト送信 */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      届く通知のプレビュー（現在の状況）
                    </span>
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      disabled={isTestingNotification}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <BellRing className="w-3 h-3" />
                      {isTestingNotification ? '送信中...' : 'テスト通知を送る'}
                    </button>
                  </div>

                  {/* プレビュー吹き出し */}
                  {(() => {
                    const preview = getDailyQuotaSummary(tasks, logs, events, tempSleepHours);
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-900/40 text-xs space-y-1 font-sans">
                        <div className="font-bold text-emerald-400 flex items-center gap-1">
                          <span>🌲 今日の学習ノルマ</span>
                          <span className="text-[10px] text-slate-500 font-normal">・ 学習管理の要</span>
                        </div>
                        {preview.totalCount === 0 ? (
                          <div className="text-slate-400 text-[11px]">登録されている科目がありません。</div>
                        ) : preview.isAllCompleted ? (
                          <div className="text-emerald-200 text-[11px]">
                            🎉 本日のすべての科目（全{preview.totalCount}科目）のノルマを達成しました！
                          </div>
                        ) : (
                          <div className="text-slate-300 text-[11px] space-y-0.5">
                            <div className="text-slate-400">
                              本日の残りノルマ ({preview.completedCount}/{preview.totalCount} 完了):
                            </div>
                            {preview.pendingTasks.slice(0, 3).map((item, i) => (
                              <div key={i} className="pl-1 text-slate-200">
                                ・{item.taskName}: あと <span className="text-amber-400 font-medium">{item.remainingToday}</span> {item.unitLabel}
                              </div>
                            ))}
                            {preview.pendingTasks.length > 3 && (
                              <div className="pl-1 text-slate-500 text-[10px]">
                                ...他 {preview.pendingTasks.length - 3} 科目
                              </div>
                            )}
                            <div className="pt-1 text-emerald-400 text-[10px] font-medium">
                              🕒 残り勉強可能時間: {formatMinutesToHours(preview.disposableTime.remainingAvailableMinutes)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 保存ボタン */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    通知設定を保存する
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                タブ 1: クラウド同期
               ========================================================= */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                {/* 説明バナー */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 flex-shrink-0">
                    <Laptop className="w-5 h-5" />
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    PCとスマホで同じ<strong>「同期コード」</strong>を設定すると、どちらからでも同じ学習進捗やカレンダー予定、時間割をリアルタイム共有できます。
                  </p>
                </div>

                {/* この端末の同期コード */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    この端末の同期コード
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-base font-bold text-emerald-300 tracking-wider text-center select-all">
                      {syncCode || '生成中...'}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
                      title="コードをコピー"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {isCopied ? 'コピー済' : 'コピー'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ※ スマホ側でこのコードを入力すると、PCのデータをスマホに引き継げます。
                  </p>
                </div>

                {/* 手動同期ボタン */}
                <button
                  onClick={onForceCloudSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'クラウドと同期中...' : '今すぐ最新データと同期する'}
                </button>

                {/* 別の同期コードを入力して接続 */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    別の端末の同期コードを連携する
                  </label>
                  <form onSubmit={handleLinkCode} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="例: FST-A83K"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs uppercase focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
                      >
                        連携
                      </button>
                    </div>
                  </form>
                </div>

                {/* クラウド設定ステータス */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Supabase クラウド接続状態
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isSupabaseConfigured
                      ? '🟢 クラウドデータベースと正常に接続されています。'
                      : '🟡 ローカル同期モード（環境変数が設定されると完全自動同期が有効化されます）'}
                  </p>
                </div>
              </div>
            )}

            {/* =========================================================
                タブ 2: データ管理（バックアップ/復元/初期化）
               ========================================================= */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                {/* バックアップ エクスポート */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    データのバックアップ保存
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    現在の学習タスク、進捗ログ、カレンダーの予定、時間割設定をすべてJSONファイルとして保存します。
                  </p>
                  <button
                    onClick={handleExportData}
                    className="py-2 px-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSONファイルをダウンロード
                  </button>
                </div>

                {/* バックアップ インポート */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-sky-400" />
                    バックアップから復元
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    保存したJSONファイルを選択して学習データと時間割を復元します。
                  </p>
                  <label className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sky-300 hover:text-white text-xs font-semibold cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    JSONファイルを選択
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>

                {/* データの消去 ＆ デフォルト初期化 */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                    <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      データの消去 ＆ デフォルト初期化
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50 font-semibold">
                      取り消し不可
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    端末に保存されている学習データやカレンダー予定、設定を消去・リセットします。目的の操作を選択してください。
                  </p>

                  <div className="space-y-2.5">
                    {/* 1. デフォルト初期状態にリセット (推奨) */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          データをデフォルト初期状態に戻す
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">消去リセット</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        登録した予定や学習記録を消去し、標準の初期状態（基本1科目「ここに科目名を入力」、学習時間0、予定0件、初期時間割・睡眠7h）に戻します。
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('すべての予定や学習記録を消去し、データをデフォルト初期状態にリセットしますか？\n（この操作は取り消せません）')) {
                            onResetAllData('default');
                            setStatusMessage({
                              type: 'success',
                              text: 'データをデフォルト初期状態にリセットしました！',
                            });
                            setTimeout(() => {
                              setStatusMessage(null);
                              onClose();
                            }, 1000);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        データをデフォルト状態に戻す（消去リセット）
                      </button>
                    </div>

                    {/* 2. 学習記録・実績ログのみ消去 */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          学習記録・実績ログのみ消去（進捗を0クリア）
                        </div>
                        <span className="text-[10px] text-amber-400 font-semibold">ログ消去</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        作成した科目やカレンダー予定はそのまま残し、入力した学習時間や消化実績ログのみを消去して0に戻します。
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('これまでの学習記録・ログのみを消去して0に戻しますか？\n（科目やカレンダー予定はそのまま維持されます）')) {
                            onResetAllData('logs_only');
                            setStatusMessage({
                              type: 'success',
                              text: '学習進捗と記録ログを消去しました！',
                            });
                            setTimeout(() => {
                              setStatusMessage(null);
                              onClose();
                            }, 1000);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/80 border border-amber-500/40 hover:border-amber-500 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        学習記録・ログのみ消去する
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                タブ 3: アプリ情報
               ========================================================= */}
            {activeTab === 'about' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                    <div className="font-bold text-white text-sm">Forest Study Manager</div>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Forestの優れた円形インジケーター・UIレイアウトを「学習予定の消化と進捗トラッキング」に転用したスマート学習管理アプリです。
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
                    <div>バージョン: <span className="text-white font-semibold">v1.3.0</span></div>
                    <div>時間割: <span className="text-white font-semibold">{tempTimetable.periodCount}限制 (昼休対応)</span></div>
                    <div>フレームワーク: <span className="text-white font-semibold">Next.js 14</span></div>
                    <div>データベース: <span className="text-white font-semibold">Supabase & Local</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ステータスメッセージ */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {statusMessage.text}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
