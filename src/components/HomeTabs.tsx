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
  unitIds: string[]; // 【変更点】単一のunitIdから、所属ユニットの配列に変更
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

  // グループタブで選択中のグループに属するユニット一覧
  const unitsInGroup = units.filter((u) => u.groupId === activeGroupId);

  // ---------------------------------------------
  // 表示するタレントの絞り込み
  // ---------------------------------------------
  const filteredTalents = talents.filter((talent) => {
    if (talent.officeId !== activeOfficeId) return false;

    if (activeGroupId === ALL) {
      // グループ「すべて」: この事務所のタレント全員
      // （グループに所属していないタレントもここに含まれる）
      return true;
    }
    // 特定のグループが選ばれている場合
    if (talent.groupId !== activeGroupId) return false;

    if (activeUnitId === ALL) return true;
    // 【重要】このタレントが「選択中のユニット」を含んでいるかどうかで判定する
    // → 複数のユニットに所属していても、タレント本体は1件しか無いので、
    //    同じ人が重複して表示されることはない
    return talent.unitIds.includes(activeUnitId);
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
      {/* 事務所タブ（手書きチョーク風フォント） */}
      <div className="flex gap-2 border-b border-white/15 mb-4">
        {offices.map((office) => (
          <button
            key={office.id}
            onClick={() => handleOfficeChange(office.id)}
            className={
              "font-handwriting px-4 py-2 text-base font-semibold border-b-2 -mb-px transition-colors " +
              (activeOfficeId === office.id
                ? "border-[#f2c744] text-[#f2c744]"
                : "border-transparent text-white/50 hover:text-white")
            }
          >
            {office.name}
          </button>
        ))}
      </div>

      {/* グループタブ（この事務所にグループが1件も無い場合は表示しない） */}
      {groupsInOffice.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handleGroupChange(ALL)}
            className={
              "font-handwriting px-3 py-1.5 rounded-full text-sm font-semibold transition-colors " +
              (activeGroupId === ALL
                ? "bg-[#0891b2] text-white"
                : "bg-white/10 border border-white/25 text-white/70 hover:border-[#0891b2]/60 hover:text-white")
            }
          >
            すべて
          </button>
          {groupsInOffice.map((group) => (
            <button
              key={group.id}
              onClick={() => handleGroupChange(group.id)}
              className={
                "font-handwriting px-3 py-1.5 rounded-full text-sm font-semibold transition-colors " +
                (activeGroupId === group.id
                  ? "bg-[#0891b2] text-white"
                  : "bg-white/10 border border-white/25 text-white/70 hover:border-[#0891b2]/60 hover:text-white")
              }
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* ユニットタブ（具体的なグループが選ばれていて、かつそのグループに
          ユニットが1件以上登録されている時だけ表示。グループタブと同じ考え方） */}
      {activeGroupId !== ALL && unitsInGroup.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveUnitId(ALL)}
            className={
              "font-handwriting px-3 py-1 rounded-full text-sm font-medium transition-colors " +
              (activeUnitId === ALL
                ? "bg-[#ec4899] text-white"
                : "bg-white/10 border border-white/25 text-white/70 hover:border-[#ec4899]/60 hover:text-white")
            }
          >
            すべて
          </button>
          {unitsInGroup.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setActiveUnitId(unit.id)}
              className={
                "font-handwriting px-3 py-1 rounded-full text-sm font-medium transition-colors " +
                (activeUnitId === unit.id
                  ? "bg-[#ec4899] text-white"
                  : "bg-white/10 border border-white/25 text-white/70 hover:border-[#ec4899]/60 hover:text-white")
              }
            >
              {unit.name}
            </button>
          ))}
        </div>
      )}

      {/* タレント一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTalents.map((item) => (
          <TalentCard key={item.talentId} talentId={item.talentId} channel={item.channelInfo} />
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <p className="text-white/50 text-sm">
          ここにはまだタレントが登録されていません。
        </p>
      )}
    </div>
  );
}