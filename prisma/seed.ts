// ============================================
// シードスクリプト
// タレントは事務所(officeId)には必ず所属するが、
// グループ・ユニットへの所属は任意、という構造に対応
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/seed.ts
// ============================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hololive = await prisma.office.create({
    data: { name: "hololiveプロダクション" },
  });

  const hololiveGroup = await prisma.group.create({
    data: { name: "ホロライブ", officeId: hololive.id },
  });

  const regloss = await prisma.unit.create({
    data: { name: "ReGLOSS", groupId: hololiveGroup.id },
  });

  // 事務所直属（グループ・ユニット未所属）のタレントの例
  await prisma.talent.create({
    data: {
      name: "hololive公式",
      officeId: hololive.id,
      channels: {
        create: [
          { platform: "youtube", externalId: "UCJFZiqLMntJufDCHc6bQixg" },
        ],
      },
    },
  });

  // グループ直属（ユニット未所属）のタレントの例
  await prisma.talent.create({
    data: {
      name: "星街すいせい",
      officeId: hololive.id,
      groupId: hololiveGroup.id,
      channels: {
        create: [
          { platform: "youtube", externalId: "UC5CwaMl1eIgY8h02uZw7u8A" },
        ],
      },
    },
  });

  console.log("シードデータの登録が完了しました");
}

main()
  .catch((error) => {
    console.error("シード実行中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
