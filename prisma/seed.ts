// ============================================
// シードスクリプト（4階層版）
// 事務所 → グループ → ユニット → タレント → チャンネル
// という構造で初期データをDBに流し込みます
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/seed.ts
// ============================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---------------------------------------------
  // ステップ1: 事務所（Office）を作成
  // ---------------------------------------------
  const hololive = await prisma.office.create({
    data: {
      name: "hololiveプロダクション",
    },
  });

  // ---------------------------------------------
  // ステップ2: グループ（Group）を作成
  // ---------------------------------------------
  const hololiveGroup = await prisma.group.create({
    data: {
      name: "ホロライブ",
      officeId: hololive.id,
    },
  });

  // ---------------------------------------------
  // ステップ3: ユニット（Unit）を作成
  // 特にユニットに属さないタレント用に「本体」という汎用ユニットも用意しておく
  // ---------------------------------------------
  const mainUnit = await prisma.unit.create({
    data: {
      name: "本体",
      groupId: hololiveGroup.id,
    },
  });

  const regloss = await prisma.unit.create({
    data: {
      name: "ReGLOSS",
      groupId: hololiveGroup.id,
    },
  });

  // ---------------------------------------------
  // ステップ4: タレント（Talent）とチャンネル（Channel）を作成
  // ---------------------------------------------
  await prisma.talent.create({
    data: {
      name: "hololive公式",
      unitId: mainUnit.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UCJFZiqLMntJufDCHc6bQixg",
          },
        ],
      },
    },
  });

  await prisma.talent.create({
    data: {
      name: "星街すいせい",
      unitId: mainUnit.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UC5CwaMl1eIgY8h02uZw7u8A",
          },
        ],
      },
    },
  });

  console.log("シードデータの登録が完了しました");
  console.log("（ReGLOSSユニットは作成済みです。タレントは管理画面から追加してください）");
}

main()
  .catch((error) => {
    console.error("シード実行中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
