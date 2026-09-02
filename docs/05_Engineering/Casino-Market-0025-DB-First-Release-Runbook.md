# Casino Market 0025 DB-First Release Record

Status: **DETECTED — PRODUCTION MIGRATION COMPLETE; STEADY-STATE RELEASE CANDIDATE**

## Immutable migration

`0025_casino_market_profile_architecture` remains the final repository migration. Its SQL is 7,954 bytes with SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`. It adds the exact-market architecture without importing factual casino data or creating commercial authority.

## Production execution evidence

Founder-authorised execution completed on 1 September 2026 from release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d` in temporary Vercel deployment `dpl_HAU77Wih5w52nhNfWqaTWwJY7Y8X` for project `prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`.

The executor verified pooled `DATABASE_URL`, direct `DIRECT_URL`, and the same database identity before using the direct binding. Preflight found effective 0023 and 0024 completions with repository checksums, 0025 pending with no attempt row, no partial 0025 schema, and only safely superseded historical rollback attempts for `0002_program_builder` and `0015_active_control_program_flow`.

Postflight emitted `casino_market_0025_execution_succeeded` and verified:

- 0023, 0024, and 0025 completed with repository checksums;
- no pending or unresolved repository migration;
- complete 0025 schema, index, constraint, enum, and authority invariants;
- preservation counts unchanged: Casino 26, CasinoCountry 25, CasinoLicense 25, CasinoPaymentMethod 56, CasinoGameProvider 50, CasinoGameCategory 50, CasinoBonus 25, MediaAsset 1, AffiliateTrackingLinkCountry 0;
- zero migration-created evidence, licence links, market-scoped legacy relations, or Production-eligible routes.

The temporary build stopped intentionally at `CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP` and finished `ERROR`; it was never promoted. The prior runtime deployment `dpl_pe8Jgh28b6J2yLpbe8aeKJmgNybg` continued serving `b4gamble.com`.

## Durable steady-state contract

Normal Production builds are read-only for this release boundary. They require:

1. exact effective migration history with no unknown, unresolved, ambiguous, or unsuperseded rollback state;
2. 0023, 0024, and 0025 completed with repository checksums;
3. no pending repository migrations;
4. pooled/direct readiness and same database identity;
5. administrative inspection through `DIRECT_URL` in a PostgreSQL-enforced read-only, repeatable-read transaction;
6. 20-second statement, 5-second lock, and 60-second idle-in-transaction timeouts;
7. complete 0025 schema invariants and zero unexpected Production eligibility.

The durable branch contains no Production migration executor, probe launcher, ephemeral migration authority, or migration application path.

## Remaining release order

1. Merge the reconciled post-migration steady-state PR #114 after exact-head CI and Preview pass.
2. Rebase and validate PR #111 against that `main`, preserving this migration byte-for-byte and creating no 0026 duplicate.
3. Promote the exact-market runtime only after its own exact-head and Production acceptance gates.
4. Rebase and validate PR #112, then separately execute only an explicitly authorised, checksum-bound factual import.

Commercial route activation remains independent and fail-closed.

## Failure handling

Application/runtime failure uses a known-good Vercel runtime while retaining the additive 0025 schema. Database recovery remains forward-fix or isolated restore under RFC-024; never improvise reverse SQL, migration-history repair, or automatic schema rollback.
