# Environment and Secrets

## Trust zones and active evidence

Reconciled on 2026-08-14 for the approved B4GAMBLE canonical-domain release contract, Preview isolation, RECOVERY-01, MVP-RUNTIME-01 and LAUNCH-POLISH-01 Contact boundary. Secret values are intentionally omitted.

| Zone | Database authority | Auth/admin authority | External integrations | Allowed data and mutation | Deployment source |
| --- | --- | --- | --- | --- | --- |
| Local | **Detected:** developer-owned local configuration | **Detected:** developer-owned secrets | Local/synthetic only | Synthetic/local data; developer-owned mutations | Developer checkout |
| CI | **Detected:** disposable PostgreSQL 16 service | **Detected:** fake auth/admin sentinels; no Vercel secret | Disabled/fake only | Disposable test data; migrations and tests may mutate the disposable service | Pull-request GitHub Actions |
| Preview | **Branch-specific current exception:** dedicated Prisma Postgres aliases for `sevenbet-preview` (`store_hLPkkgamL7rJNmCe`) are present, but a redacted 2026-08-11 pull for the RECOVERY-01 branch found generic runtime `DATABASE_URL` and `DIRECT_URL` absent. The approved PR #64 feature-on Preview separately had valid isolated runtime bindings and passed live validation before merge. | **Detected:** Preview-only Better Auth secret and admin token; exact Vercel branch host is derived from system metadata | Historically recorded Preview configuration kept affiliate redirects/public CMS off and used local media; approved PR #64 separately used Preview-only OpenAI configuration. Draft PR #72 changes the deployed Preview/Production public-casino source contract to governed CMS reads. Its pushed intermediate checkpoint has a Ready branch Preview, while the final worktree remains undeployed and the PR remains unmerged and absent from Production. No S3, email, webhook, analytics or affiliate credential was detected by RECOVERY-01. | Non-production disposable test data only after runtime database authority is verified for the exact deployment; no Production copy | Non-`main` Vercel Preview deployment |
| Production | **Detected:** Prisma Postgres `prisma-postgres-cobalt-school` (`store_1I4F54ETrwSKS42o`), provider connection restricted to Production only | **Detected:** Production-only Better Auth/admin configuration | Production authority only when separately approved and configured | Governed Production data and mutations only | `main` Vercel Production deployment |
| Demo/Staging | **Planned:** separate project and database | **Planned:** separate auth/admin authority | Sandbox or separately approved non-production authority | Curated synthetic/demo data only | Future separately authorised deployment |

Preview is an engineering/review environment, not Demo/Staging. It must never become a shadow copy of Production personal, Programme, Protected Help, Self-Check or Limit Tracker data.

## ENV-ISO-01 isolation evidence

