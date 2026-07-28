# IP-001 — Jurisdiction Resolution Vertical Slice

**Status:** Implemented in shadow mode only (2026-07-28)

## Objective

Introduce a typed, server-side, fail-closed jurisdiction decision seam and observe it without changing public rendering or affiliate redirects.

## Existing entry points

- `app/casinos/page.tsx` public discovery
- `app/r/[slug]/route.ts` managed redirect
- `app/go/[slug]/route.ts` legacy CMS redirect

## Affected modules

`lib/jurisdiction/` contains contracts, the resolver, unavailable-policy adapter, and shadow observer. The three entry points invoke the observer only behind `JURISDICTION_RESOLVER_SHADOW_ENABLED`.

## Data assumptions

**Detected:** `CasinoCountry`, `CasinoLicense`, and affiliate GEO rows are source/routing facts; no canonical approved Market, Jurisdiction, or policy-version model exists. **Implemented limitation:** the default adapter returns no policy and denies commercial/referral capability. Tests inject an approved policy adapter. No migration was created.

## Phases

1. Define deterministic contracts and deny-safe resolution.
2. Compare proposed and legacy commercial/referral outcomes in the listed entry points.
3. Later: introduce approved governed records and enforce only after the RFC phase gate.

## Tests

Unit tests cover supported, no-commercial, unknown, conflict, unsupported, stale, missing-scope, user-selection, determinism, and flag behaviour. Route behaviour remains covered by existing redirect tests; shadow calls are observational.

## Shadow rollout and rollback

The flag defaults to disabled and accepts only the literal `true`. Enabled mode logs minimised structured comparisons with no IP, cookies, tokens, destinations, or affiliate secrets. Roll back by setting it false; no stored state or public response changes require reversal.

## Known limitations

No canonical governed policy persistence, trusted-edge provenance, account country, licence applicability record, or enforcement is introduced. Existing legacy routing remains authoritative by design during this slice.

## Definition of done

The typed resolver is server-side, commercial/referral fail closed, instrumented in discovery and both redirects, tested, documented, and does not alter public or redirect outputs.

## Casino Domain Foundation implementation exception (2026-07-28)

**Authorised scope:** The Casino Domain Foundation may introduce canonical domain contracts, repositories, mappers, services, tests, and additive Prisma persistence for operator/brand references, licence evidence, and domain lifecycle metadata. This is an implementation exception to RFC-001's planning-only limitation.

**Boundary:** The jurisdiction resolver remains shadow-only. This work does not activate jurisdiction filtering, commercial blocking, or a market. Existing public rendering and affiliate redirects preserve their current behaviour. Domain eligibility is fail-closed for missing, unverified, expired, revoked, or suspended licence evidence, but is not yet an authoritative runtime gate.

**Database safety:** migrations must be additive and backward compatible; destructive migrations are prohibited. Commercial activation, authoritative enforcement, and any production market launch require separate approval and their applicable RFC phase gates.
