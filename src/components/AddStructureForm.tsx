"use client";

import { useState } from "react";

type Office = { id: string; name: string; officialChannelUrl: string | null };
type Group = { id: string; name: string; officeId: string; officialChannelUrl: string | null };
type Unit = { id: string; name: string; groupId: string; officialChannelUrl: string | null };

type AddStructureFormProps = {
  initialOffices: Office[];
  initialGroups: Group[];
  initialUnits: Unit[];
};

export default function AddStructureForm({
  initialOffices,
  initialGroups,
  initialUnits,
}: AddStructureFormProps) {
  const [offices, setOffices] = useState<Office[]>(initialOffices);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [message, setMessage] = useState("");

  // 新規事務所
  const [newOfficeName, setNewOfficeName] = useState("");
  const [newOfficeChannelUrl, setNewOfficeChannelUrl] = useState("");

  // 新規グループ
  const [groupOfficeId, setGroupOfficeId] = useState(offices[0]?.id ?? "");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupChannelUrl, setNewGroupChannelUrl] = useState("");

  // 新規ユニット
  const groupOptionsForUnit = groups;
  const [unitGroupId, setUnitGroupId] = useState(groups[0]?.id ?? "");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitChannelUrl, setNewUnitChannelUrl] = useState("");

  async function handleCreateOffice() {
    if (!newOfficeName) {
      setMessage("事務所名を入力してください");
      return;
    }
    const response = await fetch("/api/offices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newOfficeName,
        officialChannelUrl: newOfficeChannelUrl || null,
      }),
    });
    if (response.ok) {
      const newOffice = await response.json();
      setOffices((prev) => [...prev, newOffice]);
      setNewOfficeName("");
      setNewOfficeChannelUrl("");
      setMessage(`事務所「${newOffice.name}」を追加しました`);
    } else {
      setMessage("事務所の追加に失敗しました");
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName || !groupOfficeId) {
      setMessage("グループ名と事務所を指定してください");
      return;
    }
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGroupName,
        officeId: groupOfficeId,
        officialChannelUrl: newGroupChannelUrl || null,
      }),
    });
    if (response.ok) {
      const newGroup = await response.json();
      setGroups((prev) => [...prev, newGroup]);
      setNewGroupName("");
      setNewGroupChannelUrl("");
      setMessage(`グループ「${newGroup.name}」を追加しました`);
    } else {
      setMessage("グループの追加に失敗しました");
    }
  }

  async function handleCreateUnit() {
    if (!newUnitName || !unitGroupId) {
      setMessage("ユニット名とグループを指定してください");
      return;
    }
    const response = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newUnitName,
        groupId: unitGroupId,
        officialChannelUrl: newUnitChannelUrl || null,
      }),
    });
    if (response.ok) {
      const newUnit = await response.json();
      setUnits((prev) => [...prev, newUnit]);
      setNewUnitName("");
      setNewUnitChannelUrl("");
      setMessage(`ユニット「${newUnit.name}」を追加しました`);
    } else {
      setMessage("ユニットの追加に失敗しました");
    }
  }

  function officeName(officeId: string) {
    return offices.find((o) => o.id === officeId)?.name ?? "?";
  }

  return (
    <div className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm space-y-6">
      <h2 className="text-[#14141c] font-semibold">
        事務所・グループ・ユニットの追加
      </h2>
      <p className="text-xs text-[#70707f] -mt-4">
        既存の項目の編集・削除は下の「グループ・ユニットの編集」から行えます。
        公式チャンネルURL（任意）は、タレントではなく組織全体のチャンネル（例:
        hololive公式チャンネル）を登録する欄です。
      </p>

      {/* 事務所を追加 */}
      <div className="border-t border-[#e4e4ec] pt-4 space-y-2">
        <label className="block text-xs text-[#70707f] mb-1">
          新しい事務所
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newOfficeName}
            onChange={(e) => setNewOfficeName(e.target.value)}
            placeholder="本体: ホロライブプロダクション"
            className="flex-1 rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          />
          <button
            onClick={handleCreateOffice}
            className="rounded-lg bg-[#0891b2] text-white text-sm font-semibold px-4 py-2 hover:opacity-90"
          >
            追加
          </button>
        </div>
        <input
          type="text"
          value={newOfficeChannelUrl}
          onChange={(e) => setNewOfficeChannelUrl(e.target.value)}
          placeholder="公式チャンネルURL（任意）"
          className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 text-sm outline-none focus:border-[#0891b2]/60"
        />
      </div>

      {/* グループを追加 */}
      <div className="border-t border-[#e4e4ec] pt-4 space-y-2">
        <label className="block text-xs text-[#70707f] mb-1">
          新しいグループ
        </label>
        <div className="flex gap-2">
          <select
            value={groupOfficeId}
            onChange={(e) => setGroupOfficeId(e.target.value)}
            className="rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          >
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="本体: ホロライブ"
            className="flex-1 rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          />
          <button
            onClick={handleCreateGroup}
            className="rounded-lg bg-[#ec4899] text-white text-sm font-semibold px-4 py-2 hover:opacity-90"
          >
            追加
          </button>
        </div>
        <input
          type="text"
          value={newGroupChannelUrl}
          onChange={(e) => setNewGroupChannelUrl(e.target.value)}
          placeholder="公式チャンネルURL（任意）"
          className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 text-sm outline-none focus:border-[#0891b2]/60"
        />
      </div>

      {/* ユニットを追加 */}
      <div className="border-t border-[#e4e4ec] pt-4 space-y-2">
        <label className="block text-xs text-[#70707f] mb-1">
          新しいユニット
        </label>
        <div className="flex gap-2">
          <select
            value={unitGroupId}
            onChange={(e) => setUnitGroupId(e.target.value)}
            className="rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          >
            {groupOptionsForUnit.map((group) => (
              <option key={group.id} value={group.id}>
                {officeName(group.officeId)} / {group.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="本体: 0期生"
            className="flex-1 rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
          />
          <button
            onClick={handleCreateUnit}
            className="rounded-lg bg-[#0891b2] text-white text-sm font-semibold px-4 py-2 hover:opacity-90"
          >
            追加
          </button>
        </div>
        <input
          type="text"
          value={newUnitChannelUrl}
          onChange={(e) => setNewUnitChannelUrl(e.target.value)}
          placeholder="公式チャンネルURL（任意）"
          className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 text-sm outline-none focus:border-[#0891b2]/60"
        />
      </div>

      {message && <p className="text-sm text-[#0891b2]">{message}</p>}
    </div>
  );
}