- **Historic detected evidence:** ENV-ISO-01 proved Preview and Production used different Vercel/Prisma resource IDs and different database credentials; their runtime URL relations were `DIFFERENT` at that verification point.
- **Current detected exception, 2026-08-11:** Preview provider aliases remain populated but the RECOVERY-01 branch pull contains no generic runtime `DATABASE_URL` or `DIRECT_URL`. The provider-owned Preview and Production direct aliases were compared in process memory: resource IDs and connection-authority fingerprints were `DIFFERENT`. This authorises the bounded recovery drill only for this branch. It does not retroactively negate the valid isolated bindings used by the approved PR #64 feature-on Preview validation.
- **Detected:** the Preview backup point contains all 18 repository migrations through `0018_program_ai_m1_foundation`. Historic ENV-ISO-01 evidence proved 17 migrations on both resources; RECOVERY-01 did not query current Production migration rows.
- **Detected:** Preview and Production Better Auth secrets and admin tokens are independently generated. Production values were unchanged after the accepted ENV-REC-01 recovery baseline.
- **Detected:** Preview Better Auth uses `VERCEL_BRANCH_URL` only when `VERCEL_ENV=preview`. The host must be an exact generated `*-git-*.vercel.app` branch host; wildcard, Production fallback and contradictory static origins fail closed. Exact requests to the current valid `VERCEL_URL` deployment host are redirected with status 307 to that exact branch host before rendering/auth, with path and query preserved; malformed metadata and unexpected Preview hosts reject. The unmerged FULL-SITE-QA-01 source branch adds a Production-only permanent redirect from every non-canonical host to the constant `https://b4gamble.com` origin while preserving path and query. Read-only audit evidence found the currently deployed Production project alias still rendering directly, so that live correction is not claimed before an authorised merge/deploy. Local and ordinary CI do not canonicalise.
- **Detected:** an `example.invalid` Preview account and session succeeded, the exact account was absent from Production, Production rejected the Preview session, and the Preview account was deleted. No ENV-ISO auth canary remains. RECOVERY-01's synthetic structural canary was captured in completed Preview backup `backup-01kzszywy038jepagf0zk705zs`, restored to a fresh target with deterministic parity, then the target and exact canary were deleted and verified absent.
- **Detected:** the Production marketplace connection is Production-only under `PRODDB_*`; the Preview connection is Preview-only under `ENVISO_*`. The application continues to consume separately scoped `DATABASE_URL`/`DIRECT_URL` values.
- **Detected 2026-08-11:** both Preview and Production base `DATABASE_URL`/`DIRECT_URL` values are empty. Their provider aliases are present, direct `db.prisma.io` authorities and have different redacted database fingerprints. No pooled `pooled.db.prisma.io` authority was detected. This blocks approval of a future database-consuming deployment and migration; it does not prove the environment snapshot held by an already-built deployment.
- **Detected:** PR #52 merged as `a954243786af83ec6ce97f8a1a0527d0b6a3cf2b`; exact-merge main CI passed, Production deployment `dpl_4xhpC5sQwQuuzLp9RZkNi8YVG4uL` is Ready, Production Smoke run `31254902719` passed and a real Production staff auth E2E passed login, protected admin, refresh/session persistence and logout.
- **Not detected:** any Production database, user, Programme, protected-support or CMS record copied to Preview.

ENV-ISO-01 and the associated Production configuration incident are closed. Recovery is **RECOVERY-01 — MANAGED RESTORE DRILL COMPLETE** under RFC-024: Starter, completed Production/Preview snapshots, provider-native restore to a fresh disconnected target, deterministic canary parity, and exact target/canary cleanup are detected. Production remained read-only; any Production restore still requires separate incident authority.

The provider connection prefixes are control-plane aliases. No repository runtime consumer uses `PRODDB_*` or `ENVISO_*`; the separately scoped runtime/direct variables remain authoritative.

## Variable inventory

