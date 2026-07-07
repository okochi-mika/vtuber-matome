// ============================================
// トップページ（DB連携版）
// 前回まではチャンネルIDを配列で直接書いていましたが、
// ここからはSupabase(DB)に登録したタレント情報を元に表示します。
// ============================================

import { prisma } from "@/lib/prisma";
import { getChannelInfo } from "@/lib/youtube";
import TalentCard from "@/components/TalentCard";

export default async function HomePage() {
  // ---------------------------------------------
  // ステップ1: DBから「タレント一覧」を取得する
  // include を使うと、タレントに紐づく channels も一緒に取得できる
  // （SQLでいう JOIN のようなことをPrismaが自動でやってくれます）
  // ---------------------------------------------
  const talents = await prisma.talent.findMany({
    include: {
      channels: true,
    },
  });

  // ---------------------------------------------
  // ステップ2: 各タレントの「最初のチャンネル」情報をYouTube APIから取得する
  // タレントによってはチャンネルが複数登録される可能性もあるので、
  // ひとまず1人につき1チャンネル目だけを表示する形にしています
  // ---------------------------------------------
  const talentsWithChannelInfo = await Promise.all(
    talents.map(async (talent) => {
      const primaryChannel = talent.channels[0];

      // チャンネルが1件も登録されていないタレントは、ここでnullを返してスキップする
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

  // nullになったもの（チャンネル未登録のタレント）を除外する
  const displayList = talentsWithChannelInfo.filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <main className="min-h-screen bg-[#0f0f17] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-xs tracking-widest text-[#00e0ff] font-mono uppercase">
            Live Stats
          </p>
          <h1 className="text-3xl font-bold text-[#f5f5fa] mt-1">
            VTuberまとめ
          </h1>
          <p className="text-sm text-[#9797ab] mt-1">
            登録者数・動画数をまとめてチェック
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayList.map((item) => (
            <TalentCard key={item.talentId} channel={item.channelInfo} />
          ))}
        </div>

        {/* タレントが1件も登録されていない場合の案内 */}
        {displayList.length === 0 && (
          <p className="text-[#9797ab] text-sm">
            まだタレントが登録されていません。シードスクリプトを実行してください。
          </p>
        )}
      </div>
    </main>
  );
}
