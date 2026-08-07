# SevenBet Project State

Last reconciled: 2026-08-07

Status: current operational snapshot

Product authority: [Product Vision & Principles](Product-Vision-and-Principles.md)

This document answers what exists now. Forward sequencing belongs in the
[Roadmap](ROADMAP.md), visual authority belongs in the
[Figma Screen Inventory](02_Product_Design/Figma-Screen-Inventory-and-Delivery-Plan.md),
and completed page-migration history belongs in the
[Frontend Migration Record](02_Product_Design/Frontend-Migration-Audit-and-P0-Implementation-Plan.md).

## Current product

SevenBet is an online-casino-first decision-support product for adults. The first launch market is Great Britain (GB), and the strategy is **regulated-first**: applicable regulation, licensing evidence, material terms and user control precede commercial action.

The 10-Step Programme is the central control product. Discovery, reviews, comparisons, Learning Center content and affiliate handoffs support informed decisions; they do not turn Programme completion, Protected Help use or vulnerability signals into commercial targeting.

## Current delivery state

### Frontend

**Detected:** the page-level frontend migration programme is complete through FE-MIG-16. The merged public route families are:

- shared Public Shell;
- Home `/` and the `/10-steps` acquisition route;
- Casino Directory `/casinos`, casino profiles `/casino/[slug]`, Bonuses `/bonuses`, Best Offers `/best-offers` and Comparison `/compare`;
- Protected Help `/responsible-gambling/**`;
- Ranking Methodology `/methodology`, Affiliate Disclosure `/affiliate-disclosure` and About `/about`;
- Learning Center `/learn`, category routes and article routes;
- Bonus Guide `/bonus-guide`.

The migration record owns the exact FE-MIG/PR sequence. Completion of page migrations does **not** mean the frontend design system is consolidated.

**Detected:** the Public Shell is server-owned by `app/(public)/layout.tsx`, uses the approved Header and Footer, derives account presentation from the server session, owns the public `<main>`, and keeps Protected Help and Programme shells separate. Home is server-rendered with a bounded carousel client island. Public account state is runtime truth; illustrative Figma account or XP values are not production authority.

**Detected:** `/program` implements Mission 01, mandatory earned-result account claim, Missions 02–04, private editable artefacts, deterministic rewards and Dashboard truth through `330 XP / 4 of 10`. Mission 05 is only a disabled next-package state; Missions 05–10 are not implemented missions. The full approved ten-node Programme Map, Dashboard-level paused-map re-entry and explicit Dashboard loading/retry representatives remain a visual/product gap rather than a page-migration blocker.

**Detected:** Learning Center includes E05 Search & Filter v1: client-side text search, Category, Tag and Difficulty filters, combined filtering, result count, no-results recovery, clear filters, browse-categories recovery and a full server-rendered/no-JavaScript catalogue fallback. No search API, index or backend was added.

**Detected:** `/responsible-gambling/**` uses a dedicated Protected Help layout. It contains no casino, bonus or affiliate prompt, remains available without an account, and states that Help activity is not used for affiliate targeting, offer ranking or commercial personalisation.

### Backend and data boundaries

**Detected:** public casino, offer, comparison and affiliate presentation uses server services and public DTOs over latest eligible published records. Public React components do not import Prisma or expose raw affiliate destinations. Commercial handoffs use internal `/r/[slug]` routes and revalidate stored destinations server-side.

**Detected:** missing data is not invented; draft, archived and unpublished material is not public; unavailable commercial action remains unavailable; and failure does not permit substitution with another partner. The current production exception remains the bounded, explicitly fictional RFC-012 dataset, not authority to fabricate real-operator or live-market truth.

**Detected:** Programme rewards, progress, completion and next-mission state are server-owned. Programme, pause and Protected Help data remain outside affiliate ranking, advertising targeting and individual commercial personalisation.

## Figma and runtime authority

The current route-to-node mapping is maintained in the [Figma Screen Inventory](02_Product_Design/Figma-Screen-Inventory-and-Delivery-Plan.md).

- Figma controls approved visual design, composition, responsive intent and visual states.
- Runtime, governed data and Founder Office decisions control functionality, auth, production availability, evidence truth, compliance-sensitive copy and backend capability.
- An illustrative Figma value is never permission to fabricate runtime truth.

Current corrections include:

- Home canonical 1,440 source `289:946`, supplemented by desktop family `661:7551` and mobile family `657:2545`;
- About current family `835:5298`; old About nodes `646:4653` and `649:2405` are superseded;
- `/learn` current family `835:6356`; old catalogue frame `632:4240` is superseded for the hub, while category/article templates remain separate authorities;
- Bonus Guide desktop family `694:5455` and mobile family `694:8724`.

## Active blockers and debt

### Frontend and cross-cutting

- **FE-DS-01 — Frontend & Design System Consolidation: not started.** Production UI inventory, token/component consolidation, duplicate CSS/component detection, responsive/state contracts, accessibility consolidation, visual regression, the Storybook decision, Figma production back-sync, legacy deprecation and Design System v1 governance remain open.
- **FE-HANDOFF-01 — unresolved.** Commercial cards can present the approved confirmation before `/r/[slug]`, but a denied or failed redirect still returns a plain no-store text response. There is no system-wide, context-preserving failure/recovery surface with a neutral return path. This must be solved centrally rather than route by route.
- **Live market/age/licensing authority — not detected.** The shadow jurisdiction resolver and approved fail-closed Figma states do not constitute a trusted live policy dataset or public enforcement contract.
- **FE-SAFETY-01 — launch blocked.** `/self-check` and `/tools/budget-calculator` retain unapproved safety/commercial mechanics and require separate product, privacy, compliance and Figma approval before implementation or release.
- Privacy and Terms remain capability/content placeholders; account-wide export/erasure and password recovery are not functioning public capabilities.

### Programme, compliance and operations

- Mission 04 authenticated browser completion, broader mobile/device QA and clinical-content/compliance review remain release gates.
- Fixed historic `reviewAt` fixtures remain date-unstable against the next-30-days validator; the Programme regression baseline must be restored without changing approved Mission behaviour.
- Automated expiry purge, distributed rate limiting, account-wide export/erasure and Programme telemetry remain planned.
- Missions 05–10 require their own approved Mission decisions and Definition-of-Done gates.
- Production jurisdiction/licensing evidence, legal copy ownership, evidence-review operations, observability, deployment/migration controls and broader compliance readiness remain incomplete.

## Documentation state

DOC-REC-01 reconciles the current canonical documents in this PR and becomes complete when the PR is merged. Historical QA packages and RFCs remain decision/evidence history; they are not current project dashboards.

## Next authorized frontend workstream

**FE-DS-01 — Frontend & Design System Consolidation** is next and not started.

It must consolidate the production patterns created by the completed migrations without redesigning pages, changing runtime truth, broadening backend/data policy or treating illustrative Figma content as production functionality.
