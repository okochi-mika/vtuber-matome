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

// 候補リストに積む1件分のデータ。検索結果に「チェック状態」と「編集可能な名前」を足したもの
type Candidate = ChannelSearchResult & {
  talentName: string;
  checked: boolean;
};

const UNAFFILIATED = "";

export default function AddTalentForm({
  offices,
  groups,
  units,
}: AddTalentFormProps) {
  // 事務所・グループ・ユニットは「これから登録する候補全員」に共通で適用される
  const [officeId, setOfficeId] = useState(offices[0]?.id ?? "");
  const groupsInOffice = groups.filter((g) => g.officeId === officeId);

  const [groupId, setGroupId] = useState<string>(UNAFFILIATED);
  const unitsInGroup = units.filter((u) => u.groupId === groupId);

  // 【変更点】ユニットは複数選択できるようにする（配列で管理）
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 検索してきた候補を積み上げていくリスト（複数回検索しても既存の候補は消えない）
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  function handleOfficeChange(newOfficeId: string) {
    setOfficeId(newOfficeId);
    setGroupId(UNAFFILIATED);
    setSelectedUnitIds([]);
  }

  function handleGroupChange(newGroupId: string) {
    setGroupId(newGroupId);
    // グループを変えたら、以前選んでいたユニットは無関係になるのでリセットする
    setSelectedUnitIds([]);
  }

  // チェックボックスのオン/オフを切り替える
  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId]
    );
  }

  // ---------------------------------------------
  // 検索: 見つかった結果を「候補リスト」に追加する（既存の候補は消さない）
  // ---------------------------------------------
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
        return;
      }

      const results: ChannelSearchResult[] = await response.json();

      setCandidates((prev) => {
        // すでに候補リストに入っているチャンネルは重複して追加しない
        const existingIds = new Set(prev.map((c) => c.channelId));
        const newOnes = results
          .filter((r) => !existingIds.has(r.channelId))
          .map((r) => ({
            ...r,
            talentName: r.title, // 名前の初期値はチャンネル名にしておき、後で編集できるようにする
            checked: true, // デフォルトでチェックを入れておく
          }));
        return [...prev, ...newOnes];
      });

      setSearchQuery("");
    } catch (error) {
      console.error("search error:", error);
      setMessage("検索中に通信エラーが発生しました。ターミナルのログを確認してください。");
    } finally {
      setIsSearching(false);
    }
  }

  // ---------------------------------------------
  // 候補リストの操作（チェック切り替え・名前編集・削除）
  // ---------------------------------------------
  function toggleChecked(channelId: string) {
    setCandidates((prev) =>
      prev.map((c) =>
        c.channelId === channelId ? { ...c, checked: !c.checked } : c
      )
    );
  }

  function updateCandidateName(channelId: string, name: string) {
    setCandidates((prev) =>
      prev.map((c) =>
        c.channelId === channelId ? { ...c, talentName: name } : c
      )
    );
  }

  function removeCandidate(channelId: string) {
    setCandidates((prev) => prev.filter((c) => c.channelId !== channelId));
  }

  // ---------------------------------------------
  // チェックが付いている候補をまとめて登録する
  // ---------------------------------------------
  async function handleBulkRegister() {
    const selected = candidates.filter((c) => c.checked);

    if (selected.length === 0) {
      setMessage("登録するチャンネルを1つ以上選択してください");
      return;
    }
    if (selected.some((c) => !c.talentName.trim())) {
      setMessage("タレント名が空欄の項目があります");
      return;
    }

    setIsRegistering(true);
    setMessage("");

    const response = await fetch("/api/talents/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officeId,
        groupId: groupId || null,
        unitIds: selectedUnitIds, // 複数のユニットIDをまとめて送る
        talents: selected.map((c) => ({
          name: c.talentName,
          channelId: c.channelId,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setMessage(`${data.count}件のタレントを登録しました！トップページで確認してください。`);
      // 登録が完了したら、チェックが入っていなかった候補も含めて全部リセットする
      // （不要だった検索結果を毎回手動で消さなくて済むようにするため）
      setCandidates([]);
      setSearchQuery("");
    } else {
      setMessage("登録に失敗しました。もう一度お試しください。");
    }

    setIsRegistering(false);
  }

  const checkedCount = candidates.filter((c) => c.checked).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm">
        <h2 className="text-[#14141c] font-semibold mb-4">
          1. 登録先（選んだ候補すべてに適用されます）
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-[#70707f] mb-1">
              事務所（必須）
            </label>
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
            <label className="block text-xs text-[#70707f] mb-1">
              グループ（任意）
            </label>
            <select
              value={groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
            >
              <option value={UNAFFILIATED}>未所属</option>
              {groupsInOffice.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 【変更点】ユニットはチェックボックスで複数選べるようにする */}
        <div>
          <label className="block text-xs text-[#70707f] mb-2">
            ユニット（任意・複数選択可）
          </label>

          {groupId === UNAFFILIATED ? (
            <p className="text-xs text-[#70707f]">
              グループを選ぶとユニットを選択できます
            </p>
          ) : unitsInGroup.length === 0 ? (
            <p className="text-xs text-[#70707f]">
              このグループにはまだユニットが登録されていません
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unitsInGroup.map((unit) => {
                const isSelected = selectedUnitIds.includes(unit.id);
                return (
                  <label
                    key={unit.id}
                    className={
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer border transition-colors " +
                      (isSelected
                        ? "bg-[#0891b2] border-[#0891b2] text-white"
                        : "bg-[#f5f6fa] border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUnit(unit.id)}
                      className="hidden"
                    />
                    {unit.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm">
        <h2 className="text-[#14141c] font-semibold mb-4">
          2. チャンネルを検索して候補に追加
        </h2>
        <p className="text-xs text-[#70707f] -mt-3 mb-4">
          何度も検索して候補を積み上げてから、最後にまとめて登録できます
        </p>

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
      </div>

      {/* 候補リスト */}
      {candidates.length > 0 && (
        <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#14141c] font-semibold">
              3. 候補一覧（{checkedCount}件を選択中）
            </h2>
            <button
              onClick={handleBulkRegister}
              disabled={isRegistering || checkedCount === 0}
              className="rounded-lg bg-[#ec4899] text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50"
            >
              {isRegistering
                ? "登録中..."
                : `選択した${checkedCount}件を登録`}
            </button>
          </div>

          <div className="space-y-2">
            {candidates.map((candidate) => (
              <div
                key={candidate.channelId}
                className={
                  "flex items-center gap-3 rounded-lg p-3 " +
                  (candidate.checked ? "bg-[#f5f6fa]" : "bg-white border border-dashed border-[#e4e4ec] opacity-60")
                }
              >
                <input
                  type="checkbox"
                  checked={candidate.checked}
                  onChange={() => toggleChecked(candidate.channelId)}
                  className="w-4 h-4 accent-[#0891b2]"
                />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.thumbnailUrl}
                  alt={candidate.title}
                  className="h-10 w-10 rounded-full shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={candidate.talentName}
                    onChange={(e) =>
                      updateCandidateName(candidate.channelId, e.target.value)
                    }
                    className="w-full rounded-md bg-white border border-[#e4e4ec] text-[#14141c] text-sm px-2 py-1 outline-none focus:border-[#0891b2]/60"
                  />
                  <p className="text-[#70707f] text-xs truncate mt-1">
                    {candidate.title} ・ {candidate.channelId}
                  </p>
                </div>

                <button
                  onClick={() => removeCandidate(candidate.channelId)}
                  className="shrink-0 text-[#70707f] hover:text-[#ec4899] text-sm px-2"
                  aria-label="候補から削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p className="text-sm text-[#0891b2]">{message}</p>}
    </div>
  );
}
