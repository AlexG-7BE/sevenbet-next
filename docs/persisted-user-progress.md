# Persisted User Progress Foundation

## Current progress storage

The public `ProgramExperience` remains an anonymous-first client experience. Its
entire state is stored under `sevenbet-program-progress-v1` in `localStorage`.
No `sessionStorage` progress state exists.

| State | Current source | PostgreSQL readiness |
| --- | --- | --- |
| Current step | `activeStep` and stable `activeStepId` in localStorage | `ProgramEnrollment.currentStepId` exists |
| Completed lessons | Not tracked separately by the current UI | `lesson:<lessonId>:completed` events are supported by the new service |
| Completed steps | `completedSteps` and `completedStepIds` in localStorage | `step:<stepId>:completed` events are supported |
| Quiz result | `quizAnswers[day]` in localStorage | `quiz:<blockId>:submitted` events are supported |
| Scenario result | `scenarioAnswers[day]` in localStorage | `scenario:<blockId>:submitted` events are supported |
| Exercise/reflection | `answers[exercise-<day>]` in localStorage | `exercise:<blockId>:completed` events are supported |
| XP | Calculated from static/public step copy and stored as `xp` in localStorage | `UserXpEvent` exists; no production XP engine is connected |
| Achievements | Calculated by `achievementsFor()` and stored in localStorage | `UserAchievement` exists; no production achievement engine is connected |
| Learning streak | Browser date keys in localStorage | No server persistence in this phase |

The dashboard reads the same local state. XP labels and achievement badges are
currently educational UI calculations, not authoritative server awards.
`ProgramProgressRepository` and `ProgramProgressService` predate this phase but
were not used by a public route. The new `UserProgressRepository` and
`UserProgressService` provide the authenticated foundation without changing the
browser flow.

## Server flow

```text
Route / future server action
  -> requireCurrentUser() (Better Auth session.user.id)
  -> strict input parser (no userId/enrollmentId/version/XP fields)
  -> UserProgressService (published snapshot and ownership validation)
  -> UserProgressRepository (ownership predicates and idempotent upserts)
  -> Prisma / PostgreSQL
```

The client never chooses `userId`, `enrollmentId`, `programVersionId`, XP,
achievement IDs, event keys, or entity types. During an explicit local merge,
the client may submit completion facts, but the server accepts only IDs found in
the enrollment's published snapshot. An enrollment is pinned to the published
version selected by the server at start time, not the editable draft.

## Endpoint and action contracts

All progress contracts below are now exposed through the same authenticated
handler, service, and repository pattern. Each route resolves the Better Auth
session before reading its payload and returns the normalized server DTO.

| Action | Input | Authorization and validation | Idempotency and writes | Response / errors |
| --- | --- | --- | --- | --- |
| `GET /api/program/progress?programId=` | UUID query only | Better Auth user; reject `userId` and unknown query fields | Read own enrollment and ordered events | `{ok, progress|null}`; 401/422 |
| `POST /api/program/progress/start` | `{programId}` | Better Auth user; program and exact current version must be published | Upsert on `(userId, programId)`; server selects version and first step | `{ok, progress}`; 401/404/422 |
| `POST /api/program/progress/current-step` | `{programId, stepId}` | Step must exist in enrollment's published snapshot | Ownership-filtered update; repeating same step is safe | `{ok, progress}`; 401/404/422 |
| `POST /api/program/progress/lesson` | `{programId, lessonId}` | Lesson belongs to program; required interactive blocks are complete | `lesson:<lessonId>:completed`; unique per enrollment | `{ok, progress}`; 401/404/409/422 |
| `POST /api/program/progress/quiz` | `{programId, blockId, answerIndex}` | QUIZ block belongs to a lesson in the pinned snapshot; answer index is valid | `quiz:<blockId>:submitted`; first server event wins; correctness is derived server-side | `{ok, event}`; 401/404/422 |
| `POST /api/program/progress/scenario` | `{programId, blockId, answerIndex}` | SCENARIO block belongs to the pinned snapshot | `scenario:<blockId>:submitted`; first event wins | `{ok, event}`; 401/404/422 |
| `POST /api/program/progress/exercise` | `{programId, blockId, response}` | EXERCISE/REFLECTION/PRACTICAL_TASK block belongs to snapshot; 1-4000 characters | `exercise:<blockId>:completed`; first event wins | `{ok, event}`; 401/404/422 |
| `POST /api/program/progress/step` | `{programId, stepId}` | Step belongs to snapshot; required lessons are complete | `step:<stepId>:completed`; unique per enrollment | `{ok, progress}`; 401/404/409/422 |
| `POST /api/program/progress/complete` | `{programId}` | Every published step completion event exists | `program:<programId>:completed`, then set `completedAt` once | `{ok, progress}`; 401/404/409/422 |
| `POST /api/program/progress/merge` | `{programId, currentStepId?, completedStepIds, completedLessonIds, completedQuizIds, completedScenarioIds, completedExerciseIds, programCompleted}` | Better Auth user; unknown or archived IDs are discarded; reject XP, achievements, version, enrollment, user ID | One transaction and marker `program:<programId>:anonymous-merge:v1`; server events win; insert only missing keys | `{ok, progress}`; 401/404/422 |

