# RFC-044 — Logo-Only Media Retirement and Locale/Market Separation

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 10 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE —
PRODUCTION MULTI-MARKET REFORM + MEDIA-GEO3 RETIREMENT + FULL LOCALE
REACTIVATION`, reaffirmed through the finalisation and Production-release
instructions of 10 September 2026.

**Supersedes:** RFC-040, RFC-041 and RFC-043 as active Product and Production
authority. Their schemas, migrations, parsers and release records remain
historical evidence. This RFC also supersedes only the Media Operations MCP
amendment of RFC-027; RFC-027 remains active for its other bounded agent and
Commercial Operations authority.

## Decision

B4GAMBLE is a logo-only operator product. A Casino or operator may be
represented graphically by its own canonical logo. Promotional operator or
partner banners, creative sets, assignment-driven artwork, hosted frames and
offer creatives are not public Product content and have no commercial,
publication, route, readiness or activation authority.

B4GAMBLE-owned editorial and Product imagery remains permitted. It must be
distinguishable from operator promotional inventory. Repository-owned page
art remains ordinary first-party Product content. The Casino media manager
keeps canonical `LOGO` records; the narrowly retained `SOCIAL_IMAGE` editor is
limited to authenticated, explicitly `b4gambleOwned` editorial records and
cannot bind to an offer, bonus, market or placement.

Language presentation and commercial jurisdiction are independent dimensions.
A route or language preference selects copy only. Trusted request GEO remains
the only source of request-market context and never changes when a user changes
language.

## Product and public-rendering contract

Public Casino, Casino review, comparison, Best Offers and Bonuses projections:

1. expose a canonical direct operator logo where one exists;
2. do not expose `MediaAssignment`, `MediaCreativeSet`, `MediaRevision` or
   `PartnerHostedCreative` promotional output;
3. do not wrap creative artwork in commercial links;
4. keep governed CTA availability independent from media availability; and
5. use a B4GAMBLE composition or intentional identity fallback when a logo is
   absent, without an empty banner frame or broken image placeholder.

First-party directory, Home, Programme, Learn and editorial art is outside the
retired promotional authority and remains valid. Large explicitly editorial
brand art may remain inert; a promotional presentation family cannot be made
public by changing its clickability.

## Commercial authority

`MarketActivation` remains the canonical Casino × GEO × Product activation
authority established by RFC-042. A valid canonical affiliate route and all
applicable jurisdiction, legal, operator, contract, URL-integrity and route
safety controls remain required.

Media is not an activation input. Creative availability, media freshness,
assignment counts, creative fingerprints, hosted-provider health and media
preflight results cannot activate, block, rank or redirect an offer. `/r/{slug}`
uses only the canonical activation and route destination; creative IDs and
creative destination overrides are not accepted.

## MEDIA-GEO3 retirement boundary

The following are retired from active application runtime:

- promotional assignment mutation and publication;
- creative recommendation/apply/publish and MEDIA-GEO3 orchestration;
- partner-hosted public frames and previews;
- Media Operations ingestion/analyse/apply endpoints;
- the Media MCP resource, OAuth registration and resource discovery;
- media readiness planners in the Production build; and
- promotional-media contribution to reconciliation, fingerprints, route
  health, commercial eligibility or `MarketActivation`.

Retired HTTP surfaces return cache-proof `410 MEDIA_OPERATIONS_RETIRED`.
Historical parsers, read models, migration verification, fixtures and unit
tests may remain when they are unregistered, unreachable and unable to affect
Production.

The Production build is read-only with respect to media. It verifies exact
migration history, the canonical MarketActivation schema and Migration 0034
retirement invariants. It does not invoke legacy media planners or writers.

## Migration 0034

`0034_logo_only_media_retirement` is DB-first and non-destructive:

- all six assignment families become inactive;
- partner-hosted creatives become inactive and archived;
- prepared/active creative variants become inactive;
- creative sets become archived;
- prepared/active media revisions become rolled back with retirement evidence;
- check constraints reject later reactivation by an old writer; and
- table comments identify retained historical authority as inert.

The migration does not delete a historical GEO3, assignment, creative,
preflight, revision or `MediaAsset` row. It does not update `MediaAsset`.
Canonical logos and first-party editorial assets therefore survive unchanged.

Post-migration acceptance must prove retained row counts, zero active legacy
authority, usable logos, untouched first-party assets, deterministic real
constraint names and database rejection of every retired writer state.

## Recovery and rollback

Migration 0034 is an authority-removal migration, not a data-loss migration.
Normal recovery is application rollback to another logo-only-compatible build
or restore-to-new-target under RFC-024. Re-enabling promotional authority by
dropping retirement constraints or changing historical rows is not a rollback;
it requires a new explicit Founder decision and a new forward migration.

An older build that attempts a retired write must fail closed at the database.
No deployment or recovery process may recreate assignments, hosted creatives,
active creative sets/variants or active/prepared revisions.

## Canonical locale authority

`lib/market/registry.ts` owns the one canonical published-language inventory
through `PUBLISHED_LANGUAGE_ROUTE_PROFILES`. Home navigation, public language
selection, Programme routes, Programme locale selection, hreflang generation
and localized routing derive from that registry rather than maintaining local
lists.

The Production-ready inventory approved by this decision is:

| Public route | Locale |
| --- | --- |
| `en` | `en-GB` |
| `de` | `de-DE` |
| `es` | `es-ES` |
| `el` | `el-GR` |
| `sv` | `sv-SE` |
| `da` | `da-DK` |
| `it` | `it-IT` |
| `pt` | `pt-PT` |
| `nl` | `nl-NL` |
| `fi` | `fi-FI` |
| `nb` | `nb-NO` |

The existing French catalogue remains retained but unpublished because it is
not in the canonical Production-ready set. Legacy language/locale aliases
normalize to canonical routes without becoming market authority.

## Locale is not market

Presentation resolution has two outputs:

- language/locale, selected by explicit language route, language-only user
  preference, `Accept-Language`, trusted-GEO default or English default; and
- market, selected only from trusted request GEO or `UNKNOWN`.

The language preference cookie stores language only. Language switching must
preserve the current pathname/query semantics and must not write a country,
change trusted GEO, create commercial eligibility or reset Programme identity,
enrolment, progress, XP, pause or Mission state.

Publishing a translation does not publish a commercial market. Market profile
publication, `MarketActivation` and route eligibility remain independently
governed.

## Required verification

Release acceptance includes:

- locale registry parity across Home and Programme;
- localized route, alias, sitemap and hreflang checks;
- language persistence with unchanged trusted GEO and Programme state;
- public render checks proving no promotional operator artwork or empty frames;
- CTA and representative restricted-market checks;
- PostgreSQL Migration 0034 replay and post-retirement writer rejection;
- active endpoint/job/build-registration scans; and
- Production desktop/mobile smoke, log review and exact-SHA verification.

