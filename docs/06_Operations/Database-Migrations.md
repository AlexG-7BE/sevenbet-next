# Database Migrations

## Current implementation

- **Detected:** Prisma 6 targets PostgreSQL through `DATABASE_URL` and `DIRECT_URL`.
- **Detected:** committed migration history exists and is applied with `prisma migrate deploy`.
- **Detected:** PR CI starts a fresh PostgreSQL 16 service, validates/generates Prisma, runs the existing idempotent migration-0015 enum preflight, applies every committed migration and performs representative connected reads.
- **Detected:** the CI guard refuses non-loopback hosts, ports other than 5432, database names without the `_ci` suffix, and execution without `CI=true`.
- **Detected:** Vercel Production exposes the normal pooled runtime binding and a direct binding for the same Prisma Postgres database identity; the Production build preflight verifies that relationship without printing credentials.
- **Not detected:** a permanent approved automatic Production migration hook. Production schema mutation remains an explicit controlled action.
- **Proposed / not executed:** a dedicated one-time local/operator CLI for 0025 is documented in [Casino Market 0025 One-Time Operator](Casino-Market-0025-One-Time-Operator.md). It keeps Production credentials out of GitHub, defaults to read-only, and requires exact commit, checksum, environment, database-identity, pending-history, hazard, preservation, and explicit mutation authority. This proposal is not a permanent hook and confers no Production access or execution authority.
- **Proposed / not executed:** a separate [Casino Market 0025 Production Build Probe](Casino-Market-0025-Production-Build-Probe.md) is a build-only, PostgreSQL-read-only evidence mechanism for a later attended Founder decision. Its successful inspection deliberately fails the Vercel build before runtime output can be promoted. It has no dependency on the mutation-capable operator and confers no migration, merge, deployment, or Production mutation authority.

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

## Pending Programme access migration 0024 — not applied to Production

**PROPOSED / NOT DEPLOYED:** `0024_programme_access_acceptance` is an additive table and enum only. It does not alter `ProgramEnrollment`, Mission progress, rewards, `currentStep`, Starting Point, account identity or commercial data. The application change depends on this table, so Production migration and application promotion require an explicit ordered release decision; this implementation task does not run either action.

The compatibility insert marks only a user whose consumed `PendingProgrammeClaim` joins to a `program-ai-01:v1` anonymous session and to a `ProgrammeStartingPoint` with the same user, exact version and `confirmedAt = consumedAt` transaction timestamp. Repository route/service evidence establishes that this narrow session type was created only after signed 18+/Terms/Privacy proof verification. It uses the session creation time as the closest truthful lower-bound timestamp and leaves historical Terms/Privacy versions `NULL`. A generic `ProgramEnrollment`, Mission progress or XP row is not evidence and is never backfilled.

Disposable CI stages all history through `0023`, loads both a provable claim fixture and an unknown generic-enrollment fixture, runs the `0024` preflight, deploys and replays migrations, then verifies one safe acceptance, zero unknown-user acceptances, and byte-equivalent selected Enrollment/progress/reward/currentStep/Starting-Point projections. Production execution remains prohibited without separate Founder authority and a verified pending-migration plan.

## Pending Better Auth 1.7 sequence — not applied to Production

**DETECTED:** Production remains applied through `0020_commercial_ops_01`. Repository migration `0021_partner_ops_work_bridge_01` is merged history but is not Production-applied. `PARTNER-OPS-WORK-BRIDGE-02` adds `0022_better_auth_17_schema_upgrade`; neither migration is applied by that implementation task.

Migration 0022 is the additive compatibility step for `better-auth`, `@better-auth/core` and `@better-auth/oauth-provider` `1.7.1`. It:

- adds `Account.issuer`, backfills only documented credential (`local:credential`) and Google (`https://accounts.google.com`) identities, verifies completeness/collisions, then enforces the issuer/account identity key;
- retains a narrow issuer trigger so the deployed 1.6 application can continue credential and Google account writes during the migration-before-code window;
- adds the provider-generated protected-resource, client-resource, token/consent resource, refresh replay/revocation and client assertion structures;
- preserves the old nullable `oauthClient.public` and `oauthClient.type` columns for 1.6 rollback compatibility;
- backfills the one Commercial resource only from application-owned 0021 client metadata and rejects unsupported client/account state rather than inventing data; and
- keeps `clientCredentialsScopes` empty and does not enable the client-credentials grant.

**DETECTED COMPATIBILITY:** the disposable staged test builds exact post-0020 state with two Users, credential and Google Accounts, one linked `AdminUser`, one Commercial opportunity and one Commercial evidence row. It applies 0021, inserts a 1.6 DCR/token/consent fixture, then applies 0022. It verifies preservation of every representative row, both exact issuers, the one resource/client relation, token/consent resource backfills, empty client-credentials scopes, legacy 1.6 credential/Google inserts after 0022, and issuer/account collision rejection. A separate disposable replay inserts an unsupported legacy provider, proves that 0022 refuses the migration, and verifies that the existing Account row remains unchanged.

Required future Production order:

1. Keep `COMMERCIAL_MCP_ENABLED=false`; approve the exact candidate head and obtain a separate Founder migration GO.
2. With the current Better Auth 1.6.30 application still deployed, fail closed unless the only pending migrations are exactly 0021 then 0022; apply them in that order and verify `_prisma_migrations` plus existing auth.
3. Only after 0022 is verified, merge/promote the Better Auth 1.7.1 application and reverify consumer, Google, Admin and Programme auth while MCP remains disabled.
4. Enable the Commercial MCP only under a later explicit decision and run the documented connection smoke.

The migration-before-code order is required. The 1.7 application is not compatible with a database through only 0020 or 0021 because `Account.issuer` and the 1.7 OAuth schema are missing. The old 1.6 application is compatible with schema through 0022 for the bounded overlap because ordinary auth issuer writes are filled deterministically and the MCP feature stays off. No standard auto-deploy should promote the 1.7 code before the migration verification.

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
