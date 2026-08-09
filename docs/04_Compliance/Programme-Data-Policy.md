# Programme Data and Commercial-Separation Policy

Status: **Approved implementation policy** under RFC-017. Last reconciled: 2026-08-09.

## Decision

The Active Control Programme is an adult educational reflection, decision-support and personal-boundary product. It is not diagnosis, treatment, therapy, rehabilitation or evidence that gambling is safe or suitable.

Raw participant narrative is local-first for GB v1. It may exist in React state and in the versioned, tab-scoped `sessionStorage` key `sevenbet.programme.local-content.v1`. It must not be sent to the application server, stored in cookies, URLs, `localStorage`, logs, analytics or generic event metadata. Account, enrolment, bounded task state, completion, rewards and the minimum neutral structured continuity facts remain server-persisted.

Programme data, pause state and protected Help activity are prohibited inputs to advertising, operator/casino recommendation, offer selection, affiliate optimisation, commercial eligibility, natural editorial ranking or promotional pressure.

## Programme data persistence map

This table records the **Detected** implementation after RFC-017. “Raw narrative” includes user-authored details that could disclose gambling situations, feelings, urges, vulnerability, coping choices or other sensitive context.

| Mission / field | Model or client source | Server endpoint | Persisted? | Sensitive potential | RFC-017 target and implemented change |
| --- | --- | --- | --- | --- | --- |
| M1 raw situation, cues, thought/feeling, response, consequence, notice rule | React + `sessionStorage` local-content record | Not accepted; M1 draft accepts `taskStates` only | **Client session only** | High | Raw Moment Map narrative never enters a request. |
| M1 task states and content-location marker | `AnonymousProgrammeSession.taskStates`, `draft` | `/api/program/session/mission-01` | **Yes** | Low | Server stores bounded task identifiers and `{ contentStorage: "browser_session" }`. |
| M1 claimed continuity record | `MomentMap` | `/api/program/claims/redeem` | **Yes, neutral marker only** | Low when neutral | Existing required text columns receive `[stored only in this browser session]`; arrays are empty. No raw client narrative is accepted or reconstructed. |
| M2 raw action, trigger/situation, alternative, success signal, confidence adjustment | React + `sessionStorage` local-content record | Not accepted | **Client session only** | High | Removed from request DTO and server presentation. |
| M2 source ID, direction, review date, confidence, status, task states | `CurrentGoal`, `ProgrammeMissionProgress` | `/api/program/missions/02` and `/complete` | **Yes** | Low–moderate, bounded | Exact allow-list; raw goal columns receive the neutral local-only marker. |
| M3 raw early-signal text/category | React + `sessionStorage` local-content record | Not accepted | **Client session only** | High | The server records neither personal signal narrative nor category. |
| M3 evidence review, wave moments, learning-check answers, `local`/`not_now` choice, completion times, task states | `ProgrammeMissionProgress`, `UrgeLearningRecord` | `/api/program/missions/03` and `/complete` | **Yes** | Low, bounded educational state | Exact enum/list allow-list. Persisted `earlySignalCategory` and `earlySignalText` remain `null`; `notNow` reflects the bounded completion choice. |
| M4 raw trigger text, rule text, unit/period wording, execution detail, coping action | React + `sessionStorage` local-content record | Not accepted | **Client session only** | High | Removed from request DTO and redacted from server responses. Required raw text columns receive the neutral local-only marker. |
| M4 evidence review, category, trigger type, user-entered numeric limit, bounded execution method, review date, scenario/check state, status, task states | `ProgrammeMissionProgress`, `ActiveBoundary` | `/api/program/missions/04` and `/complete` | **Yes** | Moderate, structured | Exact allow-list; numeric value is user-entered and no amount is recommended. `limitUnit`, `limitPeriod` and `executionDetail` are not accepted. |
| Enrolment, current mission, completion timestamps | `ProgramEnrollment`, `ProgrammeMissionProgress`, `ProgramProgressEvent` | Claim and mission completion services | **Yes** | Low | Server-owned progression only; client cannot calculate or award completion. |
| XP, achievements, active-day dates, timezone and streak inputs | `UserXpEvent`, `UserAchievement`, `ProgrammeActiveDay`, `ProgramEnrollment.timezone` | Claim/completion/reward services | **Yes** | Low–moderate | Deterministic server-owned ledgers. No narrative in metadata. |
| Legacy reflection content | `ProgramReflection` | `GET` / `DELETE /api/program/reflections` | **Historic rows may remain** | High | Authenticated ownership, data-subject export and deletion remain. New `POST` fails with `410 LOCAL_ONLY_CONTENT` before body parsing. |
| Legacy raw M1–M4 artefact rows | Existing `MomentMap`, `CurrentGoal`, `UrgeLearningRecord`, `ActiveBoundary` rows | Dashboard/export/delete | **Historic rows may remain** | High | Active presenters redact raw fields. Export and erasure rights remain. Cleanup needs a separately approved retention decision; this release performs no destructive migration. |

