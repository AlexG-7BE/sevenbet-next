# Migrations 0015–0017 — Active Control Program Flow

Migration: `prisma/migrations/0015_active_control_program_flow/migration.sql`.

Mission 03 extension: `prisma/migrations/0016_mission_03_urge_learning/migration.sql`.

Mission 04 extension: `prisma/migrations/0017_mission_04_active_boundary/migration.sql`.

All three migrations are additive. Migration 0015 adds the shared Programme flow baseline. Migration 0016 adds the private `UrgeLearningRecord`. Migration 0017 adds boundary enums, the private `ActiveBoundary`, source relations, integrity constraints and the deterministic `boundary-built` achievement catalogue row. Existing users, enrollments, progress, XP and achievements are not deleted or rewritten.

Before deployment:

1. take and verify a target database backup;
2. verify migrations 0001–0014 are applied in order;
3. run `npx prisma validate` and `npm run programme:test` against the release source;
4. run the idempotent enum preflight before Prisma deploy because PostgreSQL requires the new `MISSION_COMPLETION` enum value to be committed before migration 0015 references it;
5. apply with the environment's reviewed `npm run programme:migrate` process;
6. publish or verify Program slug `sevenbet-10-step-control-program` with `npm run programme:seed`;
7. smoke-test anonymous session, claim redemption, same-day Mission 02 and Mission 03 completion, returning-user sign-in and owner-only artefact access;
8. verify no Programme payloads appear in logs or commercial event streams.

## Deployment evidence — 2026-08-04

- **Detected:** migrations 0011–0017 are applied and Prisma reports the configured remote database schema as up to date.
- **Detected:** the first 0015 deploy attempt stopped safely with PostgreSQL `55P04`; the enum preflight was committed, the failed migration was marked rolled back, and the unchanged migration then applied successfully.
- **Detected:** the idempotent seed published Program version 1 with ten active steps and left the existing published record unchanged on a second run.
- **Detected:** a synthetic browser E2E verified Mission 01 claim (`60 XP`, `1 of 10`) and Mission 02 completion (`140 XP`, `First Plan`, `1 active day`, `2 of 10`).
- **Detected:** a connected-database browser E2E verified returning-user sign-in and the complete Mission 03 sequence, including evidence review, urge-wave interaction, explained retry, private signal, meaning check, `+90 XP`, `230 XP` total, `3 of 10`, editable result and Mission 04 current.
- **Detected:** server tests verify the `not now` path, idempotent reward, owner scope, edit/deletion scrub and incomplete-check rejection.
- **Detected:** Mission 04 service tests verify resumable draft state, required strength checks, idempotent `+100 XP`, `330 XP` total, `Boundary built`, Mission 05 current state and Active Boundary edit/deletion semantics.
- **Detected:** the two explicitly named synthetic E2E users and their cascade-owned Programme data were deleted after verification.
- **Planned:** authenticated Mission 04 browser completion, clinical-content/compliance release review, mobile/device QA, expiry purge automation, distributed rate limiting, account-wide export/erasure, telemetry and Missions 05–10.

Rollback is application-first: disable the new routes and deploy the previous application build. Do not drop the new tables or columns while any claim, artefact, reward or active-day row exists. A destructive database rollback requires a separate approved data migration.
