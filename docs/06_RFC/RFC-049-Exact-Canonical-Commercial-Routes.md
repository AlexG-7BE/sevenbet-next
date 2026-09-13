# RFC-049 — Exact Canonical Commercial Routes

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 13 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE
Commercial Core Simplification — PR3: Exact Routes + GEO Simplification`.

## Decision

Every public commercial decision normalizes one trusted GEO into one canonical
commercial market key and performs one exact `MarketActivation` lookup for that
key. Route existence and the route's exact bindings are the GEO authority.
Route health, destination safety, jurisdiction policy and the additional GB
operator evidence controls remain independent fail-closed safety gates.

The decision path is:

```text
trusted GEO
    -> canonicalCommercialMarketKey
    -> one exact MarketActivation lookup
    -> binding, health, destination and legal safety
    -> GovernedCommercialAction | null
```

There is no post-normalization exact-to-parent or `ZZ` precedence engine.
`AffiliateOfferCountry`, `AffiliateTrackingLinkCountry`, `geoMode` and
`productionEligible` cannot grant or veto a public action or controlled
redirect.

**Presentation GEO and commercial route scope are related but not identical
concepts. Trusted GEO is normalized once into a canonical commercial market
key; route resolution then performs one exact lookup.**

## Pre-implementation authority audit

The repository-wide PR3 audit classified the current decision graph as
follows. The category letters are: A commercial authority; B route safety; C
factual evidence; D editorial data; E compatibility-only; F diagnostics; G
historical/dead code.

| Surface | Detected pre-PR3 role | Class | PR3 disposition |
| --- | --- | --- | --- |
| `MarketActivation(casinoId, marketCode, product)` | Founder-enabled route intent, exact bindings and route-health result | A/B | Sole persisted commercial GEO authority; exact lookup only. |
| `MarketActivation.marketProfile` / `CasinoCountry` | Factual/editorial country profile, local domain and evidence | C/D, with an old A veto | Retained as factual evidence. A contradictory or explicitly unavailable profile remains a safety blocker when present; profile absence is not route permission. |
| `MarketActivation.globalFallbackBlockedCountries` and `ZZ` | Implicit global authority plus deny list | A/E | Removed from new runtime and writes. Historical disabled rows/fields remain for rollback inspection; readiness rejects active legacy fallback. |
| parent-country lookup after subdivision miss | Implicit route precedence | A | Removed. Country collapse happens once in canonicalization. AR and CA remain exact-subdivision jurisdictions. |
| `AffiliateOfferCountry.mode` | Provider/import scope and duplicate CTA permission | A/C/E | Retained as non-authoritative provider/import metadata pending PR6; removed from canonical reads and writes. |
| `AffiliateTrackingLinkCountry.mode` | Provider/import scope and duplicate redirect permission | A/C/E | Retained as non-authoritative provider/import metadata pending PR6; removed from canonical reads and writes. |
| `AffiliateOffer.geoMode` / `AffiliateTrackingLink.geoMode` | Raw provider scope plus duplicate permission state machine | A/C/E | Retained only as non-authoritative provider/import compatibility metadata pending PR4/PR6. |
| `AffiliateTrackingLinkCountry.productionEligible` | Legacy route projection and duplicate commercial permission | A/E | Retained only for historical rollback compatibility; no canonical reader or writer depends on it. Cleanup is PR6. |
| `AffiliateProgram.supportedCountries` | Raw partner/import scope and an old GB market predicate | A/C/E | Retained as non-authoritative provider evidence; exact route scope replaces its public GEO predicate. |
| Affiliate Program/Offer/Tracking lifecycle fields | Transitional entity lifecycle and GB contract evidence | B/E | Narrowly retained for PR4. They do not replace the exact route decision. |
| redirect slug, offer, tracking and bonus foreign-key bindings | Identity and controlled redirect integrity | B | Retained and checked against the exact route. |
| route verification status/time/final host | Technical route health | B | Retained; only current `HEALTHY` routes are actionable. |
| jurisdiction resolver and exact AR/CA evidence | Legal and trusted-location constraints | B/C | Retained outside Affiliate lifecycle. |
| GB licence, operator, domain, agreement, bonus and tracking evidence | GB-specific legal/technical safeguards | B/C | Retained; only duplicate Offer/Tracking country ALLOW checks are removed. |
| `PartnerCasinoRelationship` | Canonical Partner x Casino business fact | C | Retained; neither grants nor vetoes a route. |
| `PartnerCasinoMarketSupport` | Partner-market evidence | C | Retained as non-authoritative evidence; never used for public lookup or fallback materialization. |
| public presentation market and `CasinoCountry` projection | Page/editorial localization | D | Retained and kept separate from commercial authority. |
| CRM opportunities/stages | Contacts, evidence, workflow and history | C/D | Retained with zero route, GEO, CTA or redirect authority. |
| Commercial MCP | Authenticated transport wrapper | E | Retained through PR5; delegates to the same application service and has no business authority. |
| media revision and MEDIA-GEO3 route checks | Historical media release safeguards | B/G | Media may require an exact commercial route but cannot authorize or veto the route. Historical fallback reads are removed. |
| `market-activation-v2`, old rollout and catalog scripts | One-time historical reconciliation/release tooling | G | Not a deploy-time authority. New writes cannot create `ZZ`; current release commands remain explicit and never run in generic build. |
| GoldenPlay one-shot remediation endpoints | Bounded historical Production remediation | G | Retained as historical code only; any controller call is subject to the same exact-key and binding rules. |
| route diagnostics | Operator visibility into activation and legacy drift | F | Reports canonical route/health state; `LEGACY_PRODUCTION_ELIGIBILITY_DRIFT` is removed. |

## Legacy-mechanism evaluation

| Mechanism | Real business meaning | Canonical representation | Live dependency after PR3 | Behavior on removal from authority | Current-route equivalence |
| --- | --- | --- | --- | --- | --- |
| Parent fallback | Country-wide scope when a request contains a region | The canonicalizer maps country-scoped GEOs such as `US-VA` to `US` | None | One exact `US` query replaces `US-VA`, then `US` | Equivalent for country-scoped jurisdictions; unsafe AR/CA inheritance is impossible. |
| `ZZ` | An old evidenced default route except a deny list | Explicit exact routes derived only by a separately governed, evidenced operation | No new runtime/write dependency | Active `ZZ` becomes a readiness blocker, never silent authority | Existing current-partner rollout already records exact replacements and disabled historical `ZZ`; unknown active rows are not guessed. |
| OfferCountry | Raw/imported offer scope and old CTA ALLOW/BLOCK | Exact `MarketActivation` plus source references | Admin/provider previews may display the metadata | Missing/BLOCK rows neither create nor revoke action | Current exact routes remain available from their canonical route. |
| TrackingCountry | Raw/imported link scope and old redirect ALLOW/BLOCK | Exact route's `primaryTrackingLinkId` binding | Admin/provider previews may display the metadata | Missing/BLOCK rows neither create nor revoke redirect | Current exact bindings preserve the same controlled destination. |
| `geoMode` | Provider GLOBAL/ALLOW/BLOCK representation | Provider metadata plus explicit exact route authority | Legacy admin/import code until PR4/PR6 | Mode cannot become site permission | No supported exact route changes solely because the raw mode differs. |
| `productionEligible` | Compatibility projection of older eligible-link state | `MarketActivation.status`, desired state and route verification | Historical rollback/old migrations only | Boolean drift cannot grant or deny a route | Existing active healthy routes remain authoritative; orphan booleans remain inert. |
| Program supported countries | Raw provider/partner market metadata | Exact `MarketActivation` plus separately reviewed partner evidence | Provider/import and admin evidence | Missing/stale metadata cannot veto an exact route | Legal and GB agreement/operator safeguards remain independent. |
| Market-profile requirement | Factual market/domain/evidence record | Optional `CasinoCountry` relation plus independent jurisdiction safety | Editorial projection and evidence tooling | Absence no longer duplicates route permission; present contradiction still blocks writes | Existing profiled routes are unchanged; explicit evidenced routes no longer require fabricated editorial rows. |

## Canonical market rules

Canonicalization accepts only a trusted signal or an authenticated explicit
commercial command. Case is uppercased and `_` is normalized to `-` before
validation. The country prefix must be an assigned ISO 3166-1 alpha-2 code and
must match the trusted country.

- Country-scoped jurisdictions resolve to their two-letter country key. A
  valid `US-VA` signal therefore resolves to `US` before database access.
- Argentina and Canada are subdivision-scoped. Only a recognized current
  `AR-*` or `CA-*` key is canonical. Country-only, unknown-subdivision and
  malformed input fails closed.
- `ZZ`, mismatched country/market pairs, untrusted input and malformed input
  have no canonical key. Invalid input is never broadened to its prefix.

The central policy is used by public CTA resolution, `/r/...`, activation
writes, Partner tracking registration and exact-route readiness checks.

## Exact route and binding rule

For product `CASINO`, at most one route may exist for `casinoId + canonical
marketCode`. Existing database uniqueness remains the primary guard. Runtime
also rejects an unexpected multi-row result rather than selecting by recency.
An active result must have coherent Casino, Offer, TrackingLink, RedirectSlug
and optional Bonus bindings, a safe public slug, credential-free HTTPS
destinations, `desiredState=ACTIVE`, `status=ACTIVE`, and current healthy route
verification.

An optional `CasinoCountry` record remains evidence. It is not required to
create authority, but a present profile with a runtime-critical contradiction
or an explicit `RESTRICTED`/`NOT_AVAILABLE` state blocks activation.

## `ZZ` disposition and materialization

New active `ZZ` routes are rejected by the application contract and database
guard. The new runtime never reads `ZZ`. Historical rows and the blocked-list
column remain inspectable for rollback and audit.

Exact-route materialization is a separate `plan`, `apply`, `verify` operation.
Its plan is deterministic and bounded by an explicit evidence manifest. It
must compare source bindings, detect existing-key conflicts, show before/after
semantic projections and counts, and abort without mutation when any target is
ambiguous or unproven. It never expands from ISO inventory, CRM stage,
`PartnerCasinoMarketSupport`, OfferCountry, TrackingCountry or
`productionEligible` alone. With no active legacy fallback the operation is an
idempotent no-op. An active `ZZ` without an approved explicit target manifest
produces `LEGACY_ZZ_ROUTE_REQUIRES_MATERIALIZATION` and
`UNPROVEN_ROUTE_MATERIALIZATION`.

The read-only plan also proves the bounded deployment interval in which the
pre-PR3 binary remains live after materialization. For every proposed or
already-existing exact target it evaluates that binary's actual requirements:
matching market profile, Offer/Tracking country ALLOW metadata, coherent
Offer/Tracking/Redirect/Bonus bindings and destination safety. Any missing or
incompatible prerequisite produces `PREVIOUS_RUNTIME_CUTOVER_UNSAFE` and
`cutoverSafe=false`. The plan never creates or repairs compatibility data;
missing compatibility blocks the release. This is a release check, not a
second resolver or durable compatibility authority.

The governed current-partner rollout already replaced the six known Superfly
fallbacks with explicit IE and MT routes and disabled their `ZZ` rows. That
historical operation is evidence about current canonical state, not authority
to infer any further markets. Production state must be confirmed by the
read-only plan before release.

## Public action, redirect and legal boundary

RFC-047 remains the single `GovernedCommercialAction | null` seam. Missing,
ambiguous, unhealthy, unsafe or wrongly bound routes return `null`; Casino,
Bonus and directory editorial content remains visible. Ranking and media never
authorize a route.

CTA and redirect use the same canonical market key and exact lookup. The
redirect keeps its safe HTTPS validation, controlled slug, attribution,
analytics and jurisdiction checks. GB keeps its operator, domain, licence,
agreement, bonus, lifecycle and tracking-evidence safeguards; the duplicate
Program/Offer/Tracking country predicates are removed because the exact GB
route is the GEO decision.

## CRM, MCP and media boundaries

CRM remains a non-authoritative evidence and workflow system. Route resolution
does not read CommercialOpportunity and is unchanged if CRM is unavailable.
Commercial MCP remains transport-only until PR5. Media may consume the fact
that an exact healthy route exists before publishing promotional media, but
media state cannot create, block or select a commercial action.

## Schema and compatibility

Migration `0040_commercial_core_exact_routes_geo_simplification` removes the
old active-route requirement for a `CasinoCountry` foreign key and adds a
narrow scope-change guard. It rejects every new `ZZ` row, every non-`ZZ` to
`ZZ` scope change, and creation/change/activation into an invalid canonical
active scope. It deliberately does not use a row-wide `NOT VALID` CHECK:
PostgreSQL would enforce that CHECK on later updates to historical rows. An
unchanged pre-existing `ZZ` or non-canonical legacy row may therefore receive
ordinary health, status, timestamp, version and diagnostic maintenance from
the previous binary during cutover. The migration performs no business-data
materialization or backfill. Existing exact uniqueness constraints remain.

Offer/Tracking country tables, `geoMode`, `productionEligible` and historical
fallback fields remain in the schema for rollback, provider/import evidence
and the bounded PR4/PR6 cleanup sequence. They are deliberately not renamed in
this compatibility PR because an application rollback must still work against
the expanded schema. Their non-authority is enforced by canonical code and
tests.

## Release and readiness

The Production order is strictly:

1. establish a recoverable backup and live old-binary baseline;
2. apply schema migration `0040`;
3. verify the old Production application remains healthy;
4. run exact-route materialization `plan`;
5. require `plan.cutoverSafe=true`;
6. obtain Founder authority for that exact reviewed plan;
7. run `apply` only if the plan requires it;
8. immediately verify preserved CTA and controlled redirects through the old
   Production application;
9. run read-only exact-route `verify`;
10. merge PR3;
11. allow the canonical Production deployment; and
12. perform the post-deploy smoke.

Loss of any preserved route at step 8 is a mandatory stop. Merge/deployment
cannot proceed while old-binary compatibility is broken.

Generic Vercel build and Production verification are read-only for business
data. Readiness fails with machine-readable blockers for active `ZZ`,
non-canonical active scope, duplicate canonical route or binding ambiguity. It
does not repair them.

Application rollback is possible while the retained legacy schema remains.
Business-data materialization must have its own recorded before-state and
recovery plan; application rollback must not silently re-enable disabled
fallbacks. Schema rollback is forward-fix only after Production migration and
requires separate authority.

## Supersession

This RFC supersedes RFC-042 and RFC-045 only where they define runtime
exact/parent/`ZZ` precedence, Offer/Tracking country compatibility projection,
or `productionEligible` as route permission. Their persisted intent, audit,
health, legal and exact-subdivision evidence boundaries remain active. It
amends RFC-038 so `CasinoCountry` is factual evidence rather than a required
commercial-route record. RFC-047 and RFC-048 remain the public-action and
CRM-independent write boundaries.

## Deferred work

- PR4 — Affiliate Lifecycle Collapse decides the remaining Network, Program,
  Offer and Tracking lifecycle model.
- PR5 — MCP Extraction & Retirement removes the Commercial MCP transport.
- PR6 — Legacy Cleanup removes proven-unused country tables, `geoMode`,
  `productionEligible`, fallback columns, old scripts and compatibility types
  after the rollback window closes.
