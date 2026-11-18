"use client";

import type { Member, Party } from "@/lib/types";
import { Field } from "./ui";

export function MemberEditor({
  party,
  onChange,
}: {
  party: Party;
  onChange: (party: Party) => void;
}) {
  function update(id: string, patch: Partial<Member>) {
    onChange({
      ...party,
      members: party.members.map((member) => (member.id === id ? { ...member, ...patch } : member)),
    });
  }

  function add() {
    const id = crypto.randomUUID();
    onChange({
      ...party,
      organizerId: party.organizerId || id,
      members: [
        ...party.members,
        {
          id,
          name: "",
          roleId:
            party.rules.roles.find((role) => role.weight === 1)?.id ?? party.rules.roles[0].id,
          arrival: party.start,
          departure: party.end,
          drinks: true,
          fixed: null,
          payment: null,
        },
      ],
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>
          02 <span>参加者</span>
          <span className="count">{party.members.length}名</span>
        </h2>
        <button
          className="button secondary"
          type="button"
          onClick={add}
          disabled={party.members.length >= 100}
        >
          ＋ 参加者を追加
        </button>
      </div>
      <p className="muted">
        参加時刻は会の開始〜終了の範囲で入力してください。固定額は傾斜・端数処理より優先します。
      </p>
      <div className="members-list">
        {party.members.map((member, index) => (
          <div className="member-editor" key={member.id}>
            <div className="member-heading">
              <span className="avatar">{index + 1}</span>
              <strong>{member.name || "新しい参加者"}</strong>
              {member.payment && <span className="badge done">集金記録あり</span>}
              <button
                type="button"
                className="text-button danger"
                onClick={() => {
                  if (member.payment && !window.confirm("この参加者の集金記録も削除しますか？"))
                    return;
                  const members = party.members.filter((value) => value.id !== member.id);
                  onChange({
                    ...party,
                    members,
                    organizerId:
                      party.organizerId === member.id ? (members[0]?.id ?? "") : party.organizerId,
                  });
                }}
              >
                削除
              </button>
            </div>
            <div className="member-fields">
              <Field label="名前">
                <input
                  required
                  maxLength={60}
                  value={member.name}
                  onChange={(event) => update(member.id, { name: event.target.value })}
                />
              </Field>
              <Field label="役職区分">
                <select
                  value={member.roleId}
                  onChange={(event) => update(member.id, { roleId: event.target.value })}
                >
                  {party.rules.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ×{role.weight}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="到着時刻">
                <input
                  required
                  type="time"
                  min={party.start}
                  max={party.end}
                  value={member.arrival}
                  onChange={(event) => update(member.id, { arrival: event.target.value })}
                />
              </Field>
              <Field label="退出時刻">
                <input
                  required
                  type="time"
                  min={member.arrival || party.start}
                  max={party.end}
                  value={member.departure}
                  onChange={(event) => update(member.id, { departure: event.target.value })}
                />
              </Field>
              <Field label="固定額（任意・円）">
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="1"
                  placeholder="傾斜で計算"
                  value={member.fixed ?? ""}
                  onChange={(event) =>
                    update(member.id, {
                      fixed: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </Field>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!member.drinks}
                  onChange={(event) => update(member.id, { drinks: !event.target.checked })}
                />
                お酒を飲まない
              </label>
            </div>
          </div>
        ))}
      </div>
      {!party.members.length && <p className="empty">参加者を追加すると割り勘を計算できます。</p>}
    </section>
  );
}
