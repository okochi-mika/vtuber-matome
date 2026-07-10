import { prisma } from "@/lib/prisma";
import { getChannelInfo } from "@/lib/youtube";
import HomeTabs from "@/components/HomeTabs";

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
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Live Stats
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            VTuberまとめ
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            登録者数・配信情報・動画数をまとめてチェック
          </p>
        </header>

        <HomeTabs
          offices={offices}
          groups={groups}
          units={units}
          talents={displayList}
        />
      </div>
    </main>
  );
}
