// ============================================
// 【STEP 3】 JSONファイルをMySQL(phpMyAdmin/MAMP)へ読み込む
//
// 【前提】このスクリプトを実行する前に、
//   1. schema.prisma をMySQL版に差し替え済みであること
//   2. .env の DATABASE_URL がMySQL(vtuber_matome)を指していること
//   3. npx prisma migrate dev --name init_mysql を実行し、
//      MySQL側に空のテーブルが作成済みであること
// が必要です。
//
// 実行方法（ターミナルで）:
//   npx tsx prisma/import-mysql-data.ts
//
// 【重要】upsertを使っているので、同じJSONを何度読み込んでも
// 重複登録にはなりません（IDが同じなら上書き更新されるだけ）。
// 途中でエラーが出ても、直してからもう一度実行し直して大丈夫です。
// ============================================

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type ExportData = {
  exportedAt: string;
  offices: { id: string; name: string }[];
  groups: { id: string; name: string; officeId: string }[];
  units: { id: string; name: string; groupId: string }[];
  talents: {
    id: string;
    name: string;
    sortOrder: number;
    officeId: string;
    groupId: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    hashtag: string | null;
    holodexTwitter: string | null;
    holodexDescription: string | null;
    holodexInactive: boolean;
    holodexSyncedAt: string | null;
    unitIds: string[];
  }[];
  channels: { id: string; talentId: string; platform: string; externalId: string }[];
  subscriberSnapshots: { id: string; channelId: string; count: number; fetchedAt: string }[];
};

async function main() {
  const exportPath = path.join(__dirname, "export", "vtuber-matome-export.json");

  if (!fs.existsSync(exportPath)) {
    throw new Error(
      `書き出し済みJSONが見つかりません: ${exportPath}\n先に prisma/export-postgres-data.ts を実行してください`
    );
  }

  const data: ExportData = JSON.parse(fs.readFileSync(exportPath, "utf-8"));

  console.log(`読み込み対象: ${data.exportedAt} 時点のデータ`);

  console.log("事務所を登録しています...");
  for (const office of data.offices) {
    await prisma.office.upsert({
      where: { id: office.id },
      create: office,
      update: office,
    });
  }

  console.log("グループを登録しています...");
  for (const group of data.groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      create: group,
      update: group,
    });
  }

  console.log("ユニットを登録しています...");
  for (const unit of data.units) {
    await prisma.unit.upsert({
      where: { id: unit.id },
      create: unit,
      update: unit,
    });
  }

  console.log("タレントを登録しています...");
  const talentFailures: string[] = [];
  for (const talent of data.talents) {
    try {
      const { unitIds, holodexSyncedAt, ...rest } = talent;
      await prisma.talent.upsert({
        where: { id: talent.id },
        create: {
          ...rest,
          holodexSyncedAt: holodexSyncedAt ? new Date(holodexSyncedAt) : null,
          units: { connect: unitIds.map((id) => ({ id })) },
        },
        update: {
          ...rest,
          holodexSyncedAt: holodexSyncedAt ? new Date(holodexSyncedAt) : null,
          units: { set: unitIds.map((id) => ({ id })) },
        },
      });
    } catch (error) {
      console.error(`タレント登録失敗 (${talent.name}):`, error);
      talentFailures.push(talent.name);
    }
  }

  console.log("チャンネルを登録しています...");
  for (const channel of data.channels) {
    await prisma.channel.upsert({
      where: { id: channel.id },
      create: channel,
      update: channel,
    });
  }

  console.log("登録者数スナップショットを登録しています...");
  for (const snapshot of data.subscriberSnapshots) {
    await prisma.subscriberSnapshot.upsert({
      where: { id: snapshot.id },
      create: { ...snapshot, fetchedAt: new Date(snapshot.fetchedAt) },
      update: { ...snapshot, fetchedAt: new Date(snapshot.fetchedAt) },
    });
  }

  console.log("---------------------------------------------");
  console.log(`事務所: ${data.offices.length}件`);
  console.log(`グループ: ${data.groups.length}件`);
  console.log(`ユニット: ${data.units.length}件`);
  console.log(`タレント: ${data.talents.length}件（失敗 ${talentFailures.length}件）`);
  console.log(`チャンネル: ${data.channels.length}件`);
  console.log(`登録者数スナップショット: ${data.subscriberSnapshots.length}件`);
  console.log("---------------------------------------------");

  if (talentFailures.length > 0) {
    console.log("登録に失敗したタレント:", talentFailures.join(", "));
  }

  console.log("MySQLへの取り込みが完了しました。phpMyAdminまたは `npx prisma studio` で確認してください。");
}

main()
  .catch((error) => {
    console.error("取り込み中にエラーが発生しました:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
