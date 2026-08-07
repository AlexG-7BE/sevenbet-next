# SevenBet Roadmap

Last reconciled: 2026-08-07

Role: forward execution sequence

Current implementation truth is in [Project State](PROJECT_STATE.md). Visual route authority is in the [Figma Screen Inventory](02_Product_Design/Figma-Screen-Inventory-and-Delivery-Plan.md). Completed frontend history is in the [Frontend Migration Record](02_Product_Design/Frontend-Migration-Audit-and-P0-Implementation-Plan.md).

## Frontend sequence

| Order | Workstream | Status | Gate / outcome |
| ---: | --- | --- | --- |
| 1 | FE-MIG-01 through FE-MIG-16 — page-level frontend migrations | **Completed** | All final migration heads are merged through Home final parity. |
| 2 | DOC-REC-01 — post-migration documentation reconciliation | **Implemented in this PR; complete on merge** | Canonical project state, roadmap, Figma mapping and migration history agree with merged runtime and approved design authorities. |
| 3 | FE-DS-01 — Frontend & Design System Consolidation | **Next · not started** | Consolidate production patterns without redesigning migrated pages or changing data/functionality authority. |

FE-DS-01 includes the approved scope of production UI inventory, Figma/code parity audit, design tokens, component and duplicate-CSS inventory, responsive contracts, states and variants, accessibility consolidation, visual regression, Storybook decision, Figma production back-sync, legacy deprecation and Design System v1 governance.

No frontend workstream after FE-DS-01 is established by this roadmap.

## Product, Programme and launch tracks

| Track | Current status | Next approved gate |
| --- | --- | --- |
| Product Vision | Completed and governing | Continue Product Master Plan work without conflicting with the approved Product Vision. |
| Product Master Plan | In progress | Close remaining architecture, compliance, commercial and operational decisions. |
| RFC-002 / RFC-008 Programme foundation | Missions 01–04 and persistence/rewards implemented | Restore date-stable regressions; complete authenticated browser, mobile/device, clinical-content and compliance review. |
| Mission 05 | Not approved or implemented | Separate Mission RFC, Figma authority and Programme Definition of Done before implementation. |
| Missions 06–10 | Planned only | Mission-specific decisions and release gates. |
| RFC-012 temporary synthetic dataset | Implemented and production-deployed as an explicitly fictional exception | Preserve the bounded exception; do not infer real-operator or live-market authority. |
| RFC-004 commercial launch | Approved delivery direction; wider gates pending | Trusted jurisdiction/licensing enforcement, content/legal ownership and release evidence. |
| FE-HANDOFF-01 | Unresolved | Approve and implement one system-wide outbound failure/recovery contract. |
| FE-SAFETY-01 | Launch blocked | Product/privacy/compliance/Figma approval before any self-check or budget-tool redesign implementation. |
| Programme privacy/operations | Partial | Expiry purge, distributed rate limiting, export/erasure and telemetry. |

## Phase roadmap

| Phase | Focus | Status |
| --- | --- | --- |
| Phase 0 | Product Vision | Completed |
| Phase 1 | Product Master Plan | In progress |
| Phase 2 | Product Architecture | Pending formal completion |
| Phase 3 | Domain Model | Pending formal completion |
| Phase 4 | Compliance | Pending |
| Phase 5 | Engineering Standards | Programme-specific standards implemented; phase-wide completion pending |
| Phase 6 | Wider implementation | Pending governed phase entry |

RFC-005 and RFC-006 remain superseded decision history. RFC-007 remains the approved visual/composition direction; RFC-001 jurisdiction enforcement remains a separate unresolved authority and must not be inferred from frontend states.
