const { test } = require("node:test");
const assert = require("node:assert/strict");
const { split } = require("../src/lib/split.ts");
const { attendance } = require("../src/lib/attendance.ts");
const { allocate, roundYen } = require("../src/lib/rounding.ts");
const { collection, markPaid, reminder } = require("../src/lib/collection.ts");
const { createSeed } = require("../src/lib/seed.ts");

function fixture() {
  const party = createSeed(new Date("2026-11-18T00:15:00+09:00")).events[0];
  party.members = party.members.slice(0, 3).map((member) => ({
    ...member,
    roleId: "staff",
    arrival: "19:00",
    departure: "21:30",
    drinks: true,
    fixed: null,
    payment: null,
  }));
  party.total = 10001;
  return party;
}

function balance(party) {
  const result = split(party);
  assert.equal(result.total, party.total + result.surplus - result.shortage);
  assert.equal(
    result.total,
    result.rows.reduce((sum, row) => sum + row.amount, 0),
  );
  assert.ok(result.rows.every((row) => Number.isSafeInteger(row.amount) && row.amount >= 0));
  return result;
}

for (const unit of [100, 500, 1000]) {
  for (const mode of ["ceil", "floor", "nearest"]) {
    for (const [label, amount] of [
      ["zero", 0],
      ["exact", unit * 4],
      ["below-half", unit * 4 + unit / 2 - 1],
      ["half", unit * 4 + unit / 2],
      ["above-unit", unit * 4 + 1],
    ]) {
      test(`rounding ${unit} ${mode} ${label}`, () => {
        const expected =
          { ceil: Math.ceil, floor: Math.floor, nearest: Math.round }[mode](amount / unit) * unit;
        assert.equal(roundYen(amount, unit, mode), expected);
      });
    }
    test(`split balance ${unit} ${mode}`, () => {
      const party = fixture();
      party.rules.unit = unit;
      party.rules.rounding = mode;
      balance(party);
    });
  }
}

test("役職・滞在・飲まない係数を掛け合わせる", () => {
  const party = fixture();
  const member = { ...party.members[0], roleId: "director", arrival: "20:15", drinks: false };
  const result = attendance(party, member);
  assert.equal(result.weight, 1.6);
  assert.equal(result.stayPercent, 50);
  assert.equal(result.drinkFactor, 0.8);
  assert.equal(result.score, 160 * 5000 * 8000);
});

test("滞在の下限を適用する", () => {
  const party = fixture();
  assert.equal(attendance(party, { ...party.members[0], arrival: "21:15" }).stayPercent, 50);
  party.rules.minimumStay = 0;
  assert.equal(attendance(party, { ...party.members[0], arrival: "21:15" }).stayPercent, 10);
});

test("早退による滞在割合", () => {
  const party = fixture();
  assert.equal(attendance(party, { ...party.members[0], departure: "20:30" }).stayPercent, 60);
});

test("会の範囲外は計算時に切り詰める", () => {
  const party = fixture();
  assert.equal(
    attendance(party, { ...party.members[0], arrival: "18:00", departure: "23:00" }).stayPercent,
    100,
  );
});

test("固定額は按分から除外し残額を配分", () => {
  const party = fixture();
  party.total = 10000;
  party.members[0].fixed = 4000;
  const result = balance(party);
  assert.deepEqual(
    result.rows.map((row) => row.amount),
    [4000, 3000, 3000],
  );
});

test("固定額は端数単位に丸めない", () => {
  const party = fixture();
  party.members[0].fixed = 4321;
  party.rules.unit = 1000;
  assert.equal(balance(party).rows[0].amount, 4321);
});

test("固定額が会計を上回る場合も一致", () => {
  const party = fixture();
  party.members[0].fixed = 20000;
  const result = balance(party);
  assert.equal(result.surplus, 9999);
  assert.equal(result.rows[1].amount, 0);
  assert.ok(result.warnings.length);
});

