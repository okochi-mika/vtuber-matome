import { prisma } from "@/lib/prisma";
import ManageTalentsForm from "@/components/ManageTalentsForm";
import AddStructureForm from "@/components/AddStructureForm";
import EditStructureList from "@/components/EditStructureList";

export default async function ManageTalentsPage() {
  const talents = await prisma.talent.findMany({
    include: { channels: true },
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
          initialUnits={units}
        />

        <EditStructureList
          initialOffices={offices}
          initialGroups={groups}
          initialUnits={units}
        />

        {talentItems.length === 0 ? (
          <p className="text-[#70707f] text-sm">
            まだタレントが登録されていません。
          </p>
        ) : (
          <ManageTalentsForm
            initialTalents={talentItems}
            offices={offices}
            groups={groups}
            units={units}
          />
        )}
      </div>
    </main>
  );
}
