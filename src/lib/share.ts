import { split } from "./split.ts";
import { isDate } from "./dates.ts";
import { integer, record, textValue } from "./validation.ts";
import type { Party } from "./types.ts";

export interface SharedResult {
  version: 1;
  name: string;
  date: string;
  bill: number;
  total: number;
  surplus: number;
  shortage: number;
  rows: { name: string; role: string; amount: number; reason: string }[];
}

export function shareData(party: Party): SharedResult {
  const result = split(party);
  return {
    version: 1,
    name: party.name,
    date: party.date,
    bill: party.total,
    total: result.total,
    surplus: result.surplus,
    shortage: result.shortage,
    rows: result.rows.map((row) => ({
      name: row.name,
      role: row.role,
      amount: row.amount,
      reason: row.fixed
        ? "固定額（滞在・飲酒の調整なし）"
        : `役職 ${row.weight} × 滞在 ${row.stayPercent}% × 飲酒 ${row.drinkFactor} / 按分 ${row.base}円 → 端数処理 ${row.rounded}円 ＋ 不足負担 ${row.adjustment}円`,
    })),
  };
}

export function shareUrl(party: Party, origin: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify(shareData(party)));
  const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `${origin}/share?data=v1.${encoded}`;
}

export function parseShare(search: string): SharedResult | null {
  if (search.length > 150000) return null;
  try {
    const source = new URLSearchParams(search).get("data") ?? "null";
    const json = source.startsWith("v1.")
      ? new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(
            atob(source.slice(3).replaceAll("-", "+").replaceAll("_", "/")),
            (character) => character.charCodeAt(0),
          ),
        )
      : source;
    const value: unknown = JSON.parse(json);
    if (
      !record(value) ||
      value.version !== 1 ||
      !textValue(value.name) ||
      !value.name.trim() ||
      !isDate(value.date) ||
      !integer(value.bill) ||
      !integer(value.total, 10000000000) ||
      !integer(value.surplus, 10000000000) ||
      !integer(value.shortage)
    )
      return null;
    if (
      !Array.isArray(value.rows) ||
      value.rows.length > 100 ||
      !value.rows.every(
        (row) =>
          record(row) &&
          textValue(row.name, 60) &&
          textValue(row.role, 30) &&
          textValue(row.reason, 300) &&
          integer(row.amount, 200000000),
      )
    )
      return null;
    if (value.surplus > 0 && value.shortage > 0) return null;
    if (
      value.total !== value.bill + value.surplus - value.shortage ||
      value.rows.reduce((sum, row) => sum + row.amount, 0) !== value.total
    )
      return null;
    return value as unknown as SharedResult;
  } catch {
    return null;
  }
}

export function shareText(party: Party): string {
  const value = shareData(party);
  return [
    `【${value.name}】${value.date}`,
    ...value.rows.map(
      (row) =>
        `${row.name}（${row.role}） ${row.amount.toLocaleString("ja-JP")}円\n  ${row.reason}`,
    ),
    `会計 ${value.bill}円 / 集金予定 ${value.total}円`,
    `余り ${value.surplus}円 / 不足 ${value.shortage}円`,
    "デモ用の架空データです",
  ].join("\n");
}
