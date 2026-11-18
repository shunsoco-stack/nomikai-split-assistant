"use client";

import { useState } from "react";
import { collection } from "@/lib/collection";
import { newParty } from "@/lib/seed";
import { eventStatus, stats } from "@/lib/stats";
import { csvFilename, eventCsv } from "@/lib/csv";
import type { Party } from "@/lib/types";
import { useStore } from "./store";
import { download, Empty, Heading, yen } from "./ui";

export function EventList() {
  const { data, today, save } = useStore();
  const [query, setQuery] = useState("");
  const summary = stats(data.events, today);
  const sorted = [...data.events].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted.filter((event) => eventStatus(event, today) !== "完了");
  const past = sorted.filter(
    (event) =>
      eventStatus(event, today) === "完了" && `${event.name}${event.venue}`.includes(query),
  );

  function create() {
    const party = newParty(new Date(), data.defaults, crypto.randomUUID());
    save({ ...data, events: [party, ...data.events] });
    window.location.href = `/events/${party.id}`;
  }

  return (
    <>
      <Heading
        eyebrow="GATHER, SHARE, CHEERS"
        title="会の一覧"
        description="楽しい時間のあとも、気持ちよく。お会計から集金までひとまとめに。"
      >
        <button className="button primary" onClick={create}>
          ＋ 新しい会をつくる
        </button>
      </Heading>
      <section className="stats-grid" aria-label="集金の概要">
        <div className="stat">
          <span>未集金の合計</span>
          <strong>{yen(summary.outstanding)}</strong>
          <small>
            <span className="status-dot" />
            あと {summary.unpaidPeople} 名のお支払い
          </small>
        </div>
        <div className="stat">
          <span>進行中の会</span>
          <strong>
            {current.length}
            <em>件</em>
          </strong>
          <small>予定・集金中の会</small>
        </div>
        <div className="stat">
          <span>これまでに開いた会</span>
          <strong>
            {summary.count}
            <em>件</em>
          </strong>
          <small>第二営業部の集まり</small>
        </div>
      </section>
      <div className="section-heading">
        <h2>
          今の会 <span className="count">{current.length}</span>
        </h2>
        <span className="muted">次の集まりも、集金の続きも。</span>
      </div>
      <section className="event-grid">
        {current.map((event) => (
          <EventCard key={event.id} party={event} today={today} />
        ))}
        {!current.length && <Empty title="進行中の会はありません" />}
      </section>
      <section className="history">
        <div className="section-heading">
          <h2>
            過去の会 <span className="count">{past.length}</span>
          </h2>
          <input
            className="search"
            type="search"
            aria-label="過去の会を検索"
            placeholder="会の名前・会場で検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>会の名前 / 会場</th>
                <th>開催日</th>
                <th>人数</th>
                <th className="number">会計</th>
                <th>集金状況</th>
                <th>
                  <span className="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {past.map((event) => (
                <tr key={event.id}>
                  <td>
                    <a className="event-name" href={`/events/${event.id}/split`}>
                      {event.name}
                    </a>
                    <small>{event.venue}</small>
                  </td>
                  <td>{event.date.replaceAll("-", ".")}</td>
                  <td>{event.members.length}名</td>
                  <td className="number">{yen(event.total)}</td>
                  <td>
                    <span className="badge done">✓ 集金完了</span>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        download(eventCsv(event), csvFilename(event), "text/csv;charset=utf-8")
                      }
                    >
                      CSV ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!past.length && <Empty title="該当する会はありません" />}
      </section>
      <div className="tip">
        <span>◎</span>
        <p>
          <strong>割り勘の「どうして？」に、ちゃんと答える。</strong>
          <br />
          役職・滞在時間・お酒の有無をもとに、ひとりずつの計算の根拠を共有できます。
        </p>
        <a href="/about">詳しく見る →</a>
      </div>
    </>
  );
}

function EventCard({ party, today }: { party: Party; today: string }) {
  const status = eventStatus(party, today);
  const payment = collection(party);
  const upcoming = status === "予定";
  const progress = party.members.length
    ? Math.round(((party.members.length - payment.unpaid.length) / party.members.length) * 100)
    : 0;

  return (
    <article className={`event-card ${upcoming ? "planned" : "collecting"}`}>
      <div className="card-top">
        <span className={`badge ${upcoming ? "planned" : "pending"}`}>
          {upcoming ? "○ 開催予定" : "● 集金中"}
        </span>
        <span className="date-label">
          {party.date.replaceAll("-", ".")} <small>{party.start}〜</small>
        </span>
      </div>
      <h3>
        <a href={`/events/${party.id}`}>{party.name}</a>
      </h3>
      <p className="venue">
        ⌖ {party.venue || "会場未定"} <span> / {party.members.length}名</span>
      </p>
      <div className="card-amount">
        <span>{upcoming ? "会計予定" : "お店の会計"}</span>
        <strong>{yen(party.total)}</strong>
      </div>
      {upcoming ? (
        <div className="upcoming-note">参加者と傾斜を整えて、当日は気軽に乾杯。</div>
      ) : (
        <div className="collection-progress">
          <div>
            <span>
              集金 {party.members.length - payment.unpaid.length} / {party.members.length}名
            </span>
            <strong>あと {yen(payment.outstanding)}</strong>
          </div>
          <progress value={progress} max={100} aria-label="集金の進捗" />
        </div>
      )}
      <div className="card-actions">
        <a
          href={`/events/${party.id}/${upcoming ? "split" : "collect"}`}
          className={`button ${upcoming ? "secondary" : "primary"}`}
        >
          {upcoming ? "割り勘を確認" : "集金をチェック"}
          <span>→</span>
        </a>
        <a className="text-button" href={`/events/${party.id}`}>
          会の設定
        </a>
      </div>
    </article>
  );
}
