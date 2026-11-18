"use client";

import { parseShare } from "@/lib/share";
import { Empty, Heading, yen } from "./ui";

export function ShareScreen() {
  const data = parseShare(window.location.search);
  if (!data)
    return (
      <Empty title="共有データを表示できません">
        <p>
          URLが途中で切れているか、内容が正しくありません。幹事に共有URLの再発行をお願いしてください。
        </p>
        <a href="/" className="button secondary">
          会の一覧へ
        </a>
      </Empty>
    );
  return (
    <>
      <Heading
        eyebrow="SHARED BILL"
        title={data.name}
        description={`${data.date} · ${data.rows.length}名の割り勘`}
      />
      <p className="info-banner">
        共有時点の計算結果です。URLの内容だけで表示しています。作成者の確認・集金状況の同期は行いません。
      </p>
      <section className="receipt">
        <div>
          <p className="eyebrow">みんなのお会計</p>
          <span>集金予定の合計</span>
          <strong>{yen(data.total)}</strong>
        </div>
        <div className="receipt-details">
          <p>
            <span>お店の会計</span>
            <b>{yen(data.bill)}</b>
          </p>
          <p>
            <span>余り / 不足</span>
            <b>
              {yen(data.surplus)} / {yen(data.shortage)}
            </b>
          </p>
          <p className="balance-check">
            ✓ {yen(data.total)} ＝ {yen(data.bill)} ＋ {yen(data.surplus)} − {yen(data.shortage)}
          </p>
        </div>
      </section>
      <section className="panel">
        <h2>会費と計算の根拠</h2>
        <div className="shared-rows">
          {data.rows.map((row, index) => (
            <article className="shared-row" key={index}>
              <div>
                <h3>
                  {row.name}
                  <small>{row.role}</small>
                </h3>
                <strong>{yen(row.amount)}</strong>
              </div>
              <p>{row.reason}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
