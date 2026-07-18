"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TalentCard from "@/components/TalentCard";
import type { ChannelInfo } from "@/lib/youtube";

type Office = { id: string; name: string; officialChannelUrl: string | null };
type Group = { id: string; name: string; officeId: string; officialChannelUrl: string | null };
type Unit = { id: string; name: string; groupId: string; officialChannelUrl: string | null };

type TalentDisplayItem = {
  talentId: string;
  name: string; // 検索用のDB登録名
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

// ---------------------------------------------
// 公式チャンネルへのリンク（任意）
// タレントではなく組織そのもののチャンネルなので、カード一覧には混ぜず
// タブの近くに控えめなリンクとして表示する
// ---------------------------------------------
function OfficialChannelLink({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-[#22d3ee] underline decoration-dotted"
    >
      公式チャンネルを見る ↗
    </a>
  );
}

export default function HomeTabs({
  offices,
  groups,
  units,
  talents,
}: HomeTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 【変更点】初期値をURLのクエリパラメータから復元する
  // → ブラウザをリロードしても、直前に開いていたタブ・検索状態のまま戻ってこられるようにする
  const [activeOfficeId, setActiveOfficeId] = useState(
    () => searchParams.get("office") || offices[0]?.id || ""
  );
  const [activeGroupId, setActiveGroupId] = useState(
    () => searchParams.get("group") || ALL
  );
  const [activeUnitId, setActiveUnitId] = useState(
    () => searchParams.get("unit") || ALL
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || ""
  );

  // 現在の表示状態をURLに書き込む（ブラウザ履歴は増やさずreplaceする）
  function updateUrl(next: {
    office?: string;
    group?: string;
    unit?: string;
    q?: string;
  }) {
    const office = next.office ?? activeOfficeId;
    const group = next.group ?? activeGroupId;
    const unit = next.unit ?? activeUnitId;
    const q = next.q ?? searchQuery;

    const params = new URLSearchParams();
    if (office) params.set("office", office);
    if (group !== ALL) params.set("group", group);
    if (unit !== ALL) params.set("unit", unit);
    if (q) params.set("q", q);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  const groupsInOffice = groups.filter((g) => g.officeId === activeOfficeId);

  // グループタブで選択中のグループに属するユニット一覧
  const unitsInGroup = units.filter((u) => u.groupId === activeGroupId);

  const activeOffice = offices.find((o) => o.id === activeOfficeId);
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeUnit = units.find((u) => u.id === activeUnitId);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery !== "";

  // ---------------------------------------------
  // 表示するタレントの絞り込み
  // ---------------------------------------------
  const filteredTalents = isSearching
    ? // 検索中: 事務所/グループ/ユニットのタブは無視して、全タレントから名前で横断検索する
      talents.filter((talent) => {
        const nameMatch = talent.name.toLowerCase().includes(trimmedQuery);
        const titleMatch = talent.channelInfo.title
          .toLowerCase()
          .includes(trimmedQuery);
        return nameMatch || titleMatch;
      })
    : talents.filter((talent) => {
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
    updateUrl({ office: officeId, group: ALL, unit: ALL });
  }

  function handleGroupChange(groupId: string) {
    setActiveGroupId(groupId);
    setActiveUnitId(ALL);
    updateUrl({ group: groupId, unit: ALL });
  }

  function handleUnitChange(unitId: string) {
    setActiveUnitId(unitId);
    updateUrl({ unit: unitId });
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    updateUrl({ q: value });
  }

  return (
    <div>
      {/* 検索ボックス（事務所/グループ/ユニットを跨いで検索できる） */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="タレント名で検索（事務所を問わず検索します）"
            className="w-full rounded-lg bg-white/10 border border-white/25 text-white placeholder:text-white/40 text-sm pl-9 pr-9 py-2.5 outline-none focus:border-[#22d3ee]/60"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              aria-label="検索をクリア"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <p className="text-white/60 text-sm mb-4">
          「{searchQuery}」の検索結果: {filteredTalents.length}件
        </p>
      ) : (
        <>
          {/* 事務所タブ（手書きチョーク風フォント）
              【変更点】事務所数が増えても、ボタンの文字が縮んで2行に割れないように
              flex-wrap + whitespace-nowrap にして「タブ単位」で次の行へ折り返すようにする */}
          <div className="flex items-start justify-between gap-3 border-b border-white/15 mb-4 flex-wrap pr-10 sm:pr-24 lg:pr-32">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {offices.map((office) => (
                <button
                  key={office.id}
                  onClick={() => handleOfficeChange(office.id)}
                  className={
                    "font-handwriting whitespace-nowrap px-4 py-2 text-base font-semibold border-b-2 transition-colors " +
                    (activeOfficeId === office.id
                      ? "border-[#f2c744] text-[#f2c744]"
                      : "border-transparent text-white/50 hover:text-white")
                  }
                >
                  {office.name}
                </button>
              ))}
            </div>
            <div className="pb-2">
              <OfficialChannelLink url={activeOffice?.officialChannelUrl ?? null} />
            </div>
          </div>

          {/* グループタブ（この事務所にグループが1件も無い場合は表示しない） */}
          {groupsInOffice.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex flex-wrap gap-2">
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
              {activeGroupId !== ALL && (
                <OfficialChannelLink url={activeGroup?.officialChannelUrl ?? null} />
              )}
            </div>
          )}

          {/* ユニットタブ（具体的なグループが選ばれていて、かつそのグループに
              ユニットが1件以上登録されている時だけ表示。グループタブと同じ考え方） */}
          {activeGroupId !== ALL && unitsInGroup.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUnitChange(ALL)}
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
                    onClick={() => handleUnitChange(unit.id)}
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
              {activeUnitId !== ALL && (
                <OfficialChannelLink url={activeUnit?.officialChannelUrl ?? null} />
              )}
            </div>
          )}
        </>
      )}

      {/* タレント一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTalents.map((item) => (
          <TalentCard key={item.talentId} talentId={item.talentId} channel={item.channelInfo} />
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <p className="text-white/50 text-sm">
          {isSearching
            ? "該当するタレントが見つかりませんでした。"
            : "ここにはまだタレントが登録されていません。"}
        </p>
      )}
    </div>
  );
}
