import {
  addDays,
  japanDate,
  lastFridayOfMonth,
  minutes,
  nextFriday,
  previousFriday,
  timeString,
} from "./dates.ts";
import { split } from "./split.ts";
import type { Database, Party, Rules } from "./types.ts";

export const defaultRules: Rules = {
  roles: [
    { id: "director", name: "部長", weight: 1.6 },
    { id: "manager", name: "課長", weight: 1.3 },
    { id: "staff", name: "一般", weight: 1 },
    { id: "junior", name: "新人", weight: 0.7 },
    { id: "guest", name: "ゲスト（会社負担）", weight: 0 },
  ],
  nonDrinker: 0.8,
  minimumStay: 0.5,
  unit: 100,
  rounding: "ceil",
  shortage: "organizer",
};

const people = [
  ["片桐 美咲", "staff"],
  ["久世 直樹", "director"],
  ["森下 航", "junior"],
  ["三浦 詩織", "manager"],
  ["野々村 遼", "staff"],
  ["高瀬 紬", "staff"],
  ["岩井 陽介", "staff"],
  ["朝倉 奈緒", "junior"],
  ["宮原 圭", "staff"],
  ["西脇 沙耶", "staff"],
  ["藤森 蓮", "manager"],
  ["奥山 千尋", "staff"],
  ["有馬 智也", "staff"],
  ["白石 莉子", "junior"],
  ["榊原 誠", "staff"],
  ["小野寺 葵", "staff"],
  ["水野 岳", "staff"],
  ["南 佳穂", "staff"],
];

// 各会の参加者・遅刻・早退を個別に定義。循環するテンプレートを使わない。
const plans = [
  {
    offset: 26,
    monthEnd: false,
    venue: "旬菜酒場 まどい",
    people: [0, 3, 5, 8, 2, 7, 1, 10, 11, 4, 6, 9],
    late: 8,
    lateMinutes: 30,
    early: 7,
    earlyMinutes: 60,
    dry: [5, 11],
    start: "19:00",
    end: "21:30",
    fixed: true,
    note: "窓側の席でゆっくり近況を聞けました。",
  },
  {
    offset: 73,
    monthEnd: true,
    venue: "釜飯と肴 ほたる",
    people: [3, 0, 12, 9, 1, 6, 5, 13],
    late: 12,
    lateMinutes: 45,
    early: 9,
    earlyMinutes: 30,
    dry: [6, 13, 0],
    start: "18:30",
    end: "21:00",
    fixed: false,
    note: "締めの釜飯まで含めた会計です。",
  },
  {
    offset: 109,
    monthEnd: false,
    venue: "炭火焼きと麦酒 こもれび",
    people: [0, 1, 10, 4, 7, 8, 11, 14, 5, 9, 2, 12, 3, 15, 6, 16, 13, 17],
    late: 4,
    lateMinutes: 60,
    early: 15,
    earlyMinutes: 45,
    dry: [7, 5, 16, 17],
    start: "19:30",
    end: "22:00",
    fixed: true,
    note: "追加の料理は全員分として計算しています。",
  },
  {
    offset: 151,
    monthEnd: true,
    venue: "和食と小皿 花むすび",
    people: [5, 0, 3, 6, 11, 8, 2, 14, 7, 1],
    late: 11,
    lateMinutes: 30,
    early: 2,
    earlyMinutes: 60,
    dry: [14, 8],
    start: "19:00",
    end: "22:00",
    fixed: false,
    note: "座敷を利用。席料を合計に含めました。",
  },
  {
    offset: 194,
    monthEnd: false,
    venue: "ビストロ 月と葡萄",
    people: [0, 10, 12, 4, 15, 9],
    late: 15,
    lateMinutes: 20,
    early: 12,
    earlyMinutes: 40,
    dry: [4],
    start: "18:45",
    end: "21:00",
    fixed: false,
    note: "少人数で担当案件の完了をお祝いしました。",
  },
  {
    offset: 237,
    monthEnd: true,
    venue: "魚と地酒 凪",
    people: [0, 3, 1, 6, 8, 11, 5, 13, 16, 14, 4, 17, 12, 10],
    late: 16,
    lateMinutes: 45,
    early: 5,
    earlyMinutes: 60,
    dry: [11, 13, 17],
    start: "19:15",
    end: "21:45",
    fixed: true,
    note: "飲み物の追加注文をまとめた金額です。",
  },
  {
    offset: 290,
    monthEnd: false,
    venue: "旬菜酒場 まどい",
    people: [7, 0, 9, 3, 12, 6, 5, 1, 15],
    late: 6,
    lateMinutes: 30,
    early: 15,
    earlyMinutes: 45,
    dry: [9, 7],
    start: "18:30",
    end: "20:30",
    fixed: false,
    note: "翌朝の予定に合わせて早めに解散しました。",
  },
  {
    offset: 337,
    monthEnd: false,
    venue: "季節の鍋料理 雪あかり",
    people: [0, 1, 3, 11, 8, 4, 2, 5, 10, 16, 15, 7, 9, 12, 17, 6],
    late: 17,
    lateMinutes: 60,
    early: 8,
    earlyMinutes: 30,
    dry: [2, 10, 15],
    start: "19:30",
    end: "22:30",
    fixed: true,
    note: "個室の利用料とデザート代を含んでいます。",
  },
];

