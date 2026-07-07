import type { ChannelInfo } from "@/lib/youtube";

function formatNumber(num: number): string {
  return num.toLocaleString("ja-JP");
}

type TalentCardProps = {
  channel: ChannelInfo;
};

export default function TalentCard({ channel }: TalentCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl
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
          <p className="text-xs text-[#70707f] mt-0.5">
            ID: {channel.channelId}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <StatBox label="登録者" value={formatNumber(channel.subscriberCount)} />
        <StatBox label="動画数" value={formatNumber(channel.videoCount)} />
        <StatBox label="総再生数" value={formatNumber(channel.viewCount)} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f5f6fa] py-2.5 px-1">
      <p className="font-mono text-sm sm:text-base text-[#0891b2] tabular-nums truncate">
        {value}
      </p>
      <p className="text-[10px] text-[#70707f] mt-1">{label}</p>
    </div>
  );
}
