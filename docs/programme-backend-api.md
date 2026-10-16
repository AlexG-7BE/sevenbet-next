# Active Control Programme Backend API

All responses are JSON and `Cache-Control: no-store`. Authenticated routes resolve the Better Auth session server-side; user, enrollment, version, reward and event keys are never accepted from the client.

| Method and route | Auth | Contract |
| --- | --- | --- |
| `POST /api/program/session` | Anonymous | Creates a private 24-hour session cookie; returns `not_started` and `xpPreview: 60`. |
| `PATCH /api/program/session/mission-01` | Anonymous cookie | Saves strict `{taskStates, momentMap}` draft; returns derived state. No XP. |
| `POST /api/program/session/mission-01/claim` | Anonymous cookie | Requires all eight tasks and a valid Moment Map; issues a 30-minute HttpOnly claim cookie. |
| `POST /api/program/claims/redeem` | Better Auth + claim cookie | Optional `{timeZone}`; atomically saves Mission 01, `+60 XP`, active day and opens Mission 02. |
| `GET /api/program/dashboard` | Better Auth | Returns the private ten-mission Dashboard read model. |
| `GET /api/program/missions/02` | Better Auth | Returns owner-scoped resumable Mission 02 task/draft state. |
| `PUT /api/program/missions/02` | Better Auth | Saves strict `{taskStates, currentGoal}` draft. |
| `POST /api/program/missions/02/complete` | Better Auth | Validates stored eight-task draft; atomically saves Current Goal, `+80 XP`, First Plan, active day and Mission 03 current state. |
| `GET /api/program/missions/03` | Better Auth | Returns owner-scoped resumable Mission 03 task/draft state and evidence context. |
| `PUT /api/program/missions/03` | Better Auth | Saves the strict private urge-literacy draft. |
| `POST /api/program/missions/03/complete` | Better Auth | Validates the stored draft; atomically saves Urge Learning Record, `+90 XP`, active day and Mission 04 current state. |
| `GET /api/program/missions/04` | Better Auth | Returns owner-scoped resumable Mission 04 task/draft state, source context and evidence register. |
| `PATCH /api/program/missions/04` | Better Auth | Saves the strict nine-task Boundary Composer draft; no XP is awarded. |
| `POST /api/program/missions/04/complete` | Better Auth | Validates the stored draft; atomically saves Active Boundary, `+100 XP`, Boundary built, active day and Mission 05 current state. |
| `PATCH /api/program/artefacts/moment-map` | Better Auth | Edits allowed fields on the owner's live Moment Map. |
| `DELETE /api/program/artefacts/moment-map` | Better Auth | Scrubs content and tombstones the owner's Moment Map. |
| `PATCH /api/program/artefacts/current-goal` | Better Auth | Edits allowed fields; source Moment Map cannot be changed. |
| `DELETE /api/program/artefacts/current-goal` | Better Auth | Scrubs content and tombstones the owner's Current Goal. |
| `PATCH /api/program/artefacts/urge-learning-record` | Better Auth | Edits allowed private Mission 03 result fields. |
| `DELETE /api/program/artefacts/urge-learning-record` | Better Auth | Scrubs content and tombstones the owner's Urge Learning Record. |
| `PATCH /api/program/artefacts/active-boundary` | Better Auth | Edits allowed fields on the owner's active boundary without changing earned XP. |
| `DELETE /api/program/artefacts/active-boundary` | Better Auth | Scrubs personal boundary content and tombstones the artefact without rewriting completion history. |
| `GET /api/program/rewards` | Better Auth | Returns Programme XP ledger, First Plan state and active-day summary. |
| `POST /api/admin/programme/active-days/:id/void` | SUPER_ADMIN | Requires `{reason}`; records an attributed active-day correction. |

The following routes exist only when the exact server-side `PROGRAM_AI_V1_ENABLED=true` gate is active. Real OpenAI requests additionally require `PROGRAM_AI_REAL_PROVIDER_ENABLED=true`, `PROGRAM_AI_PROVIDER=openai` and a valid server-only key.

