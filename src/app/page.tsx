import { prisma } from "@/lib/prisma";
import { getChannelInfo } from "@/lib/youtube";
import HomeTabs from "@/components/HomeTabs";
import Link from "next/link";

export default async function HomePage() {
  const offices = await prisma.office.findMany({
    select: { id: true, name: true },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, officeId: true },
  });

  const units = await prisma.unit.findMany({
    select: { id: true, name: true, groupId: true },
  });

  const talents = await prisma.talent.findMany({
    include: {
      channels: true,
      units: { select: { id: true } }, // 複数所属しているユニットのID一覧
    },
    orderBy: { sortOrder: "asc" },
  });

  const talentsWithChannelInfo = await Promise.all(
    talents.map(async (talent) => {
      const primaryChannel = talent.channels[0];
      if (!primaryChannel) return null;

      const channelInfo = await getChannelInfo(primaryChannel.externalId);

      return {
        talentId: talent.id,
        officeId: talent.officeId,
        groupId: talent.groupId,
        unitIds: talent.units.map((u) => u.id),
        channelInfo,
      };
    })
  );

  const displayList = talentsWithChannelInfo.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <main className="chalkboard-bg min-h-screen px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-[#22d3ee] font-mono uppercase">
              Live Stats
            </p>
            <h1 className="text-3xl font-bold text-white mt-1 [text-shadow:1px_1px_3px_rgba(0,0,0,0.4)]">
              VTuber掲示板
            </h1>
            <p className="text-sm text-white/60 mt-1">
              登録者数・配信情報・動画数をまとめてチェック
            </p>
          </div>
          <Link
            href="/schedule"
            className="shrink-0 rounded-lg bg-white border border-white/10 text-[#0891b2] text-sm font-semibold px-4 py-2 hover:border-[#0891b2]/60 whitespace-nowrap shadow-md"
          >
            配信スケジュール
          </Link>
        </header>

        <HomeTabs
          offices={offices}
          groups={groups}
          units={units}
          talents={displayList}
        />

        {/* 黒板の下端の「チョーク受け」トレイ（見た目だけの飾り） */}
        <div className="chalk-tray mt-12 h-7 rounded-b-2xl flex items-center gap-3 px-6">
          <span className="chalk-piece bg-white" />
          <span className="chalk-piece bg-[#f2c744]" />
          <span className="chalk-piece bg-[#ec4899]" />
        </div>
      </div>
    </main>
  );
}