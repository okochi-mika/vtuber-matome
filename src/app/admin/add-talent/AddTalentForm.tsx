"use client"; // ブラウザ側で動く「クライアントコンポーネント」であることを示す
// （入力フォームやボタンのクリックなど、画面の操作を扱うにはこの宣言が必要です）

import { useState } from "react";
import type { ChannelSearchResult } from "@/lib/youtube";

// 親から渡される、選択可能なグループの一覧
type Group = {
  id: string;
  name: string;
};

type AddTalentFormProps = {
  groups: Group[];
};

export default function AddTalentForm({ groups }: AddTalentFormProps) {
  // ---------------------------------------------
  // 画面の状態（ユーザーの入力や検索結果）をここで管理する
  // ---------------------------------------------
  const [talentName, setTalentName] = useState(""); // タレント名の入力欄
  const [groupId, setGroupId] = useState(groups[0]?.id ?? ""); // 選択中のグループ
  const [searchQuery, setSearchQuery] = useState(""); // 検索キーワードの入力欄
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState(""); // 登録成功/失敗のメッセージ

  // ---------------------------------------------
  // 「検索」ボタンが押された時の処理
  // ---------------------------------------------
  async function handleSearch() {
    if (!searchQuery) return;

    setIsSearching(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
      );

      // レスポンス自体がエラー(404, 500など)だった場合はここで検知する
      if (!response.ok) {
        const errorData = await response.json();
        setMessage(`検索に失敗しました: ${errorData.error ?? "原因不明のエラー"}`);
        setSearchResults([]);
        return;
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      // ネットワークエラーなど、fetch自体が失敗した場合はここに来る
      console.error("検索中にエラーが発生しました:", error);
      setMessage("検索中に通信エラーが発生しました。ターミナルのログを確認してください。");
    } finally {
      // 成功しても失敗しても、必ず「検索中」の表示を解除する
      setIsSearching(false);
    }
  }

  // ---------------------------------------------
  // 検索結果の中から「このチャンネルを登録」ボタンが押された時の処理
  // ---------------------------------------------
  async function handleRegister(channel: ChannelSearchResult) {
    if (!talentName) {
      setMessage("タレント名を入力してください");
      return;
    }
    if (!groupId) {
      setMessage("グループを選択してください");
      return;
    }

    const response = await fetch("/api/talents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: talentName,
        groupId,
        channelId: channel.channelId,
      }),
    });

    if (response.ok) {
      setMessage(`「${talentName}」を登録しました！トップページで確認してください。`);
      // 入力内容をリセットする
      setTalentName("");
      setSearchQuery("");
      setSearchResults([]);
    } else {
      setMessage("登録に失敗しました。もう一度お試しください。");
    }
  }

  return (
    <div className="space-y-6">
      {/* ステップ1: タレント名とグループを入力 */}
      <div className="rounded-2xl bg-[#171724] border border-[#2a2a3d] p-5">
        <h2 className="text-[#f5f5fa] font-semibold mb-4">1. タレント情報</h2>

        <label className="block text-xs text-[#9797ab] mb-1">タレント名</label>
        <input
          type="text"
          value={talentName}
          onChange={(e) => setTalentName(e.target.value)}
          placeholder="例: 星街すいせい"
          className="w-full rounded-lg bg-[#0f0f17] border border-[#2a2a3d] text-[#f5f5fa] px-3 py-2 mb-4 outline-none focus:border-[#00e0ff]/60"
        />

        <label className="block text-xs text-[#9797ab] mb-1">所属グループ</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full rounded-lg bg-[#0f0f17] border border-[#2a2a3d] text-[#f5f5fa] px-3 py-2 outline-none focus:border-[#00e0ff]/60"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* ステップ2: チャンネル検索 */}
      <div className="rounded-2xl bg-[#171724] border border-[#2a2a3d] p-5">
        <h2 className="text-[#f5f5fa] font-semibold mb-4">2. YouTubeチャンネルを検索</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="チャンネル名で検索"
            className="flex-1 rounded-lg bg-[#0f0f17] border border-[#2a2a3d] text-[#f5f5fa] px-3 py-2 outline-none focus:border-[#00e0ff]/60"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-lg bg-[#00e0ff] text-[#0f0f17] font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {isSearching ? "検索中..." : "検索"}
          </button>
        </div>

        {/* 検索結果の候補リスト */}
        <div className="mt-4 space-y-2">
          {searchResults.map((channel) => (
            <div
              key={channel.channelId}
              className="flex items-center gap-3 rounded-lg bg-[#0f0f17] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[#f5f5fa] text-sm truncate">{channel.title}</p>
                <p className="text-[#9797ab] text-xs truncate">{channel.channelId}</p>
              </div>
              <button
                onClick={() => handleRegister(channel)}
                className="shrink-0 rounded-lg bg-[#ff4fa3] text-[#0f0f17] text-sm font-semibold px-3 py-1.5 hover:opacity-90"
              >
                このチャンネルを登録
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 結果メッセージ */}
      {message && (
        <p className="text-sm text-[#00e0ff]">{message}</p>
      )}
    </div>
  );
}