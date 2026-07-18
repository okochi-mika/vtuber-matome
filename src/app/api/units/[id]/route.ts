// ============================================
// API Route: /api/units/[id]
// PATCH  → ユニット名・所属グループ・公式チャンネルURLを更新する
// DELETE → ユニットを削除する（中にタレントが残っている場合は削除できない）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const unitId = params.id;
  const body = await request.json();
  const { name, groupId, officialChannelUrl } = body;

  try {
    await prisma.unit.update({
      where: { id: unitId },
      data: { name, groupId, officialChannelUrl: officialChannelUrl || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ユニット更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニット更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const unitId = params.id;

  try {
    await prisma.unit.delete({
      where: { id: unitId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // P2003: 外部キー制約エラー = まだこのユニットに属するタレントが残っている
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "このユニットにはまだタレントが登録されているため削除できません。先にタレントを削除するか、別のユニットに移動してください。",
        },
        { status: 400 }
      );
    }

    console.error("ユニット削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニット削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
