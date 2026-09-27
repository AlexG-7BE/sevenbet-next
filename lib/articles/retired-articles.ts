/**
 * Learn guides that were published, indexed and then retired, mapped to their successor
 * (`category/slug` → `category/slug`). The article page answers a retired path with a
 * permanent redirect instead of a 404, so search engines move the old URL's signals on.
 *
 * - `sports-betting-basics/sports-betting-odds-basics` was indexed and now 404s; the
 *   sports guide that replaced it is `sports-betting-basics/sportsbook-bonus-basics`
 *   (docs/06_Operations/B4GAMBLE-Learn-Publication-2026-09-17.md; audit 27 Sep 2026).
 */
export const RETIRED_ARTICLE_SUCCESSORS: Readonly<Record<string, string>> = Object.freeze({
  "sports-betting-basics/sports-betting-odds-basics": "sports-betting-basics/sportsbook-bonus-basics",
});

export function retiredArticleSuccessor(category: string, slug: string) {
  const successor = RETIRED_ARTICLE_SUCCESSORS[`${category}/${slug}`.toLowerCase()];
  if (!successor) return null;
  const [successorCategory, successorSlug] = successor.split("/");
  return { category: successorCategory, slug: successorSlug, path: `/learn/${successor}` };
}
