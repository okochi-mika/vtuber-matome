// ============================================
// API Route: /api/groups
//
// GET  → グループの一覧を返す（どの事務所に属しているかも一緒に）
// POST → 新しいグループを作成する
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      officeId: true,
    },
  });

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, officeId } = body;

  if (!name || !officeId) {
    return NextResponse.json(
      { error: "name と officeId は必須です" },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.group.create({
      data: { name, officeId },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("グループ作成中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "グループ作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
