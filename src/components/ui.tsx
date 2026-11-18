"use client";

import { useState } from "react";

export function yen(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function CopyButton({ text, children }: { text: string; children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("コピーしました");
    } catch {
      setMessage("下の文面を選択してコピーしてください");
      setManual(true);
    }
  }
  return (
    <div className="copy-action">
      <button type="button" className="button secondary" onClick={copy}>
        {children}
      </button>
      {message && <small role="status">{message}</small>}
      {manual && (
        <textarea
          aria-label="コピー用の文面"
          readOnly
          value={text}
          onFocus={(event) => event.target.select()}
        />
      )}
    </div>
  );
}

export function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-symbol">◎</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
