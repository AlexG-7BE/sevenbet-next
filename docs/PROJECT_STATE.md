# Project State

## Snapshot

- **Reconciled:** 2026-08-08
- **Main baseline:** `2d151218b3e4f85f40fc3473b4b5c63dfaba57e3` (PR [#43](https://github.com/AlexG-7BE/sevenbet-next/pull/43))
- **Production URL:** <https://sevenbet-next.vercel.app> (HTTP 200 verified 2026-08-07)
- **Figma:** [SevenBet — `UvuJZEzeMAd8cK9TNAueb8`](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)
- **Strategy:** Product Vision & Principles v2.0 and RFC-007 Tilt-Locked Human Product Theatre

## Current phase

**Detected:** the public page-level frontend migration is complete through FE-GAP-02. The final audit has no known page-level P0 or P1 public-surface defect.

**Current frontend delivery:** **FE-DS-01 — Frontend & Design System Consolidation** is represented by the FE-DS-01 implementation pull request and its merge commit in Git history.

**Detected in the delivery:** Design System v1 consolidates the production UI inventory, semantic tokens, internal Action component, states, responsive evidence, accessibility, bounded visual regression, Figma production back-sync and governance. It does not reopen approved page-level design. SevenBet as a whole is not declared launch-ready or compliance-complete.

## Completed frontend

- Public Shell, Home and 10 Steps.
- Casino Directory, Casino Profile, Bonuses, Best Offers and Comparison.
- Protected Help shell, Hub, all ten governed articles, Cooling-off/Pause states and protected unknown-article recovery.
- Methodology, Affiliate Disclosure, About, Learning hub/category/article and Bonus Guide.
- Privacy, Terms, Self-Check, Personal Gambling Limit Tracker and Product/Trust FAQ.
- Confirmation-first commercial handoff with neutral managed recovery.
- Final FE-GAP-02 semantic fixes for Help, Best Offers, Bonuses, crawler copy and sitemap consistency.

The exact merged work-package history is recorded in the [final migration audit](02_Product_Design/Frontend-Migration-Audit-and-P0-Implementation-Plan.md).

## Current product and backend state

- **Detected — Programme:** Missions 01–04 have server-owned validation, progress, deterministic rewards and Dashboard state. Mission 01 awards 60 XP; Mission 02 awards 80 XP and `First Plan`; Mission 03 awards 90 XP; Mission 04 awards 100 XP and `Boundary built`.
- **Planned — Programme:** Missions 05–10 have titles/navigation state only; no completion policy or task content is implemented.
- **Detected — casino data:** RFC-012 authorises exactly 25 deterministic fictional `demo-*` aggregates as a bounded temporary pre-launch exception. Normal regulated production policy does not permit synthetic operator data; cleanup/replacement is required before genuine regulated commercial operation.
- **Detected — commercial routing:** confirmation UI hands off to managed `/r/[slug]`; resolution is server-authoritative and fails to `/outbound/unavailable` without substitute offers. `/go/[slug]` is legacy compatibility only. FE-HANDOFF-01 is closed.
- **Detected — legal/tools:** Privacy and Terms are substantive launch-candidate pages, `noindex, follow`, and absent from the sitemap. Self-Check and the Limit Tracker are local React-memory tools with mandatory commercial isolation.
- **Not detected — account lifecycle:** account-wide export, account-wide erasure automation and complete password recovery.
- **Not detected — market authority:** the jurisdiction resolver is shadow/deny-safe and its default policy store has no approved live dataset. GB launch intent is not live age or eligibility authority.

## Remaining release gates

### Product

- Approve and implement Missions 05–10 under separate Mission RFCs and the Programme Definition of Done.
- Complete authenticated Mission 04 browser/device and clinical-content review.
- Decide remaining account lifecycle and recovery experiences.

### Compliance / legal

- External counsel review of Privacy, Terms, disclosures and market-specific copy.
- Processor/subprocessor verification and retention/transfer confirmation.
- Approve live age, jurisdiction, licensing, support-resource and commercial-eligibility policy.

### Backend / operations

- CI/CD and production migration governance; monitoring, alerting, incident response, backup/restore and on-call evidence.
- Distributed Programme rate limiting, anonymous-data expiry purge, telemetry and account-wide export/erasure.
- Connected multi-process concurrency evidence and autosave ordering decision.

### Data / partners

- Replace or remove the RFC-012 temporary fictional dataset before regulated commercial operation.
- Approve real operator evidence, partner destinations, ownership, freshness and commercial activation.

### Design system

- No P0/P1 Design System release gate is detected in FE-DS-01. Remaining route-local extraction is P2/P3 and requires production evidence; Storybook and Code Connect are explicitly deferred in the [Design System v1 contract](02_Product_Design/Design-System-v1.md).

## Known non-blocking debt

- `npm run lint` still invokes unsupported `next lint` under Next 15.
- The Programme suite currently passes 36/43 tests; seven Mission 04 fixtures use fixed review dates outside the rolling 30-day validator window.
- Local/demo casino availability can drift from production data; locally linked demo profiles may return 404 even when production profiles resolve. This is classified as environment/data drift, not a demonstrated source-code failure.
- Route-local CSS remains broad by design. The recurring production palette, shared internal Action, cross-route visual baseline and code/Figma governance are consolidated in Design System v1.
