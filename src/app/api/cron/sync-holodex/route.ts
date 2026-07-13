// ============================================
// API Route: /api/cron/sync-holodex
// Vercel Cron（またはその他の外部スケジューラ）から定期的に叩いてもらい、
// Holodexのデータを自前DBへ同期するためのエンドポイント
//
// 【重要】誰でも叩けると好きなタイミングでバッチを起動されてしまうため、
// CRON_SECRET という秘密の値をAuthorizationヘッダーで照合してガードしている。
// Vercel Cronは設定した秘密鍵を自動でAuthorizationヘッダーに付けて呼び出してくれる。
// （.envに CRON_SECRET=好きな文字列 を設定し、vercel.jsonのcron設定と対応させる）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHolodexData } from "@/lib/holodex-sync";

// タレント数が多いと数十秒〜数分かかる可能性があるため、実行時間の上限を伸ばしておく
// （Vercelのプランによって指定できる上限が異なるので、必要に応じて調整してください）
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncHolodexData(prisma);
    console.log(
      `Holodex同期バッチ完了: 対象${result.total}件 / 更新${result.updated}件 / 失敗${result.failed.length}件`
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Holodex同期バッチでエラーが発生しました:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "同期処理中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
