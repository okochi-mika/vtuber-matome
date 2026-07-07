// ============================================
// API Route: /api/youtube/search
// キーワードを受け取り、該当するYouTubeチャンネルの候補を返す
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { searchChannels } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "q（検索キーワード）をクエリパラメータで指定してください" },
      { status: 400 }
    );
  }

  try {
    const results = await searchChannels(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("チャンネル検索中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "チャンネル検索中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
