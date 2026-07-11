// ============================================
// API Route: /api/talents
// POST → 新しいタレントを登録する
// officeIdは必須、groupId・unitIds（複数可）は任意
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, officeId, groupId, unitIds, channelId } = body;

  if (!name || !officeId || !channelId) {
    return NextResponse.json(
      { error: "name, officeId, channelId は必須です" },
      { status: 400 }
    );
  }

  try {
    const maxOrder = await prisma.talent.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const talent = await prisma.talent.create({
      data: {
        name,
        officeId,
        groupId: groupId || null,
        sortOrder: nextSortOrder,
        units: {
          connect: ((unitIds ?? []) as string[]).map((id) => ({ id })),
        },
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