import { prisma } from "@/lib/prisma";
import { getChannelInfo } from "@/lib/youtube";
import TalentCard from "@/components/TalentCard";

export default async function HomePage() {
  const talents = await prisma.talent.findMany({
    include: {
      channels: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const talentsWithChannelInfo = await Promise.all(
    talents.map(async (talent) => {
      const primaryChannel = talent.channels[0];

      if (!primaryChannel) {
        return null;
      }

      const channelInfo = await getChannelInfo(primaryChannel.externalId);

      return {
        talentId: talent.id,
        talentName: talent.name,
        channelInfo,
      };
    })
  );

  const displayList = talentsWithChannelInfo.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Live Stats
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            VTuberまとめ
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            登録者数・動画数をまとめてチェック
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayList.map((item) => (
            <TalentCard key={item.talentId} channel={item.channelInfo} />
          ))}
        </div>

        {displayList.length === 0 && (
          <p className="text-[#70707f] text-sm">
            まだタレントが登録されていません。シードスクリプトを実行してください。
          </p>
        )}
      </div>
    </main>
  );
}