export function seasonalName(date: string): string {
  const month = Number(date.slice(5, 7));
  if (month === 12) return "第二営業部 忘年会";
  if (month === 3) return "春の異動 送別会";
  if (month === 4 || month === 5) return "新しい仲間の歓迎会";
  if (month === 7 || month === 8) return "第二営業部 暑気払い";
  if (month === 1) return "第二営業部 新年会";
  if (month === 2) return "冬の営業交流会";
  if (month === 6) return "展示会 打ち上げ";
  if (month === 9) return "上期おつかれさま会";
  if (month === 10) return "新サービス公開 打ち上げ";
  return "新システム導入 打ち上げ";
}

function makeParty(date: string, plan: (typeof plans)[number], id: string): Party {
  const name = seasonalName(date);
  const premium = name.includes("打ち上げ") || name.includes("忘年会");
  return {
    id,
    name,
    date,
    venue: plan.venue,
    start: plan.start,
    end: plan.end,
    total: plan.people.length * (premium ? 6120 : 4780) + plan.offset * 3 + 17,
    course: plan.people.length >= 10,
    openBar: plan.people.length >= 8,
    organizerId: "person-0",
    note: plan.note,
    rules: structuredClone(defaultRules),
    members: plan.people.map((person) => ({
      id: `person-${person}`,
      name: people[person][0],
      roleId: people[person][1],
      arrival: timeString(minutes(plan.start) + (person === plan.late ? plan.lateMinutes : 0)),
      departure: timeString(minutes(plan.end) - (person === plan.early ? plan.earlyMinutes : 0)),
      drinks: !plan.dry.includes(person),
      fixed: person === 1 && plan.fixed ? 10000 : null,
      payment: null,
    })),
  };
}

export function createSeed(now: Date): Database {
  const today = japanDate(now);
  const past = plans.map((plan) => {
    const reference = addDays(today, -plan.offset);
    const date = plan.monthEnd ? lastFridayOfMonth(reference) : previousFriday(reference);
    return makeParty(date, plan, `past-${plan.offset}`);
  });
  const active = makeParty(
    previousFriday(today),
    {
      ...plans[0],
      venue: "釜飯と肴 ほたる",
      people: [0, 1, 3, 5, 8, 2, 7, 11, 4, 6],
      note: "おつかれさまでした。残り3名の集金を確認しましょう。",
    },
    "current",
  );
  active.name = "第二営業部 おつかれさま会";
  const upcoming = makeParty(
    nextFriday(today),
    {
      ...plans[3],
      note: "コース5,500円×10名＝55,000円の見込みです。人数・追加注文が確定したら会計を更新してください。",
    },
    "upcoming",
  );
  upcoming.total = 5500 * upcoming.members.length;
  // 同じ季節の会が重なる場合も、同名は2件までにする。
  const nameCounts = new Map<string, number>();
  for (const party of [...past, active, upcoming]) {
    const name = party.name;
    const candidates = [
      name,
      ...["営業企画チーム", "営業・開発合同", "有志", "同期"].map(
        (group) => `${group} ${name.replace(/^第二営業部 /, "")}`,
      ),
    ];
    party.name = candidates.find((candidate) => (nameCounts.get(candidate) ?? 0) < 2)!;
    nameCounts.set(party.name, (nameCounts.get(party.name) ?? 0) + 1);
  }
  for (const party of [...past, active]) {
    const result = split(party);
    party.members.forEach((member, position) => {
      if (party.id === "current" && [2, 6, 8].includes(position)) return;
      const hash = [...`${member.name}${party.date}`].reduce(
        (sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0,
        7,
      );
      const delay = party.id === "current" ? 0 : hash % 6;
      const paidDate = addDays(party.date, delay);
      const paymentMinutes =
        delay === 0
          ? minutes(party.end) + 5 + (hash % 20)
          : (11 + (hash % 9)) * 60 + ((hash >>> 4) % 60);
      const at = new Date(`${paidDate}T${timeString(paymentMinutes)}:00+09:00`);
      member.payment = {
        amount: result.rows[position].amount,
        at: at.toISOString(),
        method: hash % 3 === 0 ? "PayPay" : "現金",
      };
    });
  }
  return {
    version: 1,
    defaults: structuredClone(defaultRules),
    events: [active, upcoming, ...past],
  };
}

export function newParty(now: Date, rules: Rules, id: string): Party {
  return {
    id,
    name: "新しい飲み会",
    date: nextFriday(japanDate(now)),
    venue: "",
    start: "19:00",
    end: "21:00",
    total: 0,
    course: true,
    openBar: true,
    organizerId: "",
    note: "",
    rules: structuredClone(rules),
    members: [],
  };
}
