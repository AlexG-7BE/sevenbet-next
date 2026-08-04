# Active Control Programme Backend Architecture Audit

Audit date: 2026-08-04. Scope: implemented Active Control Programme Missions 01–04 before Missions 05–10. Repository root confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` at commit `7b9ebfb`. The recursive inventory excluded dependencies, `.next`, caches, generated output, test results, coverage and `tsconfig.tsbuildinfo`.

This is the pre-refactor evidence and decision record for the bounded backend hardening. Product behaviour, public API contracts, rewards, Mission content, React/Figma surfaces and migrations are out of scope for change unless a proven defect requires a separate decision.

## Audit summary

- **Detected:** `lib/services/programme-flow.service.ts` is a 1,205-line application monolith containing anonymous-session, claim, Missions 02–04, artefact, rewards, active-day and Dashboard concerns.
- **Detected:** `lib/repositories/programme-flow.repository.ts` is a 559-line persistence monolith spanning sessions, claims, enrollment/progress, four artefacts, rewards, achievements, active days and the Dashboard projection.
- **Detected:** `lib/programme/validation.ts` is a 506-line cross-mission validator and `lib/programme/contract.ts` combines task contracts, domain enumerations, path titles, evidence content and DTO input types.
- **Detected:** Programme route handlers are already thin and do not import Prisma. They authenticate where required, apply rate limits where configured, parse/validate transport input, invoke one service method and normalise responses.
- **Detected:** Mission claim/completion commands already use Prisma `Serializable` transactions with retry on `P2034`; database uniqueness protects claim tokens, enrollment/mission rows, one artefact per enrollment, reward keys, achievement keys and active days.
- **Inferred risk:** the existing in-memory tests model uniqueness but do not prove rollback, database isolation or concurrent transaction behaviour. The regression baseline needs explicit failure injection and concurrent replay assertions before code movement.
- **Inferred risk:** Dashboard reads issue three queries without an explicit read snapshot outside completion transactions, so a read concurrent with completion can theoretically combine progress, XP and achievement states from different committed instants.
- **Detected limitation:** autosave accepts no revision or client sequence. Task states merge monotonically, but an older request arriving later can overwrite a newer field value. This PR will preserve the public contract and document the limitation rather than introduce a breaking version field.
- **Detected documentation drift:** `docs/programme-backend-api.md` describes Mission 03 autosave as `PATCH`; the implemented route and current UI use `PUT`. The implementation baseline is `PUT` and the API document must be corrected without changing the route.

## A. Current responsibilities

### Application service

| Concern | Detected methods in `ProgrammeFlowService` |
| --- | --- |
| Anonymous Programme session | `createAnonymousSession`, `saveMissionOneDraft`, `createPendingClaim`, `requireAnonymousSession` |
| Mission 01 claim | `redeemPendingClaim` |
| Mission progression | claim redemption plus `completeMissionTwo`, `completeMissionThree`, `completeMissionFour`; each writes current and next mission state and `ProgramEnrollment.currentStepId` |
| Artefact persistence | claim creates `MomentMap`; completion methods create/update `CurrentGoal`, `UrgeLearningRecord`, `ActiveBoundary`; edit/erasure methods cover all four artefacts |
| Rewards / XP / achievements | mission award keys, `recordMissionXp`, First Plan lookup/unlock, Boundary Built lookup/unlock, `getRewards` |
| Active days | eligible-day writes in each completion, streak derivation through the Dashboard, `voidActiveDay` admin correction |
| Dashboard read model | `getDashboard`, `dashboardFrom`, and four DTO mapper methods |
| Mission 03 learning record | `getMissionThreeDraft`, `saveMissionThreeDraft`, `completeMissionThree`, update/delete result |
| Mission 04 Active Boundary | `getMissionFourDraft`, `saveMissionFourDraft`, `completeMissionFour`, update/delete result |
| Shared orchestration | published-program shape check, enrollment resolution, serializable retry, Prisma enum/JSON/Decimal conversion |

The service therefore mixes use-case orchestration, domain eligibility, reward policy, transaction retry, persistence-shape conversion, query projection and presentation mapping.

### Repository

| Persistence responsibility | Detected methods |
| --- | --- |
| Transaction boundary | `transaction` |
| Anonymous sessions / claims | create/find/update/transition session; upsert/find/consume claim; tombstone session |
| Programme source / progression | find published Program/version; enrollment create/find; current-step update; mission-progress find/upsert/update |
| Artefacts | find/create/update/erase Moment Map; find/upsert/update/erase Current Goal, Urge Learning Record and Active Boundary |
| Rewards / achievements / days | progress event, XP event, active day, achievement lookup/unlock, active-day void |
| Read model | `findDashboardData` joins enrollment state and issues XP/achievement queries |

The repository contains no HTTP decisions, but one class owns nearly every Programme persistence concern and grows with each Mission.

### Contract and validation

- **Detected:** `contract.ts` owns programme identity/version constants, four task-state/stage contracts, Mission 03/04 controlled values, ten titles, evidence register, request input types and state serialisation helpers.
- **Detected:** `validation.ts` owns general JSON helpers plus all Mission 01–04 draft/artefact rules, learning-check answers, boundary completeness, timezone parsing and task completeness.
- **Inferred:** controlled Mission values and completion requirements are legitimate domain rules; evidence-card content and HTTP request parsing are separate reasons to change and should not force a single file to grow for every Mission.

### Route handlers

- **Detected:** anonymous routes resolve cookies and rate-limit keys, then call the session use case.
- **Detected:** authenticated routes call Better Auth first, parse bodies where required, then call one application method.
- **Detected:** the claim and admin-void routes perform small request-shape validation; no route computes XP, mission eligibility, Dashboard state or ownership.
- **Detected:** no scoped Programme route imports `@prisma/client` or `lib/db/prisma`.

## B. Preserved domain invariants

### Mission 01

1. Mission 01 is available only through a short-lived private anonymous session addressed by an opaque HttpOnly token whose hash is stored.
2. Accepted activity extends the 24-hour session; a pending claim lasts 30 minutes.
3. Anonymous completion creates no enrollment, permanent artefact, XP, achievement or commercial profile.
4. Claim redemption requires Better Auth and a valid, unconsumed, unexpired claim in `REGISTRATION_REQUIRED` state.
5. One atomic redemption consumes the claim, creates the Moment Map, completes Mission 01, opens Mission 02, records progress, awards exactly `+60 XP`, records at most one local active day and tombstones anonymous content.
6. A claim cannot be used by two users; invalid is `404`, expired is `410`, and already consumed/replayed is `409` under the current API semantics.

### Mission 02

1. A completed Mission 01 and live owner-scoped Moment Map are prerequisites.
2. Draft task states merge monotonically and completion requires the eight approved tasks plus a valid Current Goal referencing the enrollment's Moment Map.
3. Completion atomically saves the Current Goal, completes Mission 02, opens Mission 03, awards exactly `+80 XP`, unlocks zero-XP `First Plan` once and records the eligible active day once.
4. A completed retry returns the existing truthful Dashboard and cannot duplicate any recognition.

### Mission 03

1. Mission 02 completion is the prerequisite.
2. Draft/resume keeps the approved eight-task contract; evidence review, all urge-wave moments and both correct checks are required.
3. A private early signal or explicit `not now` is required; `not now` stores no invented personal signal.
4. Completion atomically saves the owner-scoped Urge Learning Record, completes Mission 03, opens Mission 04, awards exactly `+90 XP`, creates no achievement and records the eligible active day once.
5. Edit/delete does not rewrite completion, XP or active-day history.

### Mission 04

1. Mission 03 completion is the prerequisite.
2. Draft state, persisted Active Boundary and completed mission state remain distinct.
3. The controlled categories, triggers, execution methods, scenario answer, four strength checks and completion requirements remain those approved by RFC-010.
4. A saved-early-signal trigger requires the owner's live non-`not now` Urge Learning Record.
5. Completion atomically saves one owner-scoped Active Boundary, completes Mission 04, opens Mission 05, awards exactly `+100 XP`, unlocks zero-XP `Boundary Built` once and records the eligible active day once.
6. Replays do not create another boundary, XP event, achievement, progress event or active day. Update/delete remain owner-scoped and deletion keeps truthful history.

### Shared rewards, privacy and Dashboard

1. Reward rules are server-owned and deterministic: totals after Missions 01–04 are `60`, `140`, `230`, `330`.
2. Reward, achievement, progress and active-day ledgers contain facts/IDs, not private text.
3. `(userId, awardKey)`, `(userId, achievement awardKey)`, `(enrollmentId, eventKey)`, `(userId, localDate)` and `(enrollmentId, sourceEventKey)` uniqueness remains authoritative.
4. Local-day derivation uses the enrollment's validated IANA timezone; later timezone changes do not rewrite history.
5. Every private artefact is resolved through the authenticated user's enrollment; foreign reads/mutations fail as not found and do not disclose ownership.
6. Programme data does not enter affiliate, casino, offer, ranking or promotional inputs; protected Help separation remains unchanged.
7. Dashboard is the server-owned read model for current mission, all ten statuses, XP, achievements, active days, four artefacts and Mission 05 becoming current.

## C. Transaction boundaries

| Atomic user result | Required writes in one transaction | Reason |
| --- | --- | --- |
| Create registration bridge | conditional session transition + one pending claim | A claim must not exist without the session being registration-gated, or vice versa. |
| Redeem Mission 01 claim | conditional claim consumption + enrollment + Moment Map + M1 complete + M2 current + current step + progress event + XP + active day + anonymous tombstone | Partial success could lose private content, spend a claim without saving it, or award progress without an artefact. |
| Complete Mission 02 | Current Goal + M2 complete + M3 current + current step + progress event + XP + First Plan + active day | These facts represent one saved goal result. |
| Complete Mission 03 | Urge Learning Record + M3 complete + M4 current + current step + progress event + XP + active day | The learning result and recognition must agree. |
| Complete Mission 04 | Active Boundary + M4 complete + M5 current + current step + progress event + XP + Boundary Built + active day | RFC-010 explicitly defines these as one user result. |
| Void active day | conditional non-voided update with actor, reason and timestamp | A correction is one attributable state transition; it does not alter XP. |

No network call belongs inside these database transactions. Dashboard returned by a successful completion must be read through the same transaction context. Ordinary Dashboard/reward reads should use one repeatable database snapshot.

## D. Concurrency, idempotency and integrity risks

| Risk | Current protection | Residual assessment |
| --- | --- | --- |
| Duplicate claim creation | conditional `READY_TO_SAVE` transition and one claim per anonymous session | **Detected protection;** concurrent test required. |
| Claim used by two users | conditional consume in serializable transaction; claim/token uniqueness | **Detected protection;** two-user concurrent test required. |
| Duplicate mission completion | completed-state replay plus serializable retry | **Detected protection;** concurrent tests must cover Missions 02–04. |
| Double XP / achievement / progress | deterministic unique keys and `createMany(... skipDuplicates)` | **Detected protection.** A failure-injection test must prove rollback before the completion marker commits. |
| Duplicate active day | unique user/local date plus unique enrollment/source event | **Detected protection.** Same-day and concurrent completion tests required. |
| Duplicate artefact | one-to-one unique enrollment key for each artefact | **Detected protection.** |
| Partial write | interactive serializable transactions | **Detected protection in production code; not proven by the current memory test harness.** |
| Inconsistent Dashboard | completion reads use transaction client; ordinary reads have no explicit snapshot | **Inferred risk;** move Dashboard query behind an explicit snapshot boundary. |
| Ownership bypass | user → Program enrollment → artefact lookup; routes never accept enrollment or artefact IDs for these mutations | **Detected protection.** Expand update/delete tests to every private artefact. |
| Reward outside transaction | all four mission awards currently occur inside completion transaction | **Detected protection.** Preserve by requiring a shared unit-of-work context. |
| Stale/out-of-order autosave | monotonic task-state merge only; fields are last-write-wins and no client version exists | **Detected limitation.** Preserve API; document and add future version/order-safe gate rather than silently changing the contract. |
| Dashboard read mutates state | read methods call only find operations | **Detected protection;** add repeated-read assertion. |

## E. API stability baseline

All responses remain JSON with `Cache-Control: no-store`. Successful bodies keep the `{ ok: true, ... }` envelope. Errors keep `{ ok: false, error, code, details? }`.

| Method and path | Request | Success contract |
| --- | --- | --- |
| `POST /api/program/session` | no body | `201 { ok, session: { state, taskStates, expiresAt, xpPreview: 60 } }`; sets anonymous cookie |
| `PATCH /api/program/session/mission-01` | `{ taskStates, momentMap }` with partial Moment Map fields | `200 { ok, session }` |
| `POST /api/program/session/mission-01/claim` | no body | `201 { ok, state: "registration_required", expiresAt }`; sets claim cookie |
| `POST /api/program/claims/redeem` | `{ timeZone? }` | `200 { ok, dashboard }`; clears claim/session cookies |
| `GET /api/program/dashboard` | none | `200 { ok, dashboard }` |
| `GET /api/program/missions/02` | none | `200 { ok, mission }` |
| `PUT /api/program/missions/02` | `{ taskStates, currentGoal }` | `200 { ok, mission }` |
| `POST /api/program/missions/02/complete` | none | `200 { ok, dashboard }` |
| `GET /api/program/missions/03` | none | `200 { ok, mission }` |
| `PUT /api/program/missions/03` | `{ taskStates, urgeLearning }` | `200 { ok, mission }`; this is the detected UI/API method despite stale `PATCH` documentation |
| `POST /api/program/missions/03/complete` | none | `200 { ok, dashboard }` |
| `GET /api/program/missions/04` | none | `200 { ok, mission }` |
| `PATCH /api/program/missions/04` | `{ taskStates, activeBoundary }` | `200 { ok, mission }` |
| `POST /api/program/missions/04/complete` | none | `200 { ok, dashboard }` |
| `PATCH /api/program/artefacts/moment-map` | approved partial Moment Map fields | `200 { ok, momentMap }` |
| `DELETE /api/program/artefacts/moment-map` | none | `200 { ok: true }` |
| `PATCH /api/program/artefacts/current-goal` | approved partial Current Goal fields | `200 { ok, currentGoal }` |
| `DELETE /api/program/artefacts/current-goal` | none | `200 { ok: true }` |
| `PATCH /api/program/artefacts/urge-learning-record` | `{ earlySignalCategory?, earlySignalText?, notNow }` | `200 { ok, urgeLearningRecord }` |
| `DELETE /api/program/artefacts/urge-learning-record` | none | `200 { ok: true }` |
| `PATCH /api/program/artefacts/active-boundary` | approved partial Active Boundary fields | `200 { ok, activeBoundary }` |
| `DELETE /api/program/artefacts/active-boundary` | none | `200 { ok: true }` |
| `GET /api/program/rewards` | none | `200 { ok, rewards: { totalXp, ledger, achievements, activeDays, currentStreak } }` |
| `POST /api/admin/programme/active-days/:id/void` | `{ reason }` | `200 { ok: true }` |

Preserved status semantics: malformed JSON `400`; unauthenticated `401`; forbidden staff action `403`; missing/foreign/invalid claim resource `404`; expired session/claim `410`; conflict or invalid transition `409`; schema/incomplete mission `422`; oversized body `413`; rate limited `429`; unexpected failure `500` with no Prisma/database detail.

## F. Minimal decomposition decision

### Application use cases

- `programme-session.service`: anonymous session/draft/registration bridge only.
- `programme-claim.service`: the atomic authenticated Mission 01 redemption only.
- Mission 02, Mission 03 and Mission 04 services: one vertical slice each for get/save/complete. Their workflows and artefacts are materially different, so a generic Mission Engine is rejected.
- `programme-artefact.service`: owner-scoped edit/content-erasure operations shared because they have one security/privacy boundary.
- `programme-dashboard.service`: one query/read-model owner and DTO projection.
- `programme-reward.service` and `active-day.service`: reward query and admin correction use cases; completion services consume the shared deterministic policy inside their transaction rather than calling independent transactional services.

These boundaries correspond to existing routes, transactions and ownership rules. They do not introduce a DI container, base mission class, workflow DSL, event sourcing or CQRS framework.

### Domain rules

- `mission-registry`: ordering, prerequisite, next mission, deterministic completion/progress keys and implemented Mission metadata.
- `reward-policy`: approved XP/achievement consequences for Missions 01–04, read from the registry.
- `programme-state`: pure eligibility, next/current mission and task completion rules.
- `programme-errors`: typed internal reasons that preserve current HTTP codes/shapes.

### Infrastructure

- Split repositories by session/claim, progression, artefacts, rewards/active days and Dashboard reads.
- A small concrete `ProgrammeUnitOfWork` composes those repositories over one Prisma client/transaction. It exists because a completion crosses several persistence responsibilities atomically; it is not a generic container or repository interface.
- Ordinary Dashboard reads use a repeatable snapshot; completion Dashboard reads reuse the active serializable transaction.

### Validation

- Keep reusable primitive parsing in one small module.
- Move Mission 01, Mission 02, Mission 03 and Mission 04 validation to their owning vertical slices.
- Keep the current request shapes, accepted values, messages and status mapping.

### Rejected alternatives

- **Full Clean Architecture/ports for every call:** rejected as disproportionate to the current project style and bounded scope.
- **Generic Mission Engine/base class/JSON DSL:** rejected because Missions 01–04 have distinct workflows, artefacts and invariants; it would hide rather than clarify transactions.
- **One repository per table:** rejected because it fragments aggregate operations without improving ownership.
- **Schema redesign or new idempotency table:** rejected because existing additive constraints already provide the required uniqueness. Migration impact is expected to be none.
- **Autosave revision API in this PR:** rejected because it changes the client contract and needs a separately designed conflict/resume UX.

## G. Regression plan before refactor

1. Preserve all existing Mission 01–04 service assertions and add invalid claim, two-user concurrent claim, duplicate replay and transaction rollback cases.
2. Add locked-before-prerequisite, duplicate/concurrent completion and failure-injection rollback coverage for Missions 02–04.
3. Add truthful Dashboard assertions after every mission, exact XP totals, achievement uniqueness, one same-day active day and non-mutating repeated reads.
4. Add owner-A/owner-B read/update/delete rejection for all four private artefacts.
5. Add active-day void permission/idempotency assertions and rate-limit/error mapping checks.
6. After extraction, add pure tests for registry ordering/eligibility/next mission, reward policy, task/boundary completeness, local-date/streak logic and Programme error mapping.
7. Add source-boundary checks: no Prisma imports in Programme routes, no central service/repository growth path and no circular dependencies.
8. Run the detected gates: `npm ci`, `npm run programme:test`, the relevant/full Node test suite, `npm run typecheck`, `npx prisma validate`, `npm run build`; report the known `next lint` configuration failure rather than performing an unrelated lint migration.

## Change plan

1. Commit the strengthened regression baseline while the existing service/repository remain intact.
2. Extract pure registry, reward, state and error rules.
3. Split concrete persistence responsibilities behind a transaction-aware Programme unit of work.
4. Move session, claim, Missions 02–04, artefact, reward/active-day and Dashboard use cases into bounded application services; update routes without changing contracts.
5. Split mission-specific validation and remove the former central service/repository.
6. Add permanent Programme architecture/backend/Definition-of-Done standards and repo-level agent rules.
7. Update only evidence-backed technical/project/API documentation, run all gates, inspect the final diff, and open an unmerged PR.

## Pre-refactor contract impact

- API breaking changes: none planned.
- Database migration impact: none planned.
- Reward rule changes: none.
- Product behaviour changes: none.
- Frontend impact: none.

## Post-refactor result

The result below is repository evidence on branch `refactor/programme-backend-boundaries-m01-m04` after the bounded extraction.

- **Detected:** route handlers now invoke bounded session, claim, Mission 02, Mission 03, Mission 04, artefact, reward, active-day and Dashboard application services directly. No scoped Programme route imports Prisma or the compatibility facade.
- **Detected:** the former 1,205-line service is now a 121-line compatibility facade. The former 559-line central repository is removed. Persistence is split into five scoped repositories composed by a concrete Programme unit of work.
- **Detected:** ordering/prerequisite/next-Mission rules live in `mission-registry.ts`; implemented recognition remains exactly `60/80/90/100 XP`, `First Plan` for Mission 02 and `Boundary Built` for Mission 04 through `reward-policy.ts`.
- **Detected:** claim and completion workflows use serializable transactions with bounded `P2034` retry. Standalone Dashboard/reward reads use repeatable-read snapshots; completion responses project the Dashboard from the active transaction.
- **Detected:** Mission 01–04 validation is split by vertical slice. Typed internal Programme errors continue to map to the existing public status/code/envelope contract.
- **Detected:** the in-memory limiter is behind a replaceable provider contract and is explicitly identified as a development/single-process implementation. No distributed limiter is implemented.
- **Detected:** the regression suite contains 43 tests across Programme flow and pure domain policy. It covers two-user concurrent claim, concurrent/replayed Mission 02–04 completion, injected rollback, exact Dashboard totals/status, ownership denial for all private artefacts, active-day void and error/rate-limit mapping.
- **Detected:** source-boundary tests reject direct Prisma or compatibility-facade imports in scoped Programme routes and lock the Mission 03 autosave method to the implemented `PUT` contract.
- **Inferred:** keeping each mission completion coordinator over the 80-line review trigger makes the single atomic result visible; policy, presentation and persistence details are already extracted. Further splitting would obscure the transaction boundary without removing a separate responsibility.
- **Not detected:** schema, migration, public request/response, reward, frontend, Figma or product-behaviour changes.
- **Not detected:** a connected multi-process database contention/load test. Concurrent regression coverage uses a serialising, rollback-capable memory unit of work and is complemented by detected Prisma isolation and database uniqueness constraints.

### Final impact declaration

- API breaking changes: none.
- Database migration impact: none; `prisma/schema.prisma` and `prisma/migrations/` are unchanged.
- Reward rule changes: none.
- Product behaviour changes: none.
- Frontend impact: none.
- Remaining release/operations risks: in-memory rate limiting, expiry purge automation, distributed-operation verification, account-wide export/erasure, telemetry/observability, autosave ordering and CI/CD.

### Verification evidence

- **Detected:** `npm ci` completed using an isolated temporary npm cache after the machine-level npm cache rejected writes; dependency installation reported three high-severity audit findings, and no unrelated automatic dependency fix was applied.
- **Detected:** `npm run programme:test` passed `43/43` tests.
- **Detected:** `node --import tsx --test tests/*.test.ts` passed the complete Node suite, `209/209` tests.
- **Detected:** `npm run typecheck`, `npx prisma validate` and `npm run build` passed. The production build compiled all Programme routes under Next.js 15's Node-compatible server runtime.
- **Detected:** a local import-graph check scanned 31 `lib/programme` files and found zero circular dependencies. Source checks found no Prisma or compatibility-facade imports in scoped Programme routes and no Edge runtime declaration.
- **Detected limitation:** `npm run lint` does not provide a non-interactive lint gate. The existing `next lint` script exits at Next.js 15's configuration prompt; lint configuration migration is outside this bounded PR.
- **Not applicable:** connected migration application/rollback. No schema or migration changed; Prisma schema validation and zero-diff checks against `main` passed.
