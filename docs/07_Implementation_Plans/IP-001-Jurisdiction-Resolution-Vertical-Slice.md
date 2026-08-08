# IP-001 — Jurisdiction Resolution Vertical Slice

**Status:** Superseded by the authoritative GB vertical slice in RFC-014 / GB-MARKET-01 (2026-08-08)

## Objective

This plan introduced the typed, server-side, fail-closed jurisdiction seam. GB-MARKET-01 subsequently activated that same resolver—without creating a second engine—under the bounded authority in [RFC-014](../06_RFC/RFC-014-Great-Britain-Market-Eligibility-and-Evidence-Authority.md).

## Existing entry points

- `app/casinos/page.tsx` public discovery
- `app/r/[slug]/route.ts` managed redirect
- `app/go/[slug]/route.ts` retained non-commercial legacy endpoint

## Affected modules

`lib/jurisdiction/` now contains the contracts, resolver, repository policy source, GB policy, trusted Vercel country adapter, operator evidence evaluator and the retained shadow helper. Active public consumers use the resolver authoritatively; the shadow helper has no active commercial consumer.

## Data assumptions

**Detected:** `CasinoCountry`, `CasinoLicense`, evidence and affiliate GEO rows remain source/routing facts. The repository now has the approved bounded identities `gb-online-casino` and `great-britain` plus policy version `gb-2026-08-08.1`; it is not a generic multi-market persistence model. No migration was created.

## Phases

1. Define deterministic contracts and deny-safe resolution.
2. Compare proposed and legacy commercial/referral outcomes in the listed entry points.
3. Completed for the non-commercial GB slice: enforce the repository policy and operator evidence contract after RFC-014 approval.

## Tests

Unit tests cover supported, no-commercial, unknown, conflict, unsupported, stale, missing-scope, user-selection, determinism, trusted-edge adaptation, operator evidence and redirect-time recheck. Shadow calls remain observational tests only.

## Shadow rollout and rollback

The retained diagnostic flag defaults to disabled and accepts only the literal `true`. It does not select public behaviour. Rollback of authoritative enforcement must suspend policy or deploy an earlier application while retaining fail-closed redirects; disabling the shadow flag cannot change authority.

## Known limitations

No generic policy persistence, verified account country, durable licence-to-domain relation or commercial activation is introduced. `/go/[slug]` has no external authority. COMM-01 and LEGAL-02 remain required.

## Definition of done

The typed resolver is server-side, commercial/referral fail closed, instrumented in discovery and both redirects, tested, documented, and does not alter public or redirect outputs.

## Casino Domain Foundation implementation exception (2026-07-28)

**Authorised scope:** The Casino Domain Foundation may introduce canonical domain contracts, repositories, mappers, services, tests, and additive Prisma persistence for operator/brand references, licence evidence, and domain lifecycle metadata. This is an implementation exception to RFC-001's planning-only limitation.

**Historical boundary:** this paragraph described the 2026-07-28 exception. RFC-014 supersedes its shadow-only limitation for the GB vertical slice. Domain eligibility is now an authoritative runtime gate and currently denies because licensed-domain evidence is not machine-provable.

**Database safety:** migrations must be additive and backward compatible; destructive migrations are prohibited. Commercial activation, authoritative enforcement, and any production market launch require separate approval and their applicable RFC phase gates.
