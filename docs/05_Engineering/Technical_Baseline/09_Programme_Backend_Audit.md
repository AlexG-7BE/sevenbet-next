# Active Control Programme Backend Technical Baseline

Baseline date: **2026-08-13**

Repository root: `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`

Branch baseline: current main `c52595405f0800c8c2b51d5951c4a8d45c133034`. FULL-SITE-QA-01 Draft PR #72 worktree changes are not treated as merged baseline facts.

The full active repository inventory was scanned before this update. Dependencies, `.next`, generated output, caches, coverage, test results and `tsconfig.tsbuildinfo` were excluded from source claims. This document records implementation evidence, not target architecture.

## Summary

- **Detected:** route handlers remain thin, do not import Prisma, authenticate where required, validate bounded input shapes and delegate to mission-specific application services. **Detected current-main limitation:** several JSON routes buffer `request.text()` before enforcing the 32 KiB contract; unmerged Draft PR #72 adds declared-length and actual streamed-byte enforcement.
- **Detected:** the legacy Active Programme is split across session, claim, Missions 01–04, artefact, dashboard, reward and active-day application services, focused infrastructure repositories and one unit-of-work boundary.
- **Detected:** the separately feature-gated PROGRAM-AI path implements Mission 01 plus the RFC-025-approved bounded registry/coordinator for Missions 02–10, three completion-derived Reviews and bounded guidance. This approved package-specific registry is not a runtime plugin system or workflow DSL and does not grow the compatibility `ProgrammeFlowService`.
- **Detected:** both runtime modes keep completion, XP, achievement/review entitlement, active-day and next-Mission decisions server-owned. A clean PROGRAM-AI M1→M10 path is exactly `715 XP`.
- **Detected current-main limitation:** the feature flag selects presentation/new operations, but legacy mutation endpoints remain callable while feature-on and share user progression aggregates. Unmerged Draft PR #72 adds an early stable mode-conflict guard; it is not a current-main or Production fact.
- **Detected:** raw participant narrative is held in React state and subject-scoped `sevenbet.programme.local-content.v2:*` tab `sessionStorage` records. It is not part of active request DTOs.
- **Detected:** one unchecked access screen records bounded 18+, current Terms and Privacy acknowledgement authority for exactly 60 minutes. The anonymous marker is journey-bound and moves to an exact user namespace after authentication; that transition is separate from content migration and the ten-minute OAuth claim marker.
- **Detected:** authenticated Dashboard reads with no enrollment return a server-owned empty projection: Mission 01 current/startable, later Missions locked, zero XP and zero completed activity. Better Auth session state, not the visible Mission, owns authenticated header and `/program` home routing.
- **Detected:** exact key allow-lists reject unexpected raw fields; presenters redact raw legacy artefact columns; legacy reflection creation returns `410` before parsing the request body.
- **Detected:** existing legacy database columns that require text receive an implementation-owned neutral marker. The local-first legacy-content change itself required no destructive migration; current main separately includes additive migrations 0018 and 0019 for PROGRAM-AI M1 and runtime hardening.
- **Detected limitation:** historic raw `ProgramReflection` and artefact rows may remain for authenticated export and erasure. They are not repopulated into active narrative inputs.
- **Detected:** migration 0019 and `PrismaProgrammeRateLimiter` provide shared fixed-window counters for deployed Node runtimes; bounded purge code covers expired anonymous sessions, unconsumed claims and expired buckets. Exact deployed migration/Cron activation remains an operations fact.

## Detected architecture

| Layer | Current implementation |
| --- | --- |
| HTTP | `app/api/program/**` routes authenticate or resolve the approved anonymous authority, read bounded transport input, apply response/cache policy and call one application operation. |
| Application | Legacy session/claim/Mission 01–04 services plus PROGRAM-AI M1, M2–M10, guidance/transcription, artefact, Dashboard, reward and active-day services own use-case orchestration. |
| Domain | Mission registry, state-transition rules, reward policy, Programme errors and validation modules own deterministic policy. |
| Infrastructure | Focused session, progress, artefact, reward, Dashboard and PROGRAM-AI M1 repositories run behind `ProgrammeUnitOfWork`; shared runtime counters use their dedicated Prisma model. Prisma remains below routes and React. |
| Presentation | Purpose-specific presenters expose bounded DTOs and blank/redact legacy narrative fields. |
| Client-local content | `ActiveControlProgramme.tsx` owns Mission-local narrative in React/session storage and sends only the allow-listed continuity fields. |

The older `ProgrammeFlowService` remains as a compatibility façade for existing callers and tests, but delegates to the focused services. It is not a generic Mission engine and new Missions must still receive a dedicated vertical slice under the Programme Architecture Standards.

