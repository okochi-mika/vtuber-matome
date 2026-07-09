// ============================================
// API Route: /api/offices/[id]
// PATCH  → 事務所名を更新する
// DELETE → 事務所を削除する（中にグループが残っている場合は削除できない）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const officeId = params.id;
  const body = await request.json();
  const { name } = body;

  try {
    await prisma.office.update({
      where: { id: officeId },
      data: { name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("事務所更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "事務所更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const officeId = params.id;

  try {
    await prisma.office.delete({
      where: { id: officeId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // P2003: 外部キー制約エラー = まだこの事務所に属するグループが残っている
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "この事務所にはまだグループが登録されているため削除できません。先にグループを削除してください。",
        },
        { status: 400 }
      );
    }

    console.error("事務所削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "事務所削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
