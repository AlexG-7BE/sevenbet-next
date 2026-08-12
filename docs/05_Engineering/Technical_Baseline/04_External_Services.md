# External Services

| Service | Status | Purpose / evidence | Criticality | Configuration names | Owner evidence |
| --- | --- | --- | --- | --- | --- |
| Prisma Postgres | Detected | Redacted hosted endpoint classification plus Prisma datasource/repositories. **Detected:** the Vercel-billed workspace and both isolated resources are Starter; seven-day retention metadata and completed Production/Preview snapshots are present. RECOVERY-01 completed a Preview-only provider-native restore to a fresh isolated target with exact migration/schema/FK/count/canary/repository parity and exact target/canary cleanup. Production remained read-only. | High | `DATABASE_URL`, `DIRECT_URL`, provider aliases | Founder Office/config owner; technical consumer repository maintainer |
| Vercel | Detected | Linked project `sevenbet-next`; Production deployment and Node.js 24.x were verified through metadata/API. | High | Vercel environment configuration; `NEXT_PUBLIC_SITE_URL` | Founder Office/config owner; repository maintainer technical owner |
| GitHub and Actions | Detected | Git remote, administrator access, CI/smoke workflows and repository governance files. | High for source/release governance | No hosted application secret required by PR CI | Repository administrator `@AlexG-7BE` |
| Amazon S3-compatible storage | Partially implemented | `lib/media/storage/s3-storage.provider.ts`; activation is configuration-dependent. | Optional/conditional | `MEDIA_S3_*` | Not documented |
| Local media storage | Detected | Local provider and media route. | Conditional | `MEDIA_STORAGE_PROVIDER`, `MEDIA_LOCAL_STORAGE_ROOT`, `MEDIA_PUBLIC_BASE_URL` | Repository maintainer |
| Better Auth | Detected | Config/client/server/Next handler and Prisma adapter. | High | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` | Founder Office/config owner; repository maintainer technical owner |
| Everflow | Partial adapter detected | Adapter/provider registry exists; configured connection is not confirmed. | Optional/conditional | affiliate credential references and resolved server-only credentials | Not documented |

**Not detected:** payment/email/analytics/APM providers, queues, automated paging, infrastructure-as-code, or a provider-native Production recovery point. **Detected:** the bounded logical recovery procedure in RFC-024 and its 2026-08-11 Preview drill. Secret values were never recorded.
