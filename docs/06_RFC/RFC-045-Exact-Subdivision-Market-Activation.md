# RFC-045 — Exact Subdivision Market Activation

**Lifecycle:** `ACTIVE`

**Decision owner:** B4GAMBLE Founder

**Decision date:** 10 September 2026

**Implementation authority:** explicit Founder instruction `B4GAMBLE — FOUNDER
GLOBAL MARKET AUTHORITY OVERRIDE FOR THE CURRENT 14 CASINOS`.

## Decision

RFC-042 remains the sole Production commercial authority, extended with an
exact `marketCode`. `countryCode` remains the parent ISO 3166-1 alpha-2
jurisdiction used for legal and factual `CasinoCountry` authority. `marketCode`
is either that country code or an exact ISO 3166-2-style subdivision such as
`AR-C` or `CA-ON`.

The canonical uniqueness and runtime lookup grain is now
`Casino × marketCode × Product`. Existing rows are additively backfilled with
`marketCode = countryCode`; no existing route is rewritten or activated by the
migration. The bounded `ZZ` fallback keeps both values equal to `ZZ`.

An active subdivision row must bind its parent `CasinoCountry`, exact
offer/tracking compatibility rows and the ordinary RFC-042 route objects. An
exact subdivision never implies its parent country or a neighbouring
subdivision.

## Trusted request authority

Only trusted Vercel request headers may select a public subdivision. The
country comes from `x-vercel-ip-country`; the region comes from
`x-vercel-ip-country-region`, whose current Vercel contract documents a region
portion of up to three characters
([Vercel request headers](https://vercel.com/docs/headers/request-headers)).
Invalid or absent region input cannot be supplied
by a query string, cookie, locale or account preference. A request without a
valid exact region cannot consume a subdivision activation.

Country-level jurisdiction resolution remains an independent necessary gate.
For an exact subdivision, a positive commercial result additionally requires
the exact supported Casino/GEO authority and detected legal evidence. Parent
country approval alone is insufficient and cannot supersede an exact legal or
regulatory block.

## Registration and precedence

The permanent partner tracking-registration service remains the only route
registration path. It may bind one verified generic URL to many exact market
codes, bind one regional URL to its declared exact market set, or bind an
exact-GEO URL. Precedence is `EXACT_GEO`, then `REGIONAL_REUSE`, then `GENERIC`.

Technical inability to represent a subdivision is an engineering defect, not
a regulatory state. Legal and mandatory regulatory classifications remain
external evidence decisions.

The 11 September 2026 runtime-registration amendment allows the bounded
registration service to persist an absent exact `marketCode` for an already
established Partner × Casino. Country codes and permitted subdivision-shaped
codes use the same canonical normalization; `ZZ` remains reserved. Persisting
support does not bypass exact subdivision legal authority: absent detected
exact legal evidence remains `ACTION_REQUIRED_REGULATORY`, and RFC-042 is still
the sole writer of `ACTIVE + HEALTHY` state.

For `supportedGeos`, one generic URL is externally verified once and the
bounded verification result is handed to RFC-042 for each eligible exact
market. Later generic replacement discovers both seeded and database-backed
runtime support. Exact routes continue to shadow the generic route only for
their exact `marketCode`.

## Migration and rollback

Migration `0035_market_activation_exact_market_code` adds and backfills
`marketCode`, replaces only canonical activation unique indexes, and preserves
every existing row. A bounded database trigger fills `marketCode` from
`countryCode` only when a temporarily rolled-back pre-0035 binary omits the new
field (and keeps an old country-only row aligned if that binary changes its
country). Exact-market writes from the new application remain untouched. The
migration is not destructively reversed.

## Boundaries

This RFC does not create country-wide Canada or Argentina authority, change
Programme/Help data boundaries, weaken GB operator/domain/partner/route gates,
or authorize Super Partners inventory.
