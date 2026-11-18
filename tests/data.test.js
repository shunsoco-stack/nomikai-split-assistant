const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createSeed, seasonalName } = require("../src/lib/seed.ts");
const { parseBackup, exportBackup } = require("../src/lib/backup.ts");
const { shareData, shareUrl, parseShare, shareText } = require("../src/lib/share.ts");
const { eventCsv, csvFilename, csvCell } = require("../src/lib/csv.ts");
const { restore } = require("../src/lib/storage.ts");
const { stats, eventStatus } = require("../src/lib/stats.ts");
const { japanDate, weekday, isDate, isTime, minutes } = require("../src/lib/dates.ts");
const { validDatabase } = require("../src/lib/validation.ts");
const { collection } = require("../src/lib/collection.ts");

const now = new Date("2026-11-18T00:15:00+09:00");

test("改行した幹事メモを保存できる", () => {
  const data = createSeed(now);
  data.events[0].note = "会計を確認しました。\n追加注文も含みます。";
  assert.deepEqual(parseBackup(exportBackup(data)), data);
});

test("共有URLの不正Base64を拒否", () => assert.equal(parseShare("?data=v1.%%%"), null));

test("月に合った会の種類", () => {
  for (const month of [4, 5])
    assert.match(seasonalName(`2026-${String(month).padStart(2, "0")}-15`), /歓迎会/);
  for (const month of [7, 8])
    assert.match(seasonalName(`2026-${String(month).padStart(2, "0")}-15`), /暑気払い/);
  assert.match(seasonalName("2026-03-15"), /送別会/);
  assert.match(seasonalName("2026-12-15"), /忘年会/);
});

test("共有URLの日本語・記号往復", () => {
  const party = createSeed(now).events[0];
  party.name = "歓迎会 & お祝い #1 + 乾杯";
  const url = new URL(shareUrl(party, "https://example.test"));
  assert.deepEqual(parseShare(url.search), shareData(party));
  assert.equal(url.pathname, "/share");
  assert.ok(!url.search.includes("payment"));
});

for (const value of [
  "",
  "?data=null",
  "?data=%7B",
  "?data=[]",
  "?data=%FF",
  "?data=" + "x".repeat(150001),
]) {
  test(`不正な共有URLを拒否 ${value.slice(0, 20)}`, () => assert.equal(parseShare(value), null));
}

for (const [name, mutate] of [
  [
    "負の金額",
    (value) => {
      value.rows[0].amount = -1;
    },
  ],
  [
    "合計不一致",
    (value) => {
      value.total++;
    },
  ],
  [
    "危険な文字列",
    (value) => {
      value.rows[0].name = "<script>alert(1)</script>";
    },
  ],
  [
    "不正日付",
    (value) => {
      value.date = "2026-02-30";
    },
  ],
  [
    "未対応バージョン",
    (value) => {
      value.version = 2;
    },
  ],
  [
    "過剰な行数",
    (value) => {
      value.rows = Array(101).fill(value.rows[0]);
    },
  ],
  [
    "小数金額",
    (value) => {
      value.rows[0].amount = 0.5;
    },
  ],
  [
    "余りと不足の同時計上",
    (value) => {
      value.surplus++;
      value.shortage++;
    },
  ],
]) {
  test(`共有データ拒否: ${name}`, () => {
    const data = shareData(createSeed(now).events[0]);
    mutate(data);
    assert.equal(parseShare(`?data=${encodeURIComponent(JSON.stringify(data))}`), null);
  });
}

test("共有文面は計算根拠を含む", () =>
  assert.match(shareText(createSeed(now).events[0]), /役職.*滞在.*飲酒/));

test("バックアップを往復できる", () => {
  const data = createSeed(now);
  assert.deepEqual(parseBackup(exportBackup(data)), data);
});

for (const [name, mutate] of [
  [
    "version",
    (data) => {
      data.version = 9;
    },
  ],
  [
    "negative",
    (data) => {
      data.events[0].total = -1;
    },
  ],
  [
    "decimal",
    (data) => {
      data.events[0].total = 100.5;
    },
  ],
  [
    "date",
    (data) => {
      data.events[0].date = "2026-02-30";
    },
  ],
  [
    "time",
    (data) => {
      data.events[0].start = "25:30";
    },
  ],
  [
    "order",
    (data) => {
      data.events[0].end = "18:00";
    },
  ],
  [
    "arrival",
    (data) => {
      data.events[0].members[0].arrival = "00:00";
    },
  ],
  [
    "departure",
    (data) => {
      data.events[0].members[0].departure = "18:00";
    },
  ],
  [
    "role-reference",
    (data) => {
      data.events[0].members[0].roleId = "missing";
    },
  ],
  [
    "duplicate-id",
    (data) => {
      data.events[1].id = data.events[0].id;
    },
  ],
  [
    "duplicate-person",
    (data) => {
      data.events[0].members[1].id = data.events[0].members[0].id;
    },
  ],
  [
    "coefficient",
    (data) => {
      data.defaults.nonDrinker = 2;
    },
  ],
  [
    "empty-roles",
    (data) => {
      data.defaults.roles = [];
    },
  ],
  [
    "unit",
    (data) => {
      data.defaults.unit = 50;
    },
  ],
  [
    "payment",
    (data) => {
      data.events[0].members[0].payment.at = "invalid";
    },
  ],
  [
    "organizer",
    (data) => {
      data.events[0].organizerId = "missing";
    },
  ],
  [
    "name",
    (data) => {
      data.events[0].name = "";
    },
  ],
  [
    "unsafe-id",
    (data) => {
      data.events[0].id = "../../other";
    },
  ],
]) {
  test(`バックアップ拒否 ${name}`, () => {
    const data = createSeed(now);
    mutate(data);
    assert.throws(() => parseBackup(JSON.stringify(data)));
  });
}

