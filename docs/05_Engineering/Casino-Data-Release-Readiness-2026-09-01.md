# Casino Data Release Readiness — 1 September 2026

Status: **PROPOSED RELEASE SEQUENCE; FOUNDER DECISIONS REQUIRED**. This record does not authorise a merge, Production deployment, Production database access or mutation, factual import, commercial activation, or asset publication.

## Detected current state

- **DETECTED — authority baseline:** the release work started from `origin/main` at `f12d5f35dd5ec36257dd7e1d29a3ca38b16d1e73`.
- **DETECTED — architecture:** PR #111, `codex/casino-data-arch-01`, is open and unmerged against `main`. Its corrected code head is `00a86dfb69bdf9ddff45b9abac7762d391dab02b`; exact-head Agent Core, Quality, Build / Browser, Database / Migration Verification and Vercel checks passed. The correction prevents an unqualified public projection from combining different country profiles.
- **DETECTED — ingestion:** PR #112, `codex/casino-data-ingest-02`, is open and unmerged against PR #111's branch. Its corrected head is `1e0f2d9702d2483125e1608ea46ed9f4b20f1521`; Vercel passed, and local exact-head typecheck, lint, unit, clean migration replay, PostgreSQL ingestion and idempotency verification passed. Its source guard resolves real paths and its disposable database guard rejects query-based identity overrides.
- **DETECTED — DB-first release:** PR #113, `release/casino-market-0025-db-first`, is open and unmerged against `main`. It carries migration 0025 without the #111 application schema/runtime, adds staged and clean replay checks, verifies compatibility with the current pre-#111 Prisma client, and makes Production preflight read-only/fail-closed while 0025 is pending. The last code-bearing correction updated recovery verification for 0025 at `bc3a332`; focused recovery (25/25), release guard (8/8) and structural (292/292) tests passed locally. Exact-head hosted CI remains the live authority after each documentation-only update.
- **DETECTED — cleanup:** PR #114, `release/casino-market-0025-post-migration-cleanup`, is open and unmerged, stacked on PR #113. It removes the temporary pending-state inventory helper after 0025 is independently verified and retains a read-only steady-state guard. It contains no migration runner.
- **DETECTED — migration:** `0025_casino_market_profile_architecture/migration.sql` is 7,954 bytes with SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`. A deliberately failing disposable PostgreSQL probe showed its transactional DDL was rolled back atomically; no partial 0025 objects remained. Clean replay, staged 0024→0025 replay, idempotent verification, preservation checks, and the pre-#111 client smoke passed.
- **DETECTED — CI and Preview:** PR #111's exact head is fully green. PR #112's corrected head has green local release evidence and Vercel. PR #113 has green local release evidence, green hosted Database / Migration Verification and Agent Core evidence on its first head, and a subsequently corrected recovery-test expectation; the final exact-head hosted result must be read from GitHub. Vercel Preview builds passed for PRs #111–#114. No intentional Production deployment was performed.
- **DETECTED — frozen research:** Phase 1 remains 53 files at aggregate SHA-256 `3ed74f971ba7979b5a2da434698d67f1871148552ed4442eb5d21147d3a74cd9`. Phase 1.5 remains 20 files at aggregate SHA-256 `85a03152fd30e24c0cbf9bf0dddf65baf77c039d4fab3261f5e57439b5f36198`.
- **DETECTED — asset corpus:** the frozen asset manifest remains SHA-256 `985afb8719a70cc1fa9e8e5b2614e4c07126d3c176013b2c49ccc2a91bc89517`. The non-authoritative mapping covers 50 portal records: 29 available associations, 28 unique binaries, and 21 unavailable records. All 17 permitted Betsson renderer retries returned HTTP 530 (`DOWNLOAD_UNAVAILABLE_PROVIDER_ERROR`); no response, credential, or session token was persisted. All 50 remain `publicationEligible=false`.
- **PROPOSED — asset ownership:** 46 creative records conceptually map to `AFFILIATE_OFFER` and four landing-only records to `COMMERCIAL_ONLY`. This is a schema mapping proposal, not publication or commercial authority.

## Next-batch factual readiness

| Casino | Global identity | Evidenced market | Factual ingestion | Separate commercial state | Assets |
|---|---|---|---|---|---|
| Betsson | READY | PE READY; SE READY | READY in the reviewed bundle | Report-only; not Production eligible | 17 records; 0 binaries |
| Hello Casino | PARTIAL | GB PARTIAL | PARTIAL | GB denied/KYC-gated; no route authority | 0 |
| Skol Casino | PARTIAL | GB PARTIAL | PARTIAL | GB denied/KYC-gated; no route authority | 0 |
| Diamond7 | PARTIAL | GB PARTIAL | PARTIAL | GB denied; campaign evidence contradictory | 33 records; 29 associations; 28 binaries |
| G'day Casino | PARTIAL | GB PARTIAL | PARTIAL | GB denied; route unknown | 0 |
| 21 Privé | PARTIAL | GB PARTIAL | PARTIAL | GB denied; route unknown | 0 |
| Slotnite | PARTIAL | GB PARTIAL | PARTIAL | GB denied; route unknown | 0 |
| DragonBet | READY | GB PARTIAL | PARTIAL | latest observed account state Disabled | 0 |
| Gentleman Jim | READY historical identity | GB BLOCKED | BLOCKED | Disabled; stale portal inventory | 2 metadata records; 0 binaries |

**DETECTED:** Hello and Skol can have partial factual GB profiles while their Superfly commercial routes remain ineligible. Diamond7's direct click-ID evidence and harmless literal `{affid}` observation do not establish market or route approval. DragonBet and Gentleman Jim factual evidence does not override their latest separate Disabled commercial state.

## Not yet done

- **NOT DONE:** migration 0025 has not been applied to Production.
- **NOT DONE:** PR #111's runtime is not in Production.
- **NOT DONE:** PR #112's ingestion tooling is not in Production.
- **NOT DONE:** no real casino factual records have been imported to Production.
- **NOT DONE:** no affiliate offer, route, campaign, tracking, redirect, or other commercial authority has been activated.
- **NOT DONE:** no asset has been published.

## Founder gates remaining, in order

1. **FOUNDER_DECISION_REQUIRED:** GO / HOLD on the exact final head of PR #113 after exact-head hosted checks are green.
2. **FOUNDER_DECISION_REQUIRED:** if GO, separately approve an exact one-time Production migration mechanism and operator. PR #113 deliberately contains no automatic Production mutation capability.
3. **FOUNDER_DECISION_REQUIRED:** after independent 0025 evidence, GO / HOLD on PR #114's exact rebased head.
4. **FOUNDER_DECISION_REQUIRED:** after 0025 and cleanup are established, GO / HOLD on the updated exact head of PR #111 for runtime promotion.
5. **FOUNDER_DECISION_REQUIRED:** after runtime verification, GO / HOLD on the updated exact head of PR #112 for ingestion-tooling promotion.
6. **FOUNDER_DECISION_REQUIRED:** separately authorise or reject an exact real factual-data import plan. This does not confer commercial authority.
7. **FOUNDER_DECISION_REQUIRED:** separately authorise or reject each commercial route and each asset publication after its own evidence and controls are complete.

## Risks and technical debt

- **DETECTED:** PRs #111 and #112 are stacked while PRs #113 and #114 form a separate DB-first stack. Their documented reconciliation order must be followed to avoid migration duplication or guard loss.
- **DETECTED:** the current Production-style runtime cannot use the new market models, but the disposable old-client smoke proves the additive 0025 schema remains compatible while that runtime continues serving.
- **DETECTED:** Production preflight will stop while 0025 is pending. This is intentional; operational release remains blocked until a separately reviewed one-time migration mechanism is authorised.
- **UNKNOWN:** live Production migration history, schema shape and preservation counts were not accessed in this workstream.
- **UNKNOWN:** the 17 Betsson creative binaries remain unavailable because the official renderer returned HTTP 530.
- **CONTRADICTION:** Betsson Peru operator-footer reference `21002586020000` maps to Betsafe in regulator evidence; the reviewed bundle preserves the contradiction rather than resolving it by inference.
- **CONTRADICTION:** Diamond7 attribution mechanics were directly confirmed while campaign-list availability remained empty; neither is converted into Production route authority.

## Supporting records

- `docs/05_Engineering/Casino-Market-0025-DB-First-Release-Runbook.md`
- `docs/05_Engineering/RUNTIME_PROMOTION_HANDOFF.md`
- `docs/05_Engineering/INGESTION_PROMOTION_HANDOFF.md`
- `research_staging/affiliate_asset_mapping_2026-09-01/`
- `research_staging/casino_next_batch_2026-09-01/`
