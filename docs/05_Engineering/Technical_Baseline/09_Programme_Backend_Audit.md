# Active Control Programme Backend Technical Baseline

Baseline date: **2026-08-09**

Repository root: `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`

Branch baseline: `b5c5c0317befc1f2a85b6625d6e5d918cf3b7a37` plus LEGAL-IMPL-01 implementation commits.

The full active repository inventory was scanned before this update. Dependencies, `.next`, generated output, caches, coverage, test results and `tsconfig.tsbuildinfo` were excluded from source claims. This document records implementation evidence, not target architecture.

## Summary

- **Detected:** route handlers remain thin, do not import Prisma, authenticate where required, parse bounded inputs and delegate to mission-specific application services.
- **Detected:** the Active Programme is split across session, claim, Missions 02–04, artefact, dashboard, reward and active-day application services, focused infrastructure repositories and one unit-of-work boundary. There is no central Mission switch, generic workflow DSL or new shared Mission engine.
- **Detected:** Missions 01–04 keep server-owned completion, XP, achievement, active-day and next-Mission decisions.
- **Detected:** raw participant narrative is held in React state and the tab-scoped `sevenbet.programme.local-content.v1` `sessionStorage` record. It is not part of active request DTOs.
- **Detected:** exact key allow-lists reject unexpected raw fields; presenters redact raw legacy artefact columns; legacy reflection creation returns `410` before parsing the request body.
- **Detected:** existing database columns that require text receive an implementation-owned neutral marker. This release has no Prisma schema or migration change.
- **Detected limitation:** historic raw `ProgramReflection` and artefact rows may remain for authenticated export and erasure. They are not repopulated into active narrative inputs.

## Detected architecture

| Layer | Current implementation |
| --- | --- |
| HTTP | `app/api/program/**` routes authenticate, read bounded transport input, apply response/cache policy and call one application operation. |
| Application | `programme-session`, `programme-claim`, `mission-02`, `mission-03`, `mission-04`, `programme-artefact`, `programme-dashboard`, `programme-reward` and `active-day` services own use-case orchestration. |
| Domain | Mission registry, state-transition rules, reward policy, Programme errors and validation modules own deterministic policy. |
| Infrastructure | Focused session, progress, artefact, reward and dashboard repositories run behind `ProgrammeUnitOfWork`; Prisma remains below routes and React. |
| Presentation | Purpose-specific presenters expose bounded DTOs and blank/redact legacy narrative fields. |
| Client-local content | `ActiveControlProgramme.tsx` owns Mission-local narrative in React/session storage and sends only the allow-listed continuity fields. |

The older `ProgrammeFlowService` remains as a compatibility façade for existing callers and tests, but delegates to the focused services. It is not a generic Mission engine and new Missions must still receive a dedicated vertical slice under the Programme Architecture Standards.

## Active request and persistence contracts

### Mission 01

- **Detected:** anonymous draft input accepts only `taskStates`.
- **Detected:** `AnonymousProgrammeSession` stores token hash, mission/task state, versions, expiry/activity times and `{ contentStorage: "browser_session" }`.
- **Detected:** claim redemption creates the required `MomentMap` relation with neutral implementation markers, then awards Mission 1 progression/XP server-side.
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
- **Detected:** responses use private/no-store handling at Programme HTTP boundaries.
- **Detected:** protected Help remains outside Programme completion and commercial event flows.
- **Detected:** commercial modules are covered by an import/contract firewall test against Programme, Help, Self-Check, limit and vulnerability state.
- **Detected:** an unchecked client age control sets a tab-scoped bounded attestation; middleware rejects non-GET `/api/program/**` requests without `x-sevenbet-age-attestation: 18-or-over`.
- **Detected:** signup also requires bounded age confirmation.
- **Not detected:** stored DOB, KYC or durable age-attestation evidence. **AGE ATTESTATION PERSISTENCE — P1 OPEN.**

## Transaction and integrity baseline

- **Detected:** claim and Mission completion commands use the existing serializable transaction/retry boundary.
- **Detected:** database uniqueness protects claim consumption, enrolment/Mission rows, one artefact per enrolment, reward keys, achievement keys and active days.
- **Detected:** completion/reward/next-Mission calculations remain server-side.
- **Detected limitation:** accepted autosaves do not carry a revision or client sequence; out-of-order field writes remain possible for bounded structured fields.
- **Inferred risk:** Dashboard projection is not an explicitly isolated read snapshot across all queries, so a concurrent completion could briefly produce a mixed read.

## Legacy and compatibility boundaries

- **Detected:** `GET` and `DELETE /api/program/reflections` remain for authenticated ownership/access and deletion.
- **Detected:** `POST /api/program/reflections` returns `410 LOCAL_ONLY_CONTENT` after authentication and before request-body parsing.
- **Detected:** active artefact presenter output redacts raw legacy fields rather than using them to repopulate the current tab.
- **Planned:** approved cleanup/expiry operations after retention and user-rights gates are settled.
- **Not detected:** a destructive migration, raw-content rehydration, or commercial read of legacy Programme content.

## Operational limitations and open work

- **Detected limitation:** Programme rate limiting is process-local, not distributed.
- **Detected limitation:** anonymous-session and pending-claim expiry exists in data rules, but automated purge is not implemented.
- **Detected limitation:** durable age evidence is absent.
- **Detected limitation:** historic raw rows require a separately governed cleanup decision.
- **Planned:** distributed rate limiting, automated expiry purge, durable age evidence and approved legacy cleanup.
- **Not detected:** Programme telemetry/APM capable of proving scale behaviour; do not claim it.

## Verification evidence

The repository includes focused tests for:

- exact M1–M4 sensitive-field rejection and bounded request DTOs;
- client `sessionStorage` use and absence of local storage/server raw content;
- age gate default and middleware enforcement;
- retired legacy reflection creation;
- commercial import/DTO firewall invariants;
- neutral completion, XP, achievement, active-day and next-Mission behaviour;
- data-subject export/deletion scoping and Production execution guardrails; and
- existing Programme domain, flow, rendering and user-progress regressions.

Passing tests establish repository behaviour under their fixtures. They do not constitute clinical validation, legal sign-off, Production-data inspection or proof of distributed-runtime behaviour.
