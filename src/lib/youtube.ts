// ============================================
// YouTube Data API を呼び出す処理をここに1つにまとめます。
// こうしておくことで、
//   ・API Route（/api/youtube）
//   ・ページ側（画面表示）
// の両方から同じ関数を呼び出せて、コードの重複がなくなります。
// ============================================

// このAPIが返すデータの「型」を先に定義しておきます。
// TypeScriptでは、こうやって「どんな形のデータが返ってくるか」を
// 事前に決めておくと、タイプミスや項目の見落としに気づきやすくなります。
export type ChannelInfo = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  liveCount: number;
  videoCount: number;
  viewCount: number;
};

// channelIdを渡すと、そのチャンネルの情報を取得して返す関数
export async function getChannelInfo(
  channelId: string
): Promise<ChannelInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // ここでエラーを発生させることで、呼び出し元（page.tsxなど）が
    // try/catchでエラーを検知できるようになります
    throw new Error("YOUTUBE_API_KEY が設定されていません（.envを確認してください）");
  }

  const youtubeApiUrl =
    `https://www.googleapis.com/youtube/v3/channels` +
    `?part=snippet,statistics` +
    `&id=${channelId}` +
    `&key=${apiKey}`;

  const response = await fetch(youtubeApiUrl, {
    // 【ポイント】次のオプションを付けると、
    // 「1時間はキャッシュを使い回し、それ以降は再取得する」という動きになります。
    // 登録者数は毎秒変わるものではないので、APIの呼び出し回数を節約するために設定します。
    next: { revalidate: 3600 },
  });

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`チャンネルが見つかりませんでした: ${channelId}`);
  }

  const channelData = data.items[0];

  return {
    channelId,
    title: channelData.snippet.title,
    thumbnailUrl: channelData.snippet.thumbnails.default.url,
    subscriberCount: Number(channelData.statistics.subscriberCount),
    videoCount: Number(channelData.statistics.videoCount),
    viewCount: Number(channelData.statistics.viewCount),
  };
}

// ============================================
// ここから追加: チャンネルをキーワードで検索する機能
// 「チャンネルID」が分からなくても、名前で検索して候補を出せるようにします
// ============================================

// 検索結果1件分の形（channels.listより情報は少なめです）
export type ChannelSearchResult = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
};

export async function searchChannels(
  query: string
): Promise<ChannelSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY が設定されていません（.envを確認してください）");
  }

  // search.list というエンドポイントを使う
  // type=channel を指定することで、動画ではなく「チャンネル」だけを検索対象にする
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&type=channel` +
    `&maxResults=5` + // 候補は5件まで表示する
    `&q=${encodeURIComponent(query)}` + // 日本語や記号を含む検索語を安全な形式に変換する
    `&key=${apiKey}`;

  const response = await fetch(searchUrl);
  const data = await response.json();

  if (!data.items) {
    return [];
  }

  // 検索結果を、画面で使いやすい形に整形する
  return data.items.map((item: any) => ({
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.default.url,
  }));
}
