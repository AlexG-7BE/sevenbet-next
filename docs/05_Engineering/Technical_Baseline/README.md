# Technical Baseline

## Verified audit scope

| Field | Value |
| --- | --- |
| Audit date | 2026-08-08 |
| Verified repository root | `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` |
| Audit method | Recursive repository inspection, excluding `.git/`, `node_modules/`, `.next/`, `test-results/`, `coverage/`, caches, and `tsconfig.tsbuildinfo` from source analysis. |
| Change scope | Rescanned for GB-MARKET-01 at base `9620a9c89afda57ea168f3edbf398ba0c4e450d4`. The delivery adds repository policy/evidence authority and public commercial enforcement; Prisma schema/migrations, dependencies, hosted values and Production data do not change. |

## Evidence vocabulary

- **Detected** — directly confirmed by repository files, imports, routes, schemas, migrations, or scripts.
- **Inferred** — cautious conclusion supported by detected evidence.
- **Planned** — product/documentation intent without implementation evidence.
- **Not detected** — no supporting repository evidence was found.

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
