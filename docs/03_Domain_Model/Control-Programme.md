# Control Programme Domain Model

Status: Implemented baseline through Mission 04 (2026-08-04).

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

## State transitions

```text
not_started
  -> in_progress
  -> ready_to_save
  -> registration_required
  -> completed
```

Only anonymous Mission 01 uses every transition. Authenticated Missions 02–04 start `in_progress`, become `ready_to_save` only after their required work, and become `completed` only when the mission artefact and deterministic recognition are saved atomically.

`ProgramProgressEvent` records non-sensitive completion facts. `ProgrammeMissionProgress.draft`, `MomentMap`, `CurrentGoal`, `UrgeLearningRecord` and `ActiveBoundary` own private content. Reward and active-day ledgers reference the useful action but never duplicate its text.

## Invariants

- Mission 02 requires an authenticated enrollment and completed Mission 01.
- Mission completion is based on all required task states and a valid artefact, never elapsed time.
- A Current Goal references the same enrollment's live Moment Map.
- An Active Boundary belongs to the same enrollment and may reference that enrollment's live Current Goal and Urge Learning Record.
- Reward keys are deterministic and unique per user.
- One user-local date can contribute at most one active day.
- Artefact reads and mutations resolve ownership from the Better Auth user to the enrollment.
- Deletion scrubs user-authored content and leaves a tombstone; completion and reward ledgers remain immutable.
