import { minutes } from "./dates.ts";
import type { Member, Party } from "./types.ts";

export function attendance(party: Party, member: Member) {
  const duration = Math.max(1, minutes(party.end) - minutes(party.start));
  const stayed = Math.max(
    0,
    Math.min(minutes(party.end), minutes(member.departure)) -
      Math.max(minutes(party.start), minutes(member.arrival)),
  );
  // 係数は1万分率に整数化し、配分で浮動小数の累積を発生させない。
  const stayBasis = Math.max(
    Math.round(party.rules.minimumStay * 10000),
    Math.floor((stayed * 10000) / duration),
  );
  const weight = party.rules.roles.find((role) => role.id === member.roleId)?.weight ?? 0;
  const drinkBasis = member.drinks ? 10000 : Math.round(party.rules.nonDrinker * 10000);
  const score = Math.round(weight * 100) * stayBasis * drinkBasis;
  return { score, weight, stayPercent: stayBasis / 100, drinkFactor: drinkBasis / 10000 };
}
