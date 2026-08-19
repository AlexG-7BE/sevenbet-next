# SevenBet Agent Instructions

## Documentation First

Review current governing documentation before implementation. Documentation
records decisions; live authoritative evidence records what actually exists.

## Required Reading

Before beginning any work, study:

1. the current explicit Founder instruction, when present;
2. [Decision & Documentation Governance](docs/GOVERNANCE.md);
3. [Current State](docs/CURRENT_STATE.md);
4. [Product Vision & Principles](docs/Product-Vision-and-Principles.md); and
5. only the relevant `ACTIVE` RFCs in the [RFC Registry](docs/06_RFC/README.md).

Use [Project State](docs/PROJECT_STATE.md), [Roadmap](docs/ROADMAP.md) and
historical RFCs only when their delivery history is relevant.

## Source of Truth

Product Vision & Principles is the primary durable product-philosophy document.
A newer explicit Founder instruction is the final internal decision authority
and may change an older internal decision. External law, platform constraints
and factual evidence remain unaffected.

## Decision Documentation

Document durable architecture decisions. Create an RFC only for a material
change to durable system architecture, domain ownership or a major data model,
security/privacy/legal/Production/commercial authority, a major product
invariant, a major external integration or a durable engineering standard.
Ordinary implementation, UI work, bug fixes, CI/test changes and normal
refactors use the PR, tests and relevant current/operational documentation.

## Working Rule

For decision conflicts, follow the hierarchy in `docs/GOVERNANCE.md`; a current
explicit Founder decision outranks an older RFC. For factual conflicts, verify
live authoritative evidence and reconcile stale documentation. Do not use stale
internal governance as a veto against a newer Founder instruction.

## Active Control Programme Changes

Before changing the Active Control Programme, read:

1. `docs/Product-Vision-and-Principles.md`
2. the relevant `ACTIVE` Programme RFCs, including the RFC for the Mission being changed
3. `docs/05_Engineering/Programme-Architecture-Standards.md`
4. `docs/05_Engineering/Backend-Programme-Standards.md`
5. `docs/05_Engineering/Programme-Definition-of-Done.md`
6. `docs/CURRENT_STATE.md`

Without current Founder/project authority covering the change, do not:

- change reward amounts, achievements, Mission ordering or prerequisites;
- change commercial/safety data separation or protected Help behaviour;
- add a Mission to a central service, repository, switch, generic engine or workflow DSL;
- import Prisma in a route handler or React component;
- calculate XP, progress, completion or next Mission on the client;
- use Programme, pause or Help data for affiliate targeting or commercial personalisation;
- perform a destructive migration or `prisma migrate reset`;
- commit a material Programme feature directly to `main`;
- declare Programme work complete without regression tests and documentation updates.

For every new Mission, apply `docs/05_Engineering/Programme-Definition-of-Done.md` and record unmet release gates explicitly.

## Technical Documentation Evidence Rule

The factual implementation baseline is maintained at `docs/05_Engineering/Technical_Baseline/`. It is distinct from target architecture in `docs/02_Product_Architecture/` and from engineering standards in `docs/05_Engineering/`.

Before creating or updating technical documentation:

1. Scan the entire active repository and confirm its root.
2. Exclude dependencies, generated directories, build artefacts, caches, and `tsconfig.tsbuildinfo` from source analysis where appropriate.
3. Base implementation claims only on repository evidence.
4. Classify conclusions clearly as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN**, or **CONTRADICTION**.
5. Never present planned functionality as implemented and never expose secret values.
6. Stop rather than generate incomplete technical documentation when repository access is insufficient.
