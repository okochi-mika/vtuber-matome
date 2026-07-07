// ============================================
// シードスクリプト
// 「事務所 → グループ → タレント → チャンネル」の初期データを
// DBに1回だけ流し込むためのスクリプトです。
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
  // 先ほど作った事務所(hololive.id)に紐付ける
  // ---------------------------------------------
  const hololiveGroup = await prisma.group.create({
    data: {
      name: "ホロライブ",
      officeId: hololive.id,
    },
  });

  // ---------------------------------------------
  // ステップ3: タレント（Talent）とチャンネル（Channel）を作成
  // タレントを作ると同時に、そのタレントのチャンネル情報も一緒に登録する
  // （Prismaでは「create」の中で関連するデータもまとめて作成できます）
  // ---------------------------------------------
  await prisma.talent.create({
    data: {
      name: "hololive公式",
      groupId: hololiveGroup.id,
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
      name: "ときのそら",
      groupId: hololiveGroup.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UCp6993wxpyDPHUpavwDFqgg",
          },
        ],
      },
    },
  });
  await prisma.talent.create({
    data: {
      name: "ロボ子さん",
      groupId: hololiveGroup.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UCDqI2jOz0weumE8s7paEk6g",
          },
        ],
      },
    },
  });
  await prisma.talent.create({
    data: {
      name: "AZKi",
      groupId: hololiveGroup.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UC0TXe_LYZ4scaW2XMyi5_kw",
          },
        ],
      },
    },
  });
  await prisma.talent.create({
    data: {
      name: "さくらみこ",
      groupId: hololiveGroup.id,
      channels: {
        create: [
          {
            platform: "youtube",
            externalId: "UC-hM6YJuNYVAmUWxeIr9FeA",
          },
        ],
      },
    },
  });

  await prisma.talent.create({
    data: {
      name: "星街すいせい",
      groupId: hololiveGroup.id,
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
}

// 実行して、終わったら接続を閉じる。エラーが出たら内容を表示する
main()
  .catch((error) => {
    console.error("シード実行中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
