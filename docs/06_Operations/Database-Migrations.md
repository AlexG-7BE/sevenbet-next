# Database Migrations

## Current implementation

- **Detected:** Prisma 6 targets PostgreSQL through `DATABASE_URL` and `DIRECT_URL`.
- **Detected:** committed migration history exists and is applied with `prisma migrate deploy`.
- **Detected:** PR CI starts a fresh PostgreSQL 16 service, validates/generates Prisma, runs the existing idempotent migration-0015 enum preflight, applies every committed migration and performs representative connected reads.
- **Detected:** the CI guard refuses non-loopback hosts, ports other than 5432, database names without the `_ci` suffix, and execution without `CI=true`.
- **Detected:** Vercel Production exposes the normal pooled runtime binding and a direct binding for the same Prisma Postgres database identity; the Production build preflight verifies that relationship without printing credentials.
- **Not detected:** a permanent approved automatic Production migration hook. Production schema mutation remains an explicit controlled action.

Migration 0015 adds `MISSION_COMPLETION` to a PostgreSQL enum and later uses it. PostgreSQL requires the new enum value to be committed first. On a fresh database, apply unchanged migrations 0001–0014 with Prisma, run the committed `prisma/preflight/0015_active_control_program_flow.sql` in its own transaction, then run normal `prisma migrate deploy` for unchanged migration 0015 onward. The preflight is idempotent; this is a historical replay requirement, not permission to edit migration history.

## Production migration 0020 — completed 20 August 2026

**DETECTED — `0020_commercial_ops_01` was applied to the B4GAMBLE Production Prisma Postgres database and verified as completed.**

Execution evidence:

- Founder explicitly authorised the Production mutation with `GO 0020`.
- The migration had already passed fresh/disposable PostgreSQL CI as part of COMMERCIAL-OPS-01.
- A temporary Production-only guard was merged through PR #82. It read `_prisma_migrations`, refused execution if an unresolved migration row existed, and refused execution unless the only pending repository migration was exactly `0020_commercial_ops_01` (or it was already applied).
- Vercel Production deployment `dpl_BQEqk75EcFxFR7gAYmcFFzRvmhxW` on merge SHA `cc9bb1321352408f8ad2b157a44543f151c8db88` reported database readiness with pooled runtime / direct migration bindings pointing at the same database identity.
- The same Production build emitted `production_migration_0020` state `applying`, then `applied_and_verified` for `0020_commercial_ops_01`.
- The temporary runner was immediately removed through PR #83; no schema rollback occurred.
- Final cleanup merge SHA is `f6f520340d67e4f2aac44142437962b287794a66`. Final Production deployment `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY and uses the normal readiness-only preflight again.

This was a bounded one-time execution path. It does **not** establish a permanent policy of running migrations during every Vercel build. Future Production migrations require a new explicit controlled execution decision appropriate to their risk and migration shape.

## Production Programme access migration 0024 — applied

**DETECTED / APPLIED:** `0024_programme_access_acceptance` is an additive table
and enum only. It does not alter `ProgramEnrollment`, Mission progress, rewards,
`currentStep`, Starting Point, account identity or commercial data. Current
Production migration history through 0026 verifies 0024 as effective.

The compatibility insert marks only a user whose consumed `PendingProgrammeClaim` joins to a `program-ai-01:v1` anonymous session and to a `ProgrammeStartingPoint` with the same user, exact version and `confirmedAt = consumedAt` transaction timestamp. Repository route/service evidence establishes that this narrow session type was created only after signed 18+/Terms/Privacy proof verification. It uses the session creation time as the closest truthful lower-bound timestamp and leaves historical Terms/Privacy versions `NULL`. A generic `ProgramEnrollment`, Mission progress or XP row is not evidence and is never backfilled.

Disposable CI stages all history through `0023`, loads both a provable claim
fixture and an unknown generic-enrollment fixture, runs the `0024` preflight,
deploys and replays migrations, then verifies one safe acceptance, zero
unknown-user acceptances, and byte-equivalent selected
Enrollment/progress/reward/currentStep/Starting-Point projections. The later
0025 and 0026 Production postflights preserved those Programme projections.

## Production Casino market-profile migration 0025 — completed 1 September 2026

**DETECTED / APPLIED:** `0025_casino_market_profile_architecture` extends `CasinoCountry` as the exact factual market grain; adds market evidence and licence applicability; permits explicit country scoping for payment/provider/category/bonus/media records; and adds fail-closed, default-false tracking-country Production authority metadata. Its immutable SHA-256 is `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.

