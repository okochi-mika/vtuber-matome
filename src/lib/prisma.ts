// ============================================
// Prisma Client を安全に使い回すための設定ファイル
//
// 【なぜこれが必要か】
// Next.jsの開発モードでは、コードを保存するたびに一部の処理が再実行されます。
// 何も対策をしないと、保存するたびに新しい「DBへの接続」が作られてしまい、
// あっという間にDBの接続上限に達してエラーになります。
//
// この対策として、「一度作ったPrismaClientを、グローバルな場所に保存しておいて
// 使い回す」という、Next.js公式が推奨するやり方をここで行っています。
// ============================================

import { PrismaClient } from "@prisma/client";

// グローバルオブジェクトにPrismaClientを保存する場所を用意する
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// すでに作られたPrismaClientがあればそれを使い、なければ新しく作る
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 開発環境(本番ではない場合)だけ、作ったインスタンスをグローバルに保存しておく
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
