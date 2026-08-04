---
Title: RFC-008 — Programme Persistence, Rewards and Privacy
Status: Approved
Classification: Internal
Owner: Founder / Product / Engineering
Date: 2026-08-04
Decision: Implement the approved Mission 01 → account claim → Dashboard → Mission 02 flow by extending the detected Program, Better Auth and reward architecture.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ./RFC-002-Active-Control-Program-and-Dashboard.md
  - ./RFC-003-Program-Led-Commercial-Growth.md
---

# RFC-008 — Programme Persistence, Rewards and Privacy

## Decision

SevenBet SHALL extend the detected `ProgramEnrollment`, `ProgramProgressEvent`, `UserXpEvent`, `Achievement`, `UserAchievement` and Better Auth boundaries. It SHALL NOT introduce a second programme, identity or reward framework.

The Control Program owns anonymous Mission 01 state, pending claims, mission progress, Moment Maps, Current Goals and active-day facts. Identity owns authentication. Commercial and affiliate modules may not read or consume Programme answers, artefacts, confidence, rewards, active days, pause or Help context.

## Anonymous state and claim

- Mission 01 uses a PostgreSQL record addressed by a 256-bit opaque HttpOnly cookie; only its SHA-256 hash is stored.
- The private anonymous session expires 24 hours after its most recent accepted draft save.
- Completing all eight task states changes the session to `ready_to_save`; no XP or permanent enrollment exists yet.
- Creating the registration bridge changes it to `registration_required` and creates a one-time claim that expires after 30 minutes.
- After Better Auth succeeds, the authenticated redeem command conditionally consumes the claim and performs every save/reward/unlock write in one serializable transaction.
- Expired, unknown and previously consumed claims fail closed. Same-user retries cannot duplicate data because claim, enrollment, mission, XP, progress-event and active-day constraints are authoritative.
- A successfully redeemed anonymous draft is erased and retained only as a non-content tombstone. Abandoned expired records are eligible for operational purge; an automated purge job is not introduced by this RFC.

## Persistent artefacts

`MomentMap` and `CurrentGoal` are private aggregates owned through `ProgramEnrollment`. Free text remains in the artefact or mission-draft store and is never copied to progress, reward, analytics or error payloads.

Deletion is content erasure, not historical reward reversal. The service overwrites personal text and list values, sets `deletedAt`, and omits the artefact from future Dashboard reads. IDs, timestamps, completion facts and earned reward facts remain so retries, correction and ledger integrity are not corrupted. Formal account-wide export and erasure remain a broader privacy delivery item; the user can retrieve the two implemented artefacts through the private Dashboard contract and edit or erase each one now.

## Rewards and achievements

- Mission 01 saves exactly `+60 XP`; Mission 02 saves exactly `+80 XP`.
- Each reward is an append-only `UserXpEvent` with user, programme, mission number, event type, positive delta, deterministic award key and source artefact reference.
- `UserXpEvent.xp` is constrained non-negative. A mission event must have programme and source-artefact metadata.
- `First Plan` reuses `Achievement` / `UserAchievement`, has no bonus XP, and unlocks only when Mission 02 saves a valid Current Goal.
- No casino, offer, bonus, deposit, referral, operator or affiliate action is an eligible reward or active-day source.

## Active-day and timezone semantics

- The first claim redeem records one validated IANA timezone on `ProgramEnrollment`; `UTC` is the explicit fallback when the client supplies none.
- The server converts the eligible activity instant into that timezone and stores a date-only value plus the timezone used.
- `(userId, localDate)` is unique. Multiple missions on one local date remain one active day.
- Historical dates are immutable if the user's timezone later changes; future timezone editing is not part of this flow.
- A streak is the count of consecutive stored, non-voided local dates ending at the latest eligible date. There is no grace day, loss threat, recovery purchase or negative reward.
- Corrections are voids, not deletion. Only `SUPER_ADMIN` may void an active day, with a 10–500 character reason, timestamp and attributed admin actor. XP is not silently rewritten by an active-day correction.

## Reminder semantics

Reminders are disabled in this backend slice. No reminder is inferred from a streak and no notification is scheduled. A future opt-in reminder capability must define channel consent, quiet hours, unsubscribe, retention and non-coercive copy before implementation.

## Privacy, analytics and logs

- Programme routes emit no analytics or commercial events.
- Sensitive values are absent from reward/progress metadata, application logs and error messages.
- Programme product analytics and commercial analytics remain logically separate; neither integration is detected or added here.
- Protected Help continues to emit no affiliate or commercial event.
- Endpoint responses use `Cache-Control: no-store`, authenticated ownership checks and purpose-specific DTOs.

## Operational limits

The existing repository has no shared rate-limit service. Anonymous creation, draft, claim and completion routes therefore use a bounded in-process limiter consistent with the detected affiliate integration pattern. This is defence-in-depth for a single runtime, not a distributed production guarantee. A shared limiter and expired-session purge must be selected in production operations architecture before scale-out.

The migration is additive and must be applied with `prisma migrate deploy` only after backup and target-environment review. The published PostgreSQL Program with slug `sevenbet-10-step-control-program` must contain ten active steps and a published version; the API fails closed otherwise.

## Consequences

The first two missions now have one server-authoritative, idempotent path without changing public frontend or Figma. Remaining Missions 03–10, account-wide export/deletion, distributed rate limiting, retention automation, reminders, operational telemetry and deployment evidence remain separate work.
