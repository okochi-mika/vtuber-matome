// ============================================
// Holodexからタレントの追加情報（Twitterリンク・説明文・稼働状況）を
// まとめて取得し、自前DBに保存するバッチ処理の本体
//
// 【注意】Holodexの /api/v2/channels/{channelId} が実際に返す情報は
// twitter / description / inactive などに限られる。
// Twitch・ツイキャス・BOOTH・公式サイトのリンクはHolodexには存在しないため
// ここでは取得しない（管理画面からの手入力運用のまま）。
//
// 【呼び出し元】
// - prisma/sync-holodex.ts  … ターミナルから手動実行するスクリプト
// - src/app/api/cron/sync-holodex/route.ts … Vercel Cron等から定期実行するAPI
// の両方から、このファイルの syncHolodexData() を呼び出す（ロジックを1箇所に集約）
// ============================================

import type { PrismaClient } from "@prisma/client";

const HOLODEX_CHANNEL_ENDPOINT = (channelId: string) =>
  `https://holodex.net/api/v2/channels/${channelId}`;

type HolodexChannelResponse = {
  twitter: string | null;
  description: string | null;
  inactive: boolean | null;
};

export type SyncFailure = {
  talentId: string;
  talentName: string;
  reason: string;
};

export type SyncResult = {
  total: number; // 同期対象だった件数（YouTubeチャンネルが登録されているタレント数）
  updated: number; // 正常に取得・保存できた件数
  skipped: number; // YouTubeチャンネル未登録などで対象外だった件数
  failed: SyncFailure[]; // 取得または保存に失敗した件数の詳細
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Holodexのtwitterフィールドは "handle" 形式と "https://twitter.com/handle" 形式の
// どちらで返ってくるかが一定でないため、保存前にURLへ統一しておく
function normalizeTwitterUrl(twitter: string): string {
  const trimmed = twitter.trim();
  if (trimmed === "") return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://twitter.com/${trimmed.replace(/^@/, "")}`;
}

// 1チャンネル分のHolodex情報を取得する
// 【重要】ここでは例外を投げず、失敗時はnullを返すようにしている。
// 1件の失敗でバッチ全体を止めたくないため、失敗の扱いは呼び出し側（syncHolodexData）に任せる
async function fetchHolodexChannel(
  channelId: string,
  apiKey: string
): Promise<HolodexChannelResponse | null> {
  try {
    const response = await fetch(HOLODEX_CHANNEL_ENDPOINT(channelId), {
      headers: { "X-APIKEY": apiKey },
    });

    if (!response.ok) {
      console.error(
        `Holodex APIエラー (channelId: ${channelId}): HTTP ${response.status}`
      );
      return null;
    }

    const data = await response.json();

    return {
      twitter: data.twitter ?? null,
      description: data.description ?? null,
      inactive: Boolean(data.inactive),
    };
  } catch (error) {
    // ネットワークエラーなど、fetch自体が失敗した場合もここに来る
    console.error(`Holodex通信エラー (channelId: ${channelId}):`, error);
    return null;
  }
}

type SyncOptions = {
  // Holodexサーバーへの負荷を抑えるため、1件ごとの問い合わせの間に空けるミリ秒
  // 要件通り1〜2秒を既定値にしている
  sleepMs?: number;
};

export async function syncHolodexData(
  prisma: PrismaClient,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const sleepMs = options.sleepMs ?? 1500;

  const apiKey = process.env.HOLODEX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "HOLODEX_API_KEY が設定されていません（.envを確認してください）"
    );
  }

  // 自前DBに登録されているタレントの「YouTubeチャンネルID」を読み込む
  const talents = await prisma.talent.findMany({
    include: {
      channels: { where: { platform: "youtube" } },
    },
  });

  const result: SyncResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    failed: [],
  };

  for (const talent of talents) {
    const channel = talent.channels[0];

    // YouTubeチャンネルが登録されていないタレントは対象外
    if (!channel) {
      result.skipped++;
      continue;
    }

    result.total++;

    const info = await fetchHolodexChannel(channel.externalId, apiKey);

    if (!info) {
      result.failed.push({
        talentId: talent.id,
        talentName: talent.name,
        reason: "Holodexからの取得に失敗しました",
      });
    } else {
      try {
        await prisma.talent.update({
          where: { id: talent.id },
          data: {
            holodexTwitter: info.twitter,
            holodexDescription: info.description,
            holodexInactive: info.inactive ?? false,
            holodexSyncedAt: new Date(),
            // 【重要】手動入力のtwitterUrlは上書きしない。
            // まだ何も設定されていない場合だけ、Holodexの値で埋める
            ...(talent.twitterUrl === null && info.twitter
              ? { twitterUrl: normalizeTwitterUrl(info.twitter) }
              : {}),
          },
        });
        result.updated++;
      } catch (error) {
        console.error(`DB保存エラー (talent: ${talent.name}):`, error);
        result.failed.push({
          talentId: talent.id,
          talentName: talent.name,
          reason:
            error instanceof Error ? error.message : "DB保存中にエラーが発生しました",
        });
      }
    }

    // 次のタレントの問い合わせまで少し待機する（Holodexサーバーへの配慮）
    await sleep(sleepMs);
  }

  return result;
}
