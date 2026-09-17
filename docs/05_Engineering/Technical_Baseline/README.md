# Technical Baseline

## Verified audit scope

| Field | Value |
| --- | --- |
| Audit date | 2026-09-14 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Audit method | Recursive repository inspection, excluding `.git/`, `node_modules/`, `.next/`, `test-results/`, `coverage/`, caches, and `tsconfig.tsbuildinfo` from source analysis. |
| Change scope | Entire active repository rescanned at canonical main `2424a5dd9061aa07e09764cd7b6a5dee70c64192`. Dependencies, generated directories, build artefacts, caches, research staging and `tsconfig.tsbuildinfo` were excluded from source claims. Live Production state is classified separately. |

## 14 September counted inventory

**DETECTED on canonical main `2424a5dd…` at that audit:** 116
`app/api/**/route.ts` files, 77
`app/**/page.tsx` files, 41 ordered Prisma migration directories, 228
`.test`/`.spec` files under `tests/`, 109 Prisma models and 99 enums. The Git
index contains 2,356 tracked files and 1,153 source files under the stated
counting rules. At that checkpoint, Production had all 41 migrations through
`0041_commercial_core_legacy_connector_cleanup` applied.

**DETECTED on released main `c515ddb0…`, 17 September 2026:** the repository
contains 43 ordered migrations through `0043_article_learning_center`; a fresh
read-only Production status check enumerated all 43 and reported the database
up to date. The other inventory counts above remain the historical 14 September
audit and are not silently recast as a fresh full count.

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
- [07_Known_Technical_Debt.md](07_Known_Technical_Debt.md) — historical 13 August debt snapshot; current claims require fresh verification.
- [08_Assumptions_and_Constraints.md](08_Assumptions_and_Constraints.md) — detected constraints and explicitly unconfirmed assumptions.
- [09_Programme_Backend_Audit.md](09_Programme_Backend_Audit.md) — evidence audit and implemented Active Control Programme backend delta.
- [10_PROGRAM_AI_M1_Foundation_Audit.md](10_PROGRAM_AI_M1_Foundation_Audit.md) — detected RFC-022 feature-gated M1 foundation, privacy, progression and provider boundaries.
- [11_External_Media_Provenance.md](11_External_Media_Provenance.md) — production-facing image/embed inventory, Pexels-to-first-party mapping, privacy effects and unresolved provenance evidence.
- [12_Programme_Access_Authorization.md](12_Programme_Access_Authorization.md) — durable Programme acceptance, complete mutation classification, anonymous/authenticated boundaries and conservative migration evidence.
- [13_Casino_Market_Data_Architecture.md](13_Casino_Market_Data_Architecture.md) — global Casino, exact-market facts, provenance, public projection, commercial-route separation and migration evidence.
- [14_Geo_Language_Global_Catalog.md](14_Geo_Language_Global_Catalog.md) — language-only public routing, trusted request market, global published Casino projection and three-state presentation.
- [15_Canonical_Market_Activation.md](15_Canonical_Market_Activation.md) — single exact-market commercial authority, desired-state controller, route verification, canonical runtime cutover and legacy compatibility baseline.
- [16_Customer_Data_Analytics_Lifecycle_Core.md](16_Customer_Data_Analytics_Lifecycle_Core.md) — current customer, first-party analytics, outbound attribution, email lifecycle, consent and fixed-dashboard implementation evidence.
- [17_Navigation_Performance_Stage_2.md](17_Navigation_Performance_Stage_2.md) — candidate/local, exact-head Preview and Production navigation evidence, implemented cache/responsiveness boundaries, regression evidence, limitations and rollback.
