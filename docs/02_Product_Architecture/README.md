# SevenBet Product Architecture

## Purpose

This directory is SevenBet's architectural constitution. It defines durable boundaries and decision rules for future implementation of the approved Product Vision. It does not prescribe a framework, database schema, route shape, vendor, or migration plan.

The approved [Product Vision & Principles](../Product-Vision-and-Principles.md) remains the product authority. The [Product Master Plan](../01_Product_Master_Plan/Product-Master-Plan.md) defines product scope; its current draft status does not make unapproved capabilities implementation commitments. The verified [Technical Baseline](../05_Engineering/Technical_Baseline/README.md) is evidence about the present repository, not approval of its architecture.

## Status and use

These principles govern architecture work from Phase 2.1 onward. A substantial change to a boundary, a new cross-domain capability, a material exception, or a decision that operationalises an unresolved question requires an RFC before implementation, in accordance with `AGENTS.md`.

Architecture documents use these terms:

- **Principle** — a mandatory target-state rule.
- **Detected** — implementation evidence recorded by the Technical Baseline.
- **Target** — an architectural direction; it is not evidence of present implementation.
- **Open question** — an unresolved decision that must not be silently settled in code.
- **Open Decision** — a review-identified decision that blocks the stated governed scope until an RFC approves it. Open Decisions are deliberately not ADRs and do not authorise implementation.

## Documents

1. [Architectural Principles](01_Architectural_Principles.md) — constitutional rules and decision test.
2. [Layered Architecture](02_Layered_Architecture.md) — responsibilities and allowed direction between layers.
3. [Module Boundaries](03_Module_Boundaries.md) — domain ownership and cross-domain collaboration.
4. [Request Lifecycle](04_Request_Lifecycle.md) — safe handling of public, internal, and referral requests.
5. [Data Flow](05_Data_Flow.md) — information classes, provenance, and permitted flows.
6. [Server and Client Boundaries](06_Server_Client_Boundaries.md) — trust, execution, and rendering boundaries.
7. [Dependency Rules](07_Dependency_Rules.md) — coupling rules, contracts, and enforcement expectations.
8. [Extensibility Principles](08_Extensibility_Principles.md) — rules for markets, verticals, CMS, integrations, and scale.

## Phase 2.1 review disposition

The Phase 2.1 Architecture Review found no Critical findings. Its High findings are addressed either by clarified architectural constraints or by the following blocking Open Decisions: `ARCH-OD-02` through `ARCH-OD-08`, and `ARCH-OD-11` through `ARCH-OD-14`. They must be approved through RFCs before governed MVP implementation; they are not implementation work items or implicit technical choices.

## Non-goal

This directory does not approve an immediate rewrite of the detected Next.js, Prisma, repository, service, CMS, or affiliate implementation. Alignment work must be proposed and sequenced separately.
