"use client";

import { useState } from "react";
import { validRules } from "@/lib/validation";
import { useStore } from "./store";
import { RulesEditor } from "./rules-editor";
import { Heading } from "./ui";

export function SettingsScreen() {
  const { data, save, notify } = useStore();
  const [rules, setRules] = useState(() => structuredClone(data.defaults));
  const [error, setError] = useState("");
  return (
    <>
      <Heading
        eyebrow="DEFAULT RULES"
        title="割り勘の設定"
        description="新しくつくる会の初期設定です。すでにある会の設定は変わりません。"
      />
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (!validRules(rules)) {
            setError("区分名と係数を確認してください。係数は小数点以下2桁までです。");
            return;
          }
          save({ ...data, defaults: rules });
          setError("");
          notify("新しい会の初期設定を保存しました。");
        }}
      >
        <RulesEditor rules={rules} onChange={setRules} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" className="button primary">
            既定の設定を保存
          </button>
        </div>
      </form>
    </>
  );
}
