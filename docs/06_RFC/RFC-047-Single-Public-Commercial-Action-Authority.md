# RFC-047 — Single Public Commercial Action Authority

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 13 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE
Commercial Core Simplification — PR1`.

## Decision

The public application boundary has one final commercial-action contract for
one published Casino in one trusted market:

```ts
type GovernedCommercialAction = Readonly<{
  href: `/r/${string}`;
}>;

action: GovernedCommercialAction | null;
```

One server-side application resolver decides that value. Public Casino,
discovery, offer and comparison services consume the resolver result. Ranking,
presentation adapters, pages and components may format, order or defensively
validate the result, but cannot independently grant or revoke commercial
permission.

An internal bounded diagnostic reason may accompany the decision for tests and
operations. It is not a public status machine and is not another authority.

## Relationship to existing authority

This RFC supersedes RFC-042, RFC-044, RFC-045 and RFC-046 only where their
wording describes `MarketActivation` as the complete final public application
decision. For this bounded PR1 transition, `MarketActivation` remains the
canonical persisted activation-intent and route-safety source. It continues to
own exact-market/fallback precedence, active bindings, route health, relational
integrity and safe destination checks, and `/r/{slug}` continues to revalidate
before releasing a destination.

The public resolver is not stacked as another B4GAMBLE permission engine. It
consolidates the public decision that was previously repeated by public
services and combines the bounded route result with the necessary application
and external constraints exactly once:

1. real published public Casino identity;
2. trusted current country and exact market;
3. current jurisdiction and referral authority;
4. the redirect kill switch;
5. one active, healthy and safely bound route from the transitional
   `MarketActivation` source;
6. the existing GB operator/evidence chain where the country is GB; and
7. a safe server-owned redirect slug projected only as `/r/{slug}`.

Any absent, mismatched, ambiguous, unhealthy, unsafe or unavailable condition
fails closed to `action = null`. One market's result is keyed and evaluated
independently and cannot disable another market.

RFC-038 and RFC-039 remain authoritative for the separation of global Casino
identity, exact-market factual profiles and trusted request market. A
`CasinoCountry` availability fact can inform truthful editorial presentation
but is not a second CTA veto after the canonical action decision. RFC-014,
RFC-015, RFC-017 and RFC-036 remain authoritative for the applicable GB and
external legal safeguards. RFC-044 remains authoritative for media retirement:
media cannot grant, block or rank an action. RFC-046 analytics remains a
best-effort observer after redirect authority and cannot alter the result.

## Public read models and consumers

Public Casino, Casino-card, Offer and Comparison read models carry one nullable
`action`. Redundant permission signals such as `commercialAvailability`,
`action.available`, `visitAction.available`, public `redirectSlug` and
`PROMOTABLE` are removed from those contracts.

Published Casino research remains visible when action is null. Demo and local
visual fixtures remain explicitly classified and non-actionable. Exact-market
profiles continue to supply language, currency, licence, payment, support and
other factual presentation without becoming route authority.

Best Offers ranking first admits only records already carrying a canonical
action, then applies the established editorial and offer-quality ordering. A
market-level `SUPPORTED_COMMERCIAL | EDITORIAL_ONLY` summary may continue to
control navigation and direct-product framing, but derives from canonical
action presence and cannot veto a specific record action.

## Removed shadow authority

Public services no longer independently combine redirect enablement,
jurisdiction/referral booleans, GB operator evidence, legacy AffiliateOffer or
TrackingLink projections, public dispositions and route fallbacks. Editorial
repositories do not load route or affiliate lifecycle state. Presentation and
ranking do not inspect factual market availability to retake permission.

The resolver has no Commercial CRM opportunity-stage, Commercial MCP, Media,
Programme, protected Help, pause, self-check or customer-data dependency.

## Transitional compatibility

PR1 deliberately retains:

- the existing `MarketActivation`, AffiliateProgram, AffiliateOffer,
  AffiliateTrackingLink and AffiliateRedirect persistence used below the
  bounded route source;
- exact/parent/`ZZ` route selection already governed by RFC-042 and RFC-045;
- legacy internal redirect analytics dimensions.

None of those compatibility mechanisms can independently create a public CTA.

## Deferred simplification

Later Commercial Core work may, under separate review and migration authority:

- decouple remaining Commercial CRM write-path prerequisites;
- retire Commercial MCP orchestration after required writes have replacements;
- replace transitional Affiliate/MarketActivation persistence with a smaller
  exact-route model;
- decide whether parent and `ZZ` fallback behavior can be safely removed; and
- remove obsolete analytics dimensions.

This RFC does not authorize any of that work.

## Migration, release and recovery

PR1 has no Prisma migration, database mutation, configuration change,
commercial activation or Production execution. The change is code, tests and
documentation on a feature branch. Normal rollback is an application revert;
existing route, partner and analytics data remains unchanged.

Implementation acceptance requires type, lint, structural, legal/GB,
MarketActivation, public-service, ranking, localization, media-independence,
redirect-safety and focused browser regression coverage plus a production
build. Merge and deployment remain separate actions.