## Feature-gated PROGRAM-AI Mission 01–10 contract

- **Detected:** exact server flag `PROGRAM_AI_V1_ENABLED=true` selects the PROGRAM-AI experience; missing or malformed values retain the legacy runtime.
- **Detected:** Mission 01 uses the approved Starting Point, `20 + 20` reward, exact claim and narrow sensitive-input authority. Concrete OpenAI transcription and Programme AI adapters sit behind provider-neutral ports and require additional exact provider gates.
- **Detected:** Missions 02–10 have three closed structural actions worth `15 + 20 + 15` XP and a `25 XP` completion award. The server registry owns titles, prerequisites, action identities, rewards and next Mission.
- **Detected:** First, Mid and Full Review entitlement derives from M3, M6 and M10 completion rather than raw XP. Reviews award zero XP and have deterministic provider-off/failure fallbacks.
- **Detected:** durable Mission 02–10 drafts accept only versioned, allow-listed structural fields. Optional personal wording remains subject-scoped browser-session content and does not enter commercial modules.
- **Detected:** current transcription code accepts up to 8 MiB/90 seconds. Vercel documents a 4.5 MB complete Function-payload ceiling; proposed RFC-031 identifies the mismatch but is not approved implementation authority.

## Active request and persistence contracts

### Mission 01

- **Detected:** anonymous draft input accepts only `taskStates`.
- **Detected:** authenticated Mission 01 draft/completion uses dedicated Better Auth user-owned routes. It accepts only `taskStates` and `timeZone`, never resolves the anonymous cookie, and conditionally awards completion once.
- **Detected:** `AnonymousProgrammeSession` stores token hash, mission/task state, versions, expiry/activity times and `{ contentStorage: "browser_session" }`.
- **Detected:** claim redemption creates the required `MomentMap` relation with neutral implementation markers, then awards Mission 1 progression/XP server-side.
- **Detected:** after authentication the Better Auth user is the only interactive subject. Pending anonymous journeys remain dormant claim inputs; terminal claim failure resolves to the authenticated zero-progress projection without copying or mutating the anonymous narrative/session.
- **Not detected:** raw situation, cue, thought/feeling, response, consequence or notice-rule text in active requests.

### Mission 02

- **Detected:** draft/complete accepts `taskStates` plus `sourceMomentMapId`, `direction`, `reviewAt`, `confidence` and bounded `status`.
- **Detected:** action, trigger/situation, alternative action, success signal and confidence-adjustment text remain local. Required database text columns use the neutral marker.
- **Detected:** completion, `+80 XP`, `First Plan`, active day and Mission 3 unlock remain server-owned and idempotent.

### Mission 03

- **Detected:** input accepts evidence-reviewed state, bounded wave moments, learning-check answers, `signalChoice: local | not_now`, meaning answer and task states.
- **Detected:** server rows retain evidence/review/check/completion facts. `earlySignalCategory` and `earlySignalText` are `null` for active writes and active responses.
- **Detected:** Mission 3 completion and `+90 XP` remain server-owned.

### Mission 04

- **Detected:** input accepts bounded evidence, category, trigger type, user-entered numeric limit, execution method, review date, scenario/check state, status and task states.
- **Detected:** trigger/rule/execution-detail/coping narrative remains local. Required text columns use the neutral marker; unit/period narrative is not accepted.
- **Detected:** Mission 4 completion, `+100 XP`, `Boundary Built`, active day and Mission 5 unlock remain server-owned.

## Data model reality

The physical schema still contains legacy raw-content columns in `ProgramReflection`, `MomentMap`, `CurrentGoal`, `UrgeLearningRecord` and `ActiveBoundary`. That is **Detected**, not a statement that current active clients write raw content. Active write paths use bounded fields and neutral markers; active presenters return empty narrative with `contentStorage: "browser_session"`.

Existing records remain connected to `ProgramEnrollment` and to reward/progress integrity. RFC-017 explicitly forbids a destructive migration in this delivery. Historic content remains available to the internal data-subject export and deletion service. A separate approved retention/cleanup decision is **Planned**.

`ProgramProgressEvent.metadata` physically remains JSON. **Detected:** active Programme service writes are implementation-owned and bounded; active validators do not accept arbitrary client metadata. A future new event producer still requires review because the database type alone cannot enforce semantic sensitivity.

## Privacy and security controls

