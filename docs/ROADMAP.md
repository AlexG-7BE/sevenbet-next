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
| 10 | OPS-01 — Production Engineering & Release Governance | **Completed and merged** | [PR #45](https://github.com/AlexG-7BE/sevenbet-next/pull/45) merged as `e140f4d`; three-job CI, branch protection, scheduled smoke and operations runbooks are active. |
| 11 | ENV-ISO-01 — Preview / Production Environment Isolation | **Completed and merged** | [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) merged as `a954243`; distinct Preview database/auth/admin authority, exact-host Preview auth and no Production-data copy are proven. Exact-merge Production deployment, smoke and real staff auth E2E passed. Recovery remains a separate PARTIAL pre-closed-beta gate. |
| 12 | GB-MARKET-01 — GB Market Authority | **Implementation complete — Delivery PR #54; technical review only** | [PR #54](https://github.com/AlexG-7BE/sevenbet-next/pull/54) establishes a versioned, server-authoritative GB editorial policy and fail-closed jurisdiction/operator/redirect gates. Commercial and referral activation remain off; this is not GB launch approval. |
| 13 | Programme Missions 05–10 | **Future separate product scope** | Requires Mission-specific approval, implementation, regression and documentation gates. |
| 14 | Regulated commercial release | **Blocked by separate gates** | Live jurisdiction/age authority, legal/compliance approval, real operator/partner data and verified recovery remain outstanding. |

## FE-DS-01 outcome

FE-DS-01 produces a governed [Design System v1](02_Product_Design/Design-System-v1.md): production UI inventory, Figma/code token parity, a bounded internal Action family, responsive and accessibility contracts, visual regression, an explicit Storybook decision, Figma back-sync and legacy deprecation.

It may correct consolidation-level P2/P3 inconsistencies. It must not claim commercial launch readiness or replace product, compliance, backend/operations or partner-data approvals.

## OPS-01 outcome

OPS-01 implements [RFC-013](06_RFC/RFC-013-Production-Engineering-and-Release-Governance.md) and the [operations runbooks](06_Operations/README.md). [PR #45](https://github.com/AlexG-7BE/sevenbet-next/pull/45) is merged; `main` branch protection and successful Production Smoke evidence are detected. OPS-01 does not automate Production migrations without an approved secret architecture or close provider recovery, jurisdiction, legal/compliance, Programme or partner-data gates.

## ENV-ISO-01 outcome

ENV-ISO-01 [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) is merged and closed. It establishes a dedicated shared Preview Prisma Postgres resource, independent auth/admin secrets, exact Vercel branch-host trust, Production-only and Preview-only provider connections, fail-closed Preview integrations and a disposable auth/mutation proof. No Production data was copied. The exact-merge Production deployment is healthy, Production Smoke passed and real Production staff authentication passed login, protected admin, refresh/session persistence and logout. Prisma Free backup/PITR limitations remain a separate recovery gate and do not reopen ENV-ISO-01.

## GB-MARKET-01 outcome

GB-MARKET-01 [PR #54](https://github.com/AlexG-7BE/sevenbet-next/pull/54) is implementation-complete and awaiting Founder merge review. It activates the existing jurisdiction resolver as the server authority, adds the repository-controlled GB online-casino policy, treats Vercel request-country metadata as the only request-location signal, preserves editorial/commercial separation, defines the operator evidence contract and rechecks every final redirect. Policy `gb-2026-08-08.1` keeps commercial and referral capability off. Production inventory counts are not verified; effective commercially eligible operators are zero under the policy ceiling. COMM-01, LEGAL-02 and recovery remain separate gates.

## Next sequencing

After GB-MARKET-01 merge review, the following may proceed in parallel subject to their own governing approvals and release gates:

- COMM-01 — real partner/operator commercial authority;
- LEGAL-02 — final external GB legal/compliance sign-off;
- PROGRAM-AI-01 — product/architecture planning only;
- PERF-01 — separately governed performance work;
- RECOVERY-01 — stateful pre-closed-beta recovery gate.

No follow-up ENV-ISO or generic OPS cleanup workstream is open.
