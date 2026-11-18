import { collection } from "./collection.ts";
import { shareData } from "./share.ts";
import type { Party } from "./types.ts";

export function csvCell(value: string | number): string {
  const source = String(value);
  const safe = /^[\s]*[=+@-]/.test(source) ? `'${source}` : source;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvFilename(party: Party): string {
  return `割り勘_${party.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")}_${party.date}.csv`;
}

export function eventCsv(party: Party): string {
  const result = shareData(party);
  const status = collection(party);
  const lines: (string | number)[][] = [
    [
      "会の名前",
      "日付",
      "名前",
      "区分",
      "金額（円）",
      "計算の根拠",
      "集金額",
      "未集金額",
      "手段",
      "集金日時",
    ],
  ];
  result.rows.forEach((row, index) => {
    const payment = party.members[index].payment;
    lines.push([
      party.name,
      party.date,
      row.name,
      row.role,
      row.amount,
      row.reason,
      status.rows[index].paid,
      status.rows[index].outstanding,
      payment?.method ?? "",
      payment?.at ?? "",
    ]);
  });
  lines.push(
    ["会計", party.total],
    ["集金予定合計", result.total],
    ["余り", result.surplus],
    ["不足", result.shortage],
  );
  return "\uFEFF" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
}
