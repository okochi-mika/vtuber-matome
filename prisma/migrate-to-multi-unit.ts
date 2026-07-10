// ============================================
// 移行スクリプト（1回だけ実行するためのもの）
// 既存の「unitId（1人1ユニット）」のデータを、
// 新しい「units（複数ユニット所属）」の関連にコピーする
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/migrate-to-multi-unit.ts
// ============================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // unitIdが設定されている（ユニットに所属している）タレントだけを対象にする
  const talents = await prisma.talent.findMany({
    where: { unitId: { not: null } },
  });

  console.log(`${talents.length}件のタレントを移行します...`);

  for (const talent of talents) {
    await prisma.talent.update({
      where: { id: talent.id },
      data: {
        // 新しい「units」関連に、今まで持っていた1つのユニットをつなげる
        units: {
          connect: [{ id: talent.unitId! }],
        },
      },
    });
  }

  console.log("移行が完了しました");
}

main()
  .catch((error) => {
    console.error("移行中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
