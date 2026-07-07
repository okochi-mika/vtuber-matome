// ============================================
// API Route: /api/talents/reorder
// 「並び替え後の順番」をまとめて受け取り、DBのsortOrderを一括更新する
//
// 受け取る形式:
// { orderedIds: ["talentIdその1", "talentIdその2", ...] }
// 配列の並び順どおりに、0, 1, 2... というsortOrderを割り振っていく
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderedIds } = body as { orderedIds: string[] };

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json(
      { error: "orderedIds は配列で指定してください" },
      { status: 400 }
    );
  }

  try {
    // 配列の順番どおりに、1件ずつsortOrderを更新していく
    // Promise.allで並列に実行することで、待ち時間を短縮する
    await Promise.all(
      orderedIds.map((talentId, index) =>
        prisma.talent.update({
          where: { id: talentId },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("並び替え中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "並び替え中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
