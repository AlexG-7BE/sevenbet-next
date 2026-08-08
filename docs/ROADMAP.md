# Roadmap

| Sequence | Workstream | Status | Evidence / boundary |
| --- | --- | --- | --- |
| 1 | Product Vision & Principles | **Completed** | Approved constitutional authority. |
| 2 | RFC-002 / RFC-008 Programme foundation | **Implemented through Mission 04; release gates remain** | Missions 01–04 are server-owned; expiry, distributed limiting, export/erasure and telemetry remain. |
| 3 | RFC-007 Tilt-Locked visual direction | **Approved** | Visual and composition authority. |
| 4 | FE-MIG-01 through FE-MIG-16 | **Completed and merged** | Public Shell, acquisition, discovery, trust, learning and legal content families. |
| 5 | FE-GAP-01 | **Completed and merged** | Privacy, Terms, safe Self-Check, Personal Gambling Limit Tracker and compact About amendment. |
| 6 | FE-GAP-02 | **Completed and merged** | Protected Help article closure, FAQ, semantic fixes and FE-HANDOFF-01 closure. |
| 7 | Final page-level P0/P1 audit | **Closed** | Known public-surface P0: 0; P1: 0 at baseline `30fc96e`. |
| 8 | DOC-REC-01 | **Completed and merged** | Post-migration documentation reconciliation at PR #43. |
| 9 | FE-DS-01 — Frontend & Design System Consolidation | **Completed and merged** | Design System v1 merged through PR #44 at main baseline `8f7ab7e`. |
| 10 | OPS-01 — Production Engineering & Release Governance | **Ready for Founder review** | RFC-013, three-job CI, repository governance, isolated browser/migration proof, scheduled smoke and runbooks are implemented on the OPS branch. |
| 11 | Programme Missions 05–10 | **Future separate product scope** | Requires Mission-specific approval, implementation, regression and documentation gates. |
| 12 | Regulated commercial release | **Blocked by separate gates** | Live jurisdiction/age authority, legal/compliance approval, real operator/partner data, Preview isolation and verified recovery remain outstanding. |

## FE-DS-01 outcome

FE-DS-01 produces a governed [Design System v1](02_Product_Design/Design-System-v1.md): production UI inventory, Figma/code token parity, a bounded internal Action family, responsive and accessibility contracts, visual regression, an explicit Storybook decision, Figma back-sync and legacy deprecation.

It may correct consolidation-level P2/P3 inconsistencies. It must not claim commercial launch readiness or replace product, compliance, backend/operations or partner-data approvals.

## OPS-01 outcome

OPS-01 implements [RFC-013](06_RFC/RFC-013-Production-Engineering-and-Release-Governance.md) and the [operations runbooks](06_Operations/README.md). It may establish repository checks and protection after exact-head validation. It does not rotate unknown hosted credentials, automate Production migrations without an approved secret architecture, merge itself, or close Preview isolation, provider recovery, jurisdiction, legal/compliance, Programme or partner-data gates.
