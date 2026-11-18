export type RoundingMode = "ceil" | "floor" | "nearest";

export interface Role {
  id: string;
  name: string;
  weight: number;
}

export interface Rules {
  roles: Role[];
  nonDrinker: number;
  minimumStay: number;
  unit: 100 | 500 | 1000;
  rounding: RoundingMode;
  shortage: "organizer" | "highest" | "equal";
}

export interface Member {
  id: string;
  name: string;
  roleId: string;
  arrival: string;
  departure: string;
  drinks: boolean;
  fixed: number | null;
  payment: { method: string; at: string; amount: number } | null;
}

export interface Party {
  id: string;
  name: string;
  date: string;
  venue: string;
  start: string;
  end: string;
  total: number;
  course: boolean;
  openBar: boolean;
  organizerId: string;
  note: string;
  rules: Rules;
  members: Member[];
}

export interface Database {
  version: 1;
  defaults: Rules;
  events: Party[];
}

export interface SplitRow {
  id: string;
  name: string;
  role: string;
  weight: number;
  stayPercent: number;
  drinkFactor: number;
  score: number;
  base: number;
  rounded: number;
  adjustment: number;
  amount: number;
  fixed: boolean;
}

export interface SplitResult {
  rows: SplitRow[];
  total: number;
  surplus: number;
  shortage: number;
  originalShortage: number;
  warnings: string[];
}
