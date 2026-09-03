# RFC-039 — Language-Only Public Routing and Global Casino Catalog

## Status

`ACTIVE`. Approved for implementation and ordinary release by the explicit
Founder execution instruction `GEO-LANGUAGE-GLOBAL-CATALOG-01` on 3 September
2026.

Amended by the newer explicit Founder execution instruction
`CASINO-COMMERCIAL-VISIBILITY-03` on 3 September 2026. For the real Casino
scope, missing or `UNKNOWN` exact-market evidence is not a content or
commercial prohibition. Global editorial/catalog publication, offer
publication and outbound-action eligibility are separate decisions. A
governed route is eligible by default only when its exact release authority is
present and no detected legal, regulatory, contractual or account restriction
applies to the trusted request country.

This RFC supersedes only the conflicting public URL, user-control, request
resolution, SEO-alternate and unqualified public-casino query semantics in
RFC-037 and RFC-038. Their durable language/market separation, exact factual
market grain, evidence, publication, Programme/privacy firewall and cumulative
commercial-authority requirements remain active.

## Decision

Public presentation has two independent dimensions:

```text
language = explicit public language path or language-only preference
market   = trusted request-time country/jurisdiction signal
```

The public URL expresses language only. Market never appears in the canonical
public URL and cannot be granted by a path, query, cookie, `Accept-Language` or
client-supplied country value.

Canonical examples are `/en`, `/de`, `/es`, `/el`, `/sv` and `/da`, followed by
the unchanged localizable route suffix. BCP-47 remains useful for internal
catalog selection, `<html lang>` and content variants; it is not public market
authority.

## Resolution and preference contract

For an explicit language URL, the language path wins. For an unprefixed
localizable URL, a valid first-party language preference wins, followed by the
trusted market's default language, `Accept-Language`, then English. None of
those language inputs selects a market.

The public preference cookie is versioned and stores language only. Legacy
locale/market cookie values cannot grant country authority. The selector lists
only published languages, preserves the route suffix and safe query state, and
changes language only. A passive detected-region explanation may be shown, but
there is no public country/market control.

The Programme retains its separately governed route-owned presentation
compatibility. Admin, API, authentication/callback, MCP, affiliate redirect,
outbound, operative legal and other excluded route families remain outside the
public language rewrite.

## Legacy URL migration

Legacy BCP-47 and market-first paths are compatibility inputs only and
permanently redirect in one hop to the language path:

```text
/en-gb/casinos  -> /en/casinos
/de-de/casinos  -> /de/casinos
/es-es/casinos  -> /es/casinos
/es-pe/casinos  -> /es/casinos
/pe/casinos     -> /es/casinos
```

Safe query state survives. Any legacy `country` presentation parameter is
removed and never reaches market or commercial resolution. Explicit canonical
language paths remain stable across request countries.

## Global public casino catalog

`Casino` remains the global published identity. `CasinoCountry` remains the
exact factual Casino × market profile. The logical partner route remains the
exact Casino × market × programme/offer/tracking authority described by
RFC-038.

Public catalog reads combine:

```text
latest real published Casino identities
+ globally publishable editorial, catalog and offer content
+ only the exact current-market CasinoCountry profile, when present
+ one server-owned presentation disposition
+ governed partner routes independently projected for the trusted country
```

Demo, synthetic, test, unpublished, inactive, archived and deliberately
excluded identities never enter the global public catalog. Missing market data
remains distinct from explicit unavailability. No Casino × country Cartesian
data is created and no fact from another country is borrowed. Globally
observed facts remain labelled as such; they do not become exact-local facts.

## Presentation disposition

Every Casino × current market resolves server-side to exactly one disposition:

- `PROMOTABLE` — a real published global identity with a currently eligible,
  governed partner route and all independent legal/operator/commercial gates;
  an exact `CasinoCountry` profile is used when present but is not required
  merely to convert missing evidence into a prohibition;
- `INFORMATIONAL_ONLY` — the real global editorial/catalog record and only
  safely available exact-market facts, with no raw destination, tracking data
  or outbound action; globally published offer information may remain visible
  because publication is not route eligibility; or
