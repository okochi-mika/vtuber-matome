// ============================================
// API Route: /api/offices
// GET → 登録されている事務所の一覧を返す
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const offices = await prisma.office.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return NextResponse.json(offices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name は必須です" },
      { status: 400 }
    );
  }

  try {
    const office = await prisma.office.create({
      data: { name },
    });

    return NextResponse.json(office);
  } catch (error) {
    console.error("事務所作成中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "事務所作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
