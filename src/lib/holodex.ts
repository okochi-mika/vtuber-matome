// ============================================
// Holodex API連携
// 配信中・配信予定の情報を取得する
//
// 【重要】これはYouTube Data APIとは完全に別のサービス・別のクォータです。
// なので、この機能をどれだけ使っても、
// タレント追加の検索やチャンネル情報取得には一切影響しません。
// ============================================

export type HolodexVideo = {
  id: string; // YouTubeの動画ID
  title: string;
  status: "new" | "upcoming" | "live" | "past" | "missing";
  start_scheduled?: string; // 配信予定時刻(ISO8601形式の文字列)
  start_actual?: string; // 実際に配信が始まった時刻
  live_viewers?: number; // 現在の視聴者数（配信中のみ）
  channel_id?: string; // YouTubeチャンネルID（includeパラメータの指定によっては入らないことがある）
  // 【追加】Holodex側が持っているチャンネル名の情報
  // こちらのDBに登録が無いチャンネル（コラボ相手など）でも、
  // 名前だけは表示できるようにするために使う
  channel?: {
    id: string;
    name: string;
  };
};

// ============================================
// 動画がどのチャンネルのものかを取得するヘルパー関数
//
// 【重要】Holodex APIは、リクエスト時のパラメータ（今回は&include=channel）
// によって、チャンネルIDの入る場所が変わります。
// - トップレベルの channel_id に入っている場合
// - channel.id （入れ子）に入っている場合
// の両方に対応できるよう、このヘルパーを介して取得するようにしています。
// ============================================
export function getChannelIdFromVideo(video: HolodexVideo): string | undefined {
  return video.channel_id ?? video.channel?.id;
}

// 複数のチャンネルIDを渡すと、その中で「配信中」または「配信予定」の
// 動画をまとめて返す（Holodexの「複数チャンネルの状態を一括で調べる」専用API）
export async function getLiveAndUpcoming(
  channelIds: string[]
): Promise<HolodexVideo[]> {
  const apiKey = process.env.HOLODEX_API_KEY;

  if (!apiKey) {
    throw new Error(
      "HOLODEX_API_KEY が設定されていません（.envを確認してください）"
    );
  }

  if (channelIds.length === 0) {
    return [];
  }

  // 一度に問い合わせるチャンネル数が多すぎるとURLが長くなりすぎるため、
  // 50件ずつに分けて問い合わせる（Holodex側の1回のリクエストの目安に合わせています）
  const chunks: string[][] = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    chunks.push(channelIds.slice(i, i + 50));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const url =
        `https://holodex.net/api/v2/users/live` +
        `?channels=${chunk.join(",")}` +
        `&include=channel`; // チャンネル名の情報も一緒にもらう

      const response = await fetch(url, {
        headers: { "X-APIKEY": apiKey },
        // 1分間はキャッシュを使い回す。配信状況はそこまで頻繁に変わらないので、
        // 見に来るたびに毎回問い合わせるより負荷を抑えられる
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        console.error("Holodex APIエラー:", await response.text());
        return [];
      }

      return (await response.json()) as HolodexVideo[];
    })
  );

  return results.flat();
}

// YouTubeの動画IDから、サムネイル画像のURLを組み立てる
// （画像取得にAPIは不要。決まった形式のURLでアクセスできる）
export function getVideoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
