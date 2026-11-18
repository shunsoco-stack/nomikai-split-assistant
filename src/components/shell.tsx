"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider } from "./store";

const navigation = [
  { href: "/", symbol: "▤", label: "会の一覧" },
  { href: "/settings", symbol: "⚙", label: "割り勘の設定" },
  { href: "/backup", symbol: "⇩", label: "バックアップ" },
  { href: "/about", symbol: "ⓘ", label: "このデモについて" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 保存と計算はSW登録なしでも利用可能。 */
      });
    }
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">割</span>
          <span>
            幹事ノート<small>傾斜割り勘アシスタント</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">二</span>
          <div>
            第二営業部<small>みんなが納得する、会のお会計。</small>
          </div>
        </div>
        <p className="nav-caption">幹事の道具箱</p>
        <nav aria-label="メインナビゲーション">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={
                (
                  item.href === "/"
                    ? pathname === "/" || pathname.startsWith("/events")
                    : pathname === item.href
                )
                  ? "active"
                  : ""
              }
            >
              <span aria-hidden="true">{item.symbol}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-dot" />
          デモ用の架空データです
          <p>
            データはこのブラウザに保存。
            <br />
            送金・決済は行いません。
          </p>
        </div>
      </aside>
      <div className="main-column">
        <div className="topbar">
          <span>幹事の手間を、ちょっと軽く。</span>
          <span className="local-badge">● ブラウザ内に保存</span>
        </div>
        <main id="main">
          {pathname === "/share" ? (
            <ClientReady>{children}</ClientReady>
          ) : (
            <StoreProvider>{children}</StoreProvider>
          )}
        </main>
        <footer>
          デモ用の架空データです <span>・</span> 幹事ノート
        </footer>
      </div>
      <nav className="mobile-tabs" aria-label="モバイルナビゲーション">
        {navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <span aria-hidden="true">{item.symbol}</span>
            {item.href === "/settings"
              ? "設定"
              : item.href === "/about"
                ? "デモについて"
                : item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function ClientReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return ready ? (
    children
  ) : (
    <div className="loading" role="status">
      共有結果を読み込んでいます…
    </div>
  );
}
