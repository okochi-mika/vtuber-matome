This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## セットアップ手順（このプロジェクト固有）

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Supabase接続情報の設定
`.env.example` を `.env` にコピーし、Supabaseダッシュボード（Project Settings > Database）
から取得した接続文字列を設定してください。

```bash
cp .env.example .env
```

- `DATABASE_URL` : PgBouncer経由のPooled接続（アプリの通常クエリ用、port 6543）
- `DIRECT_URL`   : Direct接続（マイグレーション実行用、port 5432）

### 3. Prisma Clientの生成 & マイグレーション実行
```bash
npx prisma generate
npx prisma migrate dev --name init
```

これにより `prisma/schema.prisma` に定義された以下のテーブルがSupabase上に作成されます。

- `offices`（Office）
- `groups`（Group, Officeに紐づく）
- `talents`（Talent, Groupに紐づく）
- `channels`（Channel, Talentに紐づく。`platform` / `externalId` を保持）
- `subscriber_snapshots`（SubscriberSnapshot, Channelに紐づく。`count` / `fetchedAt` を保持）

### 4. 開発サーバー起動
```bash
npm run dev
```
http://localhost:3000 で起動を確認できます。

### Prisma Studioでデータ確認（任意）
```bash
npx prisma studio
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
