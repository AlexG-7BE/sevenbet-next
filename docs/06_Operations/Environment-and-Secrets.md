# Environment and Secrets

## Trust zones and current gate

| Zone | Approved use | Current evidence |
| --- | --- | --- |
| Local | Developer-owned synthetic/local resources | **Detected:** `.env` and `.env.local` are ignored; `.env.example` is the committed name/template surface. |
| CI | Disposable build/test resources only | **Detected:** CI uses fake sentinels and localhost PostgreSQL; it receives no Vercel secret. |
| Preview | Isolated non-production services and separate auth/admin secrets | **Detected gap:** Preview and Production currently resolve to identical redacted database, Better Auth and admin-preview values. Mutation-capable Preview use is blocked. |
| Production | Production services and least-privilege secrets | **Detected:** Vercel-managed encrypted variables exist. Values were not recorded. |

Before mutation-capable Preview testing, provision a separate non-production database, separate Better Auth secret, separate admin preview token and Preview-specific auth URLs/origins. Rotate or remove stale variables after consumers are verified. Never copy Production data into Preview without an approved sanitisation process.

## Variable inventory

| Names | Classification | Consumer / scope | Ownership evidence |
| --- | --- | --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Secret, runtime/direct database credentials | Prisma runtime and migration tooling | Hosted provider/config owner: Founder Office; technical consumer: repository maintainer |
| `PRISMA_DATABASE_URL`, `POSTGRES_URL` | Secret, provider-injected database aliases | Present in Vercel; no repository consumer detected | Provider/config owner not separately documented |
| `BETTER_AUTH_SECRET` | Secret | Better Auth runtime convention | Founder Office/config owner; repository maintainer technical owner |
| `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` | Sensitive configuration | Better Auth origin/callback trust | Same as authentication configuration |
| `NEXT_PUBLIC_SITE_URL` | Public configuration | Canonical links, redirects, media fallback | Repository maintainer |
| `SEVENBET_ADMIN_PREVIEW_TOKEN` | Secret, legacy/admin gate | Admin authorization path | Founder Office/config owner |
| `CMS_PHASE1_ALLOW_DEV_ADMIN`, `CMS_AUTH_PROVIDER` | Sensitive feature/auth configuration | Admin auth compatibility | Repository maintainer; remove only through governed auth work |
| `CMS_WEBHOOK_SECRET` | Secret | Listed legacy/webhook surface; active consumer **not detected** | Owner not documented |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_PROFILE_ID` | Personal/sensitive bootstrap inputs | Manual bootstrap script only | Founder Office decision owner; never routine runtime/CI |
| `ADMIN_PROFILE_EMAIL`, `ADMIN_PROFILE_NAME` | Personal/sensitive operator input | Manual profile script only | Founder Office decision owner |
| `PUBLIC_CASINO_CMS_ENABLED` | Sensitive feature flag | Public CMS-backed casino discovery | Repository maintainer |
| `ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS` | High-risk exceptional flag | RFC-012 scripts/public guard | Founder Office under RFC-012 only |
| `AFFILIATE_REDIRECT_ENGINE_ENABLED`, `AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE`, `JURISDICTION_RESOLVER_SHADOW_ENABLED` | High-risk commercial/jurisdiction flags | Server redirect/resolution paths | Founder Office plus compliance review where applicable |
| `AFFILIATE_CREDENTIAL_REFERENCES`, `AFFILIATE_CREDENTIALS_<NORMALIZED_REFERENCE>` | Secret indirection/credentials | Server-only affiliate adapters | Founder Office/partner operations; never client or logs |
| `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_MAX_FILE_SIZE_BYTES`, `MEDIA_MAX_DIMENSION` | Configuration | Media storage/runtime limits | Repository maintainer |
| `MEDIA_S3_ENDPOINT`, `MEDIA_S3_REGION`, `MEDIA_S3_BUCKET`, `MEDIA_S3_PUBLIC_BASE_URL` | Sensitive configuration | Optional S3-compatible provider | Storage owner not documented |
| `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`, `MEDIA_S3_SESSION_TOKEN` | Secret | Optional S3-compatible provider | Storage owner not documented |
| `PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS` | Runtime tuning | Prisma client | Repository maintainer |
| `PRODUCTION_SMOKE_BASE_URL` | Operational override | Smoke script; HTTPS or explicit loopback only | Repository maintainer |
| `CI`, `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` | Build/runtime mode | Tooling/framework | Automation-owned |

## Handling rules

- Store hosted values in the environment provider; commit names and safe examples only.
- Treat client-exposed `NEXT_PUBLIC_*` values as public. A secret must never use that prefix.
- Use independent values for Preview and Production. Scope each value only to environments that consume it.
- Rotate secrets after exposure, personnel/access changes, or authentication incidents; coordinate database credential rotation with connection verification and rollback.
- Review Vercel access and GitHub administrator access at least quarterly during closed beta. Remove inactive users promptly.
- Never print values during diagnostics. Compare or classify them through redacted metadata only.
- `npm run ci:build-secrets` is a defence-in-depth scan; it does not replace correct server/client boundaries.