## Server allow-list and rejection rule

Active Programme validators use exact top-level and nested key allow-lists. Unexpected keys are rejected without echoing their values. The server may accept only opaque identifiers, bounded mission/task/evidence state, dates/timezone, progress/completion facts, deterministic rewards, goal direction/review/confidence/status, a local-or-not-now signal choice, and the bounded structured boundary fields shown above.

The server must not accept or log Moment Map narrative; goal action/trigger/alternative/success narrative; urge, bodily-sensation or vulnerability narrative/category; boundary rule/trigger/execution/coping narrative; diagnosis/treatment history; Self-Check answers; Personal Limit Tracker values; arbitrary event metadata; or Help activity as a profiling signal.

API errors may name invalid fields or invalid states but must not include submitted values or raw request bodies. Programme responses are private and `Cache-Control: no-store`.

## Local lifecycle and user communication

Local narrative is namespaced by Mission inside the single versioned session key. The interface distinguishes “saved to your account” progress from words kept in the current browser tab. The local record is removed on explicit local clear and sign-out in that tab; the browser tab lifecycle supplies natural expiry. It is not a durable hidden vault.

An unchecked 18-or-over confirmation gates the Programme. Mutating Programme requests require the bounded `x-sevenbet-age-attestation: 18-or-over` header at middleware, and signup independently requires the confirmation. Help remains open. **AGE ATTESTATION PERSISTENCE — P1 OPEN:** no DOB, KYC or durable attestation evidence is stored by this release.

## Retention, access and erasure

- **Detected:** anonymous Mission 1 sessions expire after 24 hours of accepted activity; pending claims expire after 30 minutes.
- **Detected:** authenticated users can access active Programme projections; current projections redact legacy narrative.
- **Detected:** the internal data-subject tool exports actual related records and produces an ordered, dry-run-by-default deletion plan. Production execution requires both explicit environment confirmation and an execute flag.
- **Detected:** artefact-level deletion scrubs or deletes the applicable content while preserving truthful reward/completion integrity where the route contract requires it.
- **Planned:** automated expiry purge and a separately approved legacy-content cleanup/retention decision.
- **Not detected:** a lawful basis or approved purpose for new server persistence of raw vulnerability/health narrative.

Data-subject rights, complaints, backup caveats and operational ownership are defined in the linked compliance runbooks. Export files are created exclusively with mode `0600`; user content is not printed to the console.

## Commercial firewall

Commercial ranking, public casino/offer projection, affiliate candidate selection, redirects and commercial-readiness modules must not import Programme, Self-Check, personal-limit, protected-Help, vulnerability or local-session state. Commercial DTOs contain none of those fields. Structural regression tests enforce this boundary. No protected activity changes eligibility, rank, presentation, sponsored placement or destination.

## Evidence status

- **Detected:** local-first M1–M4 client storage; exact request allow-lists; redacted presenters; neutral legacy-column markers; retired legacy reflection creation; age mutation gate; deterministic rewards; commercial import firewall.
- **Inferred:** neutral legacy markers preserve existing relational and reward integrity without a schema change while avoiding new raw-content persistence.
- **Planned:** durable age evidence, distributed rate limiting, automated anonymous expiry purge and approved legacy cleanup.
- **Not detected:** Programme analytics, commercial analytics based on Programme state, behavioural advertising SDKs, or any authorised commercial use of Programme data.
