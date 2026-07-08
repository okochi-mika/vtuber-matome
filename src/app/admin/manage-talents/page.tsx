import { prisma } from "@/lib/prisma";
import ManageTalentsForm from "@/components/ManageTalentsForm";
import AddStructureForm from "@/components/AddStructureForm";

export default async function ManageTalentsPage() {
  const talents = await prisma.talent.findMany({
    include: {
      unit: { include: { group: { include: { office: true } } } },
      channels: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  const offices = await prisma.office.findMany({
    select: { id: true, name: true },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, officeId: true },
  });

  const rawUnits = await prisma.unit.findMany({
    include: { group: { include: { office: true } } },
  });

  // タレント管理フォームのプルダウン用に「事務所 / グループ / ユニット」の
  // ラベル文字列を作っておく（1つのプルダウンでどこに属すか分かりやすくするため）
  const units = rawUnits.map((unit) => ({
    id: unit.id,
    name: unit.name,
    groupLabel: `${unit.group.office.name} / ${unit.group.name} / ${unit.name}`,
  }));

  const talentItems = talents.map((talent) => ({
    id: talent.id,
    name: talent.name,
    unitId: talent.unitId,
    channelId: talent.channels[0]?.externalId ?? "",
  }));

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
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

        <AddStructureForm
          initialOffices={offices}
          initialGroups={groups}
          initialUnits={rawUnits.map((u) => ({
            id: u.id,
            name: u.name,
            groupId: u.groupId,
          }))}
        />

        {talentItems.length === 0 ? (
          <p className="text-[#70707f] text-sm">
            まだタレントが登録されていません。
          </p>
        ) : (
          <ManageTalentsForm initialTalents={talentItems} units={units} />
        )}
      </div>
    </main>
  );
}
