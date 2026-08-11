# Environment and Secrets

## Trust zones and active evidence

Reconciled on 2026-08-11 for the approved B4GAMBLE canonical-domain release contract, Preview isolation and RECOVERY-01. Secret values are intentionally omitted.

| Zone | Database authority | Auth/admin authority | External integrations | Allowed data and mutation | Deployment source |
| --- | --- | --- | --- | --- | --- |
| Local | **Detected:** developer-owned local configuration | **Detected:** developer-owned secrets | Local/synthetic only | Synthetic/local data; developer-owned mutations | Developer checkout |
| CI | **Detected:** disposable PostgreSQL 16 service | **Detected:** fake auth/admin sentinels; no Vercel secret | Disabled/fake only | Disposable test data; migrations and tests may mutate the disposable service | Pull-request GitHub Actions |
| Preview | **Branch-specific current exception:** dedicated Prisma Postgres aliases for `sevenbet-preview` (`store_hLPkkgamL7rJNmCe`) are present, but a redacted 2026-08-11 pull for the RECOVERY-01 branch found generic runtime `DATABASE_URL` and `DIRECT_URL` absent. The approved PR #64 feature-on Preview separately had valid isolated runtime bindings and passed live validation before merge. | **Detected:** Preview-only Better Auth secret and admin token; exact Vercel branch host is derived from system metadata | Affiliate redirects and public CMS disabled; local media provider; OpenAI credential and Programme configuration exist only in Preview metadata/authorised branch scopes and were not read or used by RECOVERY-01; no S3, email, webhook, analytics or affiliate credentials detected | Non-production disposable test data only after runtime database authority is verified for the exact deployment; no Production copy | Non-`main` Vercel Preview deployment |
| Production | **Detected:** Prisma Postgres `prisma-postgres-cobalt-school` (`store_1I4F54ETrwSKS42o`), provider connection restricted to Production only | **Detected:** Production-only Better Auth/admin configuration | Production authority only when separately approved and configured | Governed Production data and mutations only | `main` Vercel Production deployment |
| Demo/Staging | **Planned:** separate project and database | **Planned:** separate auth/admin authority | Sandbox or separately approved non-production authority | Curated synthetic/demo data only | Future separately authorised deployment |

Preview is an engineering/review environment, not Demo/Staging. It must never become a shadow copy of Production personal, Programme, Protected Help, Self-Check or Limit Tracker data.

## ENV-ISO-01 isolation evidence

- **Historic detected evidence:** ENV-ISO-01 proved Preview and Production used different Vercel/Prisma resource IDs and different database credentials; their runtime URL relations were `DIFFERENT` at that verification point.
- **Current detected exception, 2026-08-11:** Preview provider aliases remain populated but the RECOVERY-01 branch pull contains no generic runtime `DATABASE_URL` or `DIRECT_URL`. The provider-owned Preview and Production direct aliases were compared in process memory: resource IDs and connection-authority fingerprints were `DIFFERENT`. This authorises the bounded recovery drill only for this branch. It does not retroactively negate the valid isolated bindings used by the approved PR #64 feature-on Preview validation.
- **Detected:** the Preview backup point contains all 18 repository migrations through `0018_program_ai_m1_foundation`. Historic ENV-ISO-01 evidence proved 17 migrations on both resources; RECOVERY-01 did not query current Production migration rows.
- **Detected:** Preview and Production Better Auth secrets and admin tokens are independently generated. Production values were unchanged after the accepted ENV-REC-01 recovery baseline.
- **Detected:** Preview Better Auth uses `VERCEL_BRANCH_URL` only when `VERCEL_ENV=preview`. The host must be an exact generated `*-git-*.vercel.app` branch host; wildcard, Production fallback and contradictory static origins fail closed. Exact requests to the current valid `VERCEL_URL` deployment host are redirected with status 307 to that exact branch host before rendering/auth, with path and query preserved; malformed metadata and unexpected Preview hosts reject. Production, local and ordinary CI do not canonicalise.
- **Detected:** an `example.invalid` Preview account and session succeeded, the exact account was absent from Production, Production rejected the Preview session, and the Preview account was deleted. No ENV-ISO auth canary remains. RECOVERY-01 separately retains one synthetic structural canary pending managed-snapshot capture.
- **Detected:** the Production marketplace connection is Production-only under `PRODDB_*`; the Preview connection is Preview-only under `ENVISO_*`. The application continues to consume separately scoped `DATABASE_URL`/`DIRECT_URL` values.
- **Detected:** PR #52 merged as `a954243786af83ec6ce97f8a1a0527d0b6a3cf2b`; exact-merge main CI passed, Production deployment `dpl_4xhpC5sQwQuuzLp9RZkNi8YVG4uL` is Ready, Production Smoke run `31254902719` passed and a real Production staff auth E2E passed login, protected admin, refresh/session persistence and logout.
- **Not detected:** any Production database, user, Programme, protected-support or CMS record copied to Preview.

