# Control Programme Domain Model

Status: Implemented baseline through Mission 04; access/home correction reconciled 2026-08-10.

## Ownership and aggregates

| Concept | Classification | Owner and invariant |
| --- | --- | --- |
| Anonymous Programme Session | **Detected** | Control Program; one hashed private browser token, eight Mission 01 task facts, private draft and expiry. |
| Pending Programme Claim | **Detected** | Control Program; one claim per anonymous session, single consumption, 30-minute expiry. |
| Program Enrollment | **Detected / extended** | Existing Program aggregate; unique user/program enrollment pinned to a published version and timezone. |
| Mission Progress | **Detected** | Control Program; unique enrollment/mission, server-controlled status and resumable private draft. |
| Moment Map | **Detected** | User-owned private artefact created only by a valid Mission 01 claim redemption. |
| Current Goal | **Detected** | User-owned private artefact linked to the enrollment's Moment Map and created by Mission 02. |
| Urge Learning Record | **Detected** | User-owned private Mission 03 artefact containing one selected early signal and its learning context. |
| Active Boundary | **Detected** | User-owned private Mission 04 artefact linking a decision point, concrete rule, execution method, coping action and later review point. |
| Reward Ledger | **Detected / extended** | Existing append-only `UserXpEvent`; deterministic, non-negative Programme rewards carry mission and artefact source. |
| Achievement | **Detected / reused** | Existing `Achievement` and `UserAchievement`; `first-plan` is seeded by migration 0015. |
| Active Day | **Detected** | One eligible Programme activity fact per user-local date; correction uses an attributed void. |
| Reminder | **Not detected** | Explicitly disabled for this slice. |
| Programme Access Authority | **Detected, browser-session only** | One versioned 60-minute authority for 18+ confirmation and current Terms/Privacy acknowledgement. Journey-bound before auth, exact-user-bound after auth, separate from narrative and OAuth claim continuation. |

## State transitions

```text
not_started
  -> in_progress
  -> ready_to_save
  -> registration_required
  -> completed
```

Only anonymous Mission 01 uses every transition. Authenticated Missions 02–04 start `in_progress`, become `ready_to_save` only after their required work, and become `completed` only when the mission artefact and deterministic recognition are saved atomically.

An authenticated user without an enrollment is not treated as anonymous and no enrollment is created by a Dashboard read. The server returns an empty personal projection with Mission 01 current, later Missions locked, 0 XP and no completed activity. Entering Mission 01 requires an explicit Start action; My Programme opens the personal Dashboard.

`ProgramProgressEvent` records non-sensitive completion facts. `ProgrammeMissionProgress.draft`, `MomentMap`, `CurrentGoal`, `UrgeLearningRecord` and `ActiveBoundary` own private content. Reward and active-day ledgers reference the useful action but never duplicate its text.

## Invariants

- Mission 02 requires an authenticated enrollment and completed Mission 01.
- Mission completion is based on all required task states and a valid artefact, never elapsed time.
- A Current Goal references the same enrollment's live Moment Map.
- An Active Boundary belongs to the same enrollment and may reference that enrollment's live Current Goal and Urge Learning Record.
- Reward keys are deterministic and unique per user.
- One user-local date can contribute at most one active day.
- Artefact reads and mutations resolve ownership from the Better Auth user to the enrollment.
- Programme header and home state resolve from the actual Better Auth session, never from the visible Mission number.
- Email and explicit Google account creation require current bounded age/Terms/Privacy headers. Returning account sign-in does not recreate Terms acceptance; Google retains the age boundary.
- Access authority and anonymous Programme content migrate as separate exact-subject operations; neither is commercial authority.
- Deletion scrubs user-authored content and leaves a tombstone; completion and reward ledgers remain immutable.