- `HIDDEN` — public presentation is not authorised, evidence is contradicted,
  the state is prohibited, or the identity is synthetic/non-public.

An unavailable state is stated only when exact evidence says unavailable.
Unknown or missing evidence cannot be relabelled as unavailable. Promotional
ranking and CTA projection are separate: Best Offers and Bonuses may present a
real, globally published offer while the action is independently unavailable.
They never admit temporary demo identities or expose a raw destination.

The bounded neutral-information policy is maintained in
`docs/04_Compliance/Global-Casino-Market-Presentation-Policy.md`. It is public
presentation policy, not operator, advertising, partner or route authority.

## Exact-country commercial authority

Language, cookie and query values are never commercial inputs. Commercial
action uses the exact trusted request country. Under bounded
`CASINO-COMMERCIAL-VISIBILITY-03` authority, the six approved Superfly routes
may use global-default Production eligibility without an exact positive
`CasinoCountry` row only when the programme and tracking metadata carry the
matching Founder authority, canonical-route hash/evidence, the complete
detected block set and all active programme/offer/link, freshness, HTTPS,
jurisdiction, referral, redirect and final redirect-time checks pass. An exact
market state of `UNAVAILABLE`, `NOT_AVAILABLE` or `RESTRICTED` still denies the
action. `UNKNOWN` or a missing profile alone does not.

The detected Superfly block set for this release is `DK`, `ES`, `FI`, `NO`,
`CL`, `SE` and `GB`. Adding a country to, or removing one from, that evidence
set requires current authority and verified evidence; a public language path
cannot change it. Reusing one physical tracking URL across countries remains a
logical per-request-country decision even when the bounded global-default
authority is used.

Responsible Gambling and Help use the trusted market, not the selected
language, and remain isolated from affiliate targeting and personalisation.

## Data access and performance

The publication repository projects only the requested country profile from
the immutable JSON snapshot in PostgreSQL. Global identities without that
profile receive an empty market-profile array rather than every country's
facts. Discovery loads the publication set once and batches public context once
for the selected identities; it performs no per-Casino market query. Pagination
and market-neutral identity caching remain possible without materialising
Casino × country rows.

## Cache and privacy

Language-level pages that do not vary by market may remain publicly cacheable.
Market-sensitive public HTML is private/no-store; correctness does not depend
on a CDN-specific header cache key. Market-sensitive public APIs are likewise
private/no-store and vary on the trusted request-country header. Unprefixed
language negotiation additionally varies on `Accept-Language` and the
language-preference cookie. A future cacheable market projection must be keyed
by exact market and proven against Vercel's cache contract before activation.

The service consumes only the coarse country code already required for product
delivery. It stores no raw IP and persists no country in the presentation
cookie. Programme, Help, self-check, vulnerability and account data remain
prohibited market/commercial targeting inputs.

## SEO

Each language path is self-canonical. Canonicals, OpenGraph URLs, structured
data, internal navigation and sitemap entries use language-only paths and never
include request country. `hreflang` represents distinct published languages,
not duplicate regional URLs. Existing publication/indexability authority is
unchanged: English retains its current policy; every currently published
non-English language remains `noindex, follow` until separate Founder indexing
authority.

## Implementation evidence

**DETECTED on the isolated implementation candidate based on
`da36c3f85fd59c4e28efa9e279bb70e9f66608fb`:** the language registry, resolver,
versioned preference, middleware migration, metadata, public shell, global
catalog projection, three-state disposition, exact-country offer/comparison
paths, response cache policy and deterministic security/performance tests
implement this decision without a Prisma migration or Production data mutation.

**DETECTED in Production through application merge
`2507043cb945f2b920b73522763f51f36b3c246c`:** PRs #139 and #140 implement the
Founder-authorised real-Casino amendment. Production contains eight real
published Casino identities, six published offers and six governed Superfly
routes. The complete seven-country block set is stored on each route; the
read-only verifier returns 42 detected blocks, zero issues and zero raw
tracking URLs. Temporary RFC-012 demo identities remain database artifacts but
are excluded before public discovery, offer, comparison and profile
projection. No Prisma migration was introduced.
