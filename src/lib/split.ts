import { attendance } from "./attendance.ts";
import { allocate, roundYen } from "./rounding.ts";
import type { Party, SplitResult } from "./types.ts";

export function split(party: Party): SplitResult {
  const warnings: string[] = [];
  const fixedTotal = party.members.reduce((sum, member) => sum + (member.fixed ?? 0), 0);
  const remaining = Math.max(0, party.total - fixedTotal);
  const factors = party.members.map((member) => attendance(party, member));
  const scores = factors.map((factor, index) =>
    party.members[index].fixed === null ? factor.score : 0,
  );
  const shares = allocate(remaining, scores);
  if (fixedTotal > party.total)
    warnings.push("固定額の合計が会計を超えています。超過分は余りとして記録します。");
  if (remaining > 0 && scores.every((score) => score === 0))
    warnings.push("按分できる参加者がいません。会社負担などの不足分を別途確認してください。");
  const rows = party.members.map((member, index) => {
    const base = member.fixed ?? shares[index];
    const rounded =
      member.fixed !== null ? base : roundYen(base, party.rules.unit, party.rules.rounding);
    return {
      id: member.id,
      name: member.name,
      role: party.rules.roles.find((role) => role.id === member.roleId)?.name ?? "未設定",
      ...factors[index],
      base,
      rounded,
      adjustment: 0,
      amount: rounded,
      fixed: member.fixed !== null,
    };
  });
  const originalShortage = Math.max(
    0,
    party.total - rows.reduce((sum, row) => sum + row.amount, 0),
  );
  // 固定額と重み0の参加者は不足分の負担対象にしない。
  if (party.rules.rounding === "floor" && originalShortage > 0) {
    const eligible = rows.filter((row) => !row.fixed && row.score > 0);
    let targets = eligible;
    if (party.rules.shortage === "organizer")
      targets = eligible.filter((row) => row.id === party.organizerId);
    if (party.rules.shortage === "highest")
      targets = [...eligible].sort((a, b) => b.weight - a.weight).slice(0, 1);
    if (targets.length) {
      const adjustments = allocate(
        originalShortage,
        targets.map(() => 1),
      );
      targets.forEach((row, index) => {
        row.adjustment = adjustments[index];
        row.amount += adjustments[index];
      });
    } else warnings.push("選択した不足負担者は固定額または重み0です。不足を残して表示しています。");
  }
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return {
    rows,
    total,
    surplus: Math.max(0, total - party.total),
    shortage: Math.max(0, party.total - total),
    originalShortage,
    warnings,
  };
}
