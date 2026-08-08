# Database Migrations

## Current implementation

- **Detected:** Prisma 6 targets PostgreSQL through `DATABASE_URL` and `DIRECT_URL`.
- **Detected:** committed migration history exists and is applied with `prisma migrate deploy`.
- **Detected:** required PR CI starts a fresh PostgreSQL 16 service, validates/generates Prisma, runs the existing idempotent migration-0015 enum preflight, applies every committed migration and performs representative connected reads.
- **Detected:** the CI guard refuses non-loopback hosts, ports other than 5432, database names without the `_ci` suffix, and execution without `CI=true`.
- **Not detected:** an approved short-lived Production migration credential or provider-native Production migration hook. Production automation remains provider/secret-architecture gated.

Migration 0015 adds `MISSION_COMPLETION` to a PostgreSQL enum and later uses it. PostgreSQL requires the new enum value to be committed first. On a fresh database, apply unchanged migrations 0001–0014 with Prisma, run the committed `prisma/preflight/0015_active_control_program_flow.sql` in its own transaction, then run normal `prisma migrate deploy` for unchanged migration 0015 onward. The preflight is idempotent; this is a historical replay requirement, not permission to edit migration history.

## Expand/contract rule

Every stateful change must remain compatible with both the old and new application deployment across the release window:

1. **Expand:** add nullable columns/tables/indexes or dual-compatible structures. Avoid destructive renames, type narrowing and new immediate constraints on existing data.
2. **Deploy compatible code:** read old and new safely; dual-write only when an approved migration design requires it.
3. **Backfill:** use a bounded, observable, restartable job with explicit ownership. Never hide a Production backfill in app startup or a PR check.
4. **Verify:** record counts/invariants without exporting personal data.
5. **Contract later:** remove old structures only after all deployed code and rollback candidates no longer need them, through a separate reviewed release.

## Pull-request checklist

- [ ] Governing RFC approves the schema/data change.
- [ ] Migration directory is additive, ordered and immutable after merge.
- [ ] `prisma migrate reset`, destructive migration and improvised reverse SQL are absent.
- [ ] Fresh PostgreSQL CI passes on the exact PR head SHA.
- [ ] Old application/new schema and new application/old-compatible schema boundaries are documented.
- [ ] Lock duration, table size, index construction and backfill cost are assessed.
- [ ] Backup/restore evidence and rollback/forward-fix decision are recorded.
- [ ] Preview proof uses isolated non-production data.
- [ ] Production execution owner, timing, observation and stop condition are named.

## Production procedure gate

Do not run a Production migration until the database provider, secret architecture, backup policy and restore drill are verified. At that point, record the provider-native connection mechanism and least-privilege execution path in this runbook through an approved RFC. Never copy a long-lived Production database URL into generic GitHub PR secrets merely to automate the step.
