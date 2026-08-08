# Performance and Instant Discovery

## Status and scope

- **Reconciled:** 2026-08-08
- **Repository root:** `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`
- **Main baseline:** `82e3985765285ae63e4d2620b843bc6086fb4185`
- **Delivery branch:** `codex/ux-perf-01-performance-instant-discovery`
- **Governing decision:** [RFC-016 — Production Performance and Instant Discovery](../06_RFC/RFC-016-Production-Performance-and-Instant-Discovery.md)
- **Production baseline deployment:** `dpl_CoVwh2Z9KsQsNBMWW3tobeqty2WW`, source `82e3985765285ae63e4d2620b843bc6086fb4185`, Ready

**Detected on the UX-PERF-01 branch:** the measured interaction and delivery changes described here are implemented and locally verified. They are not represented as merged or deployed to Production.

**Detected:** the complete active repository was scanned before this baseline was written. Dependencies, generated output, build artefacts, caches and `tsconfig.tsbuildinfo` were excluded from source conclusions.

## Decision summary

The URL and server remain the discovery authority. Three existing server-rendered GET form families are progressively enhanced by one narrow client form wrapper:

`native control → FormData → URL search parameters → Next soft navigation → server parser → server service/repository → Server Component result`

The client serializes controls and provides navigation feedback only. It does not receive a discovery dataset, reproduce filtering rules, calculate eligibility, import Prisma or decide jurisdiction/commercial authority.

## Measurement method

### Production baseline

**Detected:** three cold-cache browser runs were taken for each route against `https://sevenbet-next.vercel.app` before implementation. Each table reports the median. Resource transfer bytes come from the browser Performance API. Cache was disabled for every run.

- Mobile: 390 × 844 viewport, 150 ms latency, 1.6 Mbps download, 750 Kbps upload.
- Desktop: 1440 × 1000 viewport, native network.
- Core timing: navigation TTFB plus paint/LCP/CLS observers.
- Inventory: HTML, JavaScript, CSS, image, font and request transfer totals.
- Production showed no third-party resource transfer and no `Server-Timing` header.

### Controlled post-change build

**Detected:** the same three-run browser harness was used against the local optimized production build. Local timing is not directly comparable to Vercel edge timing because the application and database path differ. It is retained as diagnostic evidence; emitted bundle size and transferred asset-shape changes are comparable.

**Planned release evidence:** repeat the route inventory on the exact-head Vercel Preview and record it below before Founder handoff.

## Production baseline — mobile median

All byte columns are transferred KiB, rounded to one decimal.

| Route | TTFB ms | FCP ms | LCP ms | CLS | HTML | JS | CSS | Images | Fonts | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 82.8 | 1,448 | 1,448 | 0 | 10.3 | 119.4 | 31.2 | 5.3 | 65.0 | 23 |
| `/casinos` | 80.6 | 2,428 | 2,428 | 0 | 15.8 | 116.8 | 27.3 | 1,092.5 | 34.4 | 19 |
| `/bonuses` | 82.7 | 1,600 | 1,600 | 0 | 20.6 | 122.4 | 28.6 | 0 | 65.0 | 21 |
| `/best-offers` | 82.5 | 1,280 | 1,280 | 0 | 7.8 | 125.7 | 28.0 | 0 | 34.4 | 19 |
| `/compare` | 83.0 | 1,308 | 1,592 | 0 | 25.4 | 120.8 | 26.2 | 3.2 | 34.4 | 22 |

## Production baseline — desktop median

| Route | TTFB ms | FCP ms | LCP ms | CLS | HTML | JS | CSS | Images | Fonts | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 82.6 | 684 | 684 | 0 | 10.3 | 123.5 | 31.2 | 217.5 | 65.0 | 33 |
| `/casinos` | 82.4 | 1,412 | 1,740 | 0 | 15.8 | 120.9 | 27.3 | 1,101.0 | 34.4 | 35 |
| `/bonuses` | 85.5 | 924 | 1,016 | 0 | 20.6 | 124.4 | 28.6 | 0 | 65.0 | 28 |
| `/best-offers` | 82.6 | 676 | 676 | 0 | 7.8 | 127.9 | 28.0 | 0 | 34.4 | 25 |
| `/compare` | 83.3 | 644 | 644 | 0 | 25.4 | 124.9 | 26.2 | 3.2 | 34.4 | 32 |

## Controlled post-change build — mobile median

