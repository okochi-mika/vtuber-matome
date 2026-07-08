// ============================================
// API Route: /api/talents
// POST → 新しいタレントを登録する（unitIdに所属させる形に変更）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, unitId, channelId } = body;

  if (!name || !unitId || !channelId) {
    return NextResponse.json(
      { error: "name, unitId, channelId はすべて必須です" },
      { status: 400 }
    );
  }

  try {
    const talent = await prisma.talent.create({
      data: {
        name,
        unitId,
        channels: {
          create: [
            {
              platform: "youtube",
              externalId: channelId,
            },
          ],
        },
      },
    });

    return NextResponse.json(talent);
  } catch (error) {
    console.error("タレント登録中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "タレント登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
