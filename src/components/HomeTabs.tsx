"use client";

import { useState } from "react";
import TalentCard from "@/components/TalentCard";
import type { ChannelInfo } from "@/lib/youtube";

type Office = { id: string; name: string };
type Group = { id: string; name: string; officeId: string };
type Unit = { id: string; name: string; groupId: string };

type TalentDisplayItem = {
  talentId: string;
  unitId: string;
  channelInfo: ChannelInfo;
};

type HomeTabsProps = {
  offices: Office[];
  groups: Group[];
  units: Unit[];
  talents: TalentDisplayItem[];
};

const ALL = "__all__";

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
  const groupIdsInOffice = new Set(groupsInOffice.map((g) => g.id));

  // グループタブで「すべて」が選ばれている時は、事務所内の全グループのユニットを対象にする
  const unitsToShow =
    activeGroupId === ALL
      ? units.filter((u) => groupIdsInOffice.has(u.groupId))
      : units.filter((u) => u.groupId === activeGroupId);

  const unitIdsToShow = new Set(unitsToShow.map((u) => u.id));

  const filteredTalents = talents.filter((talent) => {
    if (activeUnitId !== ALL) return talent.unitId === activeUnitId;
    return unitIdsToShow.has(talent.unitId);
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
      </div>

      {/* ユニットタブ */}
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
        {unitsToShow.map((unit) => (
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
      </div>

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
