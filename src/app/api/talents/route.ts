// ============================================
// API Route: /api/talents
//
// GET  → グループ一覧を返す（登録フォームのプルダウン用）
// POST → 新しいタレント＋チャンネルをDBに登録する
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------
// GET: グループ一覧を返す
// フォームで「どのグループに所属させるか」を選ぶプルダウンに使う
// ---------------------------------------------
export async function GET() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return NextResponse.json(groups);
}

// ---------------------------------------------
// POST: 新しいタレントを登録する
// フロント側から { name, groupId, channelId } という形式で送られてくる想定
// ---------------------------------------------
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, groupId, channelId } = body;

  // 必須項目が足りない場合はエラーを返す
  if (!name || !groupId || !channelId) {
    return NextResponse.json(
      { error: "name, groupId, channelId はすべて必須です" },
      { status: 400 }
    );
  }

  try {
    // タレントとチャンネルを同時に作成する
    // （Prismaの「入れ子のcreate」を使うと、関連テーブルへの登録も1回でできる）
    const talent = await prisma.talent.create({
      data: {
        name,
        groupId,
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
