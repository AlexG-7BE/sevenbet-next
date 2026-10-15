/**
 * Learn guides that were published, indexed and then retired, mapped to their successor
 * (`category/slug` → `category/slug`). The article page answers a retired path with a
 * permanent redirect instead of a 404, so search engines move the old URL's signals on.
 *
 * - `sports-betting-basics/sports-betting-odds-basics` was indexed and now 404s; the
 *   sports guide that replaced it is `sports-betting-basics/sportsbook-bonus-basics`
 *   (docs/06_Operations/B4GAMBLE-Learn-Publication-2026-09-17.md; audit 27 Sep 2026).
 * - Two pause guides answered the same search as a newer one (Founder decision, 15 October
 *   2026: remove the ballast). Swedes search "ta bort Spelpaus" far more than "häva", and Danes
 *   "melde sig ud af ROFUS" about five times more than "fortryde" (content repo
 *   research/demand/DEMAND-MAP.md), so `hava-spelpaus` (Swedish) moves to `ta-bort-spelpaus`
 *   and `fortryde-rofus` (Danish) to `melde-sig-ud-af-rofus`. The retired guides are archived
 *   in the admin, not deleted; each exists in one language only.
 */
export const RETIRED_ARTICLE_SUCCESSORS: Readonly<Record<string, string>> = Object.freeze({
  "sports-betting-basics/sports-betting-odds-basics": "sports-betting-basics/sportsbook-bonus-basics",
  "responsible-gambling/hava-spelpaus": "responsible-gambling/ta-bort-spelpaus",
  "responsible-gambling/fortryde-rofus": "responsible-gambling/melde-sig-ud-af-rofus",
});

export function retiredArticleSuccessor(category: string, slug: string) {
  const successor = RETIRED_ARTICLE_SUCCESSORS[`${category}/${slug}`.toLowerCase()];
  if (!successor) return null;
  const [successorCategory, successorSlug] = successor.split("/");
  return { category: successorCategory, slug: successorSlug, path: `/learn/${successor}` };
}
