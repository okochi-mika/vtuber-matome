// ============================================
// タレント1人分の情報を表示する「カード」コンポーネント
// 配信の統計パネルのような見た目にしています
// ============================================

import type { ChannelInfo } from "@/lib/youtube";

// 数値を「2,930,000」のようにカンマ区切りにするための小さな関数
function formatNumber(num: number): string {
  return num.toLocaleString("ja-JP");
}

// このコンポーネントが受け取る値の形を定義
type TalentCardProps = {
  channel: ChannelInfo;
};

export default function TalentCard({ channel }: TalentCardProps) {
  return (
    // カード全体。背景を少し明るいネイビーにして、枠線をうっすら光らせる
    <div
      className="
        group relative overflow-hidden rounded-2xl
        bg-[#171724] border border-[#2a2a3d]
        p-5 transition-all duration-300
        hover:border-[#00e0ff]/60 hover:shadow-[0_0_24px_-4px_#00e0ff40]
      "
    >
      {/* 上部: アイコン画像 + チャンネル名 + 配信中風の点滅ドット */}
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={channel.thumbnailUrl}
          alt={channel.title}
          className="h-14 w-14 rounded-full border-2 border-[#2a2a3d]"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* 点滅するドット。「配信サービスっぽさ」を出すための演出要素 */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4fa3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4fa3]"></span>
            </span>

            <h2 className="text-[#f5f5fa] font-semibold truncate">
              {channel.title}
            </h2>
          </div>
          <p className="text-xs text-[#9797ab] mt-0.5">
            ID: {channel.channelId}
          </p>
        </div>
      </div>

      {/* 下部: 統計情報を3つ並べる。数字は等幅フォントで「データパネル」感を出す */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <StatBox label="登録者" value={formatNumber(channel.subscriberCount)} />
        <StatBox label="動画数" value={formatNumber(channel.videoCount)} />
        <StatBox label="総再生数" value={formatNumber(channel.viewCount)} />
      </div>
    </div>
  );
}

// 統計情報1つ分の小さな箱。カード内で3回繰り返し使うので部品化しておく
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0f0f17] py-2.5 px-1">
      <p className="font-mono text-sm sm:text-base text-[#00e0ff] tabular-nums truncate">
        {value}
      </p>
      <p className="text-[10px] text-[#9797ab] mt-1">{label}</p>
    </div>
  );
}
