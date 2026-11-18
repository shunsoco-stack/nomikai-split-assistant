"use client";

import type { Rules } from "@/lib/types";
import { Field } from "./ui";

export function RulesEditor({
  rules,
  onChange,
  usedRoleIds = [],
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  usedRoleIds?: string[];
}) {
  return (
    <div className="rules-editor">
      <h3>役職ごとの重み</h3>
      <p className="muted">一般を1.0として設定。0は本人の負担なしです。小数点以下2桁まで。</p>
      <div className="role-list">
        {rules.roles.map((role, index) => (
          <div className="role-row" key={role.id}>
            <Field label="区分名">
              <input
                required
                maxLength={30}
                value={role.name}
                onChange={(event) =>
                  onChange({
                    ...rules,
                    roles: rules.roles.map((value, position) =>
                      position === index ? { ...value, name: event.target.value } : value,
                    ),
                  })
                }
              />
            </Field>
            <Field label="重み">
              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={role.weight}
                onChange={(event) =>
                  onChange({
                    ...rules,
                    roles: rules.roles.map((value, position) =>
                      position === index ? { ...value, weight: Number(event.target.value) } : value,
                    ),
                  })
                }
              />
            </Field>
            <button
              type="button"
              className="icon-button"
              disabled={rules.roles.length <= 1 || usedRoleIds.includes(role.id)}
              aria-label={`${role.name}を削除`}
              title={usedRoleIds.includes(role.id) ? "参加者が使用中の区分です" : "区分を削除"}
              onClick={() =>
                onChange({ ...rules, roles: rules.roles.filter((value) => value.id !== role.id) })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="text-button"
        disabled={rules.roles.length >= 20}
        onClick={() =>
          onChange({
            ...rules,
            roles: [...rules.roles, { id: crypto.randomUUID(), name: "新しい区分", weight: 1 }],
          })
        }
      >
        ＋ 区分を追加
      </button>
      <hr />
      <div className="form-grid">
        <Field label="飲まない人の係数">
          <input
            required
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={rules.nonDrinker}
            onChange={(event) => onChange({ ...rules, nonDrinker: Number(event.target.value) })}
          />
        </Field>
        <Field label="滞在割合の下限" hint="0.5なら、滞在が短くても50%で計算">
          <input
            required
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={rules.minimumStay}
            onChange={(event) => onChange({ ...rules, minimumStay: Number(event.target.value) })}
          />
        </Field>
        <Field label="端数の単位">
          <select
            value={rules.unit}
            onChange={(event) =>
              onChange({ ...rules, unit: Number(event.target.value) as Rules["unit"] })
            }
          >
            <option value={100}>100円</option>
            <option value={500}>500円</option>
            <option value={1000}>1,000円</option>
          </select>
        </Field>
        <Field label="端数処理">
          <select
            value={rules.rounding}
            onChange={(event) =>
              onChange({ ...rules, rounding: event.target.value as Rules["rounding"] })
            }
          >
            <option value="ceil">切り上げ（余りを記録）</option>
            <option value="floor">切り捨て（不足を負担）</option>
            <option value="nearest">四捨五入（余り・不足を記録）</option>
          </select>
        </Field>
        {rules.rounding === "floor" && (
          <Field
            label="不足分を負担する人"
            hint="固定額・重み0の人は除外。同順位は参加者の上から。"
          >
            <select
              value={rules.shortage}
              onChange={(event) =>
                onChange({ ...rules, shortage: event.target.value as Rules["shortage"] })
              }
            >
              <option value="organizer">幹事</option>
              <option value="highest">最上位の役職者</option>
              <option value="equal">対象者で均等に負担</option>
            </select>
          </Field>
        )}
      </div>
    </div>
  );
}