Malformed JSON returns 400. Unexpected fields return 422. Missing authentication
returns 401. An absent or foreign enrollment is returned as 404 without exposing
whether another user owns one. Conflict errors cover unpublished versions and
incomplete prerequisites.

## Event keys

Event keys are generated by the service, never accepted from the client:

- `lesson:<lessonId>:completed`
- `quiz:<blockId>:submitted`
- `scenario:<blockId>:submitted`
- `exercise:<blockId>:completed`
- `step:<stepId>:completed`
- `program:<programId>:completed`
- `program:<programId>:anonymous-merge:v1`

`ProgramProgressEvent` has a unique constraint on `(enrollmentId, eventKey)`.
Repository upserts use an empty update so retries cannot rewrite the original
server event or double-award future XP.

## Anonymous merge strategy

1. Anonymous users continue to use the existing localStorage payload.
2. After login, the UI may offer an explicit one-time merge; it must not upload
   until the user accepts.
3. The server creates or loads the enrollment and validates every stable entity
   ID against its pinned published snapshot.
4. Existing server events have priority. Missing completed entities are added by
   their deterministic event keys.
5. Current step becomes the furthest valid step by published `order`, comparing
   local and server state. It never regresses.
6. XP is not accepted or summed from the browser. A future XP engine derives
   awards from newly inserted events only.
7. Achievement IDs are not accepted. A future achievement engine derives unique
   awards from server events.
8. The merge marker makes retries safe. The client marks the decision locally
   after a successful transaction and does not delete the localStorage fallback.

## Foreign-key preflight and migration

Run `npm run progress:check-orphans` before applying migration 0004. The script
reads distinct user IDs from enrollments, XP events, and achievements; compares
them with `User`; prints only counts and SHA-256 fingerprints; and exits 1 if any
orphan exists.

Migration `0004_progress_user_foreign_keys` adds TEXT-to-TEXT foreign keys from:

- `ProgramEnrollment.userId` to `User.id`
- `UserXpEvent.userId` to `User.id`
- `UserAchievement.userId` to `User.id`

All three use `ON DELETE CASCADE ON UPDATE CASCADE`. Existing composite unique
constraints already index these user IDs, so no duplicate indexes are added.
The migration must be reviewed and applied manually only after a clean preflight.

## Next UI phase

`ProgramExperience` now waits for Better Auth session resolution, hydrates an
existing enrollment, and offers a deliberate merge only when the device copy is
stronger. No enrollment or merge is created silently. A local decision marker
prevents repeated prompts, while the original localStorage payload remains the
anonymous/offline fallback. API failures leave client progress untouched.

The next phase is the XP Engine. It should consume newly inserted progress
events idempotently and derive awards from published `XpRule` records. Client XP
and achievement values remain explicitly local until that engine and its
backfill policy are production-ready.
