"use client";

import { useState } from "react";
import type { ChannelSearchResult } from "@/lib/youtube";

type Group = {
  id: string;
  name: string;
};

type AddTalentFormProps = {
  groups: Group[];
};

export default function AddTalentForm({ groups }: AddTalentFormProps) {
  const [talentName, setTalentName] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch() {
    if (!searchQuery) return;

    setIsSearching(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/youtube/search?q=" + encodeURIComponent(searchQuery)
      );

      if (!response.ok) {
        const errorData = await response.json();
        setMessage("検索に失敗しました: " + (errorData.error ?? "原因不明のエラー"));
        setSearchResults([]);
        return;
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("search error:", error);
      setMessage("検索中に通信エラーが発生しました。ターミナルのログを確認してください。");
    } finally {
      setIsSearching(false);
    }
  }

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
      setMessage("「" + talentName + "」を登録しました！トップページで確認してください。");
      setTalentName("");
      setSearchQuery("");
      setSearchResults([]);
    } else {
      setMessage("登録に失敗しました。もう一度お試しください。");
    }
  }

  return (
    <div className="space-y-6">
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

      {message && (
        <p className="text-sm text-[#00e0ff]">{message}</p>
      )}
    </div>
  );
}
