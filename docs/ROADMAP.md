# Roadmap

| Phase | Focus | Status | Completion Date |
| --- | --- | --- | --- |
| Phase 0 | Product Vision | Completed | — |
| Phase 1 | Product Master Plan | In progress | |
| Product decision | RFC-002 — Active Control Program and Personal Control Dashboard | Approved; delivery gates pending | 2026-08-02 |
| Design decision | RFC-005 — Prismatic Product Theatre | Superseded by RFC-006 | 2026-08-03 |
| Design decision | RFC-006 — Human Guidance Trust-Led Design Direction | Superseded by RFC-007 | 2026-08-04 |
| Design decision | RFC-007 — Tilt-Locked Human Product Theatre | Approved; visual and composition authority | 2026-08-04 |
| Product decision | RFC-009 — Mission 03 Urge Literacy and Early Signal | Approved and implemented; connected-database browser flow verified, while clinical-content/compliance release review and mobile QA remain gates | 2026-08-04 |
| Product decision | RFC-010 — Mission 04 Build One Boundary | Approved and implemented; Figma flow, private ActiveBoundary, deterministic reward and migration 0017 verified, while authenticated browser completion and release review remain gates | 2026-08-04 |
| Product decision | RFC-012 — Temporary Production Synthetic Casino Dataset and Public Offer Projection | Implemented and production-deployed in [PR #20](https://github.com/AlexG-7BE/sevenbet-next/pull/20): exactly 25 published `demo-*` aggregates, 25 eligible offers, 18 GB scenarios, 75 media assets and five internal-only redirects through latest published snapshots and repository/service contracts. Repeat seed converges without new versions; production verification and responsive/no-JavaScript smoke pass. No schema migration, separate Demo infrastructure or external gambling destination | 2026-08-06 |
| Supporting track | Product & Design — Tilt-Locked system and key journeys | In progress; acquisition surfaces and the responsive `/program` journey through Mission 04 and Dashboard `4 of 10` are implemented. Mission 04 browser/mobile/release QA, Missions 05–10 and wider journey migration remain pending. | 2026-08-04 |
| Supporting track | Frontend Migration Audit and P0 Plan | Audit complete; FE-MIG-01 through FE-MIG-06 are merged, with FE-MIG-06 Casino Directory in `328d209` and its approved theatre-media correction in `12c2d27`. FE-MIG-07 Bonus Directory is implemented in [PR #25](https://github.com/AlexG-7BE/sevenbet-next/pull/25) from merged `main`, mapping approved Figma family `541:3002` to the existing database-driven Public Offer service while preserving SSR, URL filters, facets, server sorting, 24-result pagination, ItemList/canonical/noindex rules and governed actions. Bonus-specific presentation isolates `/best-offers`; Preview smoke and Founder Office review remain gates. `/self-check` and `/tools/budget-calculator` remain launch-blocked as `P0_REDESIGN_REQUIRED` under FE-SAFETY-01. | 2026-08-06 |
| Backend decision | RFC-008 — Programme persistence, rewards and privacy | Implemented through migration 0017, including RFC-009 Mission 03 and RFC-010 Mission 04 persistence/rewards; expiry automation, distributed rate limiting, export/erasure and telemetry remain pending | 2026-08-04 |
| Supporting track | Programme backend boundaries — Missions 01–04 | Architecture hardening complete: bounded vertical slices, explicit unit of work, repeatable Dashboard snapshots, permanent standards and 43/43 Programme regressions; no API, schema, reward, frontend or product change. Distributed operations, purge, export/erasure, telemetry, CI/CD and autosave ordering remain pending. | 2026-08-04 |
| Phase 2 | Architecture | Pending | |
| Phase 3 | Domain Model | Pending | |
| Phase 4 | Compliance | Pending | |
| Phase 5 | Engineering Standards | Pending | |
| Phase 6 | Implementation | Pending | |
