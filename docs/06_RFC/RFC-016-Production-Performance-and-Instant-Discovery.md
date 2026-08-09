# RFC-016 — Production Performance and Instant Discovery

## Status

Approved by Founder Office on 2026-08-08 through the UX-PERF-01 execution authorization.

## Decision

SevenBet will improve measured public-route performance and progressively enhance existing discovery GET forms so that JavaScript-capable browsers use Next.js soft navigation while URLs, Server Components and server-side services remain authoritative.

The approved interaction is:

`native control → GET form serialization → URL search-parameter update → Next soft navigation → server query parser → server-authoritative result projection`

Discrete filters and sort controls apply on change. Text or numeric inputs use an approximately 300 ms debounce and submit immediately on Enter. Filter refinements use history replacement where rapid edits would otherwise create noise; pagination and ordinary links retain meaningful push navigation. Every enhanced form remains a real HTML GET form with a visible submit action for no-JavaScript operation.

## Repository evidence at approval

- **Detected:** the active repository root is `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`; 792 tracked active paths were scanned, excluding dependencies, generated output, build artefacts and caches from source analysis.
- **Detected:** `/casinos`, `/bonuses`, `/best-offers` and `/compare` are request-sensitive dynamic routes.
- **Detected:** `/casinos`, `/bonuses` and `/compare` use server-rendered GET forms and canonical server query parsers; without a client enhancement their submissions perform document navigation.
- **Detected:** `/best-offers` has client-side editorial carousel/tab selectors but no URL-filtered discovery result set.
- **Detected:** casino, bonus and comparison results are projected by server services from published records and request jurisdiction authority. Public commercial actions are unavailable unless request-time jurisdiction, operator, agreement, offer, tracking and redirect gates all pass.
- **Detected:** GB policy `gb-2026-08-08.1` allows editorial access while commercial and referral capability remain off. `/r` rechecks current authority and `/go` has no independent external authority.
- **Detected:** Home and public discovery use approved Tilt-Locked layouts, existing Design System v1 tokens/components, Next font integration and Next Image.
- **Inferred:** a bounded form enhancer can remove full document reloads without duplicating query defaults, business filtering, market rules or public datasets in the client.
- **Not detected:** an approved Production RUM/APM product, authoritative compute-to-database region evidence, or a need for a schema/index change for the primary interaction solution.

## Performance method

UX-PERF-01 measures before implementation and retains only changes that materially improve comparable results, implement this approved interaction without meaningful regression, or correct an exposed correctness/accessibility issue.

Evidence may combine:

- repeated mobile and desktop browser runs against Production, final Preview and a controlled local production build;
- browser Performance APIs and resource timing;
- production build output and emitted-route assets;
- safe Vercel deployment/runtime evidence;
- repository and query-shape inspection.

External network timings are reported with environment and run conditions. Flaky absolute performance thresholds do not become required CI.

## Authority and cache boundaries

The following remain request-time server authority and must not be positively shared across requests:

- trusted request country and jurisdiction policy resolution;
- operator/licence/domain evidence;
- partner agreement, offer, tracking-link and bonus readiness;
- affiliate kill switch and redirect-time eligibility.

User-selected country remains an editorial comparison preference and never establishes physical location or commercial/referral permission. Client code may serialize form controls only. It must not import Prisma, jurisdiction authority, commercial readiness, Programme/private data, partner evidence or destinations.

All request-dependent public discovery routes remain dynamic unless separate measurement and proof establish a safe split. `/r` retains its current request-time recheck. `/go` remains externally disabled. No Redis, cache vendor, new API endpoint or full client dataset is approved.

## Interaction and accessibility contract

- URL search parameters remain the only committed discovery state.
- Server parsers remain canonical for defaults, invalid values, supported values and normalization.
- Filtering and sort reset pagination; pagination preserves current filters.
- Soft filter navigation should avoid page-top jumps and leave existing results visible with a subtle, truthful pending treatment.
- Back/forward and copied/reloaded URLs must restore the canonical controls and results.
- Native labels, fieldsets, legends, selects, inputs, links and buttons remain intact.
- Result status updates use a bounded polite live region where useful; navigation must not steal focus.
- Reduced-motion and current Design System focus contracts remain in force.
- No-JavaScript form submission and result rendering are release requirements, not optional fallbacks.

## Design decision

This is an interaction and delivery optimization, not a redesign. RFC-007 and Design System v1 remain the reference lock. Existing typography, spacing, colour roles, cards, buttons, filter geometry and route composition are preserved. No Figma change, token change, shared visual primitive or Design System project is approved.

## Data and dependency decision

UX-PERF-01 does not approve:

- a Prisma schema or migration change;
- Production data mutation, seed or synthetic-data expansion;
- dependency additions or upgrades;
- compute-region migration;
- paid monitoring, caching or database infrastructure.

If measurement proves an index or schema change is necessary for a later improvement, the delivery records a data-layer proposal only and leaves the implementation for a separate approved decision.

## Verification

Release evidence must cover:

- comparable before/after performance for Home, Casinos, Bonuses, Best Offers and Compare where technically available;
- no full document navigation for enhanced controls with JavaScript;
- normal GET navigation with JavaScript disabled;
- search/numeric debounce, immediate Enter, pagination reset and final-state race behavior;
- URL, reload and browser back/forward synchronization;
- keyboard, focus, labels, live status and mobile behavior;
- unchanged result semantics for deterministic query fixtures;
- GB market, COMM, redirect, structural, build, secret and visual regressions;
- exact-head Preview readiness, Preview runtime health and an unchanged healthy Production baseline.

## Rollout and rollback

Delivery follows RFC-013: one feature branch, one pull request, required exact-head checks, configured Preview alias, Founder review and no implementing-agent merge.

Rollback is a reviewed application revert. The native GET forms remain the semantic fallback, so disabling or reverting the client enhancer restores document navigation without changing server filtering or authority. No database rollback is involved.
