// ============================================
// API Route: /api/talents
// POST → 新しいタレントを登録する
// officeIdは必須、groupId・unitIdは任意（未所属の場合はnullのまま）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, officeId, groupId, unitId, channelId } = body;

  if (!name || !officeId || !channelId) {
    return NextResponse.json(
      { error: "name, officeId, channelId は必須です" },
      { status: 400 }
    );
  }

  try {
    const talent = await prisma.talent.create({
      data: {
        name,
        officeId,
        // groupId, unitIdが空文字("")で送られてくる場合はnull(未所属)として扱う
        groupId: groupId || null,
        unitId: unitId || null,
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
