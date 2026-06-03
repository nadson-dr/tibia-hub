export type TibiaWorld = {
  name: string;
  location: string;
  pvp_type: string;
  premium_only: boolean;
  game_world_type: string;
};

const API_BASE = "https://api.tibiadata.com/v4";

/**
 * Lista de mundos do Tibia. TibiaData retorna ~90 mundos com vários atributos.
 * Cacheamos 12h — mundos mudam raramente (criação/merge é evento anual).
 *
 * Filtra `game_world_type='regular'` (exclui tournament worlds e mundos
 * inativos). Ordena alfabético pra estabilidade da UI.
 */
export async function fetchWorlds(): Promise<TibiaWorld[]> {
  try {
    const res = await fetch(`${API_BASE}/worlds`, {
      next: { revalidate: 60 * 60 * 12 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json().catch(() => null)) as {
      worlds?: { regular_worlds?: TibiaWorld[] };
    } | null;
    const list = json?.worlds?.regular_worlds ?? [];
    return [...list]
      .filter((w) => w.game_world_type === "regular")
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
