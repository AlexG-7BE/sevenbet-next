# IP-002 — Responsible Gambling Platform

**Status:** Implemented incrementally under executive authorization (2026-07-28)

## Authorization and boundary

The attached EPIC-002 executive authorization permits implementation despite the project’s prior planning-phase status. This record is limited to the implemented subsystem boundary. It does not activate jurisdiction enforcement, affiliate behavior, clinical assessment, or commercial placement.

## Detected implementation baseline reused

- CMS Program Builder with immutable published `ProgramVersion` snapshots.
- Authenticated `ProgramEnrollment`, idempotent event ledger, server-owned XP, and achievement services.
- Public `/program` player with device fallback and explicit authenticated account saving.
- Existing quiz, scenario, exercise, prerequisite, completion, and publication validation paths.

## EPIC-002 implementation additions

- `ProgramReflection` is an additive private table keyed by enrollment and content block. It is owned through the authenticated enrollment and is not included in progress, reward, or admin queries.
- Exercise completion events retain only `{ completed: true }`; free text is no longer stored in the generic event ledger.
- `/api/program/reflections` provides authenticated listing, upsert, and deletion. It validates program ownership and that a block belongs to the enrolled published snapshot and supports reflection.
- Scenario choices may contain a configured `safetySeverity` (`SUPPORT`, `URGENT`, or `EMERGENCY`). The runtime maps only those explicit values to deterministic, non-diagnostic safety interruptions. Unknown values create no inferred safety state.
- Safety UI presents neutral generic fallback guidance when governed local resource data is unavailable. It does not claim local hotlines, contact third parties, award celebratory rewards, or route users to casino pages.
- Completion now returns users to the safety hub or program review rather than casino discovery.

## Versioning and progress lifecycle

Enrollments remain pinned to their published `ProgramVersion`. New publications do not silently migrate active users. Reflection rows are tied to the enrollment and block identifier; editors should not remove a reflection-capable block from an active version without considering the retained private entry.

## Privacy and operational notes

Reflection content must never be added to analytics, logs, URL parameters, or administrator listings. The current public player still keeps unsaved anonymous reflections in browser storage; loss of that local browser state cannot be recovered. A governed regional resource catalogue and anonymous server-side ownership model remain future work.

## Deployment precautions

Apply `0013_responsible_gambling_private_reflections` after the existing migration chain. It only creates a new table, indexes, and a cascading foreign key; it does not rewrite historical progress events. Historical free-text metadata remains subject to the existing retention process and is not migrated automatically to avoid unsafe inference or data movement.

## Validation

`npx prisma validate`, Prisma client generation, TypeScript typecheck, progress, XP, achievement, and safety-domain tests pass locally. Database-backed reflection API smoke testing requires a configured PostgreSQL instance with the additive migration applied.
