"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { japanDate } from "@/lib/dates";
import { restore, STORAGE_KEY } from "@/lib/storage";
import { validDatabase } from "@/lib/validation";
import type { Database, Party } from "@/lib/types";

interface Store {
  data: Database;
  today: string;
  save: (data: Database) => void;
  saveParty: (party: Party) => void;
  notify: (message: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Database | null>(null);
  const [today, setToday] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const now = new Date();
      setToday(japanDate(now));
      try {
        const restored = restore(localStorage.getItem(STORAGE_KEY), now);
        setData(restored.data);
        setMessage(restored.message);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored.data));
      } catch {
        setData(restore(null, now).data);
        setMessage(
          "ブラウザに保存できません。この画面での変更は一時的です。JSONで保存してください。",
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function save(next: Database) {
    if (!validDatabase(next)) {
      setMessage(
        "入力内容が正しくないため保存しませんでした。名前・日時・金額や、記号 < > が含まれていないかを確認してください。",
      );
      return;
    }
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setMessage(
        "保存容量またはブラウザ設定により保存できません。バックアップを書き出してください。",
      );
    }
  }

  if (!data)
    return (
      <div className="loading" role="status">
        幹事ノートを開いています…
      </div>
    );

  return (
    <StoreContext.Provider
      value={{
        data,
        today,
        save,
        notify: setMessage,
        saveParty: (party) =>
          save({
            ...data,
            events: data.events.map((event) => (event.id === party.id ? party : event)),
          }),
      }}
    >
      {message && (
        <div className="notice" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="通知を閉じる">
            ×
          </button>
        </div>
      )}
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("保存データの読み込みが完了していません。");
  return value;
}