| Names | Classification | Consumer / scope | Ownership evidence |
| --- | --- | --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Secret, runtime/direct database credentials | Prisma runtime and migration tooling; separate Preview and Production values | Founder Office/config owner; repository maintainer technical consumer |
| `ENVISO_DATABASE_URL`, `ENVISO_POSTGRES_URL`, `ENVISO_PRISMA_DATABASE_URL` | Provider-injected sensitive aliases | Preview-only control-plane connection; no repository consumer detected | Founder Office/config owner |
| `PRODDB_DATABASE_URL`, `PRODDB_POSTGRES_URL`, `PRODDB_PRISMA_DATABASE_URL` | Provider-injected sensitive aliases | Production-only control-plane connection; no repository consumer detected | Founder Office/config owner |
| `PRISMA_DATABASE_URL`, `POSTGRES_URL` | Sensitive provider aliases | Production-only preserved aliases; no repository consumer detected | Founder Office/config owner |
| `RECOVERY_SOURCE_URL`, `RECOVERY_TARGET_URL`, `RECOVERY_PREVIEW_REFERENCE_URL`, `RECOVERY_PRODUCTION_REFERENCE_URL` | Operator-supplied secret database authorities | Local, explicitly invoked RECOVERY-01 tooling only; never hosted runtime or CI | Founder Office/config owner supplies; technical responder consumes in process memory |
| `RECOVERY_PREVIEW_RESOURCE_ID`, `RECOVERY_PRODUCTION_RESOURCE_ID`, `RECOVERY_TARGET_LABEL`, `RECOVERY_DRILL_ACKNOWLEDGEMENT`, `RECOVERY_CANARY_ACKNOWLEDGEMENT` | Non-secret recovery guard authority | Exact local recovery preflight/canary commands only | RFC-024; repository maintainer technical owner |
| `RECOVERY_PRISMA_WORKSPACE_ID`, `RECOVERY_PRISMA_PROJECT_ID`, `RECOVERY_SOURCE_DATABASE_ID`, `RECOVERY_PRODUCTION_DATABASE_ID`, `RECOVERY_TARGET_DATABASE_ID`, `RECOVERY_EXPECTED_TARGET_DATABASE_ID`, `RECOVERY_TARGET_PROVIDER`, `RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT`, `RECOVERY_SELECTED_SNAPSHOT_AT` | Non-secret managed-recovery authority/metadata | Explicit provider-native verification only; never ordinary runtime or CI | RFC-024; exact provider control-plane evidence |
| `RECOVERY_CANARY_MANIFEST_PATH`, `RECOVERY_SNAPSHOT_MANIFEST_PATH`, `RECOVERY_DRILL_ID` | Sensitive operational path / safe drill identifier | Private temporary drill directory only; never committed or uploaded | Technical responder; delete immediately after drill |
| `BETTER_AUTH_SECRET` | Secret | Better Auth runtime convention; independent per environment | Founder Office/config owner; repository maintainer technical owner |
| `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` | Sensitive configuration | Production target is exact `https://b4gamble.com`; Local/CI use explicit loopback origins; intentionally absent in Preview | Same as authentication configuration |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Sensitive OAuth client configuration / secret | Optional Better Auth Google identity provider; both required; independent Production and Preview clients | Founder Office/Google Cloud owner; repository maintainer technical consumer |
| `SEVENBET_ACCOUNT_EMAIL_FROM`, `SEVENBET_PROGRAMME_EMAIL_FROM`, `SEVENBET_EMAIL_REPLY_TO` | Legacy sender configuration | No RFC-046 runtime consumer; retained for compatibility only | Founder Office/communications owner |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | Sensitive server-only Contact kill switch | Exact `true` enables only the RFC-028 Contact transport after complete validation; absent/default off | Founder Office plus repository maintainer |
| `RESEND_API_KEY` | Secret | Server-only authentication for the isolated Contact adapter and the disabled-by-default RFC-046 lifecycle provider adapter; never client-exposed, printed or committed | Founder Office/Resend owner; narrow send permission preferred |
| `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO` | Server-only sender/recipient configuration | Exact approved visible From identity `B4GAMBLE <info@b4gamble.com>` and existing `support@b4gamble.com` mailbox only | Founder Office/communications owner; Google Admin shows `info@b4gamble.com` as an alias on the existing support user and Resend verifies `b4gamble.com`; provider Return-Path records may remain under `send.b4gamble.com` |
| `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL` | Vercel system configuration | Trusted request-country runtime boundary; exact Preview deployment redirect source; bounded stable Preview Better Auth origin derivation | Vercel control plane |
| `NEXT_PUBLIC_SITE_URL` | Public configuration | Production target is exact `https://b4gamble.com`; canonical links, metadata, structured data, sitemap, robots and media fallback derive from it | Repository maintainer |
| `SEVENBET_ADMIN_PREVIEW_TOKEN`, `CMS_PHASE1_ALLOW_DEV_ADMIN`, `CMS_AUTH_PROVIDER` | Retired Admin configuration | **DETECTED:** no Admin runtime consumer; query, cookie and header preview values cannot authorize Admin access | Remove stale hosted values through normal secret-configuration maintenance; never reuse as another authority |
| `CMS_WEBHOOK_SECRET` | Secret | Listed legacy/webhook surface; active consumer **not detected** | Owner not documented |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_PROFILE_ID` | Personal/sensitive bootstrap inputs | Manual bootstrap script only | Founder Office decision owner; never routine runtime/CI |
| `ADMIN_PROFILE_EMAIL`, `ADMIN_PROFILE_NAME` | Personal/sensitive operator input | Manual profile script only | Founder Office decision owner |
| `PUBLIC_CASINO_CMS_ENABLED` | Sensitive feature flag | Test-only opt-out. Vercel Preview/Production always read casinos from the database; local runtimes do too unless the value is exactly `false`, which database-less CI and Playwright runs set. | Repository maintainer |
| `PROGRAM_AI_V1_ENABLED` | Sensitive feature flag | RFC-022/RFC-025 runtime selector; exact `true` only and default off in source. Read-only FULL-SITE-QA-01 evidence observed the feature-on Production UI without a matching approval record; current hosted value remains an operations contradiction, not a documented value. | Founder Office plus repository maintainer |
| `PROGRAM_AI_REAL_PROVIDER_ENABLED` | Sensitive provider kill switch | RFC-023 real OpenAI adapter; exact `true` only and historically authorised for controlled Preview evidence. Current Production provider state was not tested or recorded. | Founder Office plus repository maintainer |
| `PROGRAM_AI_PROVIDER`, `PROGRAM_AI_OPENAI_MODEL`, `PROGRAM_AI_REALTIME_TRANSCRIPTION_MODEL`, `PROGRAM_AI_TRANSCRIPTION_MODEL` | Server-only provider configuration | RFC-056 source values are respectively `openai`, `gpt-6-luna`, `gpt-live-transcribe`, `gpt-4o-transcribe`; any different configured model fails closed. Current Preview/Production hosted values are unknown until inspected without revealing secrets. | Repository maintainer under RFC-023/RFC-056 |
| `OPENAI_API_KEY` | Secret | Server-only OpenAI API authentication after database isolation; consumed by the gated Programme adapters and separately enabled RFC-052 Learn image generation (`gpt-image-2`). It also runs the RFC-053 managed Learn editorial sessions (GPT-5.6 Sol) when `LEARN_CONTENT_AUTONOMY_ENABLED=true` (LEARN-SERVER-SWITCH-2026-10-01). Current Production presence must be verified without revealing the value; never client-exposed, printed or documented as a value. | Founder Office/OpenAI account owner; repository maintainer technical consumer |
| `LEARN_MCP_SERVICE_TOKEN` | Secret | RFC-052 dedicated bearer credential for `/api/mcp/learn`; minimum 32 bytes, server-only, header authentication only | Founder Office/config owner; repository maintainer technical consumer |
| `LEARN_MCP_ENABLED`, `LEARN_MCP_ACTOR_ID` | Sensitive runtime configuration | Exact `true` enables the Learn MCP endpoint (read-only `learn_context`, `learn_source` and aggregate `social_traffic`, and the one mutation `learn_apply`); UUID binds every write/revision/audit to the provisioned unlinked `AUTHOR` service actor | Founder Office plus repository maintainer |
| `CRM_MCP_SERVICE_TOKEN` | Secret | RFC-055 dedicated bearer credential for `/api/mcp/crm`; minimum 32 bytes, server-only, header authentication only | Founder Office/config owner; given only to the Claude CRM routine |
| `CRM_MCP_ENABLED`, `CRM_MCP_ACTOR_ID` | Sensitive runtime configuration | Exact `true` enables the seven-tool CRM endpoint (otherwise 503); UUID of the `AdminUser` with `affiliate.manage` recorded as the delegating actor for every CRM write and audit row | Founder Office plus repository maintainer |
| `LEARN_CONTENT_AUTONOMY_ENABLED` | Server-only switch | RFC-053 §12: exact `true` runs the hourly server Learn cycle (paid OpenAI managed sessions) when the RFC-052 configuration also passes; any other value makes the cron a no-cost `NO_OP`. Production `true` since 1 Oct 2026 | Founder Office plus repository maintainer |
| `LEARN_CONTENT_LOCALES` | Bounded server-only editorial configuration | Ordered, unique published-language rotation (default `en`; Production `en,sv,da,de`) used by the server cycle and returned by `learn_context` as `launchLocales` | Repository maintainer under RFC-053 |
| `LEARN_CONTENT_MIN_INTERVAL_HOURS`, `LEARN_CONTENT_OPENAI_MODEL` | Bounded server-only orchestration configuration | Whole-hour launch interval from 8 through 720 (default 8; Production 24 since 1 Oct 2026) and the code-allowlisted managed-session model, only `gpt-5.6-sol` since 1 Oct 2026 (empty means the default; `gpt-6-astra` fails closed) | Repository maintainer under RFC-053 |
| `LEARN_MCP_ACTOR_EMAIL` | Sensitive operator input | Explicit `learn-apply:provision-actor` process only; not required by hosted runtime and not logged by the script | Founder Office/config owner |
| `LEARN_IMAGE_GENERATION_ENABLED`, `LEARN_OPENAI_IMAGE_MODEL`, `LEARN_IMAGE_MAX_BYTES` | Sensitive/bounded server configuration | Exact generation gate, approved `gpt-image-2` model/default snapshot and optional limit that can only lower the 10 MiB ceiling | Founder Office plus repository maintainer |
| `LEARN_APPLY_PUBLIC_ORIGIN` | Sensitive operational configuration | Optional bounded public-verification origin; Production accepts only `https://b4gamble.com`, Preview otherwise derives the exact branch host | Repository maintainer |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | Retired public variable | No current runtime consumer; old Vercel Analytics path was removed by RFC-036 | Repository maintainer |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Public kill switch | Exact `true` enables RFC-046 browser emission; default false and signed consent remains mandatory | Founder Office plus repository maintainer |
| `ANALYTICS_SIGNING_SECRET` | Secret | HMAC signing for RFC-046 consent/identity and keyed rate-limit sources; falls back to `BETTER_AUTH_SECRET`, but a distinct Production value is preferred | Founder Office/config owner |
| `ANALYTICS_INTERNAL_TRAFFIC_TOKEN` | Secret | Exact server-held marker that tags staff/synthetic traffic `INTERNAL`; never client configuration | Repository maintainer/operations |
| `ANALYTICS_RETENTION_DAYS`, `EMAIL_HISTORY_RETENTION_DAYS` | Bounded operational configuration | Defaults 395/730; only documented bounded ranges are accepted | Privacy/operations owner |
| `LIFECYCLE_EMAIL_DELIVERY_ENABLED` | Sensitive server-only kill switch | Exact Production-only `true` is necessary but not sufficient; Founder authority exists, but keep false until the webhook, sender configuration, worker deployment and controlled acceptance are ready | Founder Office plus privacy/security and repository maintainer |
| `LIFECYCLE_EMAIL_FROM`, `LIFECYCLE_EMAIL_REPLY_TO` | Server-only sender configuration | RFC-046 provider envelope; validated and newline-free; Production domain/mailbox evidence required | Founder Office/communications owner |
| `RESEND_WEBHOOK_SECRET` | Secret | Raw-body Svix verification for the RFC-046 normalized provider webhook | Founder Office/Resend owner |
| `PROGRAMME_REMINDER_INACTIVITY_DAYS` | Bounded operational configuration | One deterministic lifecycle cadence; exact 7 or 30 days, otherwise 7 | Product/operations owner |
| `CRON_SECRET` | Secret | Exact Bearer authentication for Programme expiry, RFC-046 lifecycle queue/retention and RFC-053 Learn orchestration routes; hosted presence must be verified | Founder Office/config owner; repository maintainer technical consumer |
| `VERCEL_TOKEN` | Secret operator credential | Aggregate Founder analytics report only; process environment, never hosted client configuration | Founder Office/Vercel owner |
| `DEMO_CASINO_RETIREMENT_APPLY_CONFIRMATION` | High-risk one-time execution acknowledgement | Exact-ID RFC-012 retirement APPLY only; absent from ordinary runtime, CI and builds | Founder Office supplies only after independent review and separate execution authority |
| `AFFILIATE_REDIRECT_ENGINE_ENABLED` | High-risk commercial kill switch | Server `/r` redirect path; legacy `/outbound` compatibility reaches the same governed route | Founder Office plus compliance review |
| `JURISDICTION_RESOLVER_SHADOW_ENABLED` | Diagnostic configuration | Obsolete bounded shadow-comparison helper only; no active public authority consumer | Repository maintainer |
| `AFFILIATE_CREDENTIAL_REFERENCES`, `AFFILIATE_CREDENTIALS_<NORMALIZED_REFERENCE>` | Secret indirection/credentials | Server-only affiliate adapters; absent from Preview | Founder Office/partner operations; never client or logs |
| `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_MAX_FILE_SIZE_BYTES`, `MEDIA_MAX_DIMENSION` | Configuration | Media storage/runtime limits; Preview is `LOCAL` | Repository maintainer |
| `MEDIA_S3_ENDPOINT`, `MEDIA_S3_REGION`, `MEDIA_S3_BUCKET`, `MEDIA_S3_PUBLIC_BASE_URL` | Sensitive configuration | Optional S3-compatible provider; absent from Preview | Storage owner not documented |
| `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`, `MEDIA_S3_SESSION_TOKEN` | Secret | Optional S3-compatible provider; absent from Preview | Storage owner not documented |
| `PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS` | Runtime tuning | Prisma client | Repository maintainer |
| `AFFILIATE_HEALTH_MONITOR_TOKEN` | Secret | Bearer for the two monitor endpoints, `/api/internal/affiliate/route-health` and `/api/internal/ops-health`; the same value is the GitHub Actions secret used by the `Affiliate Route Health` and `Production Smoke` workflows. Unset in Vercel makes `/api/internal/ops-health` answer 404 | Founder Office/config owner; repository maintainer technical consumer |
| `PRODUCTION_SMOKE_BASE_URL` | Operational override | Smoke script; HTTPS or explicit loopback only. The monitor token is sent only to `https://b4gamble.com` or `http://127.0.0.1:*` | Repository maintainer |
| `CI`, `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` | Build/runtime mode | Tooling/framework | Automation-owned |

