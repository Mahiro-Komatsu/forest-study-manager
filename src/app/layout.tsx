import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forest Study - 集中学習予定管理',
  description: 'Forestライクな円形インジケーターで学習ノルマと進捗をトラッキングする学習管理アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
