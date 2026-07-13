// ============================================
// 【STEP 1】 Supabase(Postgres)の全データをJSONファイルへ書き出す
//
// 【重要】このスクリプトは、schema.prismaをMySQLに切り替える前に実行してください。
// まだ provider = "postgresql" のままの状態で実行する必要があります
// （切り替えた後だと、生成されるPrisma ClientがMySQL用になってしまい、
//   Supabaseの中身を読めなくなります）
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/export-postgres-data.ts
//
// 実行すると prisma/export/vtuber-matome-export.json が作られます。
// このファイルをSTEP 3（import-mysql-data.ts）で読み込みます。
// ============================================

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Supabase(Postgres)からデータを読み出しています...");

  const offices = await prisma.office.findMany();
  const groups = await prisma.group.findMany();
  const units = await prisma.unit.findMany();

  // タレントは、所属ユニットのIDも一緒に控えておく（MySQL側でunits.connectするため）
  const talentsRaw = await prisma.talent.findMany({
    include: { units: { select: { id: true } } },
  });
  const talents = talentsRaw.map((t) => ({
    id: t.id,
    name: t.name,
    sortOrder: t.sortOrder,
    officeId: t.officeId,
    groupId: t.groupId,
    twitterUrl: t.twitterUrl,
    instagramUrl: t.instagramUrl,
    tiktokUrl: t.tiktokUrl,
    hashtag: t.hashtag,
    holodexTwitter: t.holodexTwitter,
    holodexDescription: t.holodexDescription,
    holodexInactive: t.holodexInactive,
    holodexSyncedAt: t.holodexSyncedAt,
    unitIds: t.units.map((u) => u.id),
  }));

  const channels = await prisma.channel.findMany();
  const subscriberSnapshots = await prisma.subscriberSnapshot.findMany();

  const exportData = {
    exportedAt: new Date().toISOString(),
    offices,
    groups,
    units,
    talents,
    channels,
    subscriberSnapshots,
  };

  const exportDir = path.join(__dirname, "export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportPath = path.join(exportDir, "vtuber-matome-export.json");
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), "utf-8");

  console.log("---------------------------------------------");
  console.log(`事務所: ${offices.length}件`);
  console.log(`グループ: ${groups.length}件`);
  console.log(`ユニット: ${units.length}件`);
  console.log(`タレント: ${talents.length}件`);
  console.log(`チャンネル: ${channels.length}件`);
  console.log(`登録者数スナップショット: ${subscriberSnapshots.length}件`);
  console.log("---------------------------------------------");
  console.log(`書き出し完了: ${exportPath}`);
  console.log("");
  console.log("次のステップ: schema.prismaをMySQL版に差し替えてマイグレーションを実行し、");
  console.log("その後 npx tsx prisma/import-mysql-data.ts を実行してください。");
}

main()
  .catch((error) => {
    console.error("書き出し中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