## Runtime database pool

**PROPOSED — NOT YET LIVE until branch `fix/db-connection-stability` is merged and deployed** (Founder decision, 27 September 2026, "B. База и клики без провалов").

- The application's Prisma client applies a code-level pool policy to a `DATABASE_URL` on `pooled.db.prisma.io`: `connection_limit=3`, `pool_timeout=5`, `connect_timeout=5`, `socket_timeout=25` (`RUNTIME_POOL_POLICY` in `lib/db/prisma-runtime-config.ts`). These four values override whatever the environment URL says; host, credentials, database and `sslmode` still come from the environment. The Production URL can keep `connection_limit=1`; no environment change is needed or made.
- Why: Vercel Fluid compute serves many concurrent requests from one instance, so a one-connection pool serialised every page read, `/r/` lookup, click write and auth query on that instance (27 September audit: `/r/` p90 1.05–1.6 s, P2024 pool timeouts, click writes lost to the 5 s interactive-transaction timeout, one page hung 300 s).
- Capacity (**INFERRED** from the 27 September audit, not re-measured): Prisma Postgres Starter allows roughly 50–100 pooled connections; instances × 3 stays well inside it at launch traffic. If `P2037`/too-many-connections errors appear, lower the constant and redeploy.
- The build gate (`lib/db/vercel-database-readiness.ts`) checks the URL as the runtime uses it: pooled host, `sslmode=require`, an effective pool of 1–5 connections and finite pool/connect/socket timeouts, plus the unchanged direct-URL and identity checks. The build log's `vercel_database_readiness` event reports `runtimeConnectionLimit`.
- Local, CI and any other host keep their URL exactly as configured, so disposable `connection_limit=1` databases keep the one-connection FIFO in `lib/db/public-database-read-coordinator.ts`. Every public read is bounded to 8 s either way.
- `DIRECT_URL`, migrations and release administration are unchanged.
- Rollback: revert the change; the environment URL's own `connection_limit=1` then applies again.
- **Driver since 3 October 2026 (Founder: "делай самый лучший вариант"):** the runtime client no longer uses the Prisma engine's own connection pool. `lib/db/prisma.ts` builds a `pg` pool from the same URL (`runtimePgPool` in `lib/db/prisma-runtime-config.ts`) and passes it to Prisma through `@prisma/adapter-pg`; `attachDatabasePool` from `@vercel/functions` keeps the instance alive until idle clients close, so Fluid compute never suspends an instance holding a connection. The policy carries over: `connection_limit` → pool `max` (3), `pool_timeout`/`connect_timeout` → `connectionTimeoutMillis` (5 s; `pg` bounds the wait and the connect together), `socket_timeout` → client-side `query_timeout` (25 s), idle clients close after 5 s on the pooled host. `sslmode=require` now verifies the certificate (both Prisma Postgres hosts present Let's Encrypt certificates, checked 3 October); other `sslmode` values mean no TLS as before. Local, CI and other hosts get the same translation of their own URL, so CI's Postgres suites run on the adapter.
- Why (**DETECTED** 3 October, 72 h of Production logs): ~486 requests hit P2024 (pool timeout, `connection limit: 3`), with P1001 and query timeouts alongside, about one request a minute at the time — stale connections in an idle instance, not load. 393 were the uptime monitor's `HEAD /en`; nearly all still answered 200 through fallbacks.
- Rollback for the driver: revert the adapter change; the engine pool and the four URL parameters above apply again with no environment change.

