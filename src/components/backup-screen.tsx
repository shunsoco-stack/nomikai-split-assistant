"use client";

import { useState } from "react";
import { exportBackup, parseBackup } from "@/lib/backup";
import type { Database } from "@/lib/types";
import { useStore } from "./store";
import { download, Heading } from "./ui";

export function BackupScreen() {
  const { data, today, save, notify } = useStore();
  const [pending, setPending] = useState<Database | null>(null);
  const [error, setError] = useState("");

  async function read(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPending(null);
    setError("");
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error("ファイルが大きすぎます（上限2MB）。");
      setPending(parseBackup(await file.text()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "読み込みに失敗しました。");
    }
    event.target.value = "";
  }

  return (
    <>
      <Heading
        eyebrow="KEEP YOUR NOTE"
        title="バックアップ"
        description="会の設定・参加者・集金記録を、ひとつのJSONファイルに。"
      />
      <div className="two-columns">
        <section className="panel">
          <span className="feature-icon">↓</span>
          <h2>データを書き出す</h2>
          <p>
            このブラウザの {data.events.length}{" "}
            件の会と既定の設定を保存します。端末の変更やブラウザのデータ削除に備えてお使いください。
          </p>
          <button
            className="button primary"
            onClick={() =>
              download(
                exportBackup(data),
                `幹事ノート_${today}.json`,
                "application/json;charset=utf-8",
              )
            }
          >
            バックアップを書き出す（JSON）
          </button>
        </section>
        <section className="panel">
          <span className="feature-icon">↑</span>
          <h2>データを読み込む</h2>
          <p>読み込み前に内容を検証します。適用すると現在のデータをすべて置き換えます。</p>
          <input
            id="backup-file"
            className="visually-hidden file-input"
            type="file"
            accept=".json,application/json"
            onChange={read}
          />
          <label htmlFor="backup-file" className="button secondary file-label">
            バックアップを読み込む（JSON）
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {pending && (
            <div className="import-preview">
              <h3>{pending.events.length}件の会を読み込めます</h3>
              <p>現在の {data.events.length}件を置き換えてよろしいですか？</p>
              <div className="actions">
                <button
                  className="button primary"
                  onClick={() => {
                    save(pending);
                    setPending(null);
                    notify("バックアップを読み込みました。");
                  }}
                >
                  この内容で置き換える
                </button>
                <button className="button secondary" onClick={() => setPending(null)}>
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      <p className="help-text">
        ファイルには参加者の名前や集金記録が含まれます。保管先をご確認ください。
      </p>
    </>
  );
}