- **Detected:** raw narrative uses session storage, not local storage, cookies or URLs.
- **Detected:** server validators call exact-key assertions and error messages do not interpolate rejected values.
- **Detected:** no active Programme route logs request bodies or raw narrative.
- **Detected current-main limitation:** private/no-store handling is not uniform across Programme HTTP boundaries. Unmerged Draft PR #72 centralizes `private, no-store, max-age=0` plus `Vary: Cookie`; that branch fix is not a current-main or Production fact.
- **Detected:** protected Help remains outside Programme completion and commercial event flows.
- **Detected:** commercial modules are covered by an import/contract firewall test against Programme, Help, Self-Check, limit and vulnerability state.
- **Detected:** the two unchecked access controls set current, versioned, tab-scoped authority; middleware rejects non-GET `/api/program/**` requests without `x-sevenbet-age-attestation: 18-or-over`.
- **Detected:** email signup and Programme Google account creation use the current server-issued, exact-journey signed access proof containing the age/Terms/Privacy claims. Forged static headers alone do not authorise account creation. Returning email sign-in remains proof-free; Google remains identity-only rather than age verification.
- **Detected:** access authority contains no narrative, identity, token, reward, DOB, KYC or marketing field. Sign-out clears the exact user's authority, global continuation and claim marker while leaving other subject namespaces isolated.
- **Not detected:** stored DOB, KYC or durable age-attestation evidence. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**

## Transaction and integrity baseline

- **Detected:** claim and Mission completion commands use the existing serializable transaction/retry boundary.
- **Detected:** database uniqueness protects claim consumption, enrolment/Mission rows, one artefact per enrolment, reward keys, achievement keys and active days.
- **Detected:** completion/reward/next-Mission calculations remain server-side.
- **Detected limitation:** accepted autosaves do not carry a revision or client sequence; out-of-order field writes remain possible for bounded structured fields.
- **Detected:** Dashboard/reward snapshots use the unit-of-work repeatable-read path when outside an existing completion transaction; completion returns the projection from its transaction context.

## Legacy and compatibility boundaries

- **Detected:** `GET` and `DELETE /api/program/reflections` remain for authenticated ownership/access and deletion.
- **Detected:** `POST /api/program/reflections` returns `410 LOCAL_ONLY_CONTENT` after authentication and before request-body parsing.
- **Detected:** active artefact presenter output redacts raw legacy fields rather than using them to repopulate the current tab.
- **Planned:** approved cleanup/expiry operations after retention and user-rights gates are settled.
- **Not detected:** a destructive migration, raw-content rehydration, or commercial read of legacy Programme content.

## Operational limitations and open work

- **Detected:** Programme runtime uses shared PostgreSQL fixed-window counters outside isolated Node test workers. Migration 0019 owns the transient bucket table.
- **Detected:** bounded manual/Cron purge code exists for expired anonymous sessions, unconsumed claims and rate-limit buckets, with a 24-hour grace for Programme session/claim state.
- **Not detected from repository source:** exact deployed migration, Cron secret/schedule execution, runtime load behavior or alerting. Those remain operational verification gates.
- **Detected limitation:** durable age evidence is absent.
- **Detected limitation:** historic raw rows require a separately governed cleanup decision.
- **Detected limitation:** current-main feature-on Home can misproject partial M1 action/XP and next-Review distance; unmerged Draft PR #72 corrects the server projection.
- **Planned:** deployed limiter/Cron verification, durable age evidence and approved legacy cleanup.
- **Not detected:** Programme telemetry/APM capable of proving scale behaviour; do not claim it.

## Verification evidence

The repository includes focused tests for:

- exact M1–M4 sensitive-field rejection and bounded request DTOs;
- client `sessionStorage` use and absence of local storage/server raw content;
- the exact two-control access screen, 60-minute continuation validation, subject transition/isolation and middleware/account-creation enforcement;
- actual-session header/home routing, fresh authenticated Dashboard projection, explicit Mission 01 start and logout isolation;
- Google success/cancellation continuation, provider one-use callback-code replay failure and stale/mismatched marker denial;
- retired legacy reflection creation;
- commercial import/DTO firewall invariants;
- neutral completion, XP, achievement, active-day and next-Mission behaviour;
- data-subject export/deletion scoping and Production execution guardrails;
- existing Programme domain, flow, rendering and user-progress regressions;
- PROGRAM-AI Missions 02–10 action/completion, exact `715 XP`, Review entitlement, provider fallback and commercial-firewall behavior;
- and shared limiter limit/reset/concurrency/privacy behavior and bounded purge dry-run/execute/preservation behavior.

Passing tests establish repository behaviour under their fixtures. They do not constitute clinical validation, legal sign-off, Production-data inspection or proof of distributed-runtime behaviour.
