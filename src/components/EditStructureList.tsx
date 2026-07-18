"use client";

import { useState } from "react";

type Office = { id: string; name: string; officialChannelUrl: string | null };
type Group = { id: string; name: string; officeId: string; officialChannelUrl: string | null };
type Unit = { id: string; name: string; groupId: string; officialChannelUrl: string | null };

type EditStructureListProps = {
  initialOffices: Office[];
  initialGroups: Group[];
  initialUnits: Unit[];
};

export default function EditStructureList({
  initialOffices,
  initialGroups,
  initialUnits,
}: EditStructureListProps) {
  const [offices, setOffices] = useState<Office[]>(initialOffices);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [message, setMessage] = useState("");

  // ---------------------------------------------
  // 事務所の変更をその場で反映する（保存ボタンを押すまではローカルの変更）
  // ---------------------------------------------
  function handleOfficeNameChange(officeId: string, name: string) {
    setOffices((prev) =>
      prev.map((o) => (o.id === officeId ? { ...o, name } : o))
    );
  }

  function handleOfficeChannelUrlChange(officeId: string, url: string) {
    setOffices((prev) =>
      prev.map((o) =>
        o.id === officeId ? { ...o, officialChannelUrl: url || null } : o
      )
    );
  }

  // ---------------------------------------------
  // グループの変更をその場で反映する
  // ---------------------------------------------
  function handleGroupNameChange(groupId: string, name: string) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g))
    );
  }

  function handleGroupChannelUrlChange(groupId: string, url: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, officialChannelUrl: url || null } : g
      )
    );
  }

  function handleUnitNameChange(unitId: string, name: string) {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, name } : u))
    );
  }

  function handleUnitChannelUrlChange(unitId: string, url: string) {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId ? { ...u, officialChannelUrl: url || null } : u
      )
    );
  }

  // ---------------------------------------------
  // 事務所の保存・削除
  // ---------------------------------------------
  async function handleSaveOffice(office: Office) {
    const response = await fetch(`/api/offices/${office.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: office.name,
        officialChannelUrl: office.officialChannelUrl,
      }),
    });
    setMessage(response.ok ? "事務所を保存しました" : "保存に失敗しました");
  }

  async function handleDeleteOffice(office: Office) {
    const confirmed = window.confirm(`「${office.name}」を削除しますか？`);
    if (!confirmed) return;

    const response = await fetch(`/api/offices/${office.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setOffices((prev) => prev.filter((o) => o.id !== office.id));
      setMessage(`「${office.name}」を削除しました`);
    } else {
      const data = await response.json();
      setMessage(data.error ?? "削除に失敗しました");
    }
  }

  // ---------------------------------------------
  // グループの保存・削除
  // ---------------------------------------------
  async function handleSaveGroup(group: Group) {
    const response = await fetch(`/api/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: group.name,
        officeId: group.officeId,
        officialChannelUrl: group.officialChannelUrl,
      }),
    });
    setMessage(response.ok ? "グループを保存しました" : "保存に失敗しました");
  }

  async function handleDeleteGroup(group: Group) {
    const confirmed = window.confirm(`「${group.name}」を削除しますか？`);
    if (!confirmed) return;

    const response = await fetch(`/api/groups/${group.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      setMessage(`「${group.name}」を削除しました`);
    } else {
      const data = await response.json();
      setMessage(data.error ?? "削除に失敗しました");
    }
  }

  // ---------------------------------------------
  // ユニットの保存・削除
  // ---------------------------------------------
  async function handleSaveUnit(unit: Unit) {
    const response = await fetch(`/api/units/${unit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: unit.name,
        groupId: unit.groupId,
        officialChannelUrl: unit.officialChannelUrl,
      }),
    });
    setMessage(response.ok ? "ユニットを保存しました" : "保存に失敗しました");
  }

  async function handleDeleteUnit(unit: Unit) {
    const confirmed = window.confirm(`「${unit.name}」を削除しますか？`);
    if (!confirmed) return;

    const response = await fetch(`/api/units/${unit.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      setMessage(`「${unit.name}」を削除しました`);
    } else {
      const data = await response.json();
      setMessage(data.error ?? "削除に失敗しました");
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm space-y-6">
      <h2 className="text-[#14141c] font-semibold">グループ・ユニットの編集</h2>
      <p className="text-xs text-[#70707f] -mt-4">
        公式チャンネルURLはトップページのタブ付近に「公式チャンネルを見る」として表示されます
      </p>

      {offices.map((office) => {
        const groupsInOffice = groups.filter((g) => g.officeId === office.id);

        return (
          <div key={office.id} className="space-y-4">
            {/* 事務所の編集行 */}
            <div className="space-y-1.5">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={office.name}
                  onChange={(e) =>
                    handleOfficeNameChange(office.id, e.target.value)
                  }
                  className="flex-1 rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-1.5 text-sm font-medium outline-none focus:border-[#0891b2]/60"
                />
                <button
                  onClick={() => handleSaveOffice(office)}
                  className="rounded-lg bg-[#0891b2] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                >
                  保存
                </button>
                <button
                  onClick={() => handleDeleteOffice(office)}
                  className="rounded-lg bg-[#ec4899] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                >
                  削除
                </button>
              </div>
              <input
                type="text"
                value={office.officialChannelUrl ?? ""}
                onChange={(e) =>
                  handleOfficeChannelUrlChange(office.id, e.target.value)
                }
                placeholder="公式チャンネルURL（任意）"
                className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-1.5 text-xs outline-none focus:border-[#0891b2]/60"
              />
            </div>

            {groupsInOffice.length === 0 && (
              <p className="text-xs text-[#70707f] pl-4">グループ未登録</p>
            )}

            {groupsInOffice.map((group) => {
              const unitsInGroup = units.filter(
                (u) => u.groupId === group.id
              );

              return (
                <div
                  key={group.id}
                  className="rounded-xl bg-[#f5f6fa] p-4 space-y-3"
                >
                  {/* グループの編集行 */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) =>
                          handleGroupNameChange(group.id, e.target.value)
                        }
                        className="flex-1 rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-1.5 text-sm outline-none focus:border-[#0891b2]/60"
                      />
                      <button
                        onClick={() => handleSaveGroup(group)}
                        className="rounded-lg bg-[#0891b2] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="rounded-lg bg-[#ec4899] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                      >
                        削除
                      </button>
                    </div>
                    <input
                      type="text"
                      value={group.officialChannelUrl ?? ""}
                      onChange={(e) =>
                        handleGroupChannelUrlChange(group.id, e.target.value)
                      }
                      placeholder="公式チャンネルURL（任意）"
                      className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-1.5 text-xs outline-none focus:border-[#0891b2]/60"
                    />
                  </div>

                  {/* このグループに属するユニットの編集行 */}
                  <div className="pl-4 space-y-2">
                    {unitsInGroup.map((unit) => (
                      <div key={unit.id} className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <span className="text-[#70707f] text-xs">└</span>
                          <input
                            type="text"
                            value={unit.name}
                            onChange={(e) =>
                              handleUnitNameChange(unit.id, e.target.value)
                            }
                            className="flex-1 rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] px-3 py-1.5 text-sm outline-none focus:border-[#0891b2]/60"
                          />
                          <button
                            onClick={() => handleSaveUnit(unit)}
                            className="rounded-lg bg-[#0891b2] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(unit)}
                            className="rounded-lg bg-[#ec4899] text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90"
                          >
                            削除
                          </button>
                        </div>
                        <input
                          type="text"
                          value={unit.officialChannelUrl ?? ""}
                          onChange={(e) =>
                            handleUnitChannelUrlChange(unit.id, e.target.value)
                          }
                          placeholder="公式チャンネルURL（任意）"
                          className="w-full rounded-lg bg-white border border-[#e4e4ec] text-[#14141c] pl-7 pr-3 py-1.5 text-xs outline-none focus:border-[#0891b2]/60"
                        />
                      </div>
                    ))}
                    {unitsInGroup.length === 0 && (
                      <p className="text-xs text-[#70707f] pl-4">
                        ユニット未登録
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {message && <p className="text-sm text-[#0891b2]">{message}</p>}
    </div>
  );
}
