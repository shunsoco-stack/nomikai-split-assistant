export function japanDate(now: Date): string {
  return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00+09:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return japanDate(value);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00+09:00`).getUTCDay();
}

export function nextFriday(date: string): string {
  let result = addDays(date, 1);
  while (weekday(result) !== 5) result = addDays(result, 1);
  return result;
}

export function previousFriday(date: string): string {
  let result = addDays(date, -1);
  while (weekday(result) !== 5) result = addDays(result, -1);
  return result;
}

export function lastFridayOfMonth(date: string): string {
  const last = new Date(`${date.slice(0, 7)}-01T12:00:00+09:00`);
  last.setUTCMonth(last.getUTCMonth() + 1, 1);
  return previousFriday(japanDate(last));
}

export function minutes(time: string): number {
  const [hours, minute] = time.split(":").map(Number);
  return hours * 60 + minute;
}

export function timeString(value: number): string {
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}

export function isDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function displayTimestamp(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
