import type { RoundingMode } from "./types.ts";

export function roundYen(amount: number, unit: number, mode: RoundingMode): number {
  const quotient = Math.floor(amount / unit);
  const remainder = amount % unit;
  if (mode === "ceil") return (quotient + (remainder > 0 ? 1 : 0)) * unit;
  if (mode === "nearest") return (quotient + (remainder * 2 >= unit ? 1 : 0)) * unit;
  return quotient * unit;
}

export function allocate(total: number, scores: number[]): number[] {
  const sum = scores.reduce((value, score) => value + BigInt(score), BigInt(0));
  if (!sum) return scores.map(() => 0);
  const numerators = scores.map((score) => BigInt(total) * BigInt(score));
  const amounts = numerators.map((value) => Number(value / sum));
  const order = numerators
    .map((value, index) => ({ index, remainder: value % sum }))
    .sort((a, b) =>
      a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
    );
  const remaining = total - amounts.reduce((value, amount) => value + amount, 0);
  for (let index = 0; index < remaining; index++) amounts[order[index].index]++;
  return amounts;
}
