# Environments

## Detected workflow

| Environment | Evidence | Approval boundary |
| --- | --- | --- |
| Local | Port 4173 scripts and committed `.env.example`; local value files ignored | Synthetic/developer-owned resources only |
| CI | GitHub Actions Node.js 24, fake auth sentinels and disposable PostgreSQL 16 | No hosted Preview/Production secrets or data |
| Preview | Vercel environment, Git Preview deployment and dedicated Prisma Postgres resource | Non-production review/testing mutations only; no Production data or credentials |
| Production | Vercel project/deployment, fixed production smoke origin and Node.js 24.x metadata | Protected PR/merge path; smoke after deployment |

## Isolation finding — ENV-ISO-01

**Detected:** merged ENV-ISO-01 [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) uses different Preview and Production Prisma resource IDs, database credentials, Better Auth secrets and admin tokens. Provider connections are scoped Preview-only and Production-only. No value was printed or recorded.

**Detected:** the initial isolated Preview deployment applied all 17 existing migrations, exposed no Production database records in representative counts, accepted only its exact Vercel branch host and passed a disposable auth/session mutation proof. The Preview identity was absent from Production and deleted after verification. No Production data was copied.

**Detected:** PR #52 merged as `a954243786af83ec6ce97f8a1a0527d0b6a3cf2b`; its exact-merge CI passed, Production deployment `dpl_4xhpC5sQwQuuzLp9RZkNi8YVG4uL` is Ready, Production Smoke run `31254902719` passed and a real Production staff auth E2E passed login, protected `/admin`, refresh/session persistence and normal logout. Production is healthy and ENV-ISO-01 is closed.

**Detected on 2026-08-11:** workspace `cmrixpep23o54wfdvy6ikjzc1` is Starter and billed through the existing Vercel team context. Both isolated Prisma databases inherit Starter; the Management API reports seven-day retention metadata, 14 completed Production snapshots and six completed Preview snapshots. RECOVERY-01 restored Preview backup `backup-01kzqcxb1ak4rx3amh1snpwdag` into a new disconnected database, proved exact 18-migration/schema/FK/structure/repository-read parity, and deleted the exact target. Recovery remains `PARTIAL — MANAGED CANARY SNAPSHOT PENDING` because that backup predates the pending synthetic canary. Fine-grained PITR remains **Not detected**.

The complete configuration-name inventory, classifications, consumers and handling rules are maintained in [Environment and Secrets](../../06_Operations/Environment-and-Secrets.md).

## CI/CD and secrets

**Detected:** required PR CI, fresh-database migration verification, isolated browser tests, build-deliverable secret scanning, scheduled Production smoke, immutable GitHub Action pins and read-only default workflow permissions.

**Detected:** controlled Better Auth secret recovery/rotation evidence and independent Preview auth/admin authority.

**Detected:** `.env.example` documents `PROGRAM_AI_V1_ENABLED=false`; only exact server-side `true` enables the RFC-022 slice. The approved PR #64 feature-on Preview used its isolated database, migration `0018`, real Preview-only OpenAI key and valid runtime bindings to complete controlled typed and voice provider validation before merge. Production remained legacy/off. The RECOVERY-01 branch's lack of generic `DATABASE_URL`/`DIRECT_URL` aliases is branch-specific and does not retroactively invalidate that approved Preview evidence.

**Not detected:** a short-lived Production migration credential or provider-native migration hook. **Detected:** managed Production snapshots are active under Starter and provider-native new-target restore mechanics passed using Preview only. A snapshot containing the pending synthetic canary and its exact restored parity remain open.
