// ============================================
// タレント個別ページ
// URL: /talent/[id]  ← [id]の部分は、こちらのDB上のTalent.id
// ============================================

import { prisma } from "@/lib/prisma";
import { getChannelInfo, getChannelVideos, type VideoInfo } from "@/lib/youtube";
import { getLiveAndUpcoming, getVideoThumbnailUrl, getChannelIdFromVideo } from "@/lib/holodex";
import { notFound } from "next/navigation";
import Link from "next/link";

type PageParams = {
  params: { id: string };
};

function formatNumber(num: number): string {
  if (!num) return "非公開";
  return num.toLocaleString("ja-JP");
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export default async function TalentPage({ params }: PageParams) {
  const talent = await prisma.talent.findUnique({
    where: { id: params.id },
    include: { channels: true },
  });

  const primaryChannel = talent?.channels[0];

  if (!talent || !primaryChannel) {
    notFound();
  }

  // チャンネル基本情報・動画一覧・配信中かどうかを同時に取得する
  // 【変更点】表示件数を増やすため、取得する動画数を12→24に増加
  // （videos.list は動画をまとめて指定してもユニット消費が変わらないため、
  //   件数を増やしてもクォータへの影響はほぼありません）
  const [channelInfo, videos, liveStatus] = await Promise.all([
    getChannelInfo(primaryChannel.externalId),
    getChannelVideos(primaryChannel.externalId, 24),
    getLiveAndUpcoming([primaryChannel.externalId]),
  ]);

  // 【変更点】配信中の判定に、Holodexの情報に加えてYouTube側の情報も使う
  // （Holodex側の情報反映には数分のタイムラグがあることがあるため、
  //  すでに取得済みのYouTubeデータも突き合わせて、より早く正確に判定する）
  const liveVideoFromYouTube = videos.latest.find((v) => v.isLiveNow);

  const isLiveNow =
    liveStatus.some(
      (v) =>
        getChannelIdFromVideo(v) === primaryChannel.externalId &&
        v.status === "live"
    ) || Boolean(liveVideoFromYouTube);

  // 配信中の動画情報（あれば埋め込みプレイヤー表示に使う）
  // Holodex側に情報があればそちらを優先し、無ければYouTube側の情報を使う
  const liveVideo =
    liveStatus.find(
      (v) =>
        getChannelIdFromVideo(v) === primaryChannel.externalId &&
        v.status === "live"
    ) ??
    (liveVideoFromYouTube
      ? { id: liveVideoFromYouTube.videoId, title: liveVideoFromYouTube.title }
      : undefined);

  // 配信中でない場合に表示する「次の配信予定」（一番近いもの）
  const nextUpcoming = liveStatus
    .filter(
      (v) =>
        getChannelIdFromVideo(v) === primaryChannel.externalId &&
        v.status === "upcoming"
    )
    .sort((a, b) => {
      const aTime = a.start_scheduled ? new Date(a.start_scheduled).getTime() : 0;
      const bTime = b.start_scheduled ? new Date(b.start_scheduled).getTime() : 0;
      return aTime - bTime;
    })[0];

  // 配信予定も無い場合に表示する「最新のアーカイブ・動画」
  const latestVideo = videos.latest[0];

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-[1600px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#70707f] hover:text-[#0891b2] mb-4"
        >
          ← トップに戻る
        </Link>

        {/* プロフィールヘッダー + 右側パネル（配信中/配信予定/最新アーカイブ） */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 mb-8 items-stretch">
          {/* 左: プロフィールカード */}
          <div className="rounded-2xl bg-white border border-[#e4e4ec] shadow-sm p-6">
            <div className="flex items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channelInfo.thumbnailUrl}
                alt={channelInfo.title}
                className="h-20 w-20 rounded-full border-2 border-[#e4e4ec] shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#14141c]">
                    {talent.name}
                  </h1>
                  {isLiveNow && (
                    <span className="flex items-center gap-1 rounded-full bg-[#ec4899] text-white text-xs font-bold px-2.5 py-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      配信中
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#70707f] mt-0.5">
                  {channelInfo.title}
                </p>

                {/* SNSリンク */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <a
                    href={`https://www.youtube.com/channel/${primaryChannel.externalId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0891b2] hover:underline"
                  >
                    YouTube
                  </a>
                  {talent.twitterUrl && (
                    <a
                      href={talent.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0891b2] hover:underline"
                    >
                      X (Twitter)
                    </a>
                  )}
                  {talent.instagramUrl && (
                    <a
                      href={talent.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0891b2] hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {talent.tiktokUrl && (
                    <a
                      href={talent.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0891b2] hover:underline"
                    >
                      TikTok
                    </a>
                  )}
                  {talent.hashtag && (
                    <span className="text-xs text-[#70707f]">
                      {talent.hashtag}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 統計情報 */}
            <div className="mt-5 pt-5 border-t border-[#e4e4ec] grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[#f5f6fa] py-3">
                <p className="font-mono text-base text-[#0891b2]">
                  {formatNumber(channelInfo.subscriberCount)}
                </p>
                <p className="text-[10px] text-[#70707f] mt-1">登録者</p>
              </div>
              <div className="rounded-lg bg-[#f5f6fa] py-3">
                <p className="font-mono text-base text-[#0891b2]">
                  {formatNumber(channelInfo.videoCount)}
                </p>
                <p className="text-[10px] text-[#70707f] mt-1">動画数</p>
              </div>
              <div className="rounded-lg bg-[#f5f6fa] py-3">
                <p className="font-mono text-base text-[#0891b2]">
                  {formatNumber(channelInfo.viewCount)}
                </p>
                <p className="text-[10px] text-[#70707f] mt-1">総再生数</p>
              </div>
            </div>
          </div>

          {/* 右: 配信中/配信予定/最新アーカイブのパネル */}
          <LiveOrNextPanel
            isLiveNow={isLiveNow}
            liveVideo={liveVideo}
            nextUpcoming={nextUpcoming}
            latestVideo={latestVideo}
          />
        </div>

        {/* 最新動画・アーカイブ */}
        <VideoSection title="最新の動画・アーカイブ" videos={videos.latest} />

        {/* 人気動画・アーカイブ */}
        <VideoSection title="人気の動画・アーカイブ" videos={videos.popular} />
      </div>
    </main>
  );
}

// ---------------------------------------------
// 右側パネル: 状況に応じて3パターンを出し分ける
// 1. 配信中 → 動画プレイヤーをそのまま埋め込む
// 2. 配信予定がある → サムネイル＋予定時刻を表示
// 3. どちらも無い → 直近のアーカイブ・動画を表示
// ---------------------------------------------
function LiveOrNextPanel({
  isLiveNow,
  liveVideo,
  nextUpcoming,
  latestVideo,
}: {
  isLiveNow: boolean;
  liveVideo: { id: string; title: string } | undefined;
  nextUpcoming:
    | { id: string; title: string; start_scheduled?: string }
    | undefined;
  latestVideo: VideoInfo | undefined;
}) {
  // パターン1: 配信中は動画プレイヤーをそのまま埋め込む
  if (isLiveNow && liveVideo) {
    return (
      <div className="rounded-2xl bg-white border border-[#e4e4ec] shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-[#ec4899] text-white text-xs font-bold flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          配信中
        </div>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${liveVideo.id}`}
            title={liveVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <p className="p-3 text-sm text-[#14141c] line-clamp-2">
          {liveVideo.title}
        </p>
      </div>
    );
  }

  // パターン2: 配信予定があれば、その情報を表示
  if (nextUpcoming) {
    const scheduledTime = nextUpcoming.start_scheduled
      ? new Date(nextUpcoming.start_scheduled).toLocaleString("ja-JP", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <a
        href={`https://www.youtube.com/watch?v=${nextUpcoming.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-2xl bg-white border border-[#e4e4ec] shadow-sm overflow-hidden flex flex-col hover:border-[#0891b2]/50 hover:shadow-md transition-all"
      >
        <div className="px-4 py-2.5 bg-[#0891b2] text-white text-xs font-bold">
          次の配信予定
        </div>
        <div className="relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getVideoThumbnailUrl(nextUpcoming.id)}
            alt={nextUpcoming.title}
            className="w-full h-full object-cover bg-[#f5f6fa]"
          />
        </div>
        <div className="p-3">
          <p className="text-sm text-[#14141c] line-clamp-2">
            {nextUpcoming.title}
          </p>
          {scheduledTime && (
            <p className="text-xs text-[#70707f] mt-2">🕒 {scheduledTime}〜</p>
          )}
        </div>
      </a>
    );
  }

  // パターン3: 配信中でも配信予定でもなければ、直近のアーカイブ・動画を表示
  if (latestVideo) {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${latestVideo.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-2xl bg-white border border-[#e4e4ec] shadow-sm overflow-hidden flex flex-col hover:border-[#0891b2]/50 hover:shadow-md transition-all"
      >
        <div className="px-4 py-2.5 bg-[#70707f] text-white text-xs font-bold">
          最新のアーカイブ・動画
        </div>
        <div className="relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={latestVideo.thumbnailUrl}
            alt={latestVideo.title}
            className="w-full h-full object-cover bg-[#f5f6fa]"
          />
        </div>
        <div className="p-3">
          <p className="text-sm text-[#14141c] line-clamp-2">
            {latestVideo.title}
          </p>
          <p className="text-xs text-[#70707f] mt-2">
            {formatDate(latestVideo.publishedAt)}
          </p>
        </div>
      </a>
    );
  }

  return null;
}

function VideoSection({
  title,
  videos,
}: {
  title: string;
  videos: VideoInfo[];
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[#14141c] mb-4">{title}</h2>

      {videos.length === 0 ? (
        <p className="text-sm text-[#70707f]">動画が見つかりませんでした</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map((video) => (
            <a
              key={video.videoId}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-white border border-[#e4e4ec] overflow-hidden shadow-sm hover:border-[#0891b2]/50 hover:shadow-md transition-all"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full aspect-video object-cover bg-[#f5f6fa]"
                />
                {video.isArchive && (
                  <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-[#0891b2]">
                    配信
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm text-[#14141c] line-clamp-2 leading-snug">
                  {video.title}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#70707f]">
                    {formatDate(video.publishedAt)}
                  </p>
                  <p className="text-xs text-[#70707f]">
                    {video.viewCount.toLocaleString("ja-JP")}回視聴
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
