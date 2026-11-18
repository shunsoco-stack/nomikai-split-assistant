"use client";

import { split } from "@/lib/split";
import { shareText, shareUrl } from "@/lib/share";
import { eventCsv, csvFilename } from "@/lib/csv";
import type { Party } from "@/lib/types";
import { CopyButton, download, Empty, yen } from "./ui";

export function SplitView({ party }: { party: Party }) {
  const result = split(party);
  if (!party.members.length)
    return (
      <Empty title="参加者を追加しましょう">
        <a className="button primary" href={`/events/${party.id}`}>
          会の設定へ
        </a>
      </Empty>
    );

  return (
    <>
      <section className="receipt">
        <div>
          <p className="eyebrow">みんなのお会計</p>
          <span>集金予定の合計</span>
          <strong>{yen(result.total)}</strong>
        </div>
        <div className="receipt-details">
          <p>
            <span>お店の会計</span>
            <b>{yen(party.total)}</b>
          </p>
          <p>
            <span>余り</span>
            <b className="green">＋ {yen(result.surplus)}</b>
          </p>
          <p>
            <span>不足</span>
            <b className={result.shortage ? "danger" : ""}>− {yen(result.shortage)}</b>
          </p>
          <p className="balance-check">
            ✓ {yen(result.total)} ＝ {yen(party.total)} ＋ {yen(result.surplus)} −{" "}
            {yen(result.shortage)}
          </p>
        </div>
      </section>
      {result.warnings.map((warning) => (
        <p className="warning" key={warning}>
          {warning}
        </p>
      ))}
      <section className="panel">
        <div className="section-heading">
          <h2>ひとりずつの計算の根拠</h2>
          <span className="badge neutral">
            {party.rules.unit}円単位・
            {{ ceil: "切り上げ", floor: "切り捨て", nearest: "四捨五入" }[party.rules.rounding]}
          </span>
        </div>
        <p className="muted">
          残りの会計 ×（役職の重み × 滞在割合 × 飲酒係数）÷ 対象者の係数合計。滞在割合の下限は{" "}
          {party.rules.minimumStay * 100}% です。
        </p>
        <div className="table-scroll">
          <table className="split-table">
            <thead>
              <tr>
                <th>参加者 / 区分</th>
                <th>重み</th>
                <th>滞在</th>
                <th>飲酒係数</th>
                <th className="number">按分額</th>
                <th className="number">端数処理後</th>
                <th className="number">不足負担</th>
                <th className="number">会費</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <small>
                      {row.role}
                      {row.fixed && "・固定額"}
                    </small>
                  </td>
                  <td>{row.fixed ? "—" : row.weight}</td>
                  <td>{row.fixed ? "—" : `${row.stayPercent}%`}</td>
                  <td>{row.fixed ? "—" : row.drinkFactor}</td>
                  <td className="number">{yen(row.base)}</td>
                  <td className="number">{yen(row.rounded)}</td>
                  <td className="number">{row.adjustment ? `＋${yen(row.adjustment)}` : "—"}</td>
                  <td className="number amount">{yen(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="help-text">
          1円未満は余りの大きい順に1円ずつ配分（同順位は参加者の上から）。固定額の人は端数処理・不足負担の対象外。重み0の人の分は他の対象者に按分します。
        </p>
        {result.originalShortage > 0 && party.rules.rounding === "floor" && (
          <p className="help-text">
            切り捨て直後の不足 {yen(result.originalShortage)} →{" "}
            {
              { organizer: "幹事", highest: "最上位の役職者", equal: "対象者で均等" }[
                party.rules.shortage
              ]
            }
            に1円単位で加算。加算後は端数単位の倍数にならないことがあります。
          </p>
        )}
        {result.shortage > 0 && (
          <p className="warning">
            不足 {yen(result.shortage)}{" "}
            は未割当です。会の設定で負担方法を見直すか、会社負担として別途確認してください。
          </p>
        )}
      </section>
      <section className="panel share-panel">
        <div>
          <h2>みんなに共有する</h2>
          <p className="muted">
            名前・区分・会費・計算の根拠だけを共有。集金日時や手段は含みません。
          </p>
          <small>URLを知る人は閲覧できます。共有時点の結果で、後の変更は反映されません。</small>
        </div>
        <div className="actions">
          <CopyButton text={shareUrl(party, window.location.origin)}>共有URLをコピー</CopyButton>
          <CopyButton text={shareText(party)}>文面をコピー</CopyButton>
          <button
            className="button secondary"
            onClick={() => download(eventCsv(party), csvFilename(party), "text/csv;charset=utf-8")}
          >
            CSVを書き出す ↓
          </button>
          <a className="text-button" href={shareUrl(party, window.location.origin)}>
            共有ページを確認 ↗
          </a>
        </div>
        <small>長いURLが送信先で省略される場合は、文面のコピーをご利用ください。</small>
      </section>
    </>
  );
}
