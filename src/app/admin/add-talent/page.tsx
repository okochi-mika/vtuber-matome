import { prisma } from "@/lib/prisma";
import AddTalentForm from "@/components/AddTalentForm";

export default async function AddTalentPage() {
  const offices = await prisma.office.findMany({
    select: { id: true, name: true },
  });

  const groups = await prisma.group.findMany({
    select: { id: true, name: true, officeId: true },
  });

  const units = await prisma.unit.findMany({
    select: { id: true, name: true, groupId: true },
  });

  return (
    <main className="min-h-screen bg-[#f5f6fa] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#0891b2] font-mono uppercase">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-[#14141c] mt-1">
            タレント追加
          </h1>
          <p className="text-sm text-[#70707f] mt-1">
            チャンネル名で検索して、そのまま登録できます
          </p>
        </header>

        {units.length === 0 ? (
          <p className="text-[#70707f] text-sm">
            ユニットが1件も登録されていません。先に「タレント管理」画面から
            事務所・グループ・ユニットを作成してください。
          </p>
        ) : (
          <AddTalentForm offices={offices} groups={groups} units={units} />
        )}
      </div>
    </main>
  );
}