for (const target of ["organizer", "highest", "equal"]) {
  test(`不足負担 ${target}`, () => {
    const party = fixture();
    party.rules.rounding = "floor";
    party.rules.shortage = target;
    party.members[1].roleId = "director";
    const result = balance(party);
    assert.equal(result.shortage, 0);
    const adjustments = result.rows.map((row) => row.adjustment);
    if (target === "organizer") assert.equal(adjustments[0], result.originalShortage);
    if (target === "highest") assert.equal(adjustments[1], result.originalShortage);
    if (target === "equal") assert.ok(Math.max(...adjustments) - Math.min(...adjustments) <= 1);
  });
}

test("固定額の幹事は不足負担しない", () => {
  const party = fixture();
  party.rules.rounding = "floor";
  party.members[0].fixed = 1000;
  const result = balance(party);
  assert.equal(result.rows[0].amount, 1000);
  assert.ok(result.shortage > 0);
});

test("ゲストは請求も均等不足負担もゼロ", () => {
  const party = fixture();
  party.rules.rounding = "floor";
  party.rules.shortage = "equal";
  party.members[1].roleId = "guest";
  assert.equal(balance(party).rows[1].amount, 0);
});

test("全員ゲストは全額を不足として表示", () => {
  const party = fixture();
  party.members.forEach((member) => {
    member.roleId = "guest";
  });
  const result = balance(party);
  assert.equal(result.shortage, party.total);
  assert.equal(result.total, 0);
});

test("参加者ゼロでも一致", () => {
  const party = fixture();
  party.members = [];
  assert.equal(balance(party).shortage, party.total);
});

test("会計ゼロでも一致", () => {
  const party = fixture();
  party.total = 0;
  assert.equal(balance(party).total, 0);
});

test("最大剰余法の同順位は入力順", () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
});

test("大きな整数の積を正確に配分", () => {
  assert.deepEqual(
    allocate(99999999, [100000000000, 100000000000, 100000000000]),
    [33333333, 33333333, 33333333],
  );
});

test("乱数入力3000回・すべての端数と負担方式で検算", () => {
  let seed = 923701;
  function random(maximum) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % maximum;
  }
  for (let iteration = 0; iteration < 3000; iteration++) {
    const party = fixture();
    party.total = random(100000001);
    party.rules.unit = [100, 500, 1000][random(3)];
    party.rules.rounding = ["ceil", "floor", "nearest"][random(3)];
    party.rules.shortage = ["organizer", "highest", "equal"][random(3)];
    party.rules.minimumStay = random(101) / 100;
    party.rules.nonDrinker = random(101) / 100;
    party.members = Array.from({ length: random(40) }, (_, index) => ({
      ...party.members[0],
      id: `m-${index}`,
      roleId: party.rules.roles[random(5)].id,
      fixed: random(5) === 0 ? random(100000) : null,
      drinks: random(2) === 0,
      arrival: random(2) ? "20:00" : "19:00",
    }));
    party.organizerId = party.members[0]?.id ?? "";
    const before = JSON.stringify(party);
    balance(party);
    assert.equal(JSON.stringify(party), before, "計算は入力を変更しない");
  }
});

test("集金額・未集金額・日時と手段", () => {
  const party = fixture();
  const amount = split(party).rows[0].amount;
  party.members[0] = markPaid(party.members[0], amount, "PayPay", new Date("2026-11-18T10:00:00Z"));
  const result = collection(party);
  assert.equal(result.collected, amount);
  assert.equal(result.unpaid.length, 2);
  assert.equal(party.members[0].payment.method, "PayPay");
  assert.equal(party.members[0].payment.at, "2026-11-18T10:00:00.000Z");
});

test("会費増額後は受領額を保持して差額を表示", () => {
  const party = fixture();
  party.members[0] = markPaid(party.members[0], 1000, "", new Date());
  assert.equal(collection(party).rows[0].outstanding, 2400);
  assert.equal(party.members[0].payment.method, "現金");
});

test("会費減額後は返金額を表示", () => {
  const party = fixture();
  party.members[0] = markPaid(party.members[0], 5000, "現金", new Date());
  assert.equal(collection(party).rows[0].overpaid, 1600);
});

test("リマインド文面に名前・会名・金額", () => {
  assert.match(
    reminder("片桐 美咲", "忘年会", 4500),
    /片桐 美咲さん、先日の「忘年会」の会費 4,500円/,
  );
});
