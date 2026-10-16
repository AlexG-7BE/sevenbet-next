# A database stall must not take commercial pages out of the index

**Status:** ACCEPTED — built on 16 October 2026 in branch `fix/db-stall-keeps-pages-indexed`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged, deployed and
observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026 — the Founder's choice in the
affiliate traffic audit («выбор Фаундера в аудите партнёрского трафика»), item 10.

Ordinary reliability work: no RFC, no database change, no migration, no change to the pool code
of PR #520/#521, any offer, route, the Programme or Help.

## Why

**DETECTED (15 October 2026):** when the Prisma Postgres pooled endpoint stalls and no cached copy
exists, a live review answered 404 (`findPublishedCasino` and `getCasino` turned a failed read into
"not found"), `/bonuses` and `/best-offers` marked themselves `noindex`, and the sitemap dropped the
market's reviews and directories. Every casino update clears the catalogue cache and announces the
review to IndexNow, so the crawler arrived exactly when nothing was cached.

## What changes

- **Review pages:** the page asks `findPublishedCasino` and `getCasino` with
  `{ throwOnUnavailable: true }`; a failed read throws `PublicCatalogueUnavailableError`, which the
  route's error boundary answers as a server error. Only a casino that is not published answers 404.
  Other callers keep the old `null`.
- **CONTRADICTION with the brief (503 + Retry-After):** a Next.js App Router page cannot set its own
  status or headers; an error thrown while rendering is answered **500**. Googlebot treats 500 and
  503 alike as temporary server errors and retries; neither removes a page on one occurrence, as a
  404 does. A real 503 would need middleware to know the database state, which it does not.
- **`/bonuses` and `/best-offers`:** an unavailable inventory (the stall) no longer sets
  `noindex`; the page keeps the robots value it has when the data is there.
- **Sitemap:** each market's product URLs come from `lastGoodMarketProductPaths`, an
  `unstable_cache` entry (`sitemap-market-products-v1`, 10 minutes, no tag a casino update
  clears). A snapshot with any part unread throws instead of being stored, so the previous list
  stays (DETECTED in Next.js 15.5 `unstable-cache.js`: a rejected background refresh is logged
  and the stale value returned, no new entry is written). With no list yet, what could be read is
  used, as before.
- **Sitemap, Learn guides (follow-up, 16 Oct 2026):** each language's guides come from
  `lastGoodPublishedArticles`, an `unstable_cache` entry (`sitemap-learn-articles-v1`, 10
  minutes, no tag). Every publish clears the article list cache, so before this a stall right
  after a publish listed no guides for that language. A failed read throws instead of being
  stored; with no list yet and no database answer, the language lists no guides. Only category,
  slug and update date are cached. A nested `unstable_cache` is bypassed inside the outer one, so
  each refresh reads the database directly and the article tag never reaches this entry.

## Release gates

- Merged and deployed: PR #525 reached Production on 15 Oct 2026, 21:38 UTC (c7e4f540). The Learn guides
  follow-up: UNKNOWN at writing.
- Watch Production logs for `PUBLIC_CATALOGUE_UNAVAILABLE` during the next stall.
