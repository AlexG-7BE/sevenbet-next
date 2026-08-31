# Programme Data and Commercial-Separation Policy

Status: **Approved implementation policy** under RFC-017 and the 2026-08-31 Programme-access Founder decision. Last reconciled: 2026-08-31.

## Decision

The Active Control Programme is an adult educational reflection, decision-support and personal-boundary product. It is not diagnosis, treatment, therapy, rehabilitation or evidence that gambling is safe or suitable.

Raw participant narrative is local-first for GB v1. It may exist in React state and in versioned, subject-isolated, tab-scoped `sessionStorage`: a random opaque journey namespace before authentication and `sevenbet.programme.local-content.v2:user:<user-id>` after authentication. It must not be sent to the application server, stored in cookies, URLs, `localStorage`, logs, analytics or generic event metadata. Account, enrolment, bounded task state, completion, rewards and the minimum neutral structured continuity facts remain server-persisted.

Programme data, pause state and protected Help activity are prohibited inputs to advertising, operator/casino recommendation, offer selection, affiliate optimisation, commercial eligibility, natural editorial ranking, commercial email or promotional pressure. Programme email templates may use only a generic approved purpose, the server-resolved account email and the normal Programme URL; they must not import or receive protected content.

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

Local narrative is namespaced by the exact anonymous journey or authenticated Better Auth user ID. A current anonymous Mission 01 namespace moves to the exact claimant only after successful claim redemption, then the anonymous source is removed. Ordinary sign-in never imports an arbitrary anonymous namespace. For Google claim continuation, a separate marker contains only fixed intent, exact journey ID, version and timestamps, expires after about 10 minutes and must equal the current journey pointer. It contains no narrative, identity, token or consent state. An authenticated subject change hides and clears the former subject from memory before loading only the next subject's namespace or an empty record. The interface distinguishes “saved to your account” progress from words kept in the current browser tab. Explicit local clear removes the active namespace; sign-out/session expiry rotates to a fresh anonymous journey; the browser tab lifecycle supplies natural expiry. It is not a durable hidden vault.

An unchecked 18-or-over confirmation plus Terms acceptance and Privacy acknowledgement gates first access. **Detected:** anonymous/pre-account mutations retain the signed journey proof, opaque HttpOnly Programme session and `x-sevenbet-age-attestation: 18-or-over` middleware boundary. Anonymous access expiry may show the controls again. **Detected:** an authenticated accepted user is authorized instead by the Better Auth user plus the purpose-specific `ProgrammeAccessAcceptance` server record; no browser marker, age header, locale or legal-copy version comparison can substitute for or revoke that record. Claim redemption binds the exact anonymous session acceptance to the exact claimant in the same transaction. New authenticated users without the record fail closed and see the one-time acknowledgement. Protected Help remains open. This stores self-attestation and acceptance timestamps/version metadata only: no DOB, KYC outcome, verified age, narrative, Programme state, marketing permission or commercial signal.

## Retention, access and erasure

- **Detected:** anonymous Mission 1 sessions expire after 24 hours of accepted activity; pending claims expire after 30 minutes.
- **Detected:** authenticated users can access active Programme projections; current projections redact legacy narrative.
- **Detected:** the internal data-subject tool exports actual related records and produces an ordered, dry-run-by-default deletion plan. Erasure deletes exact consumed claims and their linked anonymous sessions. Every execution requires an exact general user confirmation; an explicit Production target requires a second exact Production confirmation.
- **Detected:** artefact-level deletion scrubs or deletes the applicable content while preserving truthful reward/completion integrity where the route contract requires it.
- **Planned:** automated expiry purge and a separately approved legacy-content cleanup/retention decision.
- **Not detected:** a lawful basis or approved purpose for new server persistence of raw vulnerability/health narrative.

Data-subject rights, complaints, backup caveats and operational ownership are defined in the linked compliance runbooks. Export files are created exclusively with mode `0600`; user content is not printed to the console.

## Commercial firewall

Commercial ranking, public casino/offer projection, affiliate candidate selection, redirects, commercial-readiness and communications modules must not import Programme, Self-Check, personal-limit, protected-Help, vulnerability or local-session state. Commercial and communication DTOs contain none of those fields. Structural regression tests enforce this boundary. No protected activity changes eligibility, rank, presentation, sponsored placement, destination or email content.

## Evidence status

- **Detected:** local-first, subject-isolated M1–M4 client storage; exact request allow-lists; redacted presenters; neutral legacy-column markers; retired legacy reflection creation; subject-isolated age mutation gate; deterministic rewards; commercial import firewall.
- **Inferred:** neutral legacy markers preserve existing relational and reward integrity without a schema change while avoiding new raw-content persistence.
- **Planned:** durable age evidence, distributed rate limiting, automated anonymous expiry purge and approved legacy cleanup.
- **Not detected:** Programme analytics, commercial analytics based on Programme state, behavioural advertising SDKs, or any authorised commercial use of Programme data.
