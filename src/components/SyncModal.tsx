'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, Smartphone, Laptop, Copy, Check, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  onApplyNewSyncCode: (newCode: string) => Promise<boolean>;
  onForceCloudSync: () => Promise<void>;
  isSyncing: boolean;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  onApplyNewSyncCode,
  onForceCloudSync,
  isSyncing,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-slate-900 border border-emerald-800/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-900/50 mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">端末間クラウド同期</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* 説明バナー */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 flex-shrink-0">
                <Laptop className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                PCとスマホで同じ<strong>「同期コード」</strong>を設定すると、どちらからでも同じ学習進捗をリアルタイム共有できます。
              </p>
            </div>

            {/* この端末の同期コード */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                この端末の同期コード
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-mono text-lg font-bold text-emerald-300 tracking-wider text-center select-all">
                  {syncCode || '生成中...'}
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
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
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'クラウドと同期中...' : '今すぐクラウドと最新化（同期）'}
            </button>

            {/* 別の同期コードを入力して接続 */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                別の端末のコードを連携する
              </label>
              <form onSubmit={handleLinkCode} className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="例: FST-A83K"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 font-mono text-sm uppercase focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
                  >
                    連携
                  </button>
                </div>
              </form>
            </div>

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

            {/* クラウド設定ステータス */}
            {!isSupabaseConfigured && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
                ℹ️ <strong>Supabase連携モード:</strong> 現在ローカル同期準備状態です。SupabaseのURLとAnon Keyを設定すると、即座に完全クラウド自動同期が有効化されます。
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
