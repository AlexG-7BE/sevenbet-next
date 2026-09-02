# Technical Baseline

## Verified audit scope

| Field | Value |
| --- | --- |
| Audit date | 2026-09-02 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Audit method | Recursive repository inspection, excluding `.git/`, `node_modules/`, `.next/`, `test-results/`, `coverage/`, caches, and `tsconfig.tsbuildinfo` from source analysis. |
| Change scope | Entire active repository rescanned after updating the isolated `CASINO-DATA-ARCH-01` candidate onto authoritative post-migration main `5d16a2615a642625c916f63899ba1748e895d689`. Dependencies, generated directories, build artefacts, caches, research staging and `tsconfig.tsbuildinfo` were excluded from source claims. |

## Current counted inventory

**DETECTED on the reconciled implementation candidate:** 102 `app/api/**/route.ts` files, 71 `app/**/page.tsx` files, 25 ordered Prisma migration directories, 161 TS/TSX/MJS/CJS `.test`/`.spec` files under `tests/`, and 132 tracked assets under `public/`. The architecture scan covered 2,014 active repository files under the exclusions above.

## Evidence vocabulary

- **DETECTED** — directly confirmed by repository files, imports, routes, schemas, migrations, or scripts.
- **INFERRED** — cautious conclusion supported by detected evidence.
- **PROPOSED** — target or later work without implemented evidence.
- **UNKNOWN** — current evidence cannot establish the fact.
- **CONTRADICTION** — authoritative evidence conflicts and has not yet been reconciled.

This baseline describes the observed implementation, not a target architecture or redesign proposal. Product documentation remains the authority for product intent; it does not turn planned capabilities into implemented ones.

## Documents

- [01_Current_System.md](01_Current_System.md) — system, frontend, backend, module, and assessment snapshot.
- [02_Tech_Stack.md](02_Tech_Stack.md) — detected runtime, framework, tooling, and active dependencies.
- [03_Repository_Structure.md](03_Repository_Structure.md) — repository, routing, and code-layout inventory.
- [04_External_Services.md](04_External_Services.md) — repository-evidenced integrations.
- [05_Environment.md](05_Environment.md) — environment variables and deployment evidence, without values.
- [06_Current_Data_Model.md](06_Current_Data_Model.md) — Prisma, migration, and persistence inventory.
- [07_Known_Technical_Debt.md](07_Known_Technical_Debt.md) — evidence-based debt and architecture blockers.
- [08_Assumptions_and_Constraints.md](08_Assumptions_and_Constraints.md) — detected constraints and explicitly unconfirmed assumptions.
- [09_Programme_Backend_Audit.md](09_Programme_Backend_Audit.md) — evidence audit and implemented Active Control Programme backend delta.
- [10_PROGRAM_AI_M1_Foundation_Audit.md](10_PROGRAM_AI_M1_Foundation_Audit.md) — detected RFC-022 feature-gated M1 foundation, privacy, progression and provider boundaries.
- [11_External_Media_Provenance.md](11_External_Media_Provenance.md) — production-facing image/embed inventory, Pexels-to-first-party mapping, privacy effects and unresolved provenance evidence.
- [12_Programme_Access_Authorization.md](12_Programme_Access_Authorization.md) — candidate durable Programme acceptance, complete mutation classification, anonymous/authenticated boundaries and conservative migration evidence.
- [13_Casino_Market_Data_Architecture.md](13_Casino_Market_Data_Architecture.md) — global Casino, exact-market facts, provenance, public projection, commercial-route separation and migration evidence.
