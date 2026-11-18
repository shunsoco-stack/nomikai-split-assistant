import { validDatabase } from "./validation.ts";
import type { Database } from "./types.ts";

export function parseBackup(source: string): Database {
  if (source.length > 2000000) throw new Error("ファイルが大きすぎます（上限2MB）。");
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("JSON形式を読み取れませんでした。");
  }
  if (!validDatabase(value))
    throw new Error(
      "バックアップの項目・日付・金額が正しくありません。現在のデータは変更していません。",
    );
  return value;
}

export function exportBackup(database: Database): string {
  return JSON.stringify(database, null, 2);
}
