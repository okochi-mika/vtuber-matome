import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ManageTalentsForm from "@/components/ManageTalentsForm";
import AddStructureForm from "@/components/AddStructureForm";
import EditStructureList from "@/components/EditStructureList";

export default async function ManageTalentsPage() {
  const talents = await prisma.talent.findMany({
    include: {
      channels: true,
      units: { select: { id: true } }, // 複数所属しているユニットのID一覧
    },
    orderBy: { sortOrder: "asc" },
  });

  const offices = await prisma.office.findMany({
    select: { id: true, name: true, officialChannelUrl: true },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, officeId: true, officialChannelUrl: true },
  });

  const units = await prisma.unit.findMany({
    select: { id: true, name: true, groupId: true, officialChannelUrl: true },
  });

  const talentItems = talents.map((talent) => ({
    id: talent.id,
    name: talent.name,
    officeId: talent.officeId,
    groupId: talent.groupId,
    unitIds: talent.units.map((u) => u.id),
    channelId: talent.channels[0]?.externalId ?? "",
    twitterUrl: talent.twitterUrl,
    instagramUrl: talent.instagramUrl,
    tiktokUrl: talent.tiktokUrl,
    hashtag: talent.hashtag,
  }));

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-[#14141c] mt-1">
              タレント管理
            </h1>
            <p className="text-sm text-[#70707f] mt-1">
              編集・削除・並び替えができます（矢印ボタンで表示順を変更）
            </p>
          </div>
          <Link
            href="/admin/reorder-talents"
            className="shrink-0 rounded-lg bg-white border border-[#e4e4ec] text-[#0891b2] text-sm font-semibold px-4 py-2 hover:border-[#0891b2]/60 whitespace-nowrap"
          >
            並び替え専用画面へ
          </Link>
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
