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
  unitIds: string[];
};

type ReorderTalentsListProps = {
  initialTalents: TalentItem[];
  offices: Office[];
  groups: Group[];
  units: Unit[];
};

const ALL = "__all__";

export default function ReorderTalentsList({
  initialTalents,
  offices,
  groups,
  units,
}: ReorderTalentsListProps) {
  // 【重要】talents は常に「全タレントの並び順」を保持する配列。
  // フィルターは「どれを画面に見せるか」だけを絞り込み、
  // 実際の並び替えはこの配列そのものに対して行う
  const [talents, setTalents] = useState<TalentItem[]>(initialTalents);

  const [filterOfficeId, setFilterOfficeId] = useState(ALL);
  const [filterGroupId, setFilterGroupId] = useState(ALL);
  const [filterUnitId, setFilterUnitId] = useState(ALL);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // ---------------------------------------------
  // 絞り込み用のヘルパー
  // ---------------------------------------------
  const groupsForFilter = groups.filter(
    (g) => filterOfficeId === ALL || g.officeId === filterOfficeId
  );

  const unitsForFilter = units.filter(
    (u) => filterGroupId === ALL || u.groupId === filterGroupId
  );

  function officeName(officeId: string) {
    return offices.find((o) => o.id === officeId)?.name ?? "?";
  }
  function groupName(groupId: string | null) {
    if (!groupId) return "未所属";
    return groups.find((g) => g.id === groupId)?.name ?? "?";
  }
  function unitNames(unitIds: string[]) {
    const names = unitIds
      .map((id) => units.find((u) => u.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return names.length > 0 ? names.join("・") : null;
  }

  // 実際に画面に表示する（絞り込み後の）一覧
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

  // ---------------------------------------------
  // ドラッグ&ドロップの処理
  // 表示は絞り込まれていても、並び替えは「全タレント配列」の中の
  // 位置を直接動かすことで、他のタレントとの相対位置もきちんと保たれる
  // ---------------------------------------------
  function handleDragStart(talentId: string) {
    setDraggedId(talentId);
  }

  function handleDragOver(e: React.DragEvent) {
    // これを呼ばないと onDrop が発火しないブラウザの仕様
    e.preventDefault();
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const newTalents = [...talents];
    const fromIndex = newTalents.findIndex((t) => t.id === draggedId);
    const toIndex = newTalents.findIndex((t) => t.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    // ドラッグしていた要素を取り除いてから、ドロップ先の位置に挿入し直す
    const [movedItem] = newTalents.splice(fromIndex, 1);
    newTalents.splice(toIndex, 0, movedItem);

    setTalents(newTalents);
    setDraggedId(null);

    // 新しい並び順をサーバーに保存する
    const response = await fetch("/api/talents/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedIds: newTalents.map((t) => t.id),
      }),
    });

    setMessage(response.ok ? "並び順を保存しました" : "保存に失敗しました");
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
      </div>

      {/* 並び替えリスト本体 */}
      <div className="rounded-2xl bg-white border border-[#e4e4ec] shadow-sm divide-y divide-[#e4e4ec]">
        {visibleTalents.map((talent) => (
          <div
            key={talent.id}
            draggable
            onDragStart={() => handleDragStart(talent.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(talent.id)}
            className={
              "flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing transition-colors " +
              (draggedId === talent.id ? "opacity-40" : "hover:bg-[#f5f6fa]")
            }
          >
            {/* ドラッグハンドルのアイコン（見た目だけの飾り） */}
            <span className="text-[#70707f] select-none">⠿⠿</span>

            <div className="flex-1 min-w-0">
              <p className="text-[#14141c] text-sm font-medium truncate">
                {talent.name}
              </p>
              <p className="text-[#70707f] text-xs truncate">
                {officeName(talent.officeId)} / {groupName(talent.groupId)}
                {unitNames(talent.unitIds) && ` / ${unitNames(talent.unitIds)}`}
              </p>
            </div>
          </div>
        ))}

        {visibleTalents.length === 0 && (
          <p className="text-[#70707f] text-sm px-4 py-6 text-center">
            条件に一致するタレントがいません
          </p>
        )}
      </div>

      {message && <p className="text-sm text-[#0891b2]">{message}</p>}

      <p className="text-xs text-[#70707f]">
        ※ 行をつかんで、上下にドラッグすると順番を入れ替えられます
      </p>
    </div>
  );
}
