"use client";

import { useState } from "react";

type Office = { id: string; name: string };
type Group = { id: string; name: string; officeId: string };
type Unit = { id: string; name: string; groupId: string };

type TalentItem = {
  id: string;
  name: string;
  officeId: string;
  groupId: string | null;
  unitIds: string[]; // 【変更点】単一のunitIdから、配列に変更
  channelId: string;
  twitterUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  hashtag: string | null;
};

type ManageTalentsFormProps = {
  initialTalents: TalentItem[];
  offices: Office[];
  groups: Group[];
  units: Unit[];
};

const UNAFFILIATED = "";
const ALL = "__all__";

export default function ManageTalentsForm({
  initialTalents,
  offices,
  groups,
  units,
}: ManageTalentsFormProps) {
  const [talents, setTalents] = useState<TalentItem[]>(initialTalents);
  const [messages, setMessages] = useState<Record<string, string>>({});
  // どのタレントの「プロフィール編集」欄を開いているかを管理する
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------
  // 絞り込みフィルター（並び替えページと同じ考え方）
  // カードが多いとき、事務所・グループ・ユニットで表示を絞り込めるようにする
  // ここで絞り込むのは「表示」だけで、talents自体（実データ）は変更しない
  // ---------------------------------------------
  const [filterOfficeId, setFilterOfficeId] = useState(ALL);
  const [filterGroupId, setFilterGroupId] = useState(ALL);
  const [filterUnitId, setFilterUnitId] = useState(ALL);

  const groupsForFilter = groups.filter(
    (g) => filterOfficeId === ALL || g.officeId === filterOfficeId
  );

  const unitsForFilter = units.filter(
    (u) => filterGroupId === ALL || u.groupId === filterGroupId
  );

  const visibleTalents = talents.filter((talent) => {
    if (filterOfficeId !== ALL && talent.officeId !== filterOfficeId) {
      return false;
    }
    if (filterGroupId !== ALL && talent.groupId !== filterGroupId) {
      return false;
    }
    if (filterUnitId !== ALL && !talent.unitIds.includes(filterUnitId)) {
      return false;
    }
    return true;
  });

  function toggleExpanded(talentId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(talentId)) {
        next.delete(talentId);
      } else {
        next.add(talentId);
      }
      return next;
    });
  }

  function handleFieldChange(
    talentId: string,
    field:
      | "name"
      | "officeId"
      | "groupId"
      | "channelId"
      | "twitterUrl"
      | "instagramUrl"
      | "tiktokUrl"
      | "hashtag",
    value: string
  ) {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== talentId) return t;

        const updated = { ...t, [field]: value || null } as TalentItem;

        // 事務所を変えたら、グループ・ユニットの選択は一旦リセットする
        if (field === "officeId") {
          updated.groupId = null;
          updated.unitIds = [];
        }
        // グループを変えたら、ユニットの選択はリセットする
        if (field === "groupId") {
          updated.unitIds = [];
        }

        return updated;
      })
    );
  }

  // ユニットのチェックを1つ切り替える
  function toggleUnit(talentId: string, unitId: string) {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== talentId) return t;
        const nowSelected = t.unitIds.includes(unitId);
        return {
          ...t,
          unitIds: nowSelected
            ? t.unitIds.filter((id) => id !== unitId)
            : [...t.unitIds, unitId],
        };
      })
    );
  }

  async function handleSave(talentId: string) {
    const talent = talents.find((t) => t.id === talentId);
    if (!talent) return;

    const response = await fetch(`/api/talents/${talentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: talent.name,
        officeId: talent.officeId,
        groupId: talent.groupId,
        unitIds: talent.unitIds,
        channelId: talent.channelId,
        twitterUrl: talent.twitterUrl,
        instagramUrl: talent.instagramUrl,
        tiktokUrl: talent.tiktokUrl,
        hashtag: talent.hashtag,
      }),
    });

    if (response.ok) {
      setMessages((prev) => ({ ...prev, [talentId]: "保存しました" }));
    } else {
      // 【変更点】サーバーから返ってきた詳しいエラー内容を画面に表示する
      const data = await response.json().catch(() => null);
      const detail = data?.detail ?? data?.error ?? "原因不明のエラー";
      setMessages((prev) => ({
        ...prev,
        [talentId]: `保存に失敗しました: ${detail}`,
      }));
    }
  }

  async function handleDelete(talentId: string, talentName: string) {
    const confirmed = window.confirm(
      `「${talentName}」を削除します。よろしいですか？`
    );
    if (!confirmed) return;

    const response = await fetch(`/api/talents/${talentId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setTalents((prev) => prev.filter((t) => t.id !== talentId));
    } else {
      setMessages((prev) => ({
        ...prev,
        [talentId]: "削除に失敗しました",
      }));
    }
  }

  // 【変更点】フィルターで絞り込まれていても、並び替えは常に「全タレント配列」の
  // 実際の位置に対して行う（表示上のindexではなく、talents本来のindexを使う）
  async function moveTalent(realIndex: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? realIndex - 1 : realIndex + 1;
    if (newIndex < 0 || newIndex >= talents.length) return;

    const newTalents = [...talents];
    [newTalents[realIndex], newTalents[newIndex]] = [
      newTalents[newIndex],
      newTalents[realIndex],
    ];
    setTalents(newTalents);

    await fetch("/api/talents/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedIds: newTalents.map((t) => t.id),
      }),
    });
  }

  return (
    <div className="space-y-4">
      {/* 絞り込みフィルター */}
      <div className="rounded-2xl bg-white border border-[#e4e4ec] p-4 shadow-sm flex flex-wrap gap-2">
        <select
          value={filterOfficeId}
          onChange={(e) => {
            setFilterOfficeId(e.target.value);
            setFilterGroupId(ALL);
            setFilterUnitId(ALL);
          }}
          className="rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] text-sm px-3 py-1.5 outline-none focus:border-[#0891b2]/60"
        >
          <option value={ALL}>事務所: すべて</option>
          {offices.map((office) => (
            <option key={office.id} value={office.id}>
              {office.name}
            </option>
          ))}
        </select>

        <select
          value={filterGroupId}
          onChange={(e) => {
            setFilterGroupId(e.target.value);
            setFilterUnitId(ALL);
          }}
          className="rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] text-sm px-3 py-1.5 outline-none focus:border-[#0891b2]/60"
        >
          <option value={ALL}>グループ: すべて</option>
          {groupsForFilter.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <select
          value={filterUnitId}
          onChange={(e) => setFilterUnitId(e.target.value)}
          className="rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] text-sm px-3 py-1.5 outline-none focus:border-[#0891b2]/60"
        >
          <option value={ALL}>ユニット: すべて</option>
          {unitsForFilter.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>

        <span className="ml-auto self-center text-xs text-[#70707f]">
          {visibleTalents.length} / {talents.length} 件表示中
        </span>
      </div>

      {visibleTalents.length === 0 && (
        <p className="text-[#70707f] text-sm px-1 py-6 text-center">
          条件に一致するタレントがいません
        </p>
      )}

      {visibleTalents.map((talent) => {
        // 表示は絞り込まれていても、上下移動は「全タレント配列」内の実際の位置で判定する
        const realIndex = talents.findIndex((t) => t.id === talent.id);

        const groupsInOffice = groups.filter(
          (g) => g.officeId === talent.officeId
        );
        const unitsInGroup = units.filter(
          (u) => u.groupId === talent.groupId
        );

        return (
          <div
            key={talent.id}
            className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => moveTalent(realIndex, "up")}
                  disabled={realIndex === 0}
                  className="w-7 h-7 rounded-md bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] disabled:opacity-30"
                  aria-label="上に移動"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveTalent(realIndex, "down")}
                  disabled={realIndex === talents.length - 1}
                  className="w-7 h-7 rounded-md bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] disabled:opacity-30"
                  aria-label="下に移動"
                >
                  ↓
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#70707f] mb-1">
                    タレント名
                  </label>
                  <input
                    type="text"
                    value={talent.name}
                    onChange={(e) =>
                      handleFieldChange(talent.id, "name", e.target.value)
                    }
                    className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#70707f] mb-1">
                    事務所
                  </label>
                  <select
                    value={talent.officeId}
                    onChange={(e) =>
                      handleFieldChange(talent.id, "officeId", e.target.value)
                    }
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
                    value={talent.groupId ?? UNAFFILIATED}
                    onChange={(e) =>
                      handleFieldChange(talent.id, "groupId", e.target.value)
                    }
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

                {/* 【変更点】ユニットはチェックボックスで複数選べるようにする */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#70707f] mb-2">
                    ユニット（任意・複数選択可）
                  </label>
                  {!talent.groupId ? (
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
                        const isSelected = talent.unitIds.includes(unit.id);
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
                              onChange={() => toggleUnit(talent.id, unit.id)}
                              className="hidden"
                            />
                            {unit.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#70707f] mb-1">
                    YouTubeチャンネルID
                  </label>
                  <input
                    type="text"
                    value={talent.channelId}
                    onChange={(e) =>
                      handleFieldChange(talent.id, "channelId", e.target.value)
                    }
                    className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60 font-mono text-sm"
                  />
                </div>

                {/* 個別ページ用プロフィールの開閉式編集欄 */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(talent.id)}
                    className="text-xs text-[#0891b2] font-semibold hover:underline"
                  >
                    {expandedIds.has(talent.id) ? "▲ " : "▼ "}
                    プロフィール編集（挨拶文・SNSリンク）
                  </button>

                  {expandedIds.has(talent.id) && (
                    <div className="mt-3 space-y-3 rounded-lg bg-[#f5f6fa] p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#70707f] mb-1">
                            X (Twitter) URL
                          </label>
                          <input
                            type="text"
                            value={talent.twitterUrl ?? ""}
                            onChange={(e) =>
                              handleFieldChange(talent.id, "twitterUrl", e.target.value)
                            }
                            placeholder="https://x.com/..."
                            className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#70707f] mb-1">
                            Instagram URL
                          </label>
                          <input
                            type="text"
                            value={talent.instagramUrl ?? ""}
                            onChange={(e) =>
                              handleFieldChange(talent.id, "instagramUrl", e.target.value)
                            }
                            placeholder="https://instagram.com/..."
                            className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#70707f] mb-1">
                            TikTok URL
                          </label>
                          <input
                            type="text"
                            value={talent.tiktokUrl ?? ""}
                            onChange={(e) =>
                              handleFieldChange(talent.id, "tiktokUrl", e.target.value)
                            }
                            placeholder="https://tiktok.com/@..."
                            className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#70707f] mb-1">
                            ハッシュタグ
                          </label>
                          <input
                            type="text"
                            value={talent.hashtag ?? ""}
                            onChange={(e) =>
                              handleFieldChange(talent.id, "hashtag", e.target.value)
                            }
                            placeholder="例: #すいちゃんの証"
                            className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pl-11">
              <button
                onClick={() => handleSave(talent.id)}
                className="rounded-lg bg-[#0891b2] text-white text-sm font-semibold px-4 py-1.5 hover:opacity-90"
              >
                保存
              </button>
              <button
                onClick={() => handleDelete(talent.id, talent.name)}
                className="rounded-lg bg-[#ec4899] text-white text-sm font-semibold px-4 py-1.5 hover:opacity-90"
              >
                削除
              </button>
              {messages[talent.id] && (
                <span className="text-xs text-[#70707f] ml-2">
                  {messages[talent.id]}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}