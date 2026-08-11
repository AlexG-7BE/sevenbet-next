# Programme Runtime Hardening Operations

## Authority and rollout ceiling

This runbook implements [RFC-026](../06_RFC/RFC-026-MVP-Analytics-and-Programme-Runtime-Hardening.md) under RFC-021/022/023/025 and the Programme engineering standards. It does not authorise Mission/reward changes, shared Preview or Production migration, Production purge, recovery-canary access, provider activation, Google activation or commercial activation.

RECOVERY-01, PR #65, RFC-024 and canary `73a3c254-8ffb-4d35-b91f-9fb7436ad45f` remain outside this workstream.

## Distributed rate limiting

The runtime model is `ProgrammeRuntimeRateLimitBucket`. It has no user/session relation. The 64-character primary key is HMAC-SHA-256 over a closed scope, raw source and 10-minute fixed-window number, using a purpose key derived from `BETTER_AUTH_SECRET`. Raw source values and bucket keys are never logged.

| Scope | Limit / 10 minutes | Denial |
| --- | ---: | --- |
| `PROGRAMME_SESSION_CREATE_IP` | 12 | HTTP 429 |
| `PROGRAMME_TRANSCRIPTION_SESSION` | 6 | HTTP 429; Type instead remains usable |
| `PROGRAMME_TRANSCRIPTION_IP` | 20 | HTTP 429; Type instead remains usable |
| `PROGRAMME_M1_AI_SESSION` | 4 | provider suppressed; safe fallback |
| `PROGRAMME_M1_AI_IP` | 30 | provider suppressed; safe fallback |
| `PROGRAMME_MISSION_GUIDANCE_USER` | 30 | provider suppressed; deterministic fallback |
| `PROGRAMME_REVIEW_USER` | 12 | provider suppressed; deterministic fallback |
| `PROGRAMME_MUTATION_USER` | 120 | HTTP 429 before mutation |

Hard denials return only `RATE_LIMITED` and an integer `retryAfterSeconds`, plus `Retry-After`. A database failure fails safe on provider cost and returns the bounded typed service failure before non-provider mutation. Public pages, ordinary reads and Protected Help do not depend on this limiter.

Local application runtime, Preview and Production all use the PostgreSQL limiter. The in-memory implementation is reachable only through Node's isolated test-worker seam or explicit test injection; it is not a development or deployed-runtime fallback.

## Current database binding evidence

Redacted Vercel inventories and in-memory-only parsing were refreshed on 2026-08-11. No database connection or query was made.

| Item | Preview | Production | Classification |
| --- | --- | --- | --- |
| Runtime `DATABASE_URL` | Empty | Empty | **Detected** |
| Migration `DIRECT_URL` | Empty | Empty | **Detected** |
| Provider aliases | `ENVISO_*` present | `PRODDB_*` present | **Detected** |
| Alias connection mode | Direct `db.prisma.io` | Direct `db.prisma.io` | **Detected** |
| Alias internal identity | same across the three aliases within Preview | same across the three aliases within Production | **Detected** through redacted SHA-256 fingerprints |
| Preview vs Production identity | Different | Different | **Detected** (`DIFFERENT`) |
| Pooled `pooled.db.prisma.io` authority | Not present | Not present | **Not detected** |
| Safe migration target | Blocked | Blocked | **Inferred** from missing runtime/direct bindings and absent pooled pair |

The redacted identity fingerprints are `e54c…b749` for Preview and `5bac…1891` for Production. They are evidence only, not credentials. Do not use them as runtime configuration.

The empty future bindings do not prove the configuration captured inside an already-built Production deployment. They do prove that a new deployment cannot be approved as database-ready from current base values.

