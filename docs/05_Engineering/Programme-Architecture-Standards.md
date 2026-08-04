# Programme Architecture Standards

Status: Repository engineering standard. Scope: Active Control Programme backend and its delivery contracts. Product Vision and approved Programme RFCs remain the product authority; this document governs implementation structure.

## Architecture rules

1. Each Mission is a vertical slice with its own request contract, validation, application use case, persistence needs and tests.
2. A new Mission is not added to a central service, repository, switch, base class, generic Mission Engine or JSON workflow DSL.
3. Shared abstractions are introduced only after real repetition in implemented use cases. Similar names or anticipated Missions are not sufficient evidence.
4. Route handlers are thin: authenticate, rate-limit where applicable, parse, validate, call one application use case, and map one success/error response.
5. Product invariants and state transitions live in domain/application code, not HTTP handlers, React components or repositories.
6. Repositories persist/query owned aggregates or read models. They do not decide eligibility, completion, reward amounts, next Mission or ownership policy.
7. The Dashboard is the server-owned Programme read model. The frontend does not calculate XP, achievements, completion, current Mission or next Mission.
8. Completion, reward, achievement, progress-event and active-day writes are idempotent. Important guarantees use database uniqueness/conditional writes, not UI state or an in-memory lock.
9. Artefact, progression, recognition and active-day writes are one transaction when they represent one user result. A concrete transaction/unit-of-work context must be visible in the use case.
10. Every private artefact enforces ownership through the authenticated user's Programme enrollment. Authentication alone is not ownership.
11. Every Mission supports truthful resume. Draft state, final artefact state and completed progression state remain distinguishable.
12. Autosave/write APIs must provide version/order-safe semantics or document their limitation. The current Missions 01–04 contract merges task states but uses last-write-wins fields; adding optimistic revisioning requires a compatible API/UX decision and tests.
13. Programme answers, drafts, artefacts, rewards, active days, pause and Help context stay outside affiliate targeting, ranking, offer selection and commercial personalisation.
14. Protected Help separation is not weakened by a Programme change.
15. A new Mission must not materially grow the compatibility `ProgrammeFlowService`, a shared repository or an existing Mission module. It adds a new slice and the minimum registry/policy entry.
16. Database migrations are additive and preflighted unless a separate approved decision authorises otherwise. Destructive reset is prohibited.
17. Reward amounts, achievements, ordering and prerequisites change only through an approved Product/RFC decision.
18. Every new/changed API has regression tests and API documentation updates.
19. Material Programme work uses a focused branch and Pull Request. It is not committed directly to `main`.

## Current boundary pattern

```text
Programme route
  → one application use case
  → pure registry/state/reward rules
  → ProgrammeUnitOfWork
      → session/claim repository
      → progress repository
      → artefact repository
      → reward/active-day repository
      → Dashboard repository
```

`ProgrammeUnitOfWork` is a concrete transaction composition boundary, not a dependency-injection container. Mission completion services may coordinate several scoped repositories through the same unit of work; they must not call several independently committing services.

## Review triggers

These are mandatory review triggers, not automatic violations:

- application service over 400 lines;
- repository over 350 lines;
- function over 80 lines;
- route handler contains a business rule;
- a new Mission changes more than two existing Mission modules;
- a central switch grows with each Mission;
- one atomic operation is spread across independent calls;
- reward/progression logic is duplicated;
- a new write API lacks an ownership test;
- a completion API lacks duplicate and concurrent tests;
- a migration lacks preflight and impact notes.

When a trigger is crossed, the change owner must stop, explain the cause, propose a decomposition, or document why splitting would make ownership/transactions less clear. A mission-specific completion coordinator may remain longer than 80 lines when it visibly expresses one atomic result and shared policy, mapping and persistence details have already been extracted.

## Change review evidence

Every material Programme PR states:

- preserved product invariants and API contracts;
- transaction and ownership boundaries;
- duplicate, concurrency and rollback evidence;
- migration impact;
- frontend impact;
- remaining operational/privacy risks.
