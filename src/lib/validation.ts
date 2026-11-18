import { isDate, isTime, minutes } from "./dates.ts";
import type { Database, Party, Rules } from "./types.ts";

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function textValue(value: unknown, maximum = 100, multiline = false): value is string {
  if (typeof value !== "string" || value.length > maximum) return false;
  const content = multiline ? value.replace(/\r?\n/g, "") : value;
  return !/[\u0000-\u001f<>]/.test(content);
}

export function integer(value: unknown, maximum = 100000000): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= maximum;
}

function coefficient(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maximum &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.000001
  );
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

function uniqueIds(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length;
}

export function validRules(value: unknown): value is Rules {
  if (
    !record(value) ||
    !Array.isArray(value.roles) ||
    !value.roles.length ||
    value.roles.length > 20
  )
    return false;
  if (
    !value.roles.every(
      (role) =>
        record(role) &&
        identifier(role.id) &&
        textValue(role.name, 30) &&
        role.name.trim() &&
        coefficient(role.weight, 10),
    )
  )
    return false;
  return (
    uniqueIds(value.roles) &&
    coefficient(value.nonDrinker, 1) &&
    coefficient(value.minimumStay, 1) &&
    [100, 500, 1000].includes(Number(value.unit)) &&
    typeof value.unit === "number" &&
    typeof value.rounding === "string" &&
    typeof value.shortage === "string" &&
    ["ceil", "floor", "nearest"].includes(String(value.rounding)) &&
    ["organizer", "highest", "equal"].includes(String(value.shortage))
  );
}

export function validParty(value: unknown): value is Party {
  if (
    !record(value) ||
    !identifier(value.id) ||
    !textValue(value.name) ||
    !value.name.trim() ||
    !isDate(value.date) ||
    !textValue(value.venue) ||
    !textValue(value.note, 500, true)
  )
    return false;
  if (
    !isTime(value.start) ||
    !isTime(value.end) ||
    minutes(value.end) <= minutes(value.start) ||
    !integer(value.total) ||
    typeof value.course !== "boolean" ||
    typeof value.openBar !== "boolean" ||
    !validRules(value.rules)
  )
    return false;
  if (!Array.isArray(value.members) || value.members.length > 100) return false;
  const rules = value.rules;
  const start = minutes(value.start);
  const end = minutes(value.end);
  if (
    !value.members.every((member) => {
      if (
        !record(member) ||
        !identifier(member.id) ||
        !textValue(member.name, 60) ||
        !member.name.trim() ||
        !rules.roles.some((role) => role.id === member.roleId)
      )
        return false;
      if (
        !isTime(member.arrival) ||
        !isTime(member.departure) ||
        minutes(member.arrival) < start ||
        minutes(member.departure) > end ||
        minutes(member.departure) < minutes(member.arrival)
      )
        return false;
      if (typeof member.drinks !== "boolean" || !(member.fixed === null || integer(member.fixed)))
        return false;
      if (member.payment === null) return true;
      return (
        record(member.payment) &&
        textValue(member.payment.method, 60) &&
        integer(member.payment.amount) &&
        typeof member.payment.at === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(member.payment.at) &&
        Number.isFinite(Date.parse(member.payment.at)) &&
        new Date(member.payment.at).toISOString() === member.payment.at &&
        Date.parse(member.payment.at) >= Date.parse(`${value.date}T${value.start}:00+09:00`)
      );
    })
  )
    return false;
  return (
    uniqueIds(value.members) &&
    (value.members.length === 0
      ? value.organizerId === ""
      : value.members.some((member) => member.id === value.organizerId))
  );
}

export function validDatabase(value: unknown): value is Database {
  return (
    record(value) &&
    value.version === 1 &&
    validRules(value.defaults) &&
    Array.isArray(value.events) &&
    value.events.length <= 200 &&
    value.events.every(validParty) &&
    uniqueIds(value.events)
  );
}
