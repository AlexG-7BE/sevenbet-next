# Programme Access Authorization

Status: candidate-branch technical evidence, 31 August 2026. **PROPOSED until merge and migration; not deployed.**

## Audit scope and evidence

- **DETECTED:** repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`, based on fetched `origin/main` `3e8cc0c2b8fcb72a8a62532af492cebfc5564f7b` and the isolated implementation branch.
- **DETECTED:** the entire active repository was recursively scanned. `.git`, dependencies, generated output, `.next`, caches, test output and `tsconfig.tsbuildinfo` were excluded from source conclusions.
- **DETECTED:** route files, middleware, clients, auth handlers, Prisma schema/migrations, Programme services/repositories, privacy export/erasure and test/CI scripts were inspected.
- **UNKNOWN:** whether any existing Production user outside the exact safe backfill subset completed the historical checkboxes. No Production data was read or changed for this implementation.

## End-to-end access map

1. **DETECTED — first access:** `ProgrammeAccessScreen` presents the two unchecked controls. `POST /api/programme-access/authority` validates exact booleans and current copy versions.
2. **DETECTED — anonymous:** the endpoint issues a signed `ProgrammeAccessAuthority` tied to an opaque journey. `PROGRAMME_ACCESS_TTL_MS` remains 60 minutes. The browser stores that temporary authority in journey-scoped `sessionStorage`; `programmeAuthAccessHeaders` supplies its proof and journey only where the signed boundary is required.
3. **DETECTED — anonymous session:** session creation verifies the signed proof and `x-sevenbet-age-attestation`, then creates both the opaque HttpOnly Programme session and an anonymous `ProgrammeAccessAcceptance` in one serializable transaction. Later anonymous writes require the age header in middleware and the opaque session in the route/service.
4. **DETECTED — claim:** claim/redeem requires a valid authenticated user, the one-time HttpOnly claim, valid anonymous session state and its server-side access acceptance. Redemption binds that acceptance to the exact User in the same transaction as claim consumption and Programme persistence.
5. **DETECTED — authenticated:** `GET /api/programme-access/authority` resolves accepted status from the User's server record. Every authenticated Programme read/write route uses `requireProgrammeAcceptedUser`, which requires both Better Auth and durable acceptance. It does not inspect `sessionStorage`, the age header, locale or current legal-copy constants.
6. **DETECTED — resume:** Home, Missions 2–10, guidance and Reviews send ordinary same-origin authenticated requests. Logout clears only temporary local markers. A later login, tab/browser/device change or empty storage resolves the same durable server record.
7. **DETECTED — authenticated Mission 1:** an already accepted user who starts the anonymous-style intake requests a journey proof using `{ journeyId }` only. The server verifies durable acceptance before invisibly issuing it. Failure preserves progress and shows a localized retryable error; it does not render the acknowledgement controls.

`userProgrammeSubject` remains the namespace for tab-local user-authored wording. It is not an authorization source. The short-lived proof remains a technical anonymous/pre-account credential, not authenticated acceptance.

## Mutation inventory

Category A is anonymous/pre-account. Category B is authenticated Programme persistence. Category C is a transition, cleanup or no-write route. Middleware treats any future unclassified Programme mutation as anonymous/unknown and requires the age header; CI fails when a current route is unclassified.

| Category | Method and endpoint | Authorization in the candidate |
| --- | --- | --- |
| A | `POST /api/program/session` | Age header + exact signed journey proof; creates opaque session and anonymous acceptance atomically. |
| A | `PATCH /api/program/session/mission-01` | Age header + opaque HttpOnly anonymous session; state/service checks. |
| A | `POST /api/program/session/mission-01/claim` | Age header + opaque anonymous session; one-time claim transition rules. |
| A | `POST /api/program/program-ai/session` | Age header + exact signed journey proof; creates opaque session and anonymous acceptance atomically. |
| A | `POST`, `DELETE /api/program/program-ai/authority` | Age header + opaque anonymous session; separate sensitive-input authority contract. |
| A | `POST /api/program/program-ai/turn` | Age header + opaque anonymous session + active sensitive-input authority. |
| A | `POST /api/program/program-ai/transcription` | Age header + bounded anonymous request/rate boundary. |
| A | `POST /api/program/program-ai/starting-point` | Age header + opaque anonymous session + Mission state checks. |
| A | `POST /api/program/program-ai/support/continue` | Age header + opaque anonymous session. |
| A | `POST /api/program/program-ai/claim` | Age header + opaque anonymous session + completed anonymous actions. |
| B | `PATCH /api/program/missions/01`, `POST /api/program/missions/01/complete` | Better Auth + durable acceptance + user ownership; legacy runtime and rate gates. |
| B | `PUT /api/program/missions/02`, `POST /api/program/missions/02/complete` | Better Auth + durable acceptance + user enrollment/prerequisite ownership; legacy runtime and rate gates. |
| B | `PUT /api/program/missions/03`, `POST /api/program/missions/03/complete` | Same central durable authorization and domain gates. |
| B | `PATCH /api/program/missions/04`, `POST /api/program/missions/04/complete` | Same central durable authorization and domain gates. |
| B | `PATCH`, `DELETE /api/program/artefacts/moment-map` | Better Auth + durable acceptance + owner-scoped service; write/runtime/rate rules as applicable. |
| B | `PATCH`, `DELETE /api/program/artefacts/current-goal` | Same central durable authorization and owner scope. |
| B | `PATCH`, `DELETE /api/program/artefacts/urge-learning-record` | Same central durable authorization and owner scope. |
| B | `PATCH`, `DELETE /api/program/artefacts/active-boundary` | Same central durable authorization and owner scope. |
| B | `POST /api/program/progress/start` | Better Auth + durable acceptance, then legacy runtime/rate/input/service gates. |
| B | `POST /api/program/progress/current-step` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/lesson` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/exercise` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/quiz` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/scenario` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/step` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/complete` | Same central durable authorization and progress service ownership. |
| B | `POST /api/program/progress/merge` | Same central durable authorization and progress service ownership. |
| B | `DELETE /api/program/reflections` | Better Auth + durable acceptance + owner-scoped delete/rate gate. |
| B | `POST /api/program/program-ai/missions/{2..10}/actions` | Better Auth + durable acceptance + enrollment/prerequisite service + idempotent reward/event keys. |
| B | `POST /api/program/program-ai/missions/{2..10}/guidance` | Better Auth + durable acceptance + enrollment/prerequisite service; bounded AI/fallback contract. |
| B | `POST /api/program/program-ai/missions/{2..10}/complete` | Better Auth + durable acceptance + prerequisites + idempotent completion reward. |
| B | `POST /api/program/program-ai/reviews/{first,mid,full}` | Better Auth + durable acceptance + completed-Mission entitlement; no reward mutation. |
| C | `POST /api/program/claims/redeem`, `POST /api/program/program-ai/claims/redeem` | Better Auth + one-time claim cookie + anonymous session acceptance; binds acceptance and Programme state atomically. |
| C | `DELETE /api/program/session` | Better Auth cleanup transition only; no Programme progress mutation. |
| C | `POST /api/program/reflections` | Retired local-only path; legacy mode gate and `410` response, with no persistence. |

Authenticated GET routes for Dashboard, rewards, Missions/Home/Reviews and legacy projections use the same `requireProgrammeAcceptedUser` helper even though middleware classification applies only to mutations. This prevents a writable UI from being exposed using a weaker acceptance rule.

## Durable model and monotonicity

**DETECTED in candidate:** `ProgrammeAccessAcceptance` has an exclusive User or anonymous-session subject, first adult/Terms/Privacy timestamps, optional first versions, a source enum and unique subject indexes. The repository uses create-only upsert semantics. Duplicate acknowledgement does not update timestamps or versions. There is no application expiry, locale key or normal revoke/delete path; verified data-subject erasure deletes it with the account.

**DETECTED:** `ProgrammeSensitiveInputAuthority` cannot be reused. It authorizes narrow Article-9-like unrestricted input processing, has different versions and may be withdrawn. Access acceptance has different purpose and lifecycle.

## Existing-user evidence and backfill

- **DETECTED:** generic `ProgramEnrollment` and legacy progress could be created without an evidential link to signed 18+/Terms/Privacy proof. They are not safe consent evidence.
- **INFERRED from detected route and transaction invariants:** a consumed claim from an anonymous session with exact `missionVersion = program-ai-01:v1`, joined to the same user's `ProgrammeStartingPoint` with exact `version = program-ai-01:v1` and `confirmedAt = consumedAt`, proves the session passed signed access verification before creation and was claimed in the Starting-Point transaction.
- **DETECTED:** migration `0024` backfills only that subset, uses anonymous-session `createdAt` as the closest truthful acceptance-time lower bound, and stores unknown historical copy versions as `NULL`.
- **UNKNOWN:** access status for every other historical authenticated user. The migration leaves those users unaccepted so the application fails closed and requests one acknowledgement rather than fabricating evidence.

## Release boundary

**PROPOSED:** merge the candidate only after the required unit, browser, migration, structural, internationalisation, lint, typecheck, build and diff gates pass. Application promotion requires schema `0024`; no Production migration mechanism is included. A separate explicit Founder Production migration/deploy decision is required.