| Route | TTFB ms | FCP ms | LCP ms | CLS | HTML | JS | CSS | Images + other media | Fonts | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 24.4 | 888 | 888 | 0 | 15.1 | 117.5 | 27.9 | 8.5 | 65.0 | 23 |
| `/casinos` | 712.4 | 1,332 | 1,332 | 0 | 38.0 | 120.7 | 29.5 | 29.5 | 34.4 | 21 |
| `/bonuses` | 53.3 | 1,068 | 1,068 | 0 | 49.0 | 121.2 | 30.8 | 8.8 | 65.0 | 22 |
| `/best-offers` | 15.7 | 820 | 820 | 0 | 11.2 | 123.6 | 24.8 | 1.3 | 34.4 | 19 |
| `/compare` | 490.8 | 1,096 | 1,096 | 0 | 41.9 | 119.7 | 23.3 | 3.2 | 34.4 | 22 |

## Controlled post-change build — desktop median

| Route | TTFB ms | FCP ms | LCP ms | CLS | HTML | JS | CSS | Images + other media | Fonts | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 12.4 | 116 | 116 | 0 | 15.1 | 119.4 | 27.9 | 240.2 | 65.0 | 32 |
| `/casinos` | 675.8 | 816 | 816 | 0 | 38.0 | 122.6 | 29.5 | 146.0 | 34.4 | 36 |
| `/bonuses` | 45.9 | 184 | 184 | 0 | 49.0 | 123.1 | 30.8 | 51.6 | 65.0 | 29 |
| `/best-offers` | 12.6 | 112 | 112 | 0 | 11.2 | 123.6 | 24.8 | 0 | 34.4 | 24 |
| `/compare` | 477.0 | 580 | 580 | 0 | 42.6 | 121.6 | 23.3 | 3.2 | 34.4 | 31 |

The local TTFB spread confirms that database/request-path timing needs Vercel Preview evidence before any server-latency claim. It does not invalidate the deterministic asset and interaction improvements.

## Ranked bottlenecks and dispositions

### P1 — raw casino theatre image

- **Detected cause:** `/casinos` emitted the 2,400 × 3,600 JPEG directly, including when the mobile presentation hid the theatre. The baseline browser transferred about 1.12 MB and the image was the desktop LCP element.
- **Retained fix:** Next Image now supplies bounded responsive candidates and preserves the approved 2:3 presentation. The controlled build transferred about 149 KB of desktop image/media and about 30 KB on mobile.
- **Measured impact:** approximately 87% less desktop media transfer for the route and about 97% less mobile media transfer relative to the raw baseline image total.
- **Visual boundary:** source crop, placement and Design System presentation remain unchanged.

### P1 — document navigation and route-wide discovery skeletons

- **Detected cause:** server GET forms required full document navigation. Route-level loading files replaced the discovery result surface during soft navigation and remained unresolved in no-JavaScript streamed output.
- **Retained fix:** real GET forms use `router.push` for discrete changes/submit and `router.replace` for 300 ms debounced text/numeric edits, both with `scroll: false`. A local transition state keeps the current results rendered and announces the update.
- **Measured impact:** browser regression detects RSC requests and no document request for enhanced changes; copied URLs, reload, back and forward restore server-derived state.
- **No-JavaScript result:** native form submit works on Casinos, Bonuses and Compare.

### P1 — commercial relations read after policy denial

- **Detected cause:** public casino, offer and comparison context reads included affiliate offers/redirect projections even after request jurisdiction denied commercial capability.
- **Retained fix:** repository projections accept `includeCommercial`; services omit commercial relations and operator evaluation after the server policy ceiling is false. Editorial aliases remain where their search contract requires them.
- **Impact:** eliminates denied-path commercial relation work without weakening editorial visibility or fail-closed authority.

### P2 — duplicate eager Home media

- **Detected cause:** both the creator and confidence images were marked priority although measured Home LCP was either creator imagery on mobile or the hero word “CONTROL” on desktop.
- **Retained fix:** creator remains priority; confidence is lazy. Desktop request count reduced from 33 to 32 in the controlled build.

### P2 — comparison query reuse experiment

- **Detected:** Compare metadata and page rendering can request the same server projection in one route lifecycle.
- **Reverted experiment:** React request memoization caused a successful RSC response header followed by a stalled stream in controlled navigation tracing.
- **Final disposition:** no cache was introduced. Correct dynamic behavior and navigation reliability take precedence; the duplicate projection remains a measured optimization candidate.

### Not detected

- No N+1 query pattern was detected in the governed route services.
- No broad unused-CSS or unused-font removal justified a visual-system change.
- No third-party front-end resource was detected in the browser baseline.
- No schema/index change was required for this delivery.

## Route interaction matrix

