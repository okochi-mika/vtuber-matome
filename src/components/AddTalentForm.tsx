"use client";

import { useState } from "react";
import type { ChannelSearchResult } from "@/lib/youtube";

type Office = { id: string; name: string };
type Group = { id: string; name: string; officeId: string };
type Unit = { id: string; name: string; groupId: string };

type AddTalentFormProps = {
  offices: Office[];
  groups: Group[];
  units: Unit[];
};

export default function AddTalentForm({
  offices,
  groups,
  units,
}: AddTalentFormProps) {
  const [talentName, setTalentName] = useState("");

  // 事務所 → グループ → ユニット の順に絞り込むための選択状態
  const [officeId, setOfficeId] = useState(offices[0]?.id ?? "");
  const groupsInOffice = groups.filter((g) => g.officeId === officeId);

  const [groupId, setGroupId] = useState(groupsInOffice[0]?.id ?? "");
  const unitsInGroup = units.filter((u) => u.groupId === groupId);

  const [unitId, setUnitId] = useState(unitsInGroup[0]?.id ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");

  // 事務所を切り替えたら、グループ・ユニットの選択もその事務所内のものに更新する
  function handleOfficeChange(newOfficeId: string) {
    setOfficeId(newOfficeId);
    const newGroups = groups.filter((g) => g.officeId === newOfficeId);
    const newGroupId = newGroups[0]?.id ?? "";
    setGroupId(newGroupId);
    const newUnits = units.filter((u) => u.groupId === newGroupId);
    setUnitId(newUnits[0]?.id ?? "");
  }

  // グループを切り替えたら、ユニットの選択もそのグループ内のものに更新する
  function handleGroupChange(newGroupId: string) {
    setGroupId(newGroupId);
    const newUnits = units.filter((u) => u.groupId === newGroupId);
    setUnitId(newUnits[0]?.id ?? "");
  }

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
    if (!unitId) {
      setMessage("ユニットを選択してください（グループにユニットが無い場合は先に作成してください）");
      return;
    }

    const response = await fetch("/api/talents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: talentName,
        unitId,
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
      <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm">
        <h2 className="text-[#14141c] font-semibold mb-4">1. タレント情報</h2>

        <label className="block text-xs text-[#70707f] mb-1">タレント名</label>
        <input
          type="text"
          value={talentName}
          onChange={(e) => setTalentName(e.target.value)}
          placeholder="例: ときのそら"
          className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 mb-4 outline-none focus:border-[#0891b2]/60"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[#70707f] mb-1">事務所</label>
            <select
              value={officeId}
              onChange={(e) => handleOfficeChange(e.target.value)}
              className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
            >
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#70707f] mb-1">グループ</label>
            <select
              value={groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
            >
              {groupsInOffice.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#70707f] mb-1">ユニット</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
            >
              {unitsInGroup.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm">
        <h2 className="text-[#14141c] font-semibold mb-4">2. YouTubeチャンネルを検索</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="チャンネル名で検索"
            className="flex-1 rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-lg bg-[#0891b2] text-white font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {isSearching ? "検索中..." : "検索"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {searchResults.map((channel) => (
            <div
              key={channel.channelId}
              className="flex items-center gap-3 rounded-lg bg-[#f5f6fa] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[#14141c] text-sm truncate">{channel.title}</p>
                <p className="text-[#70707f] text-xs truncate">{channel.channelId}</p>
              </div>
              <button
                onClick={() => handleRegister(channel)}
                className="shrink-0 rounded-lg bg-[#ec4899] text-white text-sm font-semibold px-3 py-1.5 hover:opacity-90"
              >
                このチャンネルを登録
              </button>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <p className="text-sm text-[#0891b2]">{message}</p>
      )}
    </div>
  );
}
