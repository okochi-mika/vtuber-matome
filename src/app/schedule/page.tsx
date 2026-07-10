import { prisma } from "@/lib/prisma";
import { getLiveAndUpcoming, getChannelIdFromVideo } from "@/lib/holodex";
import Link from "next/link";
import ScheduleTabs from "@/components/ScheduleTabs";

export default async function SchedulePage() {
  const offices = await prisma.office.findMany({
    select: { id: true, name: true },
  });

  // 登録済みタレントのチャンネルIDと「名前・所属事務所」の対応を作っておく
  // （Holodexは動画のchannel_idしか返してくれないため、
  //   自分のDBに登録した情報と突き合わせて表示・絞り込みに使う）
  const talents = await prisma.talent.findMany({
    include: { channels: true },
  });

  const channelIdToTalentInfo = new Map<
    string,
    { name: string; officeId: string }
  >();
  const channelIds: string[] = [];

  for (const talent of talents) {
    const channel = talent.channels[0];
    if (channel) {
      channelIdToTalentInfo.set(channel.externalId, {
        name: talent.name,
        officeId: talent.officeId,
      });
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

  // 各動画に「タレント名」「事務所ID」の情報を付け加えておく
  // （事務所タブでの絞り込みに使うため）
  const enrichedVideos = videos.map((video) => {
    // 【修正箇所】video.channel_id が無いレスポンス形式のこともあるため、
    // ヘルパー関数経由で（トップレベル or channel.id の）チャンネルIDを取得する
    const channelId = getChannelIdFromVideo(video);
    const info = channelId ? channelIdToTalentInfo.get(channelId) : undefined;
    return {
      ...video,
      talentName: info?.name,
      officeId: info?.officeId,
    };
  });

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-[1600px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#70707f] hover:text-[#0891b2] mb-4"
        >
          ← トップに戻る
        </Link>

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

        <ScheduleTabs offices={offices} videos={enrichedVideos} />
      </div>
    </main>
  );
}
