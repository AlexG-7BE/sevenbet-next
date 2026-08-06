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

Mutating commands require `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS=true`. They never print connection strings or credentials.

## Release checks

Before production seed: unit tests, typecheck, production build, read-only dataset audit and a successful production deployment containing the static assets.

After production seed: database verification and desktop/mobile smoke checks for `/casinos`, each `/casino/demo-*` profile, unavailable actions and the controlled internal redirect.
