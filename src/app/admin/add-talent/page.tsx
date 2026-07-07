// ============================================
// タレント追加ページ
// URL: /admin/add-talent
//
// ここはServer Componentなので、直接prismaを使ってグループ一覧を取得し、
// 実際の検索・登録の操作はクライアント側の AddTalentForm に任せます
// ============================================

import { prisma } from "@/lib/prisma";
import AddTalentForm from "@/components/AddTalentForm";

export default async function AddTalentPage() {
  // グループ一覧をあらかじめDBから取得しておく（プルダウンの選択肢にするため）
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#0f0f17] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#00e0ff] font-mono uppercase">
            Admin
          </p>
          <h1 className="text-3xl font-bold text-[#f5f5fa] mt-1">
            タレント追加
          </h1>
          <p className="text-sm text-[#9797ab] mt-1">
            チャンネル名で検索して、そのまま登録できます
          </p>
        </header>

        {/* グループが1件も無い場合の案内 */}
        {groups.length === 0 ? (
          <p className="text-[#9797ab] text-sm">
            グループが1件も登録されていません。先にSupabaseの管理画面から
            Officeテーブル・Groupテーブルにデータを追加してください。
          </p>
        ) : (
          <AddTalentForm groups={groups} />
        )}
      </div>
    </main>
  );
}
