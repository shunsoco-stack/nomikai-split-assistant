const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createSeed } = require("../src/lib/seed.ts");
const { japanDate, weekday } = require("../src/lib/dates.ts");
const { collection } = require("../src/lib/collection.ts");
const { eventStatus } = require("../src/lib/stats.ts");
const { validDatabase } = require("../src/lib/validation.ts");

const moments = [
  "2026-11-18T14:30", // 水曜
  "2026-11-20T17:00", // 金曜の開催前
  "2026-11-20T18:00", // 当日を選べる境界
  "2026-11-20T20:00", // 金曜の夜
  "2026-11-23T00:20", // 月曜の深夜
  "2026-11-30T23:59", // 月末
  "2026-12-31T23:59",
  "2027-01-01T00:00",
  "2027-01-01T17:00",
  "2027-01-01T20:00",
  "2028-02-29T00:20", // うるう年
  ...Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return [`2026-${month}-01T00:20`, `2026-${month}-15T14:30`, `2026-${month}-28T20:00`];
  }).flat(),
];

function maxOccurrences(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Math.max(...counts.values());
}

for (const moment of moments) {
  test(`シードの重複・見込み・金曜日・季節 ${moment}`, () => {
    const now = new Date(`${moment}:00+09:00`);
    const today = japanDate(now);
    const data = createSeed(now);
    const { events } = data;
    assert.ok(validDatabase(data));
    assert.equal(events.length, 10);
    assert.equal(events.filter((party) => party.id.startsWith("past-")).length, 8);
    assert.ok(maxOccurrences(events.map((party) => party.name)) <= 2);
    assert.ok(maxOccurrences(events.map((party) => party.venue)) <= 2);
    const venues = new Set(events.map((party) => party.venue));
    assert.ok(venues.size >= 5 && venues.size <= 7);
    assert.equal(new Set(events.map((party) => party.total)).size, 10);

    const active = events.find((party) => party.id === "current");
    const upcoming = events.find((party) => party.id === "upcoming");
    assert.equal(weekday(active.date), 5);
    assert.ok(active.date < today);
    const elapsed =
      (new Date(`${today}T00:00:00+09:00`) - new Date(`${active.date}T00:00:00+09:00`)) / 86400000;
    assert.ok(elapsed >= 1 && elapsed <= 7, "前日以前の直近の金曜");
    assert.equal(eventStatus(active, today), "集金中");
    assert.equal(collection(active).unpaid.length, 3);
    assert.equal(weekday(upcoming.date), 5);
    assert.ok(upcoming.date > today);
    assert.ok(new Date(`${upcoming.date}T${upcoming.start}:00+09:00`) > now);
    assert.equal(eventStatus(upcoming, today), "予定");
    assert.equal(upcoming.total, 5500 * upcoming.members.length);
    assert.equal(upcoming.total, 55000);
    assert.match(upcoming.note, /5,500円×10名＝55,000円.*見込み/);
    assert.ok(upcoming.members.every((member) => member.payment === null));

    for (const party of events) {
      assert.doesNotMatch(party.name, /・予定|（架空）|プロジェクト打ち上げ/);
      const month = Number(party.date.slice(5, 7));
      if (party.name.includes("歓迎会")) assert.ok([4, 5].includes(month));
      if (party.name.includes("暑気払い")) assert.ok([7, 8].includes(month));
      if (party.name.includes("忘年会")) assert.equal(month, 12);
      if (party.name.includes("新年会")) assert.equal(month, 1);
      if (party.name.includes("送別会")) assert.equal(month, 3);
      if (party.id !== "current") {
        if ([4, 5].includes(month)) assert.match(party.name, /歓迎会/);
        if ([7, 8].includes(month)) assert.match(party.name, /暑気払い/);
        if (month === 12) assert.match(party.name, /忘年会/);
        if (month === 3) assert.match(party.name, /送別会/);
      }
      for (const member of party.members) {
        if (member.payment) assert.ok(new Date(member.payment.at) < now);
      }
    }
    assert.ok(events.some((party) => party.members.some((member) => member.fixed !== null)));
    assert.ok(events.some((party) => party.members.every((member) => member.fixed === null)));
    for (const attribute of ["arrival", "departure", "drinks"]) {
      assert.ok(
        new Set(
          events.map((party) =>
            JSON.stringify(party.members.map((member) => [member.id, member[attribute]])),
          ),
        ).size >= 8,
      );
    }
  });
}

test("11月18日14時30分の集金中は11月13日、予定は11月20日", () => {
  const { events } = createSeed(new Date("2026-11-18T14:30:00+09:00"));
  assert.equal(events.find((party) => party.id === "current").date, "2026-11-13");
  assert.equal(events.find((party) => party.id === "upcoming").date, "2026-11-20");
});