| Method and route | Auth | Contract |
| --- | --- | --- |
| `POST /api/program/program-ai/session` | Signed anonymous access proof | Creates the RFC-022 anonymous M1 session and HttpOnly cookie. |
| `GET`, `POST`, `DELETE /api/program/program-ai/authority` | Anonymous cookie | Reads, confirms or withdraws the narrow current sensitive-input authority. |
| `POST /api/program/program-ai/turn` | Anonymous cookie + active authority | Strict `{locale,inputMode,situation,clarificationAnswers}` with `inputMode: "text"` (the picked ready answers; any other mode is refused); returns the closed clarification/candidate union and server-derived `20 XP` situation progress. At most three real-provider attempts per M1. Provider rate limit: 4 per 10 minutes per session. |
| `POST /api/program/program-ai/support/continue` | Anonymous cookie + active authority | Leaves the transient support-first interruption without creating a risk label or reward. |
| `POST /api/program/program-ai/starting-point` | Anonymous cookie + active authority | Confirms the closed browser-held Starting Point and derives `40 XP`; the raw intake is not accepted. |
| `POST /api/program/program-ai/claim` | Anonymous cookie | Issues the exact pending claim only from ready-to-save state. |
| `POST /api/program/program-ai/claims/redeem` | Better Auth + claim cookie | Atomically persists the exact user-confirmed Starting Point and two distinct `20 XP` events, respecting legacy-progress dominance. |
| `GET /api/program/program-ai/home` | Better Auth | Returns exact M1–M10 current/completed/locked state and M3/M6/M10 Review entitlement. A Mission's `missionNumber` is its identity; `step` is its place in the journey (`programmeJourney`: 1, 2, 8, 3, 4, 5, 6, 7, 9, 10) and the number a person sees. `missions` is listed in journey order with `step`; the home also carries `currentStep`, and each Review and `nextReview` carries `unlockStep`. The home carries no research state and no discovery links (removed 16 October 2026). |

No Programme answer sets or withdraws a cookie for the public menu. Until 16 October 2026 the answers that carried the home kept a `b4g_research_access` flag in step with a `researchAccess` field, and sign-out withdrew it; both are removed, and a flag left in a browser is ignored ([decision record](07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md)). The home and Mission answers carry no link into the research section.

Mission answers (`GET missions/{n}`, `actions`, `complete`) carry `step` beside `missionNumber`; routes are addressed by `missionNumber`. A Mission is accessible when it is complete or every earlier Mission of the journey is complete; otherwise the answer is `409` with `Mission {step} must be completed before Mission {step}`, both numbers being steps. After a completion the server opens the first incomplete Mission of the journey and points the enrollment's `currentStepId` at its stored step. Mission 10's `programmeFacts.facts` are in journey order and carry `step`; the provider input for the final plan keeps only `missionNumber` and `artifact`.

Provider failures use only `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `PROVIDER_RATE_LIMIT` or `PROVIDER_INVALID_OUTPUT`. Raw OpenAI errors and request content are never returned. All routes and error responses remain `Cache-Control: no-store`.

The voice routes `POST /api/program/program-ai/transcription` and `POST /api/program/program-ai/transcription/realtime`, with the provider codes `TRANSCRIPTION_FAILED` and `INPUT_TOO_LARGE`, were removed on 11 October 2026 (Founder decision; [ONE-SIGN-IN-FORM-2026-10-11](07_Decisions/ONE-SIGN-IN-FORM-2026-10-11.md), Part 3). Both addresses now answer `404`.

Malformed JSON is `400`; missing authentication is `401`; forbidden staff action is `403`; missing/foreign resources are `404`; expired session/claim is `410`; conflicts are `409`; schema/state validation is `422`; rate limiting is `429`.

Idempotency is server-authored: claim consumption is conditional; mission/progress, XP, achievement and active-day rows have database uniqueness constraints; Mission 02–04 completion retries return the existing Dashboard. Client idempotency keys are not trusted or required.

Mission claim/completion writes are one serializable transaction, including artefact, progression, reward, achievement and active-day effects. The Dashboard returned by a successful completion is projected inside that transaction. Standalone Dashboard/reward reads use one repeatable-read snapshot and do not mutate state.

The Mission 01–04 autosave contract has no revision/client sequence. Task-state completion merges monotonically, while draft fields are last-write-wins; optimistic concurrency is a documented future contract/UX decision rather than an implicit API change.
