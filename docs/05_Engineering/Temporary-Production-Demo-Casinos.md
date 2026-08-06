# Temporary Production Demo Casinos

## Governing decision

RFC-012 authorises exactly 25 temporary synthetic casino aggregates in the current production database and a public-offer projection for `/best-offers` and `/bonuses`. Separate Demo infrastructure and the future RFC-011 fixture adapter remain out of scope.

## Detected implementation path

The existing schema represents casino profiles, countries, licences, payments, game providers, categories, bonuses, SEO, images, structured editorial reviews and governed redirects. `CasinoService` validates a draft, moves it through `DRAFT → IN_REVIEW → APPROVED` and publishes an immutable `CasinoVersion` snapshot.

`PublicCasinoRepository` selects only the latest published snapshot for a currently published, non-archived casino. `PublicOfferRepository` maps those public-safe snapshots to `PublicOfferDTO`; `PublicOfferService` owns filtering, sorting, facets and pagination. Pages do not import Prisma. Missing redirect authority preserves editorial offers with unavailable actions.

No schema change or migration is required.

## Dataset contract

The factory-driven manifest contains exactly:

- `demo-northstar`, `demo-harbour`, `demo-atlas`, `demo-meadow`, `demo-lantern`
- `demo-summit`, `demo-ember`, `demo-tide`, `demo-juniper`, `demo-orbit`
- `demo-quartz`, `demo-willow`, `demo-beacon`, `demo-forge`, `demo-aurora`
- `demo-cedar`, `demo-vale`, `demo-cobalt`, `demo-drift`, `demo-solstice`
- `demo-meridian`, `demo-mosaic`, `demo-plume`, `demo-prism`, `demo-canopy`

Every aggregate has one active published synthetic bonus, three deterministic media assets and explicit fictional disclosures. Eighteen scenarios are `GB`-available; twelve are featured for the default shortlist. Types, terms, currencies, payments, crypto states, scores and presentation modes vary through scenario overrides.

Five casino-level internal routes are allowed: Northstar, Harbour, Atlas, Lantern and Summit. Each resolves only to its own `https://sevenbet-next.vercel.app/casino/demo-*` profile. The other 20 offer actions are unavailable.

All seed-owned database identities are deterministic UUIDs. Re-running the v2 seed skips unchanged published snapshots and upserts the same five affiliate graphs, producing no duplicate casino, bonus, media, affiliate or redirect records.

## Public offer behavior

`/best-offers` uses a strict GB shortlist of records with complete published material terms and returns up to 12 records. The canonical order is editor score, featured/recommended flags, lower wagering, lower minimum deposit, payout evidence and stable casino/bonus slug tie-breakers after the eligibility gates. The page shows the leading three in a carousel and all selected records in the ranked ledger. Separate generic selectors choose the overall leader, the lowest non-null wagering value and the fastest normalized published withdrawal-time bucket; they contain no operator slug rules. `/bonuses` uses the same service boundary with page size 24 and URL filters for country, type, payment, crypto, deposit, wagering, availability, sort and page.

Draft, unpublished, archived, future and expired bonuses are ineligible. Material terms and review access render before action. The public contract contains no tracking or destination URL, partner identifier, credential or internal note. CMS retrieval failures fail closed; legacy data is available only when CMS mode is explicitly disabled and its actions are scrubbed to unavailable.

## Commands

- `npm run prod:demo-casinos:assets` deterministically generates the 75 SVG assets.
- `npm run prod:demo-casinos:audit` performs read-only identity, collision, actor and schema checks.
- `npm run prod:demo-casinos:seed` creates or refreshes exact manifest records through the existing publication workflow.
- `npm run prod:demo-casinos:verify` checks the production database, public-offer counts, GB coverage, shortlist and redirect safety.
- `npm run prod:demo-casinos:cleanup` deletes only exact manifest affiliate and casino IDs after identity checks.

Mutating commands require `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS=true`. Remote mutations should set `PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS=30000` for the existing audited interactive transactions. Commands do not print connection strings or credentials.

## Cleanup contract

Cleanup validates fixed casino ID, slug and domain triplets plus affiliate ownership, then deletes exact redirect, offer, program, network and casino IDs. Casino-owned snapshots, revisions, editorial records and relations are removed only through existing foreign-key cascades. Prefix deletion, unknown-record deletion and `startsWith("demo-")` deletion are absent and prohibited.

## Release gates

Before production seed:

- targeted public-offer, public-casino, discovery, redirect and manifest regressions;
- typecheck, Prisma validation, production build and `git diff --check`;
- read-only production audit with no collisions;
- deployed code and all 75 assets;
- green PR #20 checks.

After production seed:

- exact 25 casino records and at least 25 eligible public offers;
- at least 18 GB-eligible offers and 12 default Best Offers records;
- five and only five safe internal redirects;
- desktop/mobile and no-JavaScript smoke for `/casinos`, `/best-offers`, `/bonuses` and representative profiles;
- URL filter, facet, pagination, empty-state, metadata and action verification.

## Evidence

- **Detected:** application commit `5c05b54` is deployed at `https://sevenbet-next.vercel.app`; the production build completed successfully.
- **Detected:** the v2 production seed published exactly 25 manifest casinos through the existing CMS workflow. Verification reports 25 eligible offers, 18 GB-eligible offers, the required 12-record default shortlist, five controlled routes and `issues: []`.
- **Detected:** a second production seed classified all 25 records as `Unchanged`; no casino publication version increased and the same five routes were upserted.
- **Detected:** each representative production profile renders logo, hero, screenshot, score, bonus, country/payment/licence context and pros/cons. Across the manifest, 75 deterministic SVG assets are present.
- **Detected:** production `/best-offers` returns 12 records. Unfiltered `/bonuses` returns 25 with 24 on page one and one on page two; observed filter totals are GB 18, free spins 4, Visa 25, crypto 6, maximum deposit 10 = 16, maximum wagering 30 = 13 and available action = 5.
- **Detected:** `/r/demo-northstar`, `/r/demo-harbour`, `/r/demo-atlas`, `/r/demo-lantern` and `/r/demo-summit` return `302` only to their own SevenBet profiles; `/r/demo-meadow` returns `404`. Public offer/profile HTML contains no external action href.
- **Detected:** focused public-offer and public-casino tests, typecheck, Prisma validation, local and Vercel production builds pass. Production Playwright discovery/offer desktop, mobile, URL-authority, no-JavaScript and overflow smoke passes 10/10.
- **Detected, FE-MIG-08 tuning:** only Northstar, Harbour, Atlas and Juniper carry the `best-offers-r1` manifest revision. Their published versions are 5, 5, 5 and 2. The strict selectors choose Northstar overall, Harbour at 20× for lower wagering and Atlas in the under-two-hours withdrawal bucket. The first seed retained 25 eligible / 18 GB / 12 shortlist / five controlled routes with `issues: []`; an identical second seed reported all 25 records `Unchanged`.
