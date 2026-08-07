# Frontend Migration Audit and Completed Migration Record

## STATUS: PAGE-LEVEL FRONTEND MIGRATION PROGRAMME COMPLETED

Original audit approved: 2026-08-05

Closure reconciled: 2026-08-07

Role: **completed / historical migration record**

Figma: [SevenBet](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)

Governing visual direction: RFC-007 — Tilt-Locked Human Product Theatre

This document is no longer an active implementation plan. Do not start a migration from its historical findings. Current operational truth is in [Project State](../PROJECT_STATE.md), forward sequence is in the [Roadmap](../ROADMAP.md), and current visual route authority is in the [Figma Screen Inventory](Figma-Screen-Inventory-and-Delivery-Plan.md).

## 1. Why the audit existed

The documentation-only audit compared the active repository with the approved Figma system and split a broad visual rewrite into bounded route packages. It identified useful server-owned foundations alongside legacy shells, stale visual compositions, missing states, data/product blockers and two unapproved safety-tool behaviours.

The audit did not authorize implementation by itself. Founder Office review, approved design authority, runtime truth and route-specific validation governed each later migration.

Evidence labels used by the audit and this closure:

- **Detected** — directly observed in the repository, merged history or live Figma file.
- **Inferred** — bounded conclusion supported by detected evidence.
- **Planned** — approved future work not detected as implemented.
- **Not detected** — adequate evidence was not found.

## 2. Preserved initial baseline

At approval, the audit mapped 59 approved Figma families with the following dated parity baseline:

| Initial status | Families |
| --- | ---: |
| `PARITY` | 0 |
| `CLOSE_PARITY` | 11 |
| `PARTIAL` | 14 |
| `STALE` | 21 |
| `PLACEHOLDER` | 3 |
| `FRONTEND_MISSING` | 3 |
| `BLOCKED_BY_DATA` | 3 |
| `BLOCKED_BY_PRODUCT` | 4 |
| **Total** | **59** |

That table is a historical baseline, not the current frontend state. The detailed original matrix and planned package text remain available in git history at the approved audit commit `cc8241b`; they are not repeated as current instructions because their branch order, gaps and “next migration” statements were completed or superseded.

The audit also established two safety findings that remain current:

- `/self-check` is `P0_REDESIGN_REQUIRED`; answer-derived commercial recommendations are not approved.
- `/tools/budget-calculator` is `P0_REDESIGN_REQUIRED`; a calculated “Recommended” gambling amount and result-to-offer action are not approved.

Both routes remain launch-blocked under **FE-SAFETY-01** pending separate product, privacy, compliance and Figma approval. They were not silently deferred or declared safe by page migration.

## 3. Actual completed migration sequence

The sequence below is derived from merged first-parent history and the delivery commits. IDs are preserved exactly; they are not renumbered to make the history look linear.

| Package | Delivered surface | Merge / PR evidence | Closure note |
| --- | --- | --- | --- |
| FE-MIG-01 | Shared Public Shell | PR #15, `ceee4e7` | Server-owned public layout, responsive Header/Footer and account presentation. |
| FE-MIG-02 | Initial Home responsive parity | PR #16, `bef86bd` | Server-rendered ten-section body and bounded carousel island. |
| FE-MIG-03 | Initial `/10-steps` parity | PR #17, `d85146e` | Removed stale reward/market presentation and preserved server Programme truth. |
| FE-MIG-04 | Initial Casinos catalogue and filters | PR #18, `5090cec` | SSR catalogue, URL controls, fail-closed cards and governed internal actions. |
| FE-MIG-05 | Casino Profile | PR #21, `2b35822` | Published DTO presentation, responsive profile and separate editorial/commercial availability. |
| FE-MIG-06 | Casino Directory `/casinos` | PR #23, `328d209`; correction PR #24, `12c2d27` | Final approved directory family and theatre-media correction. |
| FE-MIG-07 | Bonuses `/bonuses` | PR #25, `8f79478`; contrast PR #28; mobile parity PR #30 | Published offer projection, URL controls, material terms and responsive family. |
| FE-MIG-08 | Best Offers `/best-offers` | PR #26, `3c47cf9`; visual parity PR #29; mobile parity PR #31 | Database-ranked shortlist, approved desktop/mobile composition and governed confirmation. |
| FE-MIG-09 | Comparison `/compare` | PR #32, merge `5e4a42f` | Dynamic SSR comparison, URL selection and explicit missing-evidence states. |
| FE-MIG-10 | `/10-steps` final migration | PR #33, merge `01c2a7d` | Final acquisition landing parity after the broader migration sequence. |
| FE-MIG-11 | Protected Help `/responsible-gambling/**` | PR #34, merge `b07fb74` | Dedicated non-commercial shell, Hub/articles and fail-closed support states. |
| FE-MIG-12 | Ranking Methodology `/methodology` | PR #35, merge `a56ffac` | Approved methodology family and current editorial explanation. |
| FE-MIG-13 | Affiliate Disclosure and About | PR #36, merge `8c41442` | Trust pages migrated; About later uses the approved `835:5298` family. |
| FE-MIG-14 | Learning Center, category/article routes and E05 | PR #37, merge `fa58d08` | Current `/learn` family, distinct templates and Search & Filter v1. |
| FE-MIG-15 | Bonus Guide `/bonus-guide` | PR #38, merge `d15543a` | Continuous regulatory-safe guide, evidence/source states and responsive parity. |
| FE-MIG-16 | Home final parity | PR #39, merge `110e8e6`; reviewed head `0035e22` | Final canonical Home composition, responsive behaviour and approved shell integration. |

