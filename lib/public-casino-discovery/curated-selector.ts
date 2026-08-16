import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

export const curatedCasinoSelectors = ["Best Overall", "Crypto", "Mobile", "Best Bonuses", "New Casinos"] as const;
export type CuratedCasinoSelector = typeof curatedCasinoSelectors[number];

function timestamp(value: string | null) {
  const time = value ? new Date(value).valueOf() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function selectCuratedCasinos(items: PublicCasinoCardDto[], selector: CuratedCasinoSelector) {
  if (selector === "Crypto") return items.filter((casino) => casino.supportsCrypto === true).slice(0, 3);
  if (selector === "Mobile") return items.filter((casino) => casino.supportsMobile === true).slice(0, 3);
  if (selector === "Best Bonuses") {
    // Casino discovery cards do not carry the complete offer-ranking authority.
    // Failing closed is more truthful than inventing a "best" bonus from one term.
    return [];
  }
  if (selector === "New Casinos") {
    return [...items].sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt)).slice(0, 3);
  }
  return items.slice(0, 3);
}
