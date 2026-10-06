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
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StudyTask, DailyLog, StudyScheduleEvent } from '@/types/study';

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
  onResetAllData: () => void;
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
  onResetAllData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'data' | 'about'>('sync');
  const [inputCode, setInputCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

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

  // バックアップJSONのエクスポート
  const handleExportData = () => {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      tasks,
      logs,
      events,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-3.5 border-b border-emerald-900/50 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">設定 ＆ クラウド管理</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 設定タブナビゲーション */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-slate-800 mb-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'sync'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              クラウド同期
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'data'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              データ管理
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'about'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              アプリ情報
            </button>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
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
                    PCとスマホで同じ<strong>「同期コード」</strong>を設定すると、どちらからでも同じ学習進捗やカレンダー予定をリアルタイム共有できます。
                  </p>
                </div>

                {/* この端末の同期コード */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    この端末の同期コード
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-base font-bold text-emerald-300 tracking-wider text-center select-all">
                      {syncCode || '生成中...'}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
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
                    現在の学習タスク、進捗ログ、カレンダーの予定をすべてJSONファイルとして保存します。
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
                    保存したJSONファイルを選択して学習データを復元します。
                  </p>
                  <label className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sky-300 hover:text-white text-xs font-semibold cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    JSONファイルを選択
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>

                {/* データ初期化 */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                  <div className="font-semibold text-rose-300 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    初期サンプルデータに戻す
                  </div>
                  <p className="text-[11px] text-rose-200/70 leading-relaxed">
                    登録したタスクや進捗データをリセットし、デフォルトの初期状態に戻します。
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('すべてのデータを初期サンプル状態にリセットしますか？この操作は取り消せません。')) {
                        onResetAllData();
                        onClose();
                      }
                    }}
                    className="py-2 px-3.5 rounded-xl bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-700/50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    データを初期化する
                  </button>
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
                    <div>バージョン: <span className="text-white font-semibold">v1.2.0</span></div>
                    <div>フレームワーク: <span className="text-white font-semibold">Next.js 14</span></div>
                    <div>UI/ゲージ: <span className="text-white font-semibold">Framer Motion</span></div>
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
