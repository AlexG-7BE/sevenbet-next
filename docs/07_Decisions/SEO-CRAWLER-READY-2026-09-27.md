# Crawler-ready pages, llms.txt and robots rules

**Status:** PROPOSED — NOT YET LIVE until merged and deployed

**Decision authority:** explicit Founder approval, 27 September 2026, of "Package C2 — crawler-ready metadata and AI-search basics" after the pre-launch audit (the day before the GB/SE/DK/DE launch).

## Decision

- **Only a real browser gets the instant route frame.** The home page (`/` and the language homes) and the four commercial pages (`/casinos`, `/bonuses`, `/best-offers`, `/casino/[slug]`) stream their loading frame only when the request carries Fetch Metadata (`Sec-Fetch-Mode` or `Sec-Fetch-Dest`, sent by every current browser) and the user agent is not a crawler (`lib/seo/route-frame.ts`). Crawlers, AI agents and HTTP libraries get the complete page in the first response. People see no change. This supersedes the 25 September rule that gave the frame to every user agent the crawler pattern did not match.
- **Metadata is in `<head>` for every crawler.** `htmlLimitedBots` in `next.config.mjs` is Next's default list plus the crawler pattern of `lib/seo/crawler.ts` (Googlebot and Bingbot included) and common AI-agent HTTP clients.
- **llms.txt leads with what B4GAMBLE compares.** It states the comparison (reviews and bonus terms, editor scores 0–10) and the launch markets, links each market's entry pages and every published review by its canonical URL, keeps the Programme as its own section, and links the policies. The sentence about a "clearly labelled demonstration … fictional" inventory is gone: no demonstration inventory is live. This supersedes the 2 September positioning ("a responsible gambling platform … casino comparisons and bonus offers are secondary resources").
- **llms-full.txt lists current offers per launch market.** For GB, SE, DK and DE it lists the offers that market's Bonuses page presents at request time, with the page's market-access rules (licence, operator blocks, Germany's 21:00–06:00 window) and order, the terms and a link to the review. It has no partner or `/r/` link and never depends on the requester's IP: each market's authority is resolved from that market's own country with a trusted signal.
- **robots.txt closes click redirects.** `Disallow: /r/`, `/go/` and `/outbound/` for every agent, repeated in the AI group because a named group ignores `*`. `/api/` stays open. The non-standard `Host:` line is removed.
- **One indexing rule for the Bonuses page and the sitemap** (`lib/seo/product-indexing.ts`). The sitemap applies it to what a crawler is shown (every published offer, no market closure), so `/de/bonuses` no longer leaves the sitemap during German daytime while the page stays `index, follow`.
- **`/program` in languages closed to search is noindex** with hreflang limited to the open languages (`en`, `de`, `sv`, `da`), like every other page under [SEO-INDEX-DE-SV-DA-2026-09-27](SEO-INDEX-DE-SV-DA-2026-09-27.md).
- **Learn guides declare only the language they exist in**; `de`/`sv`/`da` Learn hubs list the English guides marked as English; switching language on a guide lands on the target language's Learn hub. The retired `sports-betting-basics/sports-betting-odds-basics` guide redirects permanently to `sports-betting-basics/sportsbook-bonus-basics`.
- **IndexNow**: the public key is served at `/219017cffaba5177842beab195a2564c.txt`; publishing a casino or a guide announces the changed URLs from Production, best effort, after the response.

## Evidence

- `tests/crawler-ready-metadata.test.ts` (`npm run seo-crawler:test`, part of `ci:quality`) pins `htmlLimitedBots`, robots, the structured data, review metadata, Learn hreflang and fallback, the Programme metadata, the German and Danish titles, the shared Bonuses rule, llms.txt, llms-full.txt and IndexNow.
- `tests/commercial-pages-streaming.test.ts` pins the browser-only frame on the home page and the commercial pages.
