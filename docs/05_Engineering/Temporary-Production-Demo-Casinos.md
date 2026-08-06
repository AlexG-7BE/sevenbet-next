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

`/best-offers` uses the GB shortlist, returns up to 12 records and shows three featured cards before the remaining comparison list. `/bonuses` uses the same service with page size 24 and URL filters for country, type, payment, crypto, deposit, wagering, availability, sort and page.

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

- **Detected:** the v1 production dataset currently contains the original five published records and Northstar internal route.
- **Detected:** the v2 read-only production audit finds those five expected identities, an eligible governed actor and no collisions after preserving Northstar's existing casino-level route contract.
- **Detected:** local manifest/public-offer tests, typecheck, Prisma validation, production build and responsive/no-JavaScript offer-page smoke pass.
- **Planned:** production deployment, v2 seed, repeated convergence check and final production browser evidence.
