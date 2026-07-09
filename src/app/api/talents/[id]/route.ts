// ============================================
// API Route: /api/talents/[id]
// PATCH  → タレント情報を更新する（groupId, unitIdは空にもできる）
// DELETE → タレントを削除する
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const talentId = params.id;
  const body = await request.json();
  const { name, officeId, groupId, unitId, channelId } = body;

  try {
    await prisma.talent.update({
      where: { id: talentId },
      data: {
        name,
        officeId,
        groupId: groupId || null,
        unitId: unitId || null,
      },
    });

    if (channelId) {
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        include: { channels: true },
      });

      const firstChannel = talent?.channels[0];

      if (firstChannel) {
        await prisma.channel.update({
          where: { id: firstChannel.id },
          data: { externalId: channelId },
        });
      } else {
        await prisma.channel.create({
          data: {
            talentId,
            platform: "youtube",
            externalId: channelId,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("タレント更新中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "タレント更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const talentId = params.id;

  try {
    await prisma.talent.delete({
      where: { id: talentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("タレント削除中にエラーが発生しました:", error);
    return NextResponse.json(
      { error: "タレント削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
