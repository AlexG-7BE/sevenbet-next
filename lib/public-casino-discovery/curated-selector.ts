import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

export const curatedCasinoSelectors = ["Best Overall", "Crypto", "Mobile", "Best Bonuses", "New Casinos"] as const;
export type CuratedCasinoSelector = typeof curatedCasinoSelectors[number];
export type CuratedCasinoRankingContext = { bestBonusCasinoIds?: readonly string[] };
export type CuratedCasinoSelection = { selector: CuratedCasinoSelector; items: PublicCasinoCardDto[] };

function timestamp(value: string | null) {
  const time = value ? new Date(value).valueOf() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function selectCuratedCasinos(
  items: PublicCasinoCardDto[],
  selector: CuratedCasinoSelector,
  context: CuratedCasinoRankingContext = {},
) {
  const editorialItems = items;
  if (selector === "Crypto") return editorialItems.filter((casino) => casino.supportsCrypto === true).slice(0, 3);
  if (selector === "Mobile") return editorialItems.filter((casino) => casino.supportsMobile === true).slice(0, 3);
  if (selector === "Best Bonuses") {
    const byId = new Map(editorialItems.map((casino) => [casino.id, casino]));
    const selected = new Set<string>();
    return (context.bestBonusCasinoIds ?? []).flatMap((casinoId) => {
      const casino = byId.get(casinoId);
      if (!casino || selected.has(casino.id)) return [];
      selected.add(casino.id);
      return [casino];
    }).slice(0, 3);
  }
  if (selector === "New Casinos") {
    return [...editorialItems].sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt)).slice(0, 3);
  }
  return editorialItems.slice(0, 3);
}

export function selectAvailableCuratedCasinoResults(
  items: PublicCasinoCardDto[],
  context: CuratedCasinoRankingContext = {},
): CuratedCasinoSelection[] {
  return curatedCasinoSelectors.flatMap((selector) => {
    const selected = selectCuratedCasinos(items, selector, context);
    return selected.length ? [{ selector, items: selected }] : [];
  });
}

export function resolveActiveCuratedCasinoSelector(
  current: CuratedCasinoSelector,
  available: readonly CuratedCasinoSelector[],
) {
  if (available.includes(current)) return current;
  if (available.includes("Best Overall")) return "Best Overall";
  return available[0] ?? null;
}
