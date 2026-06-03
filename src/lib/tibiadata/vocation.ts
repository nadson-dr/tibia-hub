import type { TibiaVocation } from "@/types/database";

const PROMOTED_MAP: Record<string, TibiaVocation> = {
  "Elite Knight": "EK",
  "Royal Paladin": "RP",
  "Elder Druid": "ED",
  "Master Sorcerer": "MS",
  "Exalted Monk": "EM",
};

const UNPROMOTED: ReadonlySet<string> = new Set([
  "Knight",
  "Paladin",
  "Druid",
  "Sorcerer",
  "Monk",
]);

export type VocationParse =
  | { ok: true; vocation: TibiaVocation }
  | { ok: false; reason: "unpromoted" | "invalid" };

export function parseTibiaVocation(raw: string): VocationParse {
  const v = raw.trim();
  const mapped = PROMOTED_MAP[v];
  if (mapped) return { ok: true, vocation: mapped };
  if (UNPROMOTED.has(v)) return { ok: false, reason: "unpromoted" };
  return { ok: false, reason: "invalid" };
}
