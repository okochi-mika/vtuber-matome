// ============================================
// API Route: /api/talents/bulk
// POST → 複数のタレントを一度にまとめて登録する
//
// 受け取る形式:
// {
//   officeId: "...",
//   groupId: "..." | null,
//   unitIds: ["...", "..."],  // 複数のユニットに同時に所属できる
//   talents: [
//     { name: "タレント名1", channelId: "チャンネルID1" },
//     { name: "タレント名2", channelId: "チャンネルID2" },
//     ...
//   ]
// }
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { officeId, groupId, unitIds, talents } = body as {
    officeId: string;
    groupId: string | null;
    unitIds: string[] | undefined;
    talents: { name: string; channelId: string }[];
  };

  if (!officeId || !Array.isArray(talents) || talents.length === 0) {
    return NextResponse.json(
      { error: "officeId と talents（1件以上）は必須です" },
      { status: 400 }
    );
  }

  try {
    // 現在の最大sortOrderを調べ、そこから連番を割り振っていく
    // → 一括登録したタレントが全員「一番最後」にまとまって追加されるようになる
    const maxOrder = await prisma.talent.aggregate({
      _max: { sortOrder: true },
    });
    let nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    // 1件ずつ作成する処理を配列にして、Promise.allでまとめて実行する
    // （for文で1件ずつawaitするより、全体の完了が早くなる）
    const created = await Promise.all(
      talents.map((talent) => {
        const sortOrder = nextSortOrder++; // 呼ばれるたびに1ずつ増やして割り当てる
        return prisma.talent.create({
          data: {
            name: talent.name,
            officeId,
            groupId: groupId || null,
            sortOrder,
            // units: connect → 渡された全ユニットIDに、同時に所属させる
            units: {
              connect: (unitIds ?? []).map((id) => ({ id })),
            },
            channels: {
              create: [
                {
                  platform: "youtube",
                  externalId: talent.channelId,
                },
              ],
            },
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: created.length });
  } catch (error) {
    console.error("一括登録中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "一括登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
