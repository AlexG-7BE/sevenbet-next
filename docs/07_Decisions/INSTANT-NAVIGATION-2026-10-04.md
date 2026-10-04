# Instant navigation: destinations load before the click

**Status:** ACCEPTED; **PROPOSED — NOT YET LIVE** until merged and deployed

**Decision authority:** explicit Founder instruction, 4 October 2026: a page change must take
0.1 s, at most 0.3 s. The Founder was offered prefetching ahead of the click, with the trade-off
that a prefetched page may show a slightly old offer, and answered that transitions must be
instant.

## Why

Functions and the database run in the United States (`iad1`). A client navigation that asks the
server for its page costs at least one round trip plus the render. Measured on 25 September and
4 October 2026: 0.15–0.7 s from Great Britain, Sweden and Denmark, and 3–4 s on a cold lambda
after a deploy. Only a page that is already in the browser can open in 0.1–0.3 s.

## Decision

This supersedes the Navigation Performance Stage 2 rule "primary navigation remains deliberately
unprefetched" ([17_Navigation_Performance_Stage_2](../05_Engineering/Technical_Baseline/17_Navigation_Performance_Stage_2.md)).

- **Primary destinations ahead of time.** Once the current page has settled (document complete,
  no loading frame, commercial navigation resolved or not timed out), the public shell prefetches
  every header and drawer destination in an idle callback. Those are Best Offers, Casinos,
  Bonuses and Learn.
- **Other links on intent.** Footer links, Learn offer bridges, Learn guide cards and casino
  review links prefetch on a 50ms mouse hover, a touch or keyboard focus. Opening the mobile drawer
  prefetches its links.
- **Never prefetched:** `/r/`, `/go/`, short links (`/t/`, `/x/`, `/ig/`, `/fb/`, `/threads`,
  `/lana`), `/api/`, `/admin`, `/outbound`, `/unsubscribe` and partner previews, with or without a
  language prefix. A prefetch is a GET and would count as a visit or a click there.
- **The current page comes first.** Nothing is prefetched while the current page is still loading
  or waiting on its commercial state, so a prefetch never competes with it.
- **Freshness.** Next keeps a full prefetch for five minutes (`staleTimes.static`, default). A
  prefetched page can therefore show an offer up to five minutes old. Every outbound click still
  goes through `/r/`, which checks the market register, activation and GEO at click time and sends
  a refused click to the recovery page. Links keep `prefetch={false}`, so there is no viewport
  fan-out across lists.

## Consequences

- A primary destination opens from the browser with no second request. The Stage 2 browser spec
  asserts it, measured in the page from click to the first painted offer card, under 300ms.
- Each settled page view adds about four background renders (the primary destinations). Each
  render reads the 60-second editorial cache and resolves the visitor's actions. Watch database
  load as traffic grows.
- A tap that reaches a page before its prefetch completes waits for the rest of the response, with
  the top progress bar and the 700ms pill
  ([TRANSITION-FEEDBACK-AND-MARKET-NAME-2026-09-25](TRANSITION-FEEDBACK-AND-MARKET-NAME-2026-09-25.md)).
- A first visit (a document load) still pays the server round trip. Moving functions and the
  database to Europe remains a separate Founder decision (deferred 25 September 2026).
