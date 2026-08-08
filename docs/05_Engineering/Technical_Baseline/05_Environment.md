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

**Not detected:** automated backup/PITR capability on the verified Prisma Free plan. Recovery remains PARTIAL and separate from the proven environment-isolation boundary.

The complete configuration-name inventory, classifications, consumers and handling rules are maintained in [Environment and Secrets](../../06_Operations/Environment-and-Secrets.md).

## CI/CD and secrets

**Detected:** required PR CI, fresh-database migration verification, isolated browser tests, build-deliverable secret scanning, scheduled Production smoke, immutable GitHub Action pins and read-only default workflow permissions.

**Detected:** controlled Better Auth secret recovery/rotation evidence and independent Preview auth/admin authority.

**Not detected:** a short-lived Production migration credential, provider-native migration hook or proven backup/restore configuration. Production migration automation remains provider/secret-architecture gated.
