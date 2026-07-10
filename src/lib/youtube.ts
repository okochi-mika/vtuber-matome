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
    // 登録者数を非公開にしているチャンネルは statistics.subscriberCount が
    // レスポンスに含まれないことがあるため、"?? 0" で無い場合は0として扱う
    // （0だと「非公開」の意味で画面側に表示させる）
    subscriberCount: Number(channelData.statistics.subscriberCount ?? 0),
    videoCount: Number(channelData.statistics.videoCount ?? 0),
    viewCount: Number(channelData.statistics.viewCount ?? 0),
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
    // 【重要】以前はここで何も考えずに空配列を返していたため、
    // クォータ超過などのエラーが起きていても画面上は「検索結果0件」にしか見えなかった
    // → エラーの中身をログに出し、呼び出し元にも分かるようにエラーとして投げる
    console.error("YouTube検索でエラーが発生しました:", data.error ?? data);

    if (data.error?.errors?.[0]?.reason === "quotaExceeded") {
      throw new Error(
        "YouTube APIの1日の利用上限（クォータ）に達しました。日本時間で毎日17時頃にリセットされます。"
      );
    }

    throw new Error("YouTube検索でエラーが発生しました");
  }

  // 検索結果を、画面で使いやすい形に整形する
  return data.items.map((item: any) => ({
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.default.url,
  }));
}

// ============================================
// ここから追加: タレント個別ページ用の「動画一覧」取得機能
//
// 【クォータ消費を抑える工夫】
// 動画一覧の取得には本来 search.list（1回100ユニット）を使いがちですが、
// 代わりに以下の2ステップで済ませることで、1ページあたり2ユニット程度に抑えています。
//
// 1. playlistItems.list（1ユニット）
//    → チャンネルの「アップロード動画一覧プレイリスト」から、
//      最新の動画IDを一括取得する
//      （YouTubeの仕様上、チャンネルID の "UC" を "UU" に置き換えると
//       そのチャンネルの「全アップロード動画」のプレイリストIDになる）
//
// 2. videos.list（1ユニット。動画を50件まとめて指定してもユニット消費は変わらない）
//    → 上記で取得した動画IDを一括で渡し、再生回数や
//      「配信アーカイブかどうか」の情報をまとめて取得する
// ============================================

export type VideoInfo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  isArchive: boolean; // 配信のアーカイブなら true、通常のアップロード動画なら false
};

export type TalentVideos = {
  latest: VideoInfo[]; // 新しい順
  popular: VideoInfo[]; // 再生回数が多い順
};

export async function getChannelVideos(
  channelId: string,
  maxResults: number = 12
): Promise<TalentVideos> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY が設定されていません（.envを確認してください）");
  }

  // ステップ1: アップロード動画一覧プレイリストのIDを組み立てる
  const uploadsPlaylistId = channelId.replace(/^UC/, "UU");

  const playlistUrl =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet` +
    `&playlistId=${uploadsPlaylistId}` +
    `&maxResults=${maxResults}` +
    `&key=${apiKey}`;

  const playlistResponse = await fetch(playlistUrl, {
    next: { revalidate: 600 }, // 10分キャッシュ
  });
  const playlistData = await playlistResponse.json();

  if (!playlistData.items || playlistData.items.length === 0) {
    return { latest: [], popular: [] };
  }

  const videoIds = playlistData.items
    .map((item: any) => item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return { latest: [], popular: [] };
  }

  // ステップ2: 動画IDをまとめて渡し、再生回数などの詳細を取得する
  const videosUrl =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=snippet,statistics,liveStreamingDetails` +
    `&id=${videoIds.join(",")}` +
    `&key=${apiKey}`;

  const videosResponse = await fetch(videosUrl, {
    next: { revalidate: 600 },
  });
  const videosData = await videosResponse.json();

  const videos: VideoInfo[] = (videosData.items ?? []).map((item: any) => ({
    videoId: item.id,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    // liveStreamingDetails が存在する動画 = 配信アーカイブ
    isArchive: Boolean(item.liveStreamingDetails),
  }));

  // 最新順（プレイリスト自体がすでに新しい順になっているので並べ替え不要）
  const latest = videos;

  // 再生回数順に並べ替えたものを「人気」として使う
  const popular = [...videos].sort((a, b) => b.viewCount - a.viewCount);

  return { latest, popular };
}
