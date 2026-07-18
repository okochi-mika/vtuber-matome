import Link from "next/link";
import type { ChannelInfo } from "@/lib/youtube";

// num が数値でない場合や0の場合でも安全に表示できるようにする
// （登録者数を非公開にしているチャンネルは0として扱われるため）
function formatNumber(num: number | undefined): string {
  if (typeof num !== "number" || Number.isNaN(num) || num === 0) {
    return "非公開";
  }
  return num.toLocaleString("ja-JP");
}

type TalentCardProps = {
  talentId: string; // クリック時に個別ページ(/talent/[id])へ飛ばすために必要
  channel: ChannelInfo;
};

export default function TalentCard({ talentId, channel }: TalentCardProps) {
  return (
    <Link
      href={`/talent/${talentId}`}
      className="
        group relative overflow-hidden rounded-2xl block
        bg-white border border-[#e4e4ec]
        p-5 shadow-sm transition-all duration-300
        hover:border-[#0891b2]/50 hover:shadow-md
      "
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={channel.thumbnailUrl}
          alt={channel.title}
          className="h-14 w-14 rounded-full border-2 border-[#e4e4ec]"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec4899] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec4899]"></span>
            </span>

            <h2 className="text-[#14141c] font-semibold truncate">
              {channel.title}
            </h2>
          </div>
          {/* 【変更点】トップページのカードにはYouTubeチャンネルIDの表示は不要のため削除 */}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <StatBox label="登録者" value={formatNumber(channel.subscriberCount)} />
        <StatBox label="動画数" value={formatNumber(channel.videoCount)} />
        <StatBox label="総再生数" value={formatNumber(channel.viewCount)} />
      </div>
    </Link>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  // 桁数（カンマ含む文字数）に応じてフォントサイズを段階的に小さくする
  // → truncate（...で省略）せずに、枠の中へ数字全体を収める
  const length = value.length;
  const sizeClass =
    length <= 9
      ? "text-sm sm:text-base"
      : length <= 12
      ? "text-xs sm:text-sm"
      : "text-[10px] sm:text-xs";

  return (
    <div className="rounded-lg bg-[#f5f6fa] py-2.5 px-1">
      <p
        className={
          "font-mono text-[#0891b2] tabular-nums whitespace-nowrap " +
          sizeClass
        }
      >
        {value}
      </p>
      <p className="text-[10px] text-[#70707f] mt-1">{label}</p>
    </div>
  );
}
