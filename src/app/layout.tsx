// ============================================
// アプリ全体の共通レイアウト
// すべてのページはこのレイアウトの中に表示されます
// ============================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Googleフォントの「Inter」を読み込む
// （元々入っていた"Geist"はNext.js 14.2.5では使えないフォントだったため変更）
const inter = Inter({ subsets: ["latin"] });

// ブラウザのタブに表示されるタイトルや説明文
export const metadata: Metadata = {
  title: "VTuber掲示板",
  description: "VTuberの登録者数・動画数をまとめてチェックできるアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