## Preview isolation runbook

1. Create one clearly named non-production Prisma Postgres resource in the same provider family. Connect it to Preview only under a non-Production prefix. Never clone, dump or restore Production into it.
2. Install only the existing migration history with `npx prisma validate`, `npx prisma generate` and `npx prisma migrate deploy`. Do not seed, run `db push`, create a migration or reset a database.
3. Generate new high-entropy Preview-only Better Auth and admin secrets. Add them only to Preview. Never move or copy the Production values.
4. Keep Preview `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` absent. Vercel must expose valid, distinct `VERCEL_URL` and `VERCEL_BRANCH_URL` system variables; middleware redirects only the exact deployment host to the exact branch host, while runtime auth allowlists only the branch host. Any wildcard, conflicting static origin, malformed metadata or unexpected Preview host is a failure.
5. For PROGRAM-AI-ACTIVATE-01, compare Preview and Production `DATABASE_URL` through provider host/database identity and safe fingerprints only. A match or unknown result blocks feature activation and migrations. Confirm migration `0018_program_ai_m1_foundation` on the isolated Preview target before either Programme gate becomes true.
6. Only after that proof, add the OpenAI key and three fixed provider configuration values to Preview, set both Programme gates to exact `true`, and redeploy. Do not add the key or real-provider gate to Production. The immediate rollback is either gate set to false; no database rollback is required.
7. Disable affiliate redirects and public CMS writes, use local media storage,
   and keep Production S3, Contact/lifecycle email delivery and affiliate
   credentials absent unless a separate exact activation stage authorises the
   specific Preview value. RFC-046 analytics may be enabled in Preview only
   with Preview-specific signing/internal secrets, environment tagging and
   synthetic consented data; it remains excluded from Production dashboards.
   Preview Google OAuth may use a separate non-Production client only after its
   exact stable branch callback is registered; never copy a Production secret.