Founder-authorised execution completed from exact release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d` in temporary Vercel deployment `dpl_HAU77Wih5w52nhNfWqaTWwJY7Y8X`. Postflight verified completed repository-checksum-valid migrations 0023, 0024 and 0025; no pending, unresolved or later migration; the complete 0025 schema; and unchanged preservation counts: Casino 26, CasinoCountry 25, CasinoLicense 25, CasinoPaymentMethod 56, CasinoGameProvider 50, CasinoGameCategory 50, CasinoBonus 25, MediaAsset 1 and AffiliateTrackingLinkCountry 0.

PR #114 merged the durable verification-only steady state as `5d16a2615a642625c916f63899ba1748e895d689`. Normal Production deployment `dpl_GTK12YtMs1xsaNGMq8SeNgxA2f1h` accepted 0025 as `already_applied_and_verified` after proving pooled/direct database identity and performing bounded read-only inspection. It did not execute a migration. Migration 0025 itself contains no data DML, created no inferred factual link or commercial authority, and did not import Casino data.

A later, independently authorised factual-data release imported and published the checksum-bound Betsson PE/SE bundle exactly once without executing a migration or activating commercial authority. Its exact evidence is in the [2 September 2026 casino release record](Casino-Market-Data-Release-Record-2026-09-02.md).

## Production commercial-platform migration 0026 — completed 3 September 2026

**DETECTED / APPLIED:** `0026_commercial_platform_completion` creates the
aggregate-only `AffiliateOutboundClickDaily` table, its identity key, bounded
indexes, checks and restrictive foreign keys. It performs no backfill and does
not alter Programme, visitor, Casino, market or affiliate-authority records. Its
immutable SHA-256 is
`20bda96af8753a18ebfa43aa9d2cb96a688c4eedd29d3e74d23c032b861e3130`.

The bounded Production preflight accepted 0026 as the only pending migration.
Postflight verified the committed checksum, aggregate privacy contract and
preservation invariants. Normal Production builds now perform read-only 0026
readiness verification; they do not run migrations. See the
[commercial-platform completion release record](Commercial-Platform-Code-Completion-Release-Record-2026-09-03.md).

## Production placement-media migration 0027 — completed 4 September 2026

**DETECTED / APPLIED:**
`0027_placement_media_assignments` is the additive RFC-040 Option C migration.
It adds three enums and the typed `CasinoMediaAssignment`,
`CasinoBonusMediaAssignment` and `AffiliateOfferMediaAssignment` tables with
domain checks, paired normalized focal bounds, validity/COVER/order checks,
subject cascades, restrictive asset foreign keys and resolver/usage indexes. It
does not alter or remove a legacy media row or owner field. Immutable SHA-256:
`415f7295e92cd7b3992e7065bbfab3eccd1a5609c5dc584f3035d31756b1d348`.

The compatible application first deployed as
`dpl_68wSn8JHXfdkiT4vCEBQqSuy2yrV` with exactly 0027 pending and assignment-first
reads off. After merge-SHA CI passed, the guarded executor verified the exact
Vercel project/org, Production resource `store_1I4F54ETrwSKS42o`, database
fingerprint, `aaebff1eccdf0f9694791b52fb88d1d011d74a17`, migration history,
checksums and current source manifest, then applied only 0027. It recorded one
successful attempt after 26 completed repository migrations and verified all
three typed tables. The separate backfill produced 26 Casino and 20 Bonus
assignments, zero AffiliateOffer assignments and eight immutable projections;
the immediate repeat produced 0/0. Assignment-first reads were enabled only
after verification. Ready activation deployment
`dpl_HdqUHzodb2TNxjMjtyGBk3KnMmi2` performs read-only 0027/schema/count
readiness checks; it does not run the migration. See the
[PLACEMENT-MEDIA-ASSIGNMENTS-01 release record](Placement-Media-Assignments-01-Release-Record-2026-09-04.md).

## Production Better Auth 1.7 sequence — applied

**DETECTED / APPLIED:** `0021_partner_ops_work_bridge_01` and
`0022_better_auth_17_schema_upgrade` are both effective in current Production
migration history. The sequence below is retained as the compatibility design
that governed their release, not as a pending execution plan.

Migration 0022 is the additive compatibility step for `better-auth`, `@better-auth/core` and `@better-auth/oauth-provider` `1.7.1`. It:

- adds `Account.issuer`, backfills only documented credential (`local:credential`) and Google (`https://accounts.google.com`) identities, verifies completeness/collisions, then enforces the issuer/account identity key;
- retains a narrow issuer trigger so the deployed 1.6 application can continue credential and Google account writes during the migration-before-code window;
- adds the provider-generated protected-resource, client-resource, token/consent resource, refresh replay/revocation and client assertion structures;
- preserves the old nullable `oauthClient.public` and `oauthClient.type` columns for 1.6 rollback compatibility;
- backfills the one Commercial resource only from application-owned 0021 client metadata and rejects unsupported client/account state rather than inventing data; and
- keeps `clientCredentialsScopes` empty and does not enable the client-credentials grant.

