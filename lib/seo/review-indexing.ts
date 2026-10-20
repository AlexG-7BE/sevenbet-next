import { BLOCKED_TARGETS } from "@/lib/market-access/blocked-targets";
import { CASINO_MARKETS } from "@/lib/market-access/register";

/**
 * A casino review is indexed in a language only where that language's market licenses the
 * casino (Founder decision, 15 October 2026: remove the ballast). A review of a casino with no
 * licence in its reader's market leads that reader to no offer, and on 15 October 2026 such pages
 * were 62 of the 108 reviews in the sitemap (en 8, sv 12, da 17, de 25): templated, about 290
 * words, and the bulk of Google's "Discovered – currently not indexed" queue (Search Console,
 * 9 October 2026). The page stays published and keeps `follow`; it only leaves the index, the
 * sitemap, llms.txt, IndexNow and the hreflang of its language versions.
 *
 * The rule reads the licence register (RFC-054), never the visitor's market or the hour, so a
 * page's robots value is the same for every crawler at every time (Germany's advertising window
 * closes offers by day; a rule on the live offer would take German reviews in and out daily).
 * Languages outside this map keep their own rules (they are `noindex` as languages today).
 *
 * A licensed market that cannot open yet (BLOCKED_TARGETS: no partner link, or no local site)
 * also keeps its review out of the index: the page leads that reader to no button (Founder's
 * choice in the affiliate traffic audit, 15 October 2026: Betsafe SE, Regency SE, PlayUZU SE,
 * DragonBet GB). The review returns to the index when its target leaves that list.
 */
export const REVIEW_INDEX_MARKETS: Readonly<Record<string, string>> = Object.freeze({
  en: "GB",
  sv: "SE",
  da: "DK",
  de: "DE",
  // UZBEK-LANGUAGE-2026-10-20: Uzbek follows the same rule. No casino holds a licence for
  // Uzbekistan in the register, so Uzbek reviews stay published and out of the index.
  uz: "UZ",
});

export function reviewIndexable(slug: string, language: string) {
  const market = REVIEW_INDEX_MARKETS[language];
  if (!market) return true;
  const key = slug.trim().toLowerCase();
  if (BLOCKED_TARGETS.some((target) => target.casinoSlug === key && target.market === market)) return false;
  return Boolean(CASINO_MARKETS[key]?.licensed[market]);
}

/**
 * The review's language versions for hreflang, without the ones kept out of the index;
 * `x-default` names the English review, so it goes with it.
 */
export function reviewLanguageAlternates(slug: string, alternates: Readonly<Record<string, string>>) {
  return Object.fromEntries(Object.entries(alternates)
    .filter(([language]) => reviewIndexable(slug, language === "x-default" ? "en" : language)));
}
