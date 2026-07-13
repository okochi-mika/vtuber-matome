// ============================================
// Holodex同期バッチ（手動実行用スクリプト）
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/sync-holodex.ts
//
// 定期実行（Cron）したい場合は、代わりに
// src/app/api/cron/sync-holodex/route.ts を
// Vercel Cron等から叩く運用にしてください
// （このスクリプトと同じロジックを src/lib/holodex-sync.ts で共有しています）
// ============================================

import { PrismaClient } from "@prisma/client";
import { syncHolodexData } from "../src/lib/holodex-sync";

const prisma = new PrismaClient();

async function main() {
  console.log("Holodexデータの同期を開始します...");

  const result = await syncHolodexData(prisma);

  console.log("---------------------------------------------");
  console.log(`対象: ${result.total}件`);
  console.log(`更新: ${result.updated}件`);
  console.log(`対象外（チャンネル未登録）: ${result.skipped}件`);
  console.log(`失敗: ${result.failed.length}件`);
  console.log("---------------------------------------------");

  if (result.failed.length > 0) {
    console.log("失敗したタレント:");
    for (const failure of result.failed) {
      console.log(`  - ${failure.talentName} (${failure.talentId}): ${failure.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("同期処理中に予期しないエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
