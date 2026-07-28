# External Services

| Service | Status | Purpose / evidence | Criticality | Environment variables | Owner |
| --- | --- | --- | --- | --- | --- |
| PostgreSQL | Detected | Prisma datasource in `prisma/schema.prisma`; repositories/services use Prisma. | High for persisted app paths | `DATABASE_URL` | Not documented. |
| Vercel | Partially detected | `.vercel/repo.json` links the local directory to a project. No `vercel.json`, deploy script, or deployed URL is confirmed. | Inferred medium | None detected as Vercel-specific | Not documented. |
| Amazon S3-compatible storage | Partially implemented | `lib/media/storage/s3-storage.provider.ts` and media configuration support it. Activation is configuration-dependent. | Optional/conditional | `MEDIA_S3_ENDPOINT`, `MEDIA_S3_REGION`, `MEDIA_S3_BUCKET`, `MEDIA_S3_PUBLIC_BASE_URL`, `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY`, `MEDIA_S3_SESSION_TOKEN` | Not documented. |
| Local media storage | Detected | `local-storage.provider.ts` and local media route. | Conditional | `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL` | Not documented. |
| Better Auth | Detected | Config/client/server/Next handler and Prisma adapter. | High for authenticated/admin paths | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` | Not documented. |
| Everflow | Partial adapter detected | `lib/affiliate-integrations/adapters/everflow.ts`; provider registry and integrations admin routes. No configured connection can be confirmed. | Optional/conditional | `AFFILIATE_CREDENTIAL_REFERENCES`, resolved server-side `AFFILIATE_CREDENTIALS_<NORMALIZED_REFERENCE>` | Not documented. |

**Not detected:** Stripe, Resend, OpenAI, Anthropic, Google APIs, Cloudflare, analytics/monitoring vendors, queues, email delivery, or a deployed production service URL. Environment variable values were not inspected or recorded.
