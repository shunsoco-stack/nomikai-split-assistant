"use client";

import { useState } from "react";
import { validParty } from "@/lib/validation";
import type { Party } from "@/lib/types";
import { useStore } from "./store";
import { Field } from "./ui";
import { MemberEditor } from "./member-editor";
import { RulesEditor } from "./rules-editor";

export function EventEditor({ party }: { party: Party }) {
  const { saveParty, notify } = useStore();
  const [draft, setDraft] = useState(() => structuredClone(party));
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(party);

  function update(patch: Partial<Party>) {
    setDraft({ ...draft, ...patch });
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!validParty(draft)) {
      setError(
        "名前・区分・金額・時刻を確認してください。到着と退出は会の時間内、退出は到着以降に設定します。記号 < > は使用できません。",
      );
      return;
    }
    saveParty(draft);
    setError("");
    notify("会の設定と参加者を保存しました。計算結果に反映しています。");
  }

  return (
    <form onSubmit={save}>
      <section className="panel">
        <h2>
          01 <span>会の基本情報</span>
        </h2>
        <div className="form-grid">
          <Field label="会の名前">
            <input
              required
              maxLength={100}
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>
          <Field label="開催日">
            <input
              required
              type="date"
              value={draft.date}
              onChange={(event) => update({ date: event.target.value })}
            />
          </Field>
          <Field label="会場（任意）">
            <input
              maxLength={100}
              placeholder="例：旬菜酒場 まどい"
              value={draft.venue}
              onChange={(event) => update({ venue: event.target.value })}
            />
          </Field>
          <Field label="お店の会計（円）">
            <input
              required
              type="number"
              min="0"
              max="100000000"
              step="1"
              value={draft.total}
              onChange={(event) => update({ total: Number(event.target.value) })}
            />
          </Field>
          <Field label="開始時刻">
            <input
              required
              type="time"
              value={draft.start}
              onChange={(event) =>
                update({
                  start: event.target.value,
                  members: draft.members.map((member) => ({
                    ...member,
                    arrival: member.arrival === draft.start ? event.target.value : member.arrival,
                  })),
                })
              }
            />
          </Field>
          <Field label="終了時刻（同日）">
            <input
              required
              type="time"
              min={draft.start}
              value={draft.end}
              onChange={(event) =>
                update({
                  end: event.target.value,
                  members: draft.members.map((member) => ({
                    ...member,
                    departure:
                      member.departure === draft.end ? event.target.value : member.departure,
                  })),
                })
              }
            />
          </Field>
          <Field label="幹事">
            <select
              value={draft.organizerId}
              onChange={(event) => update({ organizerId: event.target.value })}
            >
              {!draft.members.length && <option value="">参加者を追加してください</option>}
              {draft.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || "名前未入力"}
                </option>
              ))}
            </select>
          </Field>
          <div className="check-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.course}
                onChange={(event) => update({ course: event.target.checked })}
              />
              コースあり
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.openBar}
                onChange={(event) => update({ openBar: event.target.checked })}
              />
              飲み放題あり
            </label>
          </div>
          <Field label="幹事メモ">
            <textarea
              maxLength={500}
              rows={2}
              value={draft.note}
              onChange={(event) => update({ note: event.target.value })}
            />
          </Field>
        </div>
      </section>
      <MemberEditor party={draft} onChange={setDraft} />
      <section className="panel">
        <h2>
          03 <span>この会の割り勘ルール</span>
        </h2>
        <RulesEditor
          rules={draft.rules}
          usedRoleIds={draft.members.map((member) => member.roleId)}
          onChange={(rules) => update({ rules })}
        />
      </section>
      <div className="save-bar">
        <div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <span>
            {dirty
              ? "未保存の変更があります。画面を移動する前に保存してください。"
              : "保存した設定で計算します。"}
          </span>
          {party.members.some((member) => member.payment) && (
            <small>集金済みの額は保持し、変更後の差額を集金画面に表示します。</small>
          )}
        </div>
        <button className="button primary" type="submit">
          設定を保存する
        </button>
      </div>
    </form>
  );
}
