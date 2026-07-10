import { prisma } from "@/lib/prisma";
import { getLiveAndUpcoming, getVideoThumbnailUrl } from "@/lib/holodex";
import Link from "next/link";

export default async function SchedulePage() {
  // 登録済みタレントのチャンネルIDと名前の対応を作っておく
  // （Holodexは動画のchannel_idしか返してくれないため、
  //   自分のDBに登録した名前と突き合わせて表示するために使う）
  const talents = await prisma.talent.findMany({
    include: { channels: true },
  });

  const channelIdToTalentName = new Map<string, string>();
  const channelIds: string[] = [];

  for (const talent of talents) {
    const channel = talent.channels[0];
    if (channel) {
      channelIdToTalentName.set(channel.externalId, talent.name);
      channelIds.push(channel.externalId);
    }
  }

  let videos: Awaited<ReturnType<typeof getLiveAndUpcoming>> = [];
  let errorMessage = "";

  try {
    videos = await getLiveAndUpcoming(channelIds);
  } catch (error) {
    console.error("スケジュール取得中にエラーが発生しました:", error);
    errorMessage =
      error instanceof Error ? error.message : "スケジュールの取得に失敗しました";
  }

  const liveVideos = videos.filter((v) => v.status === "live");
  const upcomingVideos = videos
    .filter((v) => v.status === "upcoming")
    .sort((a, b) => {
      const aTime = a.start_scheduled ? new Date(a.start_scheduled).getTime() : 0;
      const bTime = b.start_scheduled ? new Date(b.start_scheduled).getTime() : 0;
      return aTime - bTime;
    });

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Schedule
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            配信スケジュール
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            配信中・配信予定をまとめてチェック（
            <a
              href="https://holodex.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#0891b2]"
            >
              Holodex
            </a>
            のデータを利用しています）
          </p>
        </header>

        {errorMessage && (
          <p className="text-sm text-[#ec4899] mb-6">{errorMessage}</p>
        )}

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
                  talentName={channelIdToTalentName.get(video.channel_id)}
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
                  talentName={channelIdToTalentName.get(video.channel_id)}
                  badge="予定"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
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
  video: Awaited<ReturnType<typeof getLiveAndUpcoming>>[number];
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
