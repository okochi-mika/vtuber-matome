// ============================================
// API Route: /api/units
//
// GET  → ユニットの一覧を返す（どのグループに属しているかも一緒に）
// POST → 新しいユニットを作成する
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const units = await prisma.unit.findMany({
    select: {
      id: true,
      name: true,
      groupId: true,
      officialChannelUrl: true,
    },
  });

  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, groupId, officialChannelUrl } = body;

  if (!name || !groupId) {
    return NextResponse.json(
      { error: "name と groupId は必須です" },
      { status: 400 }
    );
  }

  try {
    const unit = await prisma.unit.create({
      data: { name, groupId, officialChannelUrl: officialChannelUrl || null },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("ユニット作成中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "ユニット作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
