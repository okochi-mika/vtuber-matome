"use client";

import { useState } from "react";
import { getVideoThumbnailUrl, type HolodexVideo } from "@/lib/holodex";

type Office = { id: string; name: string };

// スケジュール表示に必要な情報を持たせた動画の型
// （どのタレント・どの事務所のものかを、あらかじめサーバー側で突き合わせておく）
type ScheduleVideo = HolodexVideo & {
  talentName: string | undefined;
  officeId: string | undefined;
};

type ScheduleTabsProps = {
  offices: Office[];
  videos: ScheduleVideo[];
};

const ALL = "__all__";

export default function ScheduleTabs({ offices, videos }: ScheduleTabsProps) {
  const [activeOfficeId, setActiveOfficeId] = useState(ALL);

  // 選択中の事務所で絞り込む（「すべて」の時は全件そのまま）
  const filteredVideos =
    activeOfficeId === ALL
      ? videos
      : videos.filter((v) => v.officeId === activeOfficeId);

  const liveVideos = filteredVideos.filter((v) => v.status === "live");
  const upcomingVideos = filteredVideos
    .filter((v) => v.status === "upcoming")
    .sort((a, b) => {
      const aTime = a.start_scheduled ? new Date(a.start_scheduled).getTime() : 0;
      const bTime = b.start_scheduled ? new Date(b.start_scheduled).getTime() : 0;
      return aTime - bTime;
    });

  return (
    <div>
      {/* 事務所タブ */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveOfficeId(ALL)}
          className={
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors " +
            (activeOfficeId === ALL
              ? "bg-[#0891b2] text-white"
              : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
          }
        >
          すべて
        </button>
        {offices.map((office) => (
          <button
            key={office.id}
            onClick={() => setActiveOfficeId(office.id)}
            className={
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors " +
              (activeOfficeId === office.id
                ? "bg-[#0891b2] text-white"
                : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
            }
          >
            {office.name}
          </button>
        ))}
      </div>

      {/* 配信中セクション */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#14141c] mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec4899] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ec4899]"></span>
          </span>
          配信中（{liveVideos.length}）
        </h2>

        {liveVideos.length === 0 ? (
          <p className="text-sm text-[#70707f]">
            現在配信中のチャンネルはありません
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {liveVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                talentName={video.talentName}
                badge="LIVE"
              />
            ))}
          </div>
        )}
      </section>

      {/* 配信予定セクション */}
      <section>
        <h2 className="text-lg font-bold text-[#14141c] mb-4">
          配信予定（{upcomingVideos.length}）
        </h2>

        {upcomingVideos.length === 0 ? (
          <p className="text-sm text-[#70707f]">
            現在、配信予定として登録されているものはありません
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {upcomingVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                talentName={video.talentName}
                badge="予定"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------
// 動画1件分のカード
// ---------------------------------------------
function VideoCard({
  video,
  talentName,
  badge,
}: {
  video: HolodexVideo;
  talentName: string | undefined;
  badge: "LIVE" | "予定";
}) {
  const scheduledTime = video.start_scheduled
    ? new Date(video.start_scheduled).toLocaleString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl bg-white border border-[#e4e4ec] overflow-hidden shadow-sm hover:border-[#0891b2]/50 hover:shadow-md transition-all"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getVideoThumbnailUrl(video.id)}
          alt={video.title}
          className="w-full aspect-video object-cover bg-[#f5f6fa]"
        />
        <span
          className={
            "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white " +
            (badge === "LIVE" ? "bg-[#ec4899]" : "bg-[#0891b2]")
          }
        >
          {badge}
        </span>
      </div>
      <div className="p-3">
        <p className="text-xs text-[#0891b2] font-semibold mb-1">
          {talentName ?? video.channel?.name ?? "（チャンネル不明）"}
        </p>
        <p className="text-sm text-[#14141c] line-clamp-2 leading-snug">
          {video.title}
        </p>
        {badge === "LIVE" && typeof video.live_viewers === "number" && (
          <p className="text-xs text-[#70707f] mt-2">
            👁 {video.live_viewers.toLocaleString("ja-JP")} 人視聴中
          </p>
        )}
        {badge === "予定" && scheduledTime && (
          <p className="text-xs text-[#70707f] mt-2">🕒 {scheduledTime}〜</p>
        )}
      </div>
    </a>
  );
}
