"use client";

import { useState } from "react";
import TalentCard from "@/components/TalentCard";
import type { ChannelInfo } from "@/lib/youtube";

type Office = { id: string; name: string };
type Group = { id: string; name: string; officeId: string };
type Unit = { id: string; name: string; groupId: string };

type TalentDisplayItem = {
  talentId: string;
  officeId: string;
  groupId: string | null;
  unitId: string | null;
  channelInfo: ChannelInfo;
};

type HomeTabsProps = {
  offices: Office[];
  groups: Group[];
  units: Unit[];
  talents: TalentDisplayItem[];
};

// タブの選択状態を表す特別な値
const ALL = "__all__"; // 「すべて」タブ
const UNAFFILIATED = "__unaffiliated__"; // 「未所属」タブ

export default function HomeTabs({
  offices,
  groups,
  units,
  talents,
}: HomeTabsProps) {
  const [activeOfficeId, setActiveOfficeId] = useState(offices[0]?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(ALL);
  const [activeUnitId, setActiveUnitId] = useState(ALL);

  const groupsInOffice = groups.filter((g) => g.officeId === activeOfficeId);

  // この事務所に「グループ未所属」のタレントが1人でもいるかどうか
  const hasUnaffiliatedInOffice = talents.some(
    (t) => t.officeId === activeOfficeId && !t.groupId
  );

  // グループタブで選択中のグループに属するユニット一覧
  const unitsInGroup = units.filter((u) => u.groupId === activeGroupId);

  // 選択中のグループに「ユニット未所属」のタレントが1人でもいるかどうか
  const hasUnaffiliatedInGroup = talents.some(
    (t) => t.groupId === activeGroupId && !t.unitId
  );

  // ---------------------------------------------
  // 表示するタレントの絞り込み
  // ---------------------------------------------
  const filteredTalents = talents.filter((talent) => {
    if (talent.officeId !== activeOfficeId) return false;

    if (activeGroupId === ALL) {
      // グループ「すべて」: この事務所のタレント全員（グループ有無問わず）
      return true;
    }
    if (activeGroupId === UNAFFILIATED) {
      // グループ「未所属」: グループを持たないタレントだけ
      return !talent.groupId;
    }
    // 特定のグループが選ばれている場合
    if (talent.groupId !== activeGroupId) return false;

    if (activeUnitId === ALL) return true;
    if (activeUnitId === UNAFFILIATED) return !talent.unitId;
    return talent.unitId === activeUnitId;
  });

  function handleOfficeChange(officeId: string) {
    setActiveOfficeId(officeId);
    setActiveGroupId(ALL);
    setActiveUnitId(ALL);
  }

  function handleGroupChange(groupId: string) {
    setActiveGroupId(groupId);
    setActiveUnitId(ALL);
  }

  return (
    <div>
      {/* 事務所タブ */}
      <div className="flex gap-2 border-b border-[#e4e4ec] mb-4">
        {offices.map((office) => (
          <button
            key={office.id}
            onClick={() => handleOfficeChange(office.id)}
            className={
              "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors " +
              (activeOfficeId === office.id
                ? "border-[#0891b2] text-[#0891b2]"
                : "border-transparent text-[#70707f] hover:text-[#14141c]")
            }
          >
            {office.name}
          </button>
        ))}
      </div>

      {/* グループタブ */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => handleGroupChange(ALL)}
          className={
            "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors " +
            (activeGroupId === ALL
              ? "bg-[#0891b2] text-white"
              : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
          }
        >
          すべて
        </button>
        {groupsInOffice.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupChange(group.id)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors " +
              (activeGroupId === group.id
                ? "bg-[#0891b2] text-white"
                : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
            }
          >
            {group.name}
          </button>
        ))}
        {hasUnaffiliatedInOffice && (
          <button
            onClick={() => handleGroupChange(UNAFFILIATED)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors " +
              (activeGroupId === UNAFFILIATED
                ? "bg-[#0891b2] text-white"
                : "bg-white border border-dashed border-[#e4e4ec] text-[#70707f] hover:border-[#0891b2]/50")
            }
          >
            未所属
          </button>
        )}
      </div>

      {/* ユニットタブ（具体的なグループが選ばれている時だけ表示） */}
      {activeGroupId !== ALL && activeGroupId !== UNAFFILIATED && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveUnitId(ALL)}
            className={
              "px-3 py-1 rounded-full text-xs font-medium transition-colors " +
              (activeUnitId === ALL
                ? "bg-[#ec4899] text-white"
                : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#ec4899]/50")
            }
          >
            すべて
          </button>
          {unitsInGroup.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setActiveUnitId(unit.id)}
              className={
                "px-3 py-1 rounded-full text-xs font-medium transition-colors " +
                (activeUnitId === unit.id
                  ? "bg-[#ec4899] text-white"
                  : "bg-white border border-[#e4e4ec] text-[#70707f] hover:border-[#ec4899]/50")
              }
            >
              {unit.name}
            </button>
          ))}
          {hasUnaffiliatedInGroup && (
            <button
              onClick={() => setActiveUnitId(UNAFFILIATED)}
              className={
                "px-3 py-1 rounded-full text-xs font-medium transition-colors " +
                (activeUnitId === UNAFFILIATED
                  ? "bg-[#ec4899] text-white"
                  : "bg-white border border-dashed border-[#e4e4ec] text-[#70707f] hover:border-[#ec4899]/50")
              }
            >
              未所属
            </button>
          )}
        </div>
      )}

      {/* タレント一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredTalents.map((item) => (
          <TalentCard key={item.talentId} channel={item.channelInfo} />
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <p className="text-[#70707f] text-sm">
          ここにはまだタレントが登録されていません。
        </p>
      )}
    </div>
  );
}