test("破損JSONを拒否", () => assert.throws(() => parseBackup("{")));
test("巨大JSONを拒否", () => assert.throws(() => parseBackup(" ".repeat(2000001))));
test("保存破損時はシードと通知", () => assert.ok(restore("{}", now).message));
test("初回は通知なし", () => assert.equal(restore(null, now).message, ""));
test("正常保存はそのまま復元", () =>
  assert.deepEqual(restore(exportBackup(createSeed(now)), now).data, createSeed(now)));

test("CSVはBOMとCRLFを含む", () => {
  const csv = eventCsv(createSeed(now).events[0]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /\r\n/);
  assert.match(csv, /計算の根拠/);
});

test("CSVの引用符をエスケープ", () => assert.equal(csvCell('a,"b"'), '"a,""b"""'));
test("CSV数式を無効化", () => assert.equal(csvCell("=1+1"), '"\'=1+1"'));
test("CSV名は会名と開催日", () => {
  const party = createSeed(now).events[0];
  assert.equal(csvFilename(party), `割り勘_${party.name}_${party.date}.csv`);
  party.name = "a/b:c";
  assert.ok(csvFilename(party).startsWith("割り勘_a_b_c_"));
});

test("日本時間の日付境界", () =>
  assert.equal(japanDate(new Date("2026-11-17T15:00:00Z")), "2026-11-18"));
test("うるう日を検証", () => {
  assert.ok(isDate("2024-02-29"));
  assert.ok(!isDate("2025-02-29"));
});
test("時刻を検証", () => {
  assert.ok(isTime("00:00"));
  assert.ok(!isTime("24:00"));
});

const moments = [
  "2026-01-01T00:01",
  "2026-02-28T08:10",
  "2026-03-31T12:30",
  "2026-04-01T23:50",
  "2026-07-31T19:00",
  "2026-08-07T00:05",
  "2026-11-18T00:01",
  "2026-12-31T23:59",
];

for (const moment of moments) {
  test(`シード日時・季節・自然さ ${moment}`, () => {
    const clock = new Date(`${moment}:00+09:00`);
    const data = createSeed(clock);
    assert.ok(validDatabase(data));
    assert.equal(data.events.length, 10);
    const past = data.events.filter((party) => party.id.startsWith("past"));
    assert.equal(past.length, 8);
    assert.ok(new Set(past.map((party) => party.date.slice(0, 7))).size >= 7);
    assert.ok(new Set(past.map((party) => party.start)).size >= 4);
    assert.ok(past.filter((party) => Number(party.date.slice(8)) >= 22).length >= 3);
    assert.equal(new Set(data.events.map((party) => party.note)).size, 10);
    assert.ok(past.some((party) => party.members.some((member) => member.fixed !== null)));
    assert.ok(past.some((party) => party.members.every((member) => member.fixed === null)));
    assert.ok(
      new Set(past.map((party) => party.members.map((member) => member.name).join())).size >= 7,
    );
    const upcoming = data.events.find((party) => party.id === "upcoming");
    assert.ok(upcoming.date > japanDate(clock));
    assert.equal(weekday(upcoming.date), 5);
    assert.ok(upcoming.members.every((member) => !member.payment));
    const active = data.events.find((party) => party.id === "current");
    assert.equal(collection(active).unpaid.length, 3);
    for (const party of past) {
      assert.equal(weekday(party.date), 5);
      assert.equal(party.name, seasonalName(party.date));
      assert.ok(party.members.length >= 6 && party.members.length <= 18);
      assert.ok(
        party.total / party.members.length >= 4000 && party.total / party.members.length <= 7000,
      );
      assert.notEqual(party.total % 100, 0);
      assert.ok(
        minutes(party.start) >= minutes("18:30") && minutes(party.start) <= minutes("19:30"),
      );
      assert.ok(minutes(party.end) <= minutes("22:30"));
      assert.ok(clock - new Date(`${party.date}T00:00:00+09:00`) < 366 * 86400000);
      assert.ok(party.members.some((member) => member.arrival !== party.start));
      assert.ok(party.members.some((member) => member.departure !== party.end));
      assert.ok(party.members.some((member) => !member.drinks));
      assert.ok(!party.note.includes("さん："));
    }
    for (const party of [...past, active]) {
      assert.ok(new Date(`${party.date}T${party.end}:00+09:00`) < clock);
      for (const member of party.members) {
        if (!member.payment) continue;
        const paymentTime = new Date(member.payment.at);
        assert.ok(paymentTime < clock);
        assert.ok(paymentTime >= new Date(`${party.date}T${party.end}:00+09:00`));
        assert.ok(paymentTime - new Date(`${party.date}T${party.start}:00+09:00`) < 7 * 86400000);
      }
    }
  });
}

test("統計は未来の会費を未集金に含めない", () => {
  const data = createSeed(now);
  const value = stats(data.events, japanDate(now));
  assert.equal(value.count, 9);
  assert.equal(value.unpaidPeople, 3);
  assert.equal(eventStatus(data.events[1], japanDate(now)), "予定");
});
