import { parseBackup } from "./backup.ts";
import { createSeed } from "./seed.ts";
import type { Database } from "./types.ts";

export const STORAGE_KEY = "nsa:v1";

export function restore(source: string | null, now: Date): { data: Database; message: string } {
  if (source === null) return { data: createSeed(now), message: "" };
  try {
    return { data: parseBackup(source), message: "" };
  } catch {
    return {
      data: createSeed(now),
      message: "保存データが壊れていたため、既定のデモデータに戻しました。",
    };
  }
}
