// ============================================
// API Route: /api/talents/[id]
// PATCH  → タレント情報を更新する（groupIdは空にできる、unitIdsは複数指定・総入れ替え）
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
  const {
    name,
    officeId,
    groupId,
    unitIds,
    channelId,
    twitterUrl,
    instagramUrl,
    tiktokUrl,
    hashtag,
  } = body;

  try {
    await prisma.talent.update({
      where: { id: talentId },
      data: {
        name,
        officeId,
        groupId: groupId || null,
        // units: set → 今まで所属していたユニットを一旦全部外し、
        // 新しく渡された配列の内容に丸ごと入れ替える
        // （個別にconnect/disconnectするより、画面側のチェック状態と
        //   常に一致させやすいのでこちらを採用）
        units: {
          set: ((unitIds ?? []) as string[]).map((id) => ({ id })),
        },
        // プロフィール項目（空文字で送られてきたらnullとして保存する）
        twitterUrl: twitterUrl || null,
        instagramUrl: instagramUrl || null,
        tiktokUrl: tiktokUrl || null,
        hashtag: hashtag || null,
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
  } catch (error: any) {
    console.error("タレント更新中にエラーが発生しました:", error);
    // 【変更点】原因調査をしやすくするため、エラーの詳細（Prismaのエラーコードなど）を
    // そのまま画面側にも返すようにする
    return NextResponse.json(
      {
        error: "タレント更新中にエラーが発生しました",
        detail: error?.message ?? String(error),
        code: error?.code ?? null,
      },
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
