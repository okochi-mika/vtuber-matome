// ============================================
// 並び替え専用ページ
// URL: /admin/reorder-talents
// タレントが増えてきた時に、ドラッグ&ドロップで素早く並び替えられるようにする画面
// （YouTube APIは呼ばないので、登録者数などは表示せず、名前と所属先だけの軽い画面）
// ============================================

import { prisma } from "@/lib/prisma";
import ReorderTalentsList from "@/components/ReorderTalentsList";

export default async function ReorderTalentsPage() {
  const talents = await prisma.talent.findMany({
    include: {
      units: { select: { id: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const offices = await prisma.office.findMany({
    select: { id: true, name: true },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, officeId: true },
  });

  const units = await prisma.unit.findMany({
    select: { id: true, name: true, groupId: true },
  });

  const talentItems = talents.map((talent) => ({
    id: talent.id,
    name: talent.name,
    officeId: talent.officeId,
    groupId: talent.groupId,
    unitIds: talent.units.map((u) => u.id),
  }));

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            並び替え
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            ドラッグ&ドロップでタレントの表示順を入れ替えられます
          </p>
        </header>

        <ReorderTalentsList
          initialTalents={talentItems}
          offices={offices}
          groups={groups}
          units={units}
        />
      </div>
    </main>
  );
}
