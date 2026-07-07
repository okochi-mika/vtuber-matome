// ============================================
// API Route: /api/talents/[id]
// URLの中の [id] の部分が、動的にタレントのIDとして受け取れる
// 例: /api/talents/abc123 でアクセスすると、params.id が "abc123" になる
//
// PATCH  → 指定したタレントの情報を更新する
// DELETE → 指定したタレントを削除する
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

// ---------------------------------------------
// PATCH: タレント名・所属グループ・チャンネルIDを更新する
// ---------------------------------------------
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const talentId = params.id;
  const body = await request.json();
  const { name, groupId, channelId } = body;

  try {
    // まずタレント自体の名前とグループを更新する
    await prisma.talent.update({
      where: { id: talentId },
      data: {
        name,
        groupId,
      },
    });

    // チャンネルIDが送られてきた場合は、そのタレントの最初のチャンネルも更新する
    if (channelId) {
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        include: { channels: true },
      });

      const firstChannel = talent?.channels[0];

      if (firstChannel) {
        // すでにチャンネルが存在する場合は、externalIdを書き換える
        await prisma.channel.update({
          where: { id: firstChannel.id },
          data: { externalId: channelId },
        });
      } else {
        // チャンネルが1件も無かった場合は、新しく作成する
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

// ---------------------------------------------
// DELETE: タレントを削除する
// schema.prismaで onDelete: Cascade を設定しているので、
// 紐づくChannelやSubscriberSnapshotも自動的に一緒に削除される
// ---------------------------------------------
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
