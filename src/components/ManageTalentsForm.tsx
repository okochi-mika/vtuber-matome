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
};

type ManageTalentsFormProps = {
  initialTalents: TalentItem[];
  offices: Office[];
  groups: Group[];
  units: Unit[];
};

const UNAFFILIATED = "";

export default function ManageTalentsForm({
  initialTalents,
  offices,
  groups,
  units,
}: ManageTalentsFormProps) {
  const [talents, setTalents] = useState<TalentItem[]>(initialTalents);
  const [messages, setMessages] = useState<Record<string, string>>({});

  function handleFieldChange(
    talentId: string,
    field: "name" | "officeId" | "groupId" | "channelId",
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
      }),
    });

    setMessages((prev) => ({
      ...prev,
      [talentId]: response.ok ? "保存しました" : "保存に失敗しました",
    }));
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

  async function moveTalent(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= talents.length) return;

    const newTalents = [...talents];
    [newTalents[index], newTalents[newIndex]] = [
      newTalents[newIndex],
      newTalents[index],
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
      {talents.map((talent, index) => {
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
                  onClick={() => moveTalent(index, "up")}
                  disabled={index === 0}
                  className="w-7 h-7 rounded-md bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] disabled:opacity-30"
                  aria-label="上に移動"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveTalent(index, "down")}
                  disabled={index === talents.length - 1}
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
