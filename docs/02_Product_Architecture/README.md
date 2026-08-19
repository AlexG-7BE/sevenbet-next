# SevenBet Product Architecture

## Purpose

This directory is SevenBet's architectural constitution. It defines durable boundaries and decision rules for future implementation of the approved Product Vision. It does not prescribe a framework, database schema, route shape, vendor, or migration plan.

The approved [Product Vision & Principles](../Product-Vision-and-Principles.md) remains the durable product authority. [Decision & Documentation Governance](../GOVERNANCE.md) defines the higher-priority current Founder authority and the separate evidence hierarchy. The [Product Master Plan](../01_Product_Master_Plan/Product-Master-Plan.md) defines product scope; its current draft status does not make unapproved capabilities implementation commitments. The verified [Technical Baseline](../05_Engineering/Technical_Baseline/README.md) is evidence about the present repository, not approval of its architecture.

## Status and use

These principles govern architecture work from Phase 2.1 onward. A substantial
durable change to a boundary, a new cross-domain capability, a material
exception or a decision that operationalises an unresolved question normally
requires an RFC. A newer explicit Founder decision may supersede an older
internal boundary; execution then updates the durable record after
verification, as defined by `docs/GOVERNANCE.md`.

Architecture documents use these terms:

- **Principle** — a mandatory target-state rule.
- **Detected** — implementation evidence recorded by the Technical Baseline.
- **Target** — an architectural direction; it is not evidence of present implementation.
- **Open question** — an unresolved decision that must not be silently settled in code.
- **Open Decision** — a review-identified unresolved material choice. It remains
  undecided until an RFC or a current explicit Founder decision resolves it.

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

The Phase 2.1 Architecture Review found no Critical findings. Its High findings
are addressed either by clarified architectural constraints or by the listed
Open Decisions: `ARCH-OD-02` through `ARCH-OD-08`, and `ARCH-OD-11` through
`ARCH-OD-14`. They are unresolved-decision identifiers, not permanent RFC
vetoes; current resolution follows `docs/GOVERNANCE.md` and must not be inferred
silently from code.

## Non-goal

This directory does not approve an immediate rewrite of the detected Next.js, Prisma, repository, service, CMS, or affiliate implementation. Alignment work must be proposed and sequenced separately.
