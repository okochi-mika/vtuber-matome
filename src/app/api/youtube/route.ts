// ============================================
// API Route: /api/youtube
// 中身のロジックは lib/youtube.ts に切り出したので、
// ここでは「リクエストを受け取って、結果を返す」役割だけに専念します
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getChannelInfo } from "@/lib/youtube"; // さっき作った共通関数を読み込む

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId をクエリパラメータで指定してください" },
      { status: 400 }
    );
  }

  try {
    // ロジックは全部lib/youtube.tsにお任せ。ここでは呼ぶだけ
    const result = await getChannelInfo(channelId);
    return NextResponse.json(result);

  } catch (error) {
    console.error("YouTube APIの取得中にエラーが発生しました:", error);

    return NextResponse.json(
      { error: "YouTube APIの取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
