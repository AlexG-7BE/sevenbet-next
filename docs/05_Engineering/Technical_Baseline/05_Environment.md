# Environments

## Detected local workflow

`npm run dev` starts Next.js on port 4173; `npm run build` builds, and `npm run start` starts on the same port. `.env`, `.env.local`, and `.env.example` are present. Only `.env.example` names are documented here; values are intentionally omitted.

| Environment | Evidence | URL/status |
| --- | --- | --- |
| Development | Detected npm scripts and example values | `http://localhost:4173` is the documented local default. |
| Preview | Partially detected | Vercel link metadata is present, but no preview URL/process is documented. |
| Production | Partially detected | `NEXT_PUBLIC_SITE_URL` supports canonical URLs; no production URL, deploy command, or release process is repository-confirmed. |

## Configuration surface

| Area | Variable names (values omitted) |
| --- | --- |
| Database/site/auth | `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` |
| Admin bootstrap/legacy gate | `SEVENBET_ADMIN_PREVIEW_TOKEN`, `CMS_PHASE1_ALLOW_DEV_ADMIN`, `CMS_AUTH_PROVIDER`, `CMS_WEBHOOK_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_PROFILE_ID`, `ADMIN_PROFILE_EMAIL`, `ADMIN_PROFILE_NAME` |
| Public casino/affiliate | `PUBLIC_CASINO_CMS_ENABLED`, `AFFILIATE_REDIRECT_ENGINE_ENABLED`, `AFFILIATE_REDIRECT_DEV_GEO_OVERRIDE`, `AFFILIATE_CREDENTIAL_REFERENCES`, `AFFILIATE_CREDENTIALS_<NORMALIZED_REFERENCE>` |
| Media | `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_MAX_FILE_SIZE_BYTES`, `MEDIA_MAX_DIMENSION`, and the `MEDIA_S3_*` variables listed in [04_External_Services.md](04_External_Services.md). |

## CI/CD and secrets

**Not detected:** GitHub Actions or another CI workflow, coverage publishing, a production migration command, IaC, container deployment, or explicit secret-manager integration. `.env*` files are ignored by `.gitignore`; this is a local repository convention, not proof of production secret management.

**Detected:** Prisma client generation runs at `postinstall`; focused smoke/test scripts are available. Test results are treated as generated/local analysis output and excluded from this audit.