Current Prisma guidance requires pooled `pooled.db.prisma.io` for application traffic and direct `db.prisma.io` for migrations/admin workflows. See [Prisma Postgres connection pooling](https://www.prisma.io/docs/postgres/database/connection-pooling) and [connection setup](https://www.prisma.io/docs/postgres/database/connecting-to-your-database).

### Future configuration-only binding procedure

This procedure is **Planned**, not executed:

1. Wait for RECOVERY-01 closure and Founder approval for the exact environment.
2. In each environment's own Prisma authority, generate a matched pooled/direct credential pair for that existing resource. Do not copy Production credentials to Preview or vice versa.
3. Set `DATABASE_URL` to the pooled `pooled.db.prisma.io` URL with `sslmode=require&connection_limit=1`.
4. Set `DIRECT_URL` to the matched direct `db.prisma.io` URL with `sslmode=require`.
5. Run `npm run programme:database-readiness -- --label <environment>` in a process holding only that environment. It must report `ready: true` and `sameDatabaseIdentity: true` without printing values.
6. Compare the Preview and Production redacted target fingerprints. They must be `DIFFERENT`; `MATCH`, `ABSENT` or `UNKNOWN` blocks work.
7. Redeploy only the authorised non-Production environment first. Verify exact SHA and runtime connection health.
8. Apply existing migrations with `npm run programme:migrate` through the direct authority. Never use `migrate reset` or `db push`.

No binding was changed by MVP-RUNTIME-01 because only direct aliases are currently available and the recovery programme owns shared-environment sequencing.

## Migration 0019

`0019_programme_runtime_hardening` creates one table and one expiry index. Its preflight requires Programme relations and rejects an incompatible existing bucket table. It does not alter, backfill, delete or relate existing rows.

Allowed disposable sequence:

```bash
npx prisma validate
npx prisma generate
npm run programme:migrate
```

Shared Preview and Production application are pending separate authority. Rollback is controlled SQL, only after code no longer consumes the table:

```sql
DROP TABLE IF EXISTS "ProgrammeRuntimeRateLimitBucket";
```

Do not run rollback automatically and do not change Prisma migration history after an environment has applied the migration.

## Transient expiry purge

Only these rows are eligible:

- anonymous Programme sessions expired more than 24 hours ago, provided no consumed claim exists and no still-in-grace unconsumed claim would be cascaded;
- unconsumed pending claims expired more than 24 hours ago;
- rate-limit buckets whose window has expired.

Consumed claims and their owning anonymous sessions are retained. User/account/auth session, user-bound Programme authority/content/progress/XP/Reviews, historic artifacts, commercial records and audit logs are excluded.

Dry run is the CLI default:

```bash
npm run programme:purge-expired -- --environment local
```

Local/disposable execute example:

```bash
PROGRAMME_PURGE_CONFIRM=EXECUTE:local:programme-expiry-purge npm run programme:purge-expired -- --environment local --execute
```

Production additionally requires `PROGRAMME_PURGE_PRODUCTION_CONFIRM=PRODUCTION:programme-expiry-purge`. That authority is not granted by this runbook or RFC-026's initial implementation phase.

Each invocation uses batches up to 500 and deletes at most 5,000 rows per class. Output/logs contain aggregate counts only. Repeated execution is idempotent.

## Cron

`vercel.json` declares one daily Production Vercel Cron at `17 4 * * *` for `GET /api/internal/cron/programme-expiry-purge`. The route requires exact `Authorization: Bearer <CRON_SECRET>`, fails 503 when the secret is missing and 401 when it is wrong.

As of 2026-08-11, `CRON_SECRET` is absent in both redacted Vercel inventories. Therefore a future deployment fails closed and no scheduled purge can succeed. Do not add the secret until database binding, migration 0019, Preview proof, RECOVERY-01 closure and Founder Production activation approval are complete.

Cron rollback removes or disables the schedule only after ensuring no deployment expects it. Never place the secret in a URL, repository file, client variable, report or log.

## Incident and rollback signals

- Elevated 429s: inspect aggregate scope/limited logs, route traffic and retry behaviour; never log source identity.
- Limiter database failures: keep provider calls suppressed, verify the runtime pooled binding and database availability.
- Purge failure: route returns `PURGE_FAILED`; do not broaden deletion or bypass auth. Run dry mode against the authorised target after the incident is understood.
- Connection exhaustion: verify runtime hostname is pooled and `connection_limit=1`; do not point migrations at pooled authority.
- Analytics failure is independent and must not cause Programme rollback.
