# Environments

## Detected workflow

| Environment | Evidence | Approval boundary |
| --- | --- | --- |
| Local | Port 4173 scripts and committed `.env.example`; local value files ignored | Synthetic/developer-owned resources only |
| CI | GitHub Actions Node.js 24, fake auth sentinels and disposable PostgreSQL 16 | No hosted Preview/Production secrets or data |
| Preview | Vercel environment and Git Preview deployment | Read-only inspection only until isolated non-production database/auth/admin values exist |
| Production | Vercel project/deployment, fixed production smoke origin and Node.js 24.x metadata | Protected PR/merge path; smoke after deployment |

## Isolation finding

**Detected, high severity:** redacted equality checks showed Preview and Production currently share the same database, Better Auth and admin-preview values. No value was printed or recorded. Mutation-capable Preview use is blocked until separate services/credentials are provisioned and verified.

**Detected inconsistency:** Vercel metadata lists encrypted `DATABASE_URL` and `DIRECT_URL`, but an isolated environment-run check did not surface them while provider database aliases were present. No hosted setting was changed. Runtime database configuration must be reconciled before a migration-capable Production release.

The complete configuration-name inventory, classifications, consumers and handling rules are maintained in [Environment and Secrets](../../06_Operations/Environment-and-Secrets.md).

## CI/CD and secrets

**Detected:** required PR CI, fresh-database migration verification, isolated browser tests, build-deliverable secret scanning, scheduled Production smoke, immutable GitHub Action pins and read-only default workflow permissions.

**Not detected:** a short-lived Production migration credential, provider-native migration hook, verified secret rotation record or proven backup/restore configuration. Production migration automation remains provider/secret-architecture gated.
