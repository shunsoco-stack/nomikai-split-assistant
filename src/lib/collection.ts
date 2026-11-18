import { split } from "./split.ts";
import type { Party, Member } from "./types.ts";

export function collection(party: Party) {
  const result = split(party);
  const rows = result.rows.map((row) => {
    const payment = party.members.find((member) => member.id === row.id)?.payment;
    const paid = payment?.amount ?? 0;
    return {
      ...row,
      paid,
      outstanding: Math.max(0, row.amount - paid),
      overpaid: Math.max(0, paid - row.amount),
    };
  });
  return {
    rows,
    unpaid: rows.filter((row) => row.outstanding > 0),
    collected: rows.reduce((sum, row) => sum + row.paid, 0),
    outstanding: rows.reduce((sum, row) => sum + row.outstanding, 0),
  };
}

export function markPaid(member: Member, amount: number, method: string, now: Date): Member {
  return { ...member, payment: { amount, method: method.trim() || "現金", at: now.toISOString() } };
}

export function reminder(name: string, eventName: string, amount: number): string {
  return `${name}さん、先日の「${eventName}」の会費 ${amount.toLocaleString("ja-JP")}円をお願いします。行き違いでお支払い済みでしたらご容赦ください。`;
}
