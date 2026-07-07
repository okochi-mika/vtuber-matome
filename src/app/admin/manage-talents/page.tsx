// ============================================
// タレント管理ページ
// URL: /admin/manage-talents
// 登録済みのタレントを一覧表示し、編集・削除・並び替えができる
// ============================================

import { prisma } from "@/lib/prisma";
import ManageTalentsForm from "@/components/ManageTalentsForm";

export default async function ManageTalentsPage() {
  // sortOrder順に並べて、グループ名・チャンネル情報も一緒に取得する
  const talents = await prisma.talent.findMany({
    include: {
      group: true,
      channels: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // クライアントコンポーネントに渡しやすいよう、シンプルな形に整形する
  const talentItems = talents.map((talent) => ({
    id: talent.id,
    name: talent.name,
    groupId: talent.groupId,
    channelId: talent.channels[0]?.externalId ?? "",
  }));

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            タレント管理
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            編集・削除・並び替えができます（矢印ボタンで表示順を変更）
          </p>
        </header>

        {talentItems.length === 0 ? (
          <p className="text-[#70707f] text-sm">
            まだタレントが登録されていません。
          </p>
        ) : (
          <ManageTalentsForm initialTalents={talentItems} groups={groups} />
        )}
      </div>
    </main>
  );
}