8. Trigger a new Preview deployment after every environment change. Verify the deployment SHA, resource scopes, migration count, empty/allowed data state, public routes and runtime errors.
9. Run `scripts/verify-preview-auth-isolation.mjs` with provider-managed Preview and read-only Production database authority supplied only in process memory. Required output proves Preview session success, Production rejection, Preview-only mutation and cleanup without printing values.
10. Compare credentials using cryptographic fingerprints or immutable provider timestamps only. Record `MATCH`, `DIFFERENT`, `ABSENT` or `UNKNOWN`; never values.

To rotate Preview, generate a new Preview-only value, update only Preview, redeploy, rerun the isolation proof, and confirm the Production configuration metadata did not change. To recreate Preview, delete only the dedicated Preview resource after explicit approval, create a replacement, apply the existing migrations, reinstall Preview-only secrets and repeat every proof. Production data or backups must never be the source.

## B4GAMBLE Production authority cutover

The target Production-only values are:

```text
NEXT_PUBLIC_SITE_URL=https://b4gamble.com
BETTER_AUTH_URL=https://b4gamble.com
BETTER_AUTH_TRUSTED_ORIGINS=https://b4gamble.com
```

PR #59's brand cutover is complete, and the three values above remain the approved Production contract. FULL-SITE-QA-01 nevertheless observed the project and generated Production aliases rendering the application directly. Draft PR #72 adds the RFC-030 application guard for those aliases, but that correction is branch-only and no Production change is claimed before an authorised merge/deploy. Preview retains its separate dynamic exact-host contract. The legacy `sevenbet-next.vercel.app` project alias is an internal compatibility hostname, not the target public authority.

## Handling rules

- Store hosted values in the environment provider; commit names and safe examples only.
- Treat client-exposed `NEXT_PUBLIC_*` values as public. A secret must never use that prefix.
- Use independent values for Preview and Production. Scope each value only to environments that consume it.
- Rotate secrets after exposure, personnel/access changes or authentication incidents; coordinate database credential rotation with connection verification and rollback.
- Review Vercel access and GitHub administrator access at least quarterly during closed beta. Remove inactive users promptly.
- Never print values during diagnostics. Compare or classify them through redacted metadata only.
- `npm run ci:build-secrets` is defence in depth; it does not replace correct server/client boundaries.
