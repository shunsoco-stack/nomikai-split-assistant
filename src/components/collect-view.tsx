"use client";

import { useState } from "react";
import { collection, markPaid, reminder } from "@/lib/collection";
import { displayTimestamp } from "@/lib/dates";
import type { Party } from "@/lib/types";
import { useStore } from "./store";
import { CopyButton, Empty, yen } from "./ui";

export function CollectView({ party }: { party: Party }) {
  const { saveParty, notify } = useStore();
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [openedAt] = useState(() => Date.now());
  const status = collection(party);
  const future = openedAt < Date.parse(`${party.date}T${party.start}:00+09:00`);

  function check(id: string, paid: boolean, amount: number) {
    if (future) return;
    const members = party.members.map((member) =>
      member.id !== id
        ? member
        : paid
          ? { ...member, payment: null }
          : markPaid(member, amount, methods[id] ?? member.payment?.method ?? "現金", new Date()),
    );
    saveParty({ ...party, members });
    notify(
      paid ? "集金記録を取り消しました。" : "集金済みにしました。金額・手段・日時を保存しました。",
    );
  }

  return (
    <>
      <section className="stats-grid">
        <div className="stat">
          <span>未集金の合計</span>
          <strong>{yen(status.outstanding)}</strong>
          <small>あと {status.unpaid.length} 名</small>
        </div>
        <div className="stat">
          <span>集金済み</span>
          <strong>{yen(status.collected)}</strong>
          <small>保存されている実際の集金額</small>
        </div>
        <div className="stat">
          <span>集金の進み具合</span>
          <strong>
            {status.rows.length - status.unpaid.length}
            <em>/ {status.rows.length}名</em>
          </strong>
          <small>会費0円の人は集金不要</small>
        </div>
      </section>
      {future && (
        <p className="warning">これからの会です。集金のチェックは開催時刻以降に利用できます。</p>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>集金チェック</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={onlyUnpaid}
              onChange={(event) => setOnlyUnpaid(event.target.checked)}
            />
            未集金だけ表示
          </label>
        </div>
        <div className="collection-list">
          {status.rows
            .filter((row) => !onlyUnpaid || row.outstanding > 0)
            .map((row) => {
              const member = party.members.find((value) => value.id === row.id)!;
              const paid = member.payment !== null;
              return (
                <article className={`collection-row ${paid ? "paid" : ""}`} key={row.id}>
                  <div className="collection-person">
                    <span className="avatar">{member.name.slice(0, 1)}</span>
                    <div>
                      <strong>{row.name}</strong>
                      <small>{row.role}</small>
                    </div>
                    <strong className="collection-amount">{yen(row.amount)}</strong>
                  </div>
                  <div className="payment-controls">
                    <label className="field">
                      <span>集金手段</span>
                      <input
                        aria-label={`${row.name}の集金手段`}
                        maxLength={60}
                        placeholder="現金・PayPay など"
                        value={methods[row.id] ?? member.payment?.method ?? "現金"}
                        onChange={(event) => {
                          const method = event.target.value;
                          setMethods({ ...methods, [row.id]: method });
                          if (member.payment)
                            saveParty({
                              ...party,
                              members: party.members.map((value) =>
                                value.id === row.id
                                  ? { ...value, payment: { ...member.payment!, method } }
                                  : value,
                              ),
                            });
                        }}
                      />
                    </label>
                    <label className="checkbox-label paid-toggle">
                      <input
                        type="checkbox"
                        checked={paid}
                        disabled={future || row.amount === 0}
                        onChange={() => check(row.id, paid, row.amount)}
                      />
                      {row.amount === 0 ? "集金不要" : "集金済み"}
                    </label>
                  </div>
                  {member.payment && (
                    <small className="payment-date">
                      {displayTimestamp(member.payment.at)} ・ {yen(member.payment.amount)}を記録
                    </small>
                  )}
                  {row.overpaid > 0 && (
                    <p className="warning">
                      設定変更により {yen(row.overpaid)}{" "}
                      の返金が必要です。返金後に記録を取り消し、現在の会費で記録し直してください。
                    </p>
                  )}
                  {row.outstanding > 0 && (
                    <div className="reminder-row">
                      <small className="danger">未集金 {yen(row.outstanding)}</small>
                      {paid && (
                        <button
                          className="text-button"
                          disabled={future}
                          onClick={() => check(row.id, false, row.amount)}
                        >
                          差額を受領して更新
                        </button>
                      )}
                      <CopyButton text={reminder(row.name, party.name, row.outstanding)}>
                        リマインド文面をコピー
                      </CopyButton>
                    </div>
                  )}
                </article>
              );
            })}
        </div>
        {!status.rows.length && (
          <Empty title="参加者がいません">
            <a href={`/events/${party.id}`}>会の設定へ</a>
          </Empty>
        )}
        {onlyUnpaid && !status.unpaid.length && <Empty title="全員の集金が完了しています" />}
      </section>
      {status.unpaid.length > 0 && (
        <section className="panel">
          <h2>未集金の人</h2>
          <p>{status.unpaid.map((row) => row.name).join("、")}</p>
          <CopyButton
            text={status.unpaid
              .map((row) => reminder(row.name, party.name, row.outstanding))
              .join("\n\n")}
          >
            未集金の全員分をコピー
          </CopyButton>
        </section>
      )}
    </>
  );
}