ENV-ISO-01 and the associated Production configuration incident are closed. Recovery remains **PARTIAL — MANAGED CANARY SNAPSHOT PENDING** under RFC-024: Starter, completed Production/Preview snapshots and provider-native new-target restore mechanics are detected, but the selected snapshot predates the one pending synthetic Preview canary.

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
| `SEVENBET_ACCOUNT_EMAIL_FROM`, `SEVENBET_PROGRAMME_EMAIL_FROM`, `SEVENBET_EMAIL_REPLY_TO` | Sender configuration, not delivery credentials | Future server-only communications sender categories; currently no selected provider or Production send path | Founder Office/communications owner; values require verified domain/mailbox authority before activation |
| `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL` | Vercel system configuration | Trusted request-country runtime boundary; exact Preview deployment redirect source; bounded stable Preview Better Auth origin derivation | Vercel control plane |
| `NEXT_PUBLIC_SITE_URL` | Public configuration | Production target is exact `https://b4gamble.com`; canonical links, metadata, structured data, sitemap, robots and media fallback derive from it | Repository maintainer |
| `SEVENBET_ADMIN_PREVIEW_TOKEN` | Secret, legacy/admin gate | Independent Preview and Production values | Founder Office/config owner |
| `CMS_PHASE1_ALLOW_DEV_ADMIN`, `CMS_AUTH_PROVIDER` | Sensitive feature/auth configuration | Admin auth compatibility | Repository maintainer; remove only through governed auth work |
| `CMS_WEBHOOK_SECRET` | Secret | Listed legacy/webhook surface; active consumer **not detected** | Owner not documented |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_PROFILE_ID` | Personal/sensitive bootstrap inputs | Manual bootstrap script only | Founder Office decision owner; never routine runtime/CI |
| `ADMIN_PROFILE_EMAIL`, `ADMIN_PROFILE_NAME` | Personal/sensitive operator input | Manual profile script only | Founder Office decision owner |
| `PUBLIC_CASINO_CMS_ENABLED` | Sensitive feature flag | Public CMS-backed casino discovery; disabled in Preview | Repository maintainer |
| `PROGRAM_AI_V1_ENABLED` | Sensitive feature flag | RFC-022 M1 Preview slice; exact `true` only; default off and Production unchanged | Founder Office plus repository maintainer |
| `PROGRAM_AI_REAL_PROVIDER_ENABLED` | Sensitive provider kill switch | RFC-023 real OpenAI adapter; exact `true` only and Preview-only; default off | Founder Office plus repository maintainer |
| `PROGRAM_AI_PROVIDER`, `PROGRAM_AI_OPENAI_MODEL`, `PROGRAM_AI_TRANSCRIPTION_MODEL` | Server-only provider configuration | Preview values are respectively `openai`, `gpt-5.6-terra`, `gpt-4o-transcribe`; any other configured model fails closed | Repository maintainer under RFC-023 |
| `OPENAI_API_KEY` | Secret | Preview-only OpenAI API authentication after database isolation; never client-exposed, printed, documented as a value or copied to Production | Founder Office/OpenAI account owner; repository maintainer technical consumer |
| `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS` | High-risk exceptional flag | RFC-012 scripts/public guard | Founder Office under RFC-012 only |
| `AFFILIATE_REDIRECT_ENGINE_ENABLED` | High-risk commercial kill switch | Server redirect and confirmation paths; public affiliate redirects disabled in Preview | Founder Office plus compliance review |
| `JURISDICTION_RESOLVER_SHADOW_ENABLED` | Diagnostic configuration | Obsolete bounded shadow-comparison helper only; no active public authority consumer | Repository maintainer |
| `AFFILIATE_CREDENTIAL_REFERENCES`, `AFFILIATE_CREDENTIALS_<NORMALIZED_REFERENCE>` | Secret indirection/credentials | Server-only affiliate adapters; absent from Preview | Founder Office/partner operations; never client or logs |
| `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_MAX_FILE_SIZE_BYTES`, `MEDIA_MAX_DIMENSION` | Configuration | Media storage/runtime limits; Preview is `LOCAL` | Repository maintainer |
| `MEDIA_S3_ENDPOINT`, `MEDIA_S3_REGION`, `MEDIA_S3_BUCKET`, `MEDIA_S3_PUBLIC_BASE_URL` | Sensitive configuration | Optional S3-compatible provider; absent from Preview | Storage owner not documented |
| `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`, `MEDIA_S3_SESSION_TOKEN` | Secret | Optional S3-compatible provider; absent from Preview | Storage owner not documented |
| `PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS` | Runtime tuning | Prisma client | Repository maintainer |
| `PRODUCTION_SMOKE_BASE_URL` | Operational override | Smoke script; HTTPS or explicit loopback only | Repository maintainer |
| `CI`, `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` | Build/runtime mode | Tooling/framework | Automation-owned |

## Preview isolation runbook

1. Create one clearly named non-production Prisma Postgres resource in the same provider family. Connect it to Preview only under a non-Production prefix. Never clone, dump or restore Production into it.
2. Install only the existing migration history with `npx prisma validate`, `npx prisma generate` and `npx prisma migrate deploy`. Do not seed, run `db push`, create a migration or reset a database.
3. Generate new high-entropy Preview-only Better Auth and admin secrets. Add them only to Preview. Never move or copy the Production values.
4. Keep Preview `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` absent. Vercel must expose valid, distinct `VERCEL_URL` and `VERCEL_BRANCH_URL` system variables; middleware redirects only the exact deployment host to the exact branch host, while runtime auth allowlists only the branch host. Any wildcard, conflicting static origin, malformed metadata or unexpected Preview host is a failure.
5. For PROGRAM-AI-ACTIVATE-01, compare Preview and Production `DATABASE_URL` through provider host/database identity and safe fingerprints only. A match or unknown result blocks feature activation and migrations. Confirm migration `0018_program_ai_m1_foundation` on the isolated Preview target before either Programme gate becomes true.
6. Only after that proof, add the OpenAI key and three fixed provider configuration values to Preview, set both Programme gates to exact `true`, and redeploy. Do not add the key or real-provider gate to Production. The immediate rollback is either gate set to false; no database rollback is required.
7. Disable affiliate redirects and public CMS writes, use local media storage, and keep Production S3, email-delivery, webhook, analytics and affiliate credentials absent. Preview Google OAuth may use a separate non-Production client only after its exact stable branch callback is registered; never copy the Production Google secret. Add any other sandbox credential only through separate approval.
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

Before PR #59 is merged, Founder/Operations must apply and verify the three values together in Production only. Changing the values must not deploy or otherwise mutate the current Production application. After Founder merges PR #59 by merge commit, the automatic exact-main Vercel Production deployment must build with this environment contract. Wait for the exact merged SHA to be Ready, then verify metadata, canonical links, structured data, robots, sitemap, Better Auth session behaviour, safe account access, legacy-host canonical behaviour and runtime errors. Preview values and its dynamic exact-host contract do not change. The legacy `sevenbet-next.vercel.app` project alias is an internal compatibility hostname, not the target public authority.

## Handling rules

- Store hosted values in the environment provider; commit names and safe examples only.
- Treat client-exposed `NEXT_PUBLIC_*` values as public. A secret must never use that prefix.
- Use independent values for Preview and Production. Scope each value only to environments that consume it.
- Rotate secrets after exposure, personnel/access changes or authentication incidents; coordinate database credential rotation with connection verification and rollback.
- Review Vercel access and GitHub administrator access at least quarterly during closed beta. Remove inactive users promptly.
- Never print values during diagnostics. Compare or classify them through redacted metadata only.
- `npm run ci:build-secrets` is defence in depth; it does not replace correct server/client boundaries.
