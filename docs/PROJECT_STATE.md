# Project State

## Snapshot

- **Reconciled:** 2026-08-08
- **Current main / COMM-01 merge:** `82e3985765285ae63e4d2620b843bc6086fb4185`
- **GB-MARKET-01 merge:** [PR #54](https://github.com/AlexG-7BE/sevenbet-next/pull/54) merged as `5fbb73b674a52327a01c31f59c3474a3b8a6b3fb`
- **COMM-01 merge:** [PR #55](https://github.com/AlexG-7BE/sevenbet-next/pull/55) merged as `82e3985765285ae63e4d2620b843bc6086fb4185`
- **UX-PERF-01 delivery:** implementation and local verification complete on `codex/ux-perf-01-performance-instant-discovery`; Founder-review pull request and Preview evidence are pending
- **Production URL:** <https://sevenbet-next.vercel.app> (deployment `dpl_CoVwh2Z9KsQsNBMWW3tobeqty2WW`, source `82e3985765285ae63e4d2620b843bc6086fb4185`, Ready; Production Smoke run `31268425111`, job `93130210903`, passed 2026-08-08)
- **Figma:** [SevenBet — `UvuJZEzeMAd8cK9TNAueb8`](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)
- **Strategy:** Product Vision & Principles v2.0 and RFC-007 Tilt-Locked Human Product Theatre

## Current phase

**Detected:** the public page-level frontend migration is complete through FE-GAP-02. The final audit has no known page-level P0 or P1 public-surface defect.

**Closed operations delivery:** **ENV-ISO-01 — Preview / Production Environment Isolation** merged through [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52). Exact-merge main CI passed, the ENV-ISO Production deployment is Ready, Production Smoke passed, and a real Production staff authentication E2E passed login, protected `/admin`, refresh/session persistence and normal logout. Production is healthy and the ENV-ISO configuration incident/workstream is closed.

**Detected on main:** Design System v1 consolidates the production UI inventory, semantic tokens, internal Action component, states, responsive evidence, accessibility, bounded visual regression, Figma production back-sync and governance.

**Detected from merged OPS-01 / PR #45:** ESLint, deterministic PR CI, isolated fresh-database verification, browser and build-secret gates, scheduled read-only Production smoke and operations runbooks are implemented without changing product behaviour or Production data.

**Detected in merged ENV-ISO-01 / PR #52:** Production and Preview use distinct Prisma Postgres resources and credentials, distinct Better Auth/admin secrets and separate provider environment scopes. Preview accepts only its exact Vercel branch host, all 17 migrations are applied, representative Preview data counts are zero, and a disposable Preview auth/session canary was absent from Production and deleted after proof. No Production data was copied. Post-merge Production authentication passed without broadening Production origin trust. Recovery capability remains **PARTIAL** because Prisma Free supplies no usable provider snapshot/PITR recovery point.

**GB-MARKET-01: MERGED — PR #54.** The GB technical market authority is implemented on main. GB commercial activation is **NOT ACTIVE** and GB referral is **NOT ACTIVE**.

**COMM-01: MERGED — PR #55.** Commercial partner authority machinery is on main. Real signed GB partner: **NO**. Real partner activation: **OFF**. LEGAL-02: **OPEN**. Commercial launch: **NOT READY**.

**Detected on the UX-PERF-01 branch:** [RFC-016](06_RFC/RFC-016-Production-Performance-and-Instant-Discovery.md) is approved and implemented. Casinos, Bonuses and Compare retain canonical server GET/query authority while a narrow progressive enhancer supplies 300 ms search/numeric debounce, immediate discrete changes, soft RSC navigation, URL/history truth, no-JavaScript fallback and accessible pending feedback. The measured casino theatre image uses responsive Next Image delivery; denied commercial contexts omit commercial relation reads and operator evaluation. No schema, migration, dependency, Production data, commercial-authority or cache-policy change was made. This is **READY FOR PREVIEW/FOUNDER REVIEW**, not merged or deployed to Production.

## Completed frontend

- Public Shell, Home and 10 Steps.
- Casino Directory, Casino Profile, Bonuses, Best Offers and Comparison.
- Protected Help shell, Hub, all ten governed articles, Cooling-off/Pause states and protected unknown-article recovery.
- Methodology, Affiliate Disclosure, About, Learning hub/category/article and Bonus Guide.
- Privacy, Terms, Self-Check, Personal Gambling Limit Tracker and Product/Trust FAQ.
- Confirmation-first commercial handoff with neutral managed recovery.
- Final FE-GAP-02 semantic fixes for Help, Best Offers, Bonuses, crawler copy and sitemap consistency.
- UX-PERF-01 progressive discovery and measured asset/query-path optimization are complete on the review branch; merge remains pending.

The exact merged work-package history is recorded in the [final migration audit](02_Product_Design/Frontend-Migration-Audit-and-P0-Implementation-Plan.md).

## Current product and backend state

- **Detected — Programme:** Missions 01–04 have server-owned validation, progress, deterministic rewards and Dashboard state. Mission 01 awards 60 XP; Mission 02 awards 80 XP and `First Plan`; Mission 03 awards 90 XP; Mission 04 awards 100 XP and `Boundary built`.
- **Planned — Programme:** Missions 05–10 have titles/navigation state only; no completion policy or task content is implemented.
- **Detected — casino data:** RFC-012 authorises exactly 25 deterministic fictional `demo-*` aggregates as a bounded temporary pre-launch exception. Normal regulated production policy does not permit synthetic operator data; cleanup/replacement is required before genuine regulated commercial operation.
- **Detected in merged GB-MARKET-01 and COMM-01 — commercial routing:** public commercial projection requires current jurisdiction, typed agreement with explicit `DIRECT_LINK` approval, structured operator/licence/exact-domain evidence, programme, offer, tracking-link, optional bonus and redirect authority. Content-only channels cannot authorize referral. `/r/[slug]` rechecks the full authority and fails to `/outbound/unavailable` without a substitute. `/go/[slug]` has no external authority and always uses the neutral unavailable flow. The affiliate engine remains off.
- **Detected — legal/tools:** Privacy and Terms are substantive launch-candidate pages, `noindex, follow`, and absent from the sitemap. Self-Check and the Limit Tracker are local React-memory tools with mandatory commercial isolation.
- **Not detected — account lifecycle:** account-wide export, account-wide erasure automation and complete password recovery.
- **Detected in merged GB-MARKET-01 — market authority:** one versioned repository policy supports GB online-casino editorial visibility while commercial and referral capabilities remain false. Trusted request location is Vercel Preview/Production country metadata only; user filters and routes cannot grant permission.
- **Detected in merged COMM-01 — partner authority:** a typed agreement contract, explicit `DIRECT_LINK` gate at active-offer save and request-time readiness, empty repository-controlled exact-domain evidence store, state-transition validation, current tracking/bonus gates and central evaluator extend the existing affiliate stack. GB provider import cannot auto-activate an offer or link. No schema, migration, real partner, agreement, destination or Production commercial mutation was added.
- **Detected on the UX-PERF-01 branch — discovery/query projection:** URL search parameters, server query parsers and Server Components remain authoritative. The client enhancer serializes form values only. After the server jurisdiction ceiling denies commercial capability, casino, offer and comparison repository projections omit affiliate relations and operator evaluation while preserving permitted editorial data.
- **Not verified — Production market/commercial data inventory:** no secure read-only Production database audit was performed. Network, programme, offer, link, redirect, casino, licence and agreement counts are not guessed. Effective commercially eligible GB operators are `0` under policy `gb-2026-08-08.1` because the jurisdiction commercial/referral ceiling is false and the real domain-evidence store is empty.

## Remaining release gates

### Product

- Approve and implement Missions 05–10 under separate Mission RFCs and the Programme Definition of Done.
- Complete authenticated Mission 04 browser/device and clinical-content review.
- Decide remaining account lifecycle and recovery experiences.

### Compliance / legal

- **LEGAL-02 OPEN:** external counsel review of Privacy, Terms, disclosures, market-specific copy, age/account launch decisions and significant-condition evidence.
- Processor/subprocessor verification and retention/transfer confirmation.
- Approve any later permissive GB policy change only after Legal and commercial evidence gates close.

### Backend / operations

- Approve a paid provider snapshot path or separately governed backup architecture, then complete a Preview-sourced isolated restore drill; recovery objectives are not yet guarantees.
- Approve a short-lived or provider-native Production migration mechanism. PR CI intentionally has no hosted credential.
- Distributed Programme rate limiting, anonymous-data expiry purge, telemetry and account-wide export/erasure.
- Connected multi-process concurrency evidence and autosave ordering decision.

### Data / partners

- Replace or remove the RFC-012 temporary fictional dataset before regulated commercial operation.
- COMM-01 authority machinery is merged. Founder Office must apply/contract with a real partner, then supply approved operator/domain/programme/offer/link evidence through the [onboarding runbook](06_Operations/GB-Partner-Onboarding-Runbook.md).
- No real signed partner, agreement, domain evidence, offer terms or destination is detected; no real partner is active.

### Design system

- No P0/P1 Design System release gate is detected in FE-DS-01. Remaining route-local extraction is P2/P3 and requires production evidence; Storybook and Code Connect are explicitly deferred in the [Design System v1 contract](02_Product_Design/Design-System-v1.md).

## Known non-blocking debt

- The safe Next.js 15.5.21 patch plus bounded PostCSS/Sharp overrides pass build/browser regression; `npm audit` reports zero known vulnerabilities.
- Hourly Production Smoke remains active; the manual post-COMM merge smoke passed. Broader APM/paging and authoritative Production RUM are not implemented.
- The Programme suite currently passes 36/43 tests; seven Mission 04 fixtures use fixed review dates outside the rolling 30-day validator window.
- Local/demo casino availability can drift from production data; locally linked demo profiles may return 404 even when production profiles resolve. This is classified as environment/data drift, not a demonstrated source-code failure.
- Route-local CSS remains broad by design. The recurring production palette, shared internal Action, cross-route visual baseline and code/Figma governance are consolidated in Design System v1.
- Five existing Best Offers browser fixtures expect a populated 12-card shortlist while the current fail-closed Production/local runtime truth is “no eligible offers.” UX-PERF-01 does not fabricate offers or alter commercial data to satisfy those fixtures.
