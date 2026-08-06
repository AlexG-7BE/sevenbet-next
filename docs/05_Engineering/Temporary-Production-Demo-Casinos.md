# Temporary Production Demo Casinos

## Governing decision

RFC-012 authorises a temporary, synthetic dataset in the current production database. Separate Demo infrastructure and the future RFC-011 fixture-adapter proposal are out of scope.

## Detected implementation path

The current Prisma schema already represents casino profiles, countries, licences, payments, game providers, categories, bonuses, SEO, images, structured editorial reviews and governed affiliate redirects. `CasinoService` validates the draft, moves it through `DRAFT → IN_REVIEW → APPROVED`, and publishes an immutable `CasinoVersion` snapshot used by the public repository.

No schema change or migration is required.

## Dataset contract

The source-controlled manifest contains exactly these casino slugs:

- `demo-northstar`
- `demo-harbour`
- `demo-atlas`
- `demo-meadow`
- `demo-lantern`

All database identities owned directly by the seed are deterministic UUIDs. Static presentation assets live under `public/demo-casinos/` and are referenced by deterministic `CasinoImage` records included in the normal published snapshot.

`demo-northstar` is the only available visit-action example. Its governed tracking destination is the internal production profile `/casino/demo-northstar`. The other records deliberately have no active redirect mapping.

## Commands

- `npm run prod:demo-casinos:audit` performs read-only collision and environment checks.
- `npm run prod:demo-casinos:seed` creates or refreshes only the manifest records and publishes them through the existing workflow.
- `npm run prod:demo-casinos:verify` performs read-only database verification.
- `npm run prod:demo-casinos:cleanup` deletes only the exact manifest affiliate and casino IDs after identity checks.

Mutating commands require `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS=true`. For a remote production database, set `PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS=30000` on the seed or cleanup command so the existing audited repository transactions can tolerate network latency. The override is process-local and does not alter the deployed application's default transaction timeout. These commands never print connection strings or credentials.

The manifest intentionally exercises both existing public contracts: Northstar, Harbour, Atlas and Meadow expose the complete canonical Casino Profile, while Lantern exposes the separately published structured editorial-review presentation. This keeps rating, media, payment, licence and bonus sections demonstrable without changing the public renderer.

Synthetic licence records use the workflow-required `ACTIVE` state but remain explicitly fictional and unverified: there is no licence number, verification URL or `lastVerifiedAt`. Public verification requires both active status and actual verification evidence, so Demo profiles render `Needs review` / `Licence not verified`. Reserved documentation domains (`.example`, `.test`, `.invalid` and localhost) cannot become official-site links or structured-data operator URLs; the only available Demo action is the governed internal redirect for Northstar.

## Release checks

Before production seed: unit tests, typecheck, production build, read-only dataset audit and a successful production deployment containing the static assets.

After production seed: database verification and desktop/mobile smoke checks for `/casinos`, each `/casino/demo-*` profile, unavailable actions and the controlled internal redirect.

## Release evidence — 2026-08-06

- **Detected:** the production database contains the five exact manifest UUIDs at `PUBLISHED`, each with `publishedVersion: 3`; `prod:demo-casinos:verify` reports `issues: []`.
- **Detected:** `https://sevenbet-next.vercel.app/casinos` and all five `/casino/demo-*` profiles return HTTP 200 after the production deployment.
- **Detected:** Northstar redirects with HTTP 302 only to `https://sevenbet-next.vercel.app/casino/demo-northstar`, with `no-store` and `noindex`; the four other Demo redirect slugs return HTTP 404.
- **Detected:** desktop and mobile browser checks show no horizontal overflow or external links. Northstar renders rating, three media assets, payment, explicitly fictional licence and non-live bonus presentation with `Needs review`, `Licence not verified` and `Official site unavailable`; Lantern renders the structured editorial-review contract.
- **Detected:** country, payment, published-bonus, available-visit and crypto filters select the expected manifest subsets.
- **Detected:** targeted public/manifest regressions, typecheck, Prisma validation and production build pass. No Prisma schema or migration file changed.
