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
| 12 | GB-MARKET-01 — GB Market Authority | **Completed and merged** | [PR #54](https://github.com/AlexG-7BE/sevenbet-next/pull/54) merged as `5fbb73b`; it establishes a versioned, server-authoritative GB editorial policy and fail-closed jurisdiction/operator/redirect gates. Commercial and referral activation remain off. |
| 13 | COMM-01 — GB Commercial Partner Authority | **Implementation complete — PR #55 open for Founder review** | RFC-015 adds typed agreement/domain authority, explicit `DIRECT_LINK` outbound approval, programme/offer/link/bonus gates, provider-import safety, a five-candidate shortlist with current regulatory-history diligence, and an onboarding pack. No real partner or destination was added; policy/referral remain off. |
| 14 | LEGAL-02 and Founder partner application | **Next primary commercial gates** | Final external legal/compliance decision plus real application, negotiation, agreement and exact partner evidence. |
| 15 | PROGRAM-AI-01, PERF-01 and RECOVERY-01 | **Approved next independent workstreams** | May proceed independently; recovery remains required before stateful Closed Commercial Beta. |
| 16 | Programme Missions 05–10 | **Future separate product scope** | Requires Mission-specific approval, implementation, regression and documentation gates. |
| 17 | FILTER-UX-01 | **Later** | Proceed only after performance and authority contracts remain stable. |
| 18 | Regulated commercial release | **Blocked by separate gates** | Legal approval, real operator/partner agreement/data, policy activation and verified recovery remain outstanding. |

## FE-DS-01 outcome

FE-DS-01 produces a governed [Design System v1](02_Product_Design/Design-System-v1.md): production UI inventory, Figma/code token parity, a bounded internal Action family, responsive and accessibility contracts, visual regression, an explicit Storybook decision, Figma back-sync and legacy deprecation.

It may correct consolidation-level P2/P3 inconsistencies. It must not claim commercial launch readiness or replace product, compliance, backend/operations or partner-data approvals.

## OPS-01 outcome

OPS-01 implements [RFC-013](06_RFC/RFC-013-Production-Engineering-and-Release-Governance.md) and the [operations runbooks](06_Operations/README.md). [PR #45](https://github.com/AlexG-7BE/sevenbet-next/pull/45) is merged; `main` branch protection and successful Production Smoke evidence are detected. OPS-01 does not automate Production migrations without an approved secret architecture or close provider recovery, jurisdiction, legal/compliance, Programme or partner-data gates.

## ENV-ISO-01 outcome

ENV-ISO-01 [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) is merged and closed. It establishes a dedicated shared Preview Prisma Postgres resource, independent auth/admin secrets, exact Vercel branch-host trust, Production-only and Preview-only provider connections, fail-closed Preview integrations and a disposable auth/mutation proof. No Production data was copied. The exact-merge Production deployment is healthy, Production Smoke passed and real Production staff authentication passed login, protected admin, refresh/session persistence and logout. Prisma Free backup/PITR limitations remain a separate recovery gate and do not reopen ENV-ISO-01.

## GB-MARKET-01 outcome

GB-MARKET-01 [PR #54](https://github.com/AlexG-7BE/sevenbet-next/pull/54) is merged. It activates the existing jurisdiction resolver as the server authority, adds the repository-controlled GB online-casino policy, treats Vercel request-country metadata as the only request-location signal, preserves editorial/commercial separation, defines the operator evidence contract and rechecks every final redirect. Policy `gb-2026-08-08.1` keeps commercial and referral capability off.

## COMM-01 outcome

COMM-01 implements [RFC-015](06_RFC/RFC-015-GB-Commercial-Partner-Authority.md) without a schema change. It adds typed partner-agreement evidence with explicit `DIRECT_LINK` authority for outbound referral, a repository-controlled exact-domain evidence authority, server-side programme/offer/tracking/bonus gates, GB provider-import fail-closed behavior, a request-time central readiness evaluator, a five-candidate evidence shortlist with current UKGC regulatory-history diligence, and an onboarding/application/economics package. The real evidence store is empty; no partner, agreement, destination, traffic or Production commercial data was added. See [GB Commercial Partner Authority](05_Engineering/GB-Commercial-Partner-Authority.md).

## Next sequencing

After COMM-01 merge review, the following may proceed in parallel subject to their own governing approvals and release gates:

- Founder Office application/negotiation with the top real partner candidates;
- LEGAL-02 — final external GB legal/compliance sign-off;
- PROGRAM-AI-01 — product/architecture planning only;
- PERF-01 — separately governed performance work;
- RECOVERY-01 — stateful pre-closed-beta recovery gate.

FILTER-UX-01 remains later, after performance and authority contracts are stable. No live GB commercial/referral activation is authorized.

No follow-up ENV-ISO or generic OPS cleanup workstream is open.
