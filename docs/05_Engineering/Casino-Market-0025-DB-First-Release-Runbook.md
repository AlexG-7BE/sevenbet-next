# Casino Market 0025 DB-First Release Runbook

Status: **PROPOSED** on the Release-03 candidate. No Production execution is authorised by this document.

## Release invariant

**DETECTED:** the candidate carries byte-identical migration `0025_casino_market_profile_architecture` at SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99` (7,954 bytes). It imports no research data and creates no commercial authority. The serving Prisma schema and application remain the pre-#111 runtime. The Production build preflight preserves the complete 0023/0024 checksum and Programme/MCP invariant checks, then requires 0025 to be applied and structurally valid.

**FOUNDER_DECISION_REQUIRED:** this candidate contains no automatic Production mutation path. A separately reviewed, one-time mechanism and exact operator authority are required to execute `prisma migrate deploy` against Production. The read-only guard deliberately stops deployment while 0025 is pending.

**PROPOSED FOLLOW-ON:** the dedicated operator mechanism and exact commands are documented in [Casino Market 0025 One-Time Operator](../06_Operations/Casino-Market-0025-One-Time-Operator.md). It is based on this candidate's exact head, is not merged or executed, and requires its own exact-commit Founder GO followed by a second decision after a real Production dry run.

## Ordered release

0. Record current `main`, current Production deployment, exact Release-03 head, the checksum above, and read-only Production migration state. Confirm the effective 0024 attempt is completed with the repository checksum, every historical rollback is superseded by a later valid completion for the same repository migration, no unresolved or unsuperseded attempt exists, and the only repository-pending suffix is 0025.
1. Founder gives an explicit GO for the exact DB-first release and separately approves the reviewed one-time migration mechanism. HOLD if either authority is absent.
2. Merge only the exact reviewed Release-03 head. Do not enable auto-merge.
3. Before mutation, capture the bounded counts for Casino, CasinoCountry, CasinoLicense, CasinoPaymentMethod, CasinoGameProvider, CasinoGameCategory, CasinoBonus, MediaAsset, and AffiliateTrackingLinkCountry. Run the partial-schema and legacy-index preflight. Do not log Programme/customer content.
4. Apply exactly migration 0025. Evidence must show: `0024 verified → exact 0025 pending → hazard/count preflight passed → 0025 applied → postflight passed`.
5. Verify the 0025 migration row and checksum, zero unresolved/pending migrations, exact enums/columns/composite foreign keys/partial and market indexes, MediaAsset ownership check, and `productionEligible` default false. Prove preserved counts, zero invented evidence/licence links/scoped legacy rows, and zero real route eligibility.
6. Keep the pre-#111 runtime serving and run public/application smoke. The disposable old-client proof is `casino-market-release:postgres-test`.
7. Founder reviews migration evidence. Only then merge Release-04, which retains read-only 0025 verification and contains no mutation runner.
8. Rebase/update PR #111 onto the resulting main. Keep the already-applied 0025 file byte-identical; do not create a duplicate 0026. Run exact-head CI and Preview.
9. Founder separately decides #111 runtime promotion.
10. After runtime verification, update/rebase #112. Founder separately decides ingestion-tooling promotion.
11. Founder separately decides any real Betsson factual import. Commercial activation remains a later independent gate.

## Stop conditions

Stop on unknown database identity, non-Production mutation context, missing or checksum-invalid effective 0023/0024 state, any unresolved or unsuperseded rolled-back attempt, ambiguous or unknown migration history, any attempted 0025 row while it is expected pending, a pending suffix other than exact 0025, target checksum mismatch, partial manual 0025 objects, changed preservation counts, missing postflight object, or any `productionEligible=true` route. Never mutate migration history or auto-repair schema drift.

## Rollback and failure response

- **Before 0025 completes:** do not deploy the new runtime. Keep the current Production deployment. Inspect Prisma history; do not manually drop partial objects without a separately reviewed recovery procedure.
- **After 0025 completes, application release issue:** roll the application deployment back to the previous known-good runtime and keep the additive 0025 expansion.
- **Later #111 runtime failure:** return to the pre-#111 deployment; 0025 remains.
- **Later import failure:** use a separate ingestion recovery procedure. Do not mix factual-row recovery with schema rollback.
