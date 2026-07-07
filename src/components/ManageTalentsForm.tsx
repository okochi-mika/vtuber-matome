"use client";

import { useState } from "react";

type Group = {
  id: string;
  name: string;
};

type TalentItem = {
  id: string;
  name: string;
  groupId: string;
  channelId: string;
};

type ManageTalentsFormProps = {
  initialTalents: TalentItem[];
  groups: Group[];
};

export default function ManageTalentsForm({
  initialTalents,
  groups,
}: ManageTalentsFormProps) {
  // タレント一覧をこのコンポーネントの中で管理する（編集・削除・並び替えの全ての起点）
  const [talents, setTalents] = useState<TalentItem[]>(initialTalents);
  const [messages, setMessages] = useState<Record<string, string>>({});

  // ---------------------------------------------
  // 入力欄が変更された時、その場でstateを書き換える
  // （まだサーバーには送らない。「保存」ボタンを押すまでは一時的な変更）
  // ---------------------------------------------
  function handleFieldChange(
    talentId: string,
    field: "name" | "groupId" | "channelId",
    value: string
  ) {
    setTalents((prev) =>
      prev.map((t) => (t.id === talentId ? { ...t, [field]: value } : t))
    );
  }

  // ---------------------------------------------
  // 「保存」ボタン: 編集内容をサーバーに送って更新する
  // ---------------------------------------------
  async function handleSave(talentId: string) {
    const talent = talents.find((t) => t.id === talentId);
    if (!talent) return;

    const response = await fetch(`/api/talents/${talentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: talent.name,
        groupId: talent.groupId,
        channelId: talent.channelId,
      }),
    });

    setMessages((prev) => ({
      ...prev,
      [talentId]: response.ok ? "保存しました" : "保存に失敗しました",
    }));
  }

  // ---------------------------------------------
  // 「削除」ボタン: 確認ダイアログを出してからサーバーに削除リクエストを送る
  // ---------------------------------------------
  async function handleDelete(talentId: string, talentName: string) {
    const confirmed = window.confirm(
      `「${talentName}」を削除します。よろしいですか？`
    );
    if (!confirmed) return;

    const response = await fetch(`/api/talents/${talentId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // 画面上の一覧からも取り除く
      setTalents((prev) => prev.filter((t) => t.id !== talentId));
    } else {
      setMessages((prev) => ({
        ...prev,
        [talentId]: "削除に失敗しました",
      }));
    }
  }

  // ---------------------------------------------
  // 並び替え: 配列の中身を入れ替えて、その新しい順番をサーバーに保存する
  // ---------------------------------------------
  async function moveTalent(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;

    // 範囲外への移動は何もしない（一番上でさらに上へ、一番下でさらに下へ、など）
    if (newIndex < 0 || newIndex >= talents.length) return;

    const newTalents = [...talents];
    // 配列の中で2つの要素の位置を入れ替える
    [newTalents[index], newTalents[newIndex]] = [
      newTalents[newIndex],
      newTalents[index],
    ];

    setTalents(newTalents);

    // 新しい並び順をサーバーに保存する
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
      {talents.map((talent, index) => (
        <div
          key={talent.id}
          className="rounded-2xl bg-white border border-[#e4e4ec] p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            {/* 並び替え用の上下矢印ボタン */}
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

            {/* 編集項目 */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
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
                  所属グループ
                </label>
                <select
                  value={talent.groupId}
                  onChange={(e) =>
                    handleFieldChange(talent.id, "groupId", e.target.value)
                  }
                  className="w-full rounded-lg bg-[#f5f6fa] border border-[#e4e4ec] text-[#14141c] px-3 py-2 outline-none focus:border-[#0891b2]/60"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
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

          {/* 保存・削除ボタンと結果メッセージ */}
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
      ))}
    </div>
  );
}
