export type TibiaCharacter = {
  name: string;
  level: number;
  vocation: string;
  world: string;
  sex: string;
};

export type FetchCharacterResult =
  | { ok: true; character: TibiaCharacter }
  | { ok: false; error: "not_found" | "network" | "invalid_response" };

const API_BASE = "https://api.tibiadata.com/v4";

export async function fetchCharacter(name: string): Promise<FetchCharacterResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "not_found" };

  const url = `${API_BASE}/character/${encodeURIComponent(trimmed)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 },
      headers: { Accept: "application/json" },
    });
  } catch {
    return { ok: false, error: "network" };
  }

  if (!res.ok) {
    return { ok: false, error: res.status === 404 ? "not_found" : "network" };
  }

  const json = (await res.json().catch(() => null)) as
    | { character?: { character?: Partial<TibiaCharacter> } }
    | null;

  const char = json?.character?.character;
  if (!char || !char.name || typeof char.level !== "number" || !char.vocation || !char.world) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    character: {
      name: char.name,
      level: char.level,
      vocation: char.vocation,
      world: char.world,
      sex: char.sex ?? "unknown",
    },
  };
}
