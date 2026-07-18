// ============================================
// API Route: /api/groups/[id]
// PATCH  → グループ名・所属事務所・公式チャンネルURLを更新する
// DELETE → グループを削除する（中にユニットが残っている場合は削除できない）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const groupId = params.id;
  const body = await request.json();
  const { name, officeId, officialChannelUrl } = body;

  try {
    await prisma.group.update({
      where: { id: groupId },
      data: { name, officeId, officialChannelUrl: officialChannelUrl || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("グループ更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "グループ更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const groupId = params.id;

  try {
    await prisma.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // P2003: 外部キー制約エラー = まだこのグループに属するユニットが残っている
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "このグループにはまだユニットが登録されているため削除できません。先にユニットを削除してください。",
        },
        { status: 400 }
      );
    }

    console.error("グループ削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "グループ削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