FE-MIG-01–04 are included because they are directly evidenced by git and the approved audit record. Later packages revisited Home, `/10-steps` and `/casinos`; that is intentional migration history, not a numbering error. The second passes are preserved instead of retroactively renaming earlier work.

## 4. Final page-migration outcome

**Page-level frontend migrations: complete.**

The merged programme now covers:

- shared Public Shell;
- Home and `/10-steps`;
- Casino Directory, Casino Profile, Bonuses, Best Offers and Comparison;
- Protected Help;
- Ranking Methodology, Affiliate Disclosure and About;
- Learning Center hub, category routes, article routes and E05;
- Bonus Guide.

**Frontend & Design System Consolidation: not complete.** Page delivery created production patterns but did not complete tokens, component consolidation, duplicate CSS removal, full accessibility consolidation, maintained visual regression, Storybook decision, Figma production back-sync, legacy deprecation or Design System v1 governance.

## 5. Reconciled Figma decisions

The current [Figma Screen Inventory](Figma-Screen-Inventory-and-Delivery-Plan.md) owns the full route mapping. Key migration corrections are:

- Home retains canonical 1,440 source `289:946`; desktop `661:7551` and mobile `657:2545` supplement responsive intent.
- About now uses family `835:5298`, canonical desktop `835:5301` and mobile `835:5436`. Old About frames `646:4653` and `649:2405` are historical/superseded for the route.
- `/learn` now uses family `835:6356`, canonical desktop `835:6359` and mobile `835:6473`. Old catalogue frame `632:4240` is historical/superseded for the hub.
- Learning category and article templates remain distinct approved authorities; they were not collapsed into the `/learn` hub family.
- Bonus Guide remains governed by desktop `694:5455` and mobile `694:8724`.

Figma governs visual design, composition, responsive intent and visual states. Runtime/data/Founder Office decisions govern actual functionality, auth, production availability, evidence truth, compliance-sensitive copy and backend capability.

## 6. E05 decision

**Learning Search & Filter v1: APPROVED AND IMPLEMENTED.**

FE-MIG-14 implements client-side text search, Category, Tag and Difficulty filters, combined filters, result count, no-results, clear filters, browse categories and a full SSR/no-JavaScript catalogue fallback. No API, search backend or index was added.

The older Figma search/filter-blocked annotation is preserved only as historical context and is superseded as a current-state decision.

## 7. Intentional runtime/design boundaries

- Public Shell runtime auth/account state overrides illustrative Figma account and XP examples.
- Bonus Guide uses merged, current regulatory-safe content; stale illustrative `30×`/`x35` examples are not production authority.
- Current published records and server projections override illustrative casino/offer values.
- Missing, draft, archived, unpublished or ineligible data is not invented or exposed.
- Raw affiliate destinations remain outside public UI; internal routes revalidate current stored destinations.
- Protected Help remains outside casino, bonus, affiliate and commercial-recovery presentation.
- Programme, pause and Help signals remain prohibited inputs to affiliate ranking, advertising targeting and individual commercial personalisation.

## 8. Unresolved debt preserved at closure

- **FE-HANDOFF-01 remains unresolved.** Pre-handoff confirmation exists, but denied/failed `/r/[slug]` requests still return a plain text no-store response with no system-wide context-preserving recovery surface.
- Trusted live jurisdiction, age, licensing and commercial-eligibility authority is not detected. Figma fail-closed states and the shadow resolver do not create that authority.
- FE-SAFETY-01 remains launch-blocked for `/self-check` and `/tools/budget-calculator`.
- Privacy/Terms content/capability, password recovery and account-wide export/erasure remain incomplete.
- Mission 04 authenticated browser/release review and date-stable Programme regression fixtures remain open; Missions 05–10 are not implemented.
- Automated Programme expiry purge, distributed rate limiting and telemetry remain planned.
- FE-DS-01 still owns token/component/CSS consolidation, accessibility consolidation, visual regression, Storybook decision, Figma back-sync, legacy deprecation and Design System v1 governance.

These are not route-by-route frontend fixes authorized by DOC-REC-01.

## 9. Historical material treatment

The original audit totals, safety findings and rationale for bounded route packages are retained here. Stale branch instructions, “next migration” directions and pre-merge status claims were removed from the current document role.

Route-specific QA evidence under `docs/02_Product_Design/qa/` remains historical delivery evidence. RFC bodies remain decision history and were not rewritten to make them read as current dashboards. Superseded RFC-005 and RFC-006 remain preserved; RFC-007 remains current visual authority.

## 10. Handoff

DOC-REC-01 reconciles this record with merged runtime, current Figma authority and Founder Office decisions. It is complete when the documentation PR is merged.

The next authorized frontend workstream is **FE-DS-01 — Frontend & Design System Consolidation**. It must consolidate the production patterns created by these migrations without redesigning the completed pages or fabricating functionality from Figma.
