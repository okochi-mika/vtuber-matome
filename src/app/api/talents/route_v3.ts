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
    // 現在登録されている中で一番大きいsortOrderを調べ、その次の番号を割り当てる
    // → 新しく追加したタレントが必ず「一番最後」に来るようになる
    const maxOrder = await prisma.talent.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const talent = await prisma.talent.create({
      data: {
        name,
        officeId,
        // groupIdが空文字("")で送られてくる場合はnull(未所属)として扱う
        groupId: groupId || null,
        sortOrder: nextSortOrder,
        // units: connect → 複数のユニットIDに同時に所属させる
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
