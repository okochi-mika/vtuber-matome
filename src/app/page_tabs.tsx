// ============================================
// トップページ
// 事務所タブ → グループタブ → タレント一覧、という2段階の絞り込みに対応
// タブの切り替え自体はブラウザ側の操作なので、実際の表示は
// クライアントコンポーネント（HomeTabs）に任せている
// ============================================

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

  const talents = await prisma.talent.findMany({
    include: { channels: true },
    orderBy: { sortOrder: "asc" },
  });

  // 各タレントの最新のYouTube情報を取得しつつ、
  // どのグループに属するかという情報も一緒に持たせておく
  const talentsWithChannelInfo = await Promise.all(
    talents.map(async (talent) => {
      const primaryChannel = talent.channels[0];
      if (!primaryChannel) return null;

      const channelInfo = await getChannelInfo(primaryChannel.externalId);

      return {
        talentId: talent.id,
        groupId: talent.groupId,
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

        <HomeTabs offices={offices} groups={groups} talents={displayList} />
      </div>
    </main>
  );
}