**DETECTED COMPATIBILITY:** the disposable staged test builds exact post-0020 state with two Users, credential and Google Accounts, one linked `AdminUser`, one Commercial opportunity and one Commercial evidence row. It applies 0021, inserts a 1.6 DCR/token/consent fixture, then applies 0022. It verifies preservation of every representative row, both exact issuers, the one resource/client relation, token/consent resource backfills, empty client-credentials scopes, legacy 1.6 credential/Google inserts after 0022, and issuer/account collision rejection. A separate disposable replay inserts an unsupported legacy provider, proves that 0022 refuses the migration, and verifies that the existing Account row remains unchanged.

Required release order, now historical:

1. Keep `COMMERCIAL_MCP_ENABLED=false` while applying 0021 then 0022 to the
   Better Auth 1.6-compatible application.
2. Verify migration state and existing authentication before promoting Better
   Auth 1.7.1.
3. Reverify consumer, Google, Admin and Programme authentication before the
   separately governed Commercial MCP enablement.

The migration-before-code compatibility rule remains applicable to future
equivalent auth upgrades. The current Better Auth refresh-lifecycle regression
is tracked separately in `docs/CURRENT_STATE.md`; it does not make the applied
0021/0022 migration state pending.

## Expand/contract rule

Every stateful change must remain compatible with both the old and new application deployment across the release window:

1. **Expand:** add nullable columns/tables/indexes or dual-compatible structures. Avoid destructive renames, type narrowing and new immediate constraints on existing data.
2. **Deploy compatible code:** read old and new safely; dual-write only when an approved migration design requires it.
3. **Backfill:** use a bounded, observable, restartable job with explicit ownership. Never hide a Production backfill in app startup or a routine PR check.
4. **Verify:** record counts/invariants without exporting personal data.
5. **Contract later:** remove old structures only after all deployed code and rollback candidates no longer need them, through a separate reviewed release.

## Pull-request checklist

- [ ] Current Founder/project authority covers the schema/data change; read only the relevant ACTIVE RFCs when their durable domain is affected.
- [ ] Migration directory is additive, ordered and immutable after merge.
- [ ] `prisma migrate reset`, destructive migration and improvised reverse SQL are absent.
- [ ] Fresh PostgreSQL CI passes on the exact candidate head SHA.
- [ ] Old application/new schema and new application/old-compatible schema boundaries are documented.
- [ ] Lock duration, table size, index construction and backfill cost are assessed.
- [ ] Backup/restore evidence and rollback/forward-fix decision are recorded.
- [ ] Preview proof uses isolated non-production data.
- [ ] Production execution owner, timing, observation and stop condition are named.

## Production procedure gate

Before a Production migration, verify the database provider, secret architecture, backup/restore posture, exact pending migration set, execution identity and rollback/forward-fix strategy. Prefer a least-privilege direct migration binding that targets the same database identity as the runtime connection. Never copy a long-lived Production database URL into generic GitHub PR secrets merely to automate the step.

For high-consequence migrations, use a bounded fail-closed execution path and verify the resulting `_prisma_migrations` state before declaring completion. Remove temporary execution machinery after the migration unless the Founder separately approves a permanent migration architecture.
