// ============================================
// アプリ全体の共通レイアウト
// すべてのページはこのレイアウトの中に表示されます
// ============================================

import type { Metadata } from "next";
import { Inter, Yomogi } from "next/font/google";
import "./globals.css";

// Googleフォントの「Inter」を読み込む
// （元々入っていた"Geist"はNext.js 14.2.5では使えないフォントだったため変更）
const inter = Inter({ subsets: ["latin"] });

// 【追加】黒板の見出し・タブなどを手書きチョーク風にするためのフォント
// CSS変数として登録しておき、使いたい箇所だけ font-handwriting クラスで呼び出す
// （本文・フォームなど正確さが必要な部分はInterのままにして、可読性を落とさないようにする）
const yomogi = Yomogi({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
});

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
      <body className={`${inter.className} ${yomogi.variable}`}>
        {children}
      </body>
    </html>
  );
}