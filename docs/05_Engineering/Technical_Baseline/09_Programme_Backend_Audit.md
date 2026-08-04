# Active Control Programme Backend Audit

Audit date: 2026-08-04. Repository root confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. The recursive scan excluded dependencies, `.next`, caches, generated output, test results, coverage and `tsconfig.tsbuildinfo`.

## Pre-change evidence and disposition

| Area | Audit classification | Evidence and implementation disposition |
| --- | --- | --- |
| Prisma model | **Detected** | PostgreSQL/Prisma, `Program`, published versions, enrollment, progress/reflection, XP and achievement models existed. Extended additively in migration 0015. |
| Better Auth | **Detected** | Email/password, Prisma adapter, server session helpers and `/api/auth/[...all]` existed. Reused; no second auth/session framework. |
| Program/progress | **Detected** | Published-snapshot enrollment and authenticated progress events existed. The approved first-two-mission state machine was **Not detected** and is now implemented. |
| XP/achievement | **Detected** | Transactional, idempotent rule/achievement engines existed. Mission artefact provenance and First Plan were **Not detected** and are now implemented by extending the same ledgers. |
| Streak/active day | **Inferred / Not detected** | Browser-local streak UI existed; no server active-day authority existed. Server active-day records and streak derivation are now implemented. |
| API/routes/services | **Detected** | App Router delivery → service → repository convention existed. The new Programme routes follow it. Server actions remain **Not detected**. |
| Session storage | **Detected / gap** | Better Auth persisted authenticated sessions; anonymous Programme state existed only in browser localStorage. Private PostgreSQL anonymous session/claim storage is now implemented. |
| Dashboard backend | **Not detected** | No approved server Dashboard read model existed. It is now implemented at `/api/program/dashboard`. |
| Analytics/events | **Not detected** | No analytics provider or general product/commercial event pipeline was found. Programme routes intentionally emit none. Progress/reward ledgers are operational domain facts, not analytics payloads. |
| Privacy/deletion | **Detected / partial** | Private reflections and owner-scoped deletion existed. Programme artefact content erasure is implemented; account-wide export/erasure and automated anonymous purge remain **Planned**. |
| Tests | **Detected** | Node tests covered progress, XP, achievements, auth and responsible-gambling safety. `tests/programme-flow.test.ts` now covers the approved first-two-mission flow and constraints. |
| Rate limiting | **Detected / partial** | Only an in-memory affiliate operation limiter existed. A similarly bounded Programme limiter is implemented; a distributed limiter remains **Planned**. |

## Separation result

**Detected:** Programme persistence is owner-scoped and distinct from affiliate/casino repositories. Sensitive draft/artefact text is not written to progress or XP metadata. No Programme-to-commercial import, event or decision path is present.

**Not detected:** production migration application, automated expired-session purge, distributed rate limiting, reminder delivery, account-wide data export/erasure, production telemetry and deployed database verification.