| Route | Enhanced controls | Navigation | Server authority | No-JS |
| --- | --- | --- | --- | --- |
| `/casinos` | hero/directory search, filter facets, market preference, sort, page size | search 300 ms replace; Enter/submit and discrete select/check push | canonical casino query parser and discovery service | native GET |
| `/bonuses` | categorical filters, sort, max deposit, max wagering | numeric fields 300 ms replace; discrete controls push | canonical offer query parser and offer service | native GET |
| `/compare` | up to three repeated casino selections and display preferences | discrete controls push | canonical comparison parser and comparison service | native GET |
| `/best-offers` | none applicable | unchanged | server shortlist remains authoritative; editorial carousel is not a discovery filter | N/A |

All filter refinements omit `page` so the canonical server parser resets pagination. Pagination links preserve the active query and retain ordinary push navigation.

## Pending, history and accessibility

**Detected:** `useTransition` supplies a bounded pending state. The current result region stays mounted, its busy state is exposed through `aria-busy`, and a polite live status announces the update without moving focus. Result counts retain bounded status output. Native labels, fieldsets, legends, keyboard controls and visible submit actions remain present.

**Detected:** search Enter cancels a pending debounce and submits immediately. Rapid typing emits one final replace navigation. Browser back/forward and reload reconstruct controls and results from URL/server state.

**Detected:** reduced-motion and Design System focus behavior are unchanged. No visual redesign, token change, new visual primitive or Figma change was made.

## LCP, bundles and assets

**Detected baseline LCP:** mobile Home creator image; desktop Home hero word “CONTROL”; desktop Casinos editorial theatre image; Casinos mobile H1; Bonuses H1/optimized editorial image depending viewport; Best Offers text; Compare initial loading H1.

**Detected production build output:** all five audited routes remain dynamic. Shared first-load JavaScript is 103 KB. Route output is:

| Route | Route JS | First-load JS |
| --- | ---: | ---: |
| `/` | 2.19 KB | 113 KB |
| `/casinos` | 3.57 KB | 115 KB |
| `/bonuses` | 3.79 KB | 115 KB |
| `/best-offers` | 6.43 KB | 118 KB |
| `/compare` | 2.80 KB | 114 KB |

The small client-island cost is deliberate and bounded. No dependency was added or upgraded.

## Cache and authority analysis

**Detected:** no route cache policy changed. Request-country headers, jurisdiction policy, operator evidence, agreement/offer/link/redirect readiness and kill-switch state stay request-time dynamic. `/r/[slug]` continues to recheck all authority. `/go/[slug]` remains externally disabled.

**Detected:** GB policy `gb-2026-08-08.1` continues to allow editorial content while commercial and referral capabilities remain false. A user country preference cannot assert location or unlock an action.

**Not detected:** Redis, a shared application cache, a new endpoint, positive cross-request eligibility caching, client authority or a client discovery dataset.

## Verification record

**Passed locally:**

- `npm run ci:quality` — lint, typecheck, Prisma validation, 182 structural assertions.
- `npm run gb-market:test` — 107 tests.
- `npm run comm-01:test` — 49 tests.
- `npm run ci:build-secrets` — 615 browser-deliverable files scanned.
- UX-PERF structural/service suite — 49 tests.
- UX-PERF production-style browser suite — 6/6 tests.
- Production build — success; all audited routes dynamic.

**Detected unrelated baseline:** five pre-existing Best Offers browser expectations assume a populated 12-card shortlist, while the current fail-closed runtime truth is “no eligible offers.” The Production baseline already had this state. UX-PERF-01 does not invent offers or modify commercial data to satisfy those fixtures.

**Detected local environment warning:** the local production build uses a direct Prisma endpoint and emits the existing pooled-runtime recommendation. This is not evidence about the deployed Vercel Production value.

## Data, dependency and rollback record

- **Detected:** no Prisma schema, migration, seed, Production data or synthetic-data change.
- **Detected:** no dependency addition or upgrade.
- **Detected:** no regulator, partner, agreement, offer, tracking, redirect or destination authority changed.
- **Detected:** no stash operation was used.
- **Rollback:** revert the reviewed application commits. Native GET semantics remain intact, so removing the enhancer returns document navigation without a database rollback or result-authority change.

## Remaining release evidence

- **Planned:** exact-head Preview measurements and all-route QA.
- **Planned:** exact-head required CI and Vercel checks.
- **Planned:** Preview runtime-log review and unchanged Production smoke/log review.
- **Planned:** Founder review and merge decision. The implementing agent must not merge the pull request.
