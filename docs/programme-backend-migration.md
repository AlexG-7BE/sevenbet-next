# Migration 0015 — Active Control Program Flow

Migration: `prisma/migrations/0015_active_control_program_flow/migration.sql`.

The migration is additive. It adds Programme mission/goal enums; anonymous session and claim tables; mission progress; Moment Map; Current Goal; active day/correction records; Programme reward provenance columns; constraints/indexes; and the deterministic `first-plan` achievement catalogue row. Existing users, enrollments, progress, XP and achievements are not deleted or rewritten.

Before deployment:

1. take and verify a target database backup;
2. verify migrations 0001–0014 are applied in order;
3. run `npx prisma validate` and `npm run programme:test` against the release source;
4. confirm the published Program slug `sevenbet-10-step-control-program` has a published version and ten active steps;
5. apply with the environment's reviewed `prisma migrate deploy` process;
6. smoke-test anonymous session, claim redemption, same-day Mission 02 completion and owner-only artefact access;
7. verify no Programme payloads appear in logs or commercial event streams.

Rollback is application-first: disable the new routes and deploy the previous application build. Do not drop the new tables or columns while any claim, artefact, reward or active-day row exists. A destructive database rollback requires a separate approved data migration.
