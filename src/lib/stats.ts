import { collection } from "./collection.ts";
import type { Party } from "./types.ts";

export function eventStatus(party: Party, today: string) {
  if (party.date > today) return "予定";
  return collection(party).outstanding > 0 ? "集金中" : "完了";
}

export function stats(events: Party[], today: string) {
  const held = events.filter((party) => party.date <= today);
  return {
    count: held.length,
    outstanding: held.reduce((sum, party) => sum + collection(party).outstanding, 0),
    unpaidPeople: held.reduce((sum, party) => sum + collection(party).unpaid.length, 0),
  };
}
