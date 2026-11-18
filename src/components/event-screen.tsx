"use client";

import { useStore } from "./store";
import { Empty, Heading } from "./ui";
import { EventEditor } from "./event-editor";
import { SplitView } from "./split-view";
import { CollectView } from "./collect-view";

export function EventScreen() {
  const { data } = useStore();
  const path = window.location.pathname.split("/");
  const party = data.events.find((event) => event.id === path[2]);
  const tab = path[3] ?? "settings";
  if (!party)
    return (
      <Empty title="この会は見つかりませんでした">
        <p>
          会のデータは作成したブラウザに保存されています。共有された結果は共有URLからご覧ください。
        </p>
        <a className="button primary" href="/">
          会の一覧へ戻る
        </a>
      </Empty>
    );

  return (
    <>
      <a className="back-link" href="/">
        ← 会の一覧
      </a>
      <Heading
        eyebrow={`${party.date.replaceAll("-", ".")} · ${party.members.length}名`}
        title={party.name}
        description={`${party.venue || "会場未定"} / ${party.start}〜${party.end}`}
      />
      <nav className="event-tabs" aria-label="会の操作">
        <a href={`/events/${party.id}`} aria-current={tab === "settings" ? "page" : undefined}>
          01 設定・参加者
        </a>
        <a href={`/events/${party.id}/split`} aria-current={tab === "split" ? "page" : undefined}>
          02 計算結果
        </a>
        <a
          href={`/events/${party.id}/collect`}
          aria-current={tab === "collect" ? "page" : undefined}
        >
          03 集金チェック
        </a>
      </nav>
      {tab === "split" ? (
        <SplitView party={party} />
      ) : tab === "collect" ? (
        <CollectView party={party} />
      ) : (
        <EventEditor key={party.id} party={party} />
      )}
    </>
  );
}
