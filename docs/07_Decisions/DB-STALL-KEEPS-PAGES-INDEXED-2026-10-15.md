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
  stays (INFERRED from Next.js stale-while-revalidate behaviour: a failed background refresh keeps
  the stale entry). With no list yet, what could be read is used, as before.

## Release gates

- Merged and deployed: UNKNOWN at writing.
- Watch Production logs for `PUBLIC_CATALOGUE_UNAVAILABLE` during the next stall.
