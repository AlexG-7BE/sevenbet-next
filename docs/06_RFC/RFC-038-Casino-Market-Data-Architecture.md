# RFC-038 — Casino Market Data Architecture

## Status

`ACTIVE`. Approved by the explicit Founder instruction `CASINO-DATA-ARCH-01` on 1 September 2026. Implementation is developed through a reviewable feature-branch PR; this RFC does not authorise merge, deployment, a Production migration, research ingestion, asset publication, or commercial activation.

## Decision

B4GAMBLE separates three grains:

```text
Casino                         global brand/editorial identity
CasinoCountry                  Casino × exact factual market profile
logical PartnerRoute          Casino × exact market × programme/offer/tracking authority
```

`CasinoCountry` is the canonical factual market-profile boundary. No parallel `CasinoMarketProfile` model exists. A Casino record, factual market availability, localisation, licence, payment, bonus, provider, or media fact never establishes commercial permission.

## Detected baseline

**DETECTED at authoritative base `f12d5f35dd5ec36257dd7e1d29a3ca38b16d1e73`:** the repository already has `CasinoCountry`, casino compliance/product relations, the normalized Affiliate Network/Program/Offer/TrackingLink/country-targeting/redirect system, Commercial evidence/readiness records, public discovery/compare/offer services, and fail-closed jurisdiction/operator authority. Material payments, licences, bonuses and providers are Casino-scoped, allowing facts from different countries to be combined incorrectly.

The implementation extends those existing systems. It does not replace them.

## Global identity and factual market profiles

`Casino` remains the single global identity and continues to own invariant brand/editorial fields, aliases, operator/brand identity, revisions, versions, and truly global media.

`CasinoCountry` owns exact-market availability and may record nullable local domain/URL, local legal/operator identity, terms/privacy/responsible-gambling URLs, languages, support languages, currencies, minimum age, KYC/withdrawal/support summaries, verification time, and notes. Unknown facts remain `NULL` or empty explicitly-scoped arrays; they are never inferred from legacy Casino fields.

The same Casino can therefore have distinct PE and SE profiles without becoming two Casinos.

## Scoped fact contracts

- Licences reuse `CasinoLicense` and `CasinoLicenseEvidence`. `CasinoCountryLicense` is only the many-to-many applicability join. Its composite foreign keys require both the market and licence to belong to the same Casino.
- `CasinoPaymentMethod`, `CasinoGameProvider`, `CasinoGameCategory`, and `CasinoBonus` have an optional `casinoCountryId`. A non-null value is canonical exact-market scope. Null is a transitional legacy/global record and is not evidence for an arbitrary market.
- `MediaAsset` may optionally reference a `CasinoCountry`; the existing media system remains authoritative.
- Scoped payments/providers/categories use market-grained uniqueness. Partial PostgreSQL indexes retain legacy Casino-level uniqueness for rows whose `casinoCountryId` is null.
- No individual-game model is introduced.

## Provenance

`CasinoCountryEvidence` records typed evidence for one market profile without becoming EAV. Typed facts stay on `CasinoCountry` and its scoped relations. One evidence row can cite multiple `fieldKeys` and records classification (`DETECTED`, `INFERRED`, `PROPOSED`, `UNKNOWN`, or `CONTRADICTION`), lossless source type (including official terms and partner communications), source URL/reference, observation and verification times, and notes.

Licence provenance continues through `CasinoLicenseEvidence`. Missing, stale, unknown, or contradictory evidence does not become a positive fact.

## Logical PartnerRoute

There is no `PartnerRoute` table. `PartnerRouteService` projects existing normalized records for an exact Casino and country:

```text
Casino + CasinoCountry
→ AffiliateNetwork + AffiliateProgram
→ AffiliateOffer + AffiliateOfferCountry/Currency
→ AffiliateTrackingLink + AffiliateTrackingLinkCountry
→ AffiliateRedirectSlug
```

The internal read contract exposes the programme/account, commission model, offer targeting, tracking/campaign and landing destination, currency/language constraints, route restrictions, verification state, readiness reasons, and `productionEligible`. Public DTOs expose only safe server-owned redirect slugs, never raw destination/tracking URLs or account identifiers.

## Production eligibility

`AffiliateTrackingLinkCountry` is the exact route-level authority and adds `productionEligible`, verification/expiry evidence, evidence reference, and notes. The default is `false`; migration and ordinary factual editing never set it true.

Eligibility is the cumulative AND of:

- exact available `CasinoCountry`;
- active network and exact Casino-bound active/published programme with explicit country support;
- current active offer with exact `ALLOW` country targeting and compatible market constraints;
- current, safe, active, exact-country `ALLOW` tracking link with recent verification and health check;
- exact `AffiliateTrackingLinkCountry.productionEligible=true`, explicit verification/evidence, and no expired authority;
- active exact-offer server-owned redirect mapping; and
- request-time commercial/referral jurisdiction, operator/readiness, and redirect kill-switch authority.

Absent, global-only, blocked, disabled, expired, stale, unsafe, or contradictory authority fails closed. Direct `/r/[slug]` resolution repeats the route eligibility check immediately before commercial readiness/destination release. No real route is activated by this architecture workstream.

## Public query semantics

Market-aware mapping publishes one explicit profile at a time. Country, currency, payment, licence, provider, category, bonus, and local media predicates are evaluated on the same `CasinoCountry` projection. The service creates profile-scoped candidates, applies every selected predicate, then de-duplicates Casinos; it never independently joins Casino-wide fact arrays.

With no country parameter, discovery facets aggregate only explicit market profiles. Filtering still selects a single satisfying profile and the result card uses that profile. The stable first country-code profile represents an otherwise unqualified direct service result; normal market-aware pages supply their presentation market. No facts from separate profiles are merged into a synthetic global profile. Missing exact country on detail/offer API projections returns no market facts or commercial action.

## Admin and publication boundary

`GET`/`PUT /api/admin/casinos/[casinoId]/market-profiles/[countryCode]` requires `casino.edit`, validates a strict payload, permits nullable unknown facts, checks same-Casino licence ownership and operator existence, uses optimistic concurrency, writes an audit record, and only edits Draft Casinos. It maintains market profile facts and provenance; it contains no commercial eligibility field.

The existing Casino editor remains the compatibility editor for unscoped legacy facts. Publication snapshots include nested explicit market profiles, and public readers use those nested profiles as the canonical market source.

No dedicated market-profile form is added in this bounded workstream. The authenticated API is the durable server integration; a purpose-built Admin form and explicit legacy-fact retirement controls remain later UI work and must preserve the factual/commercial separation.

## Migration and compatibility

Migration `0025_casino_market_profile_architecture` is additive except for relaxing selected booleans to nullable and replacing Casino-level uniqueness with scoped plus partial-legacy uniqueness. It preserves all existing IDs/rows. It performs no `INSERT`, `UPDATE`, inferred link, country creation, or data backfill.

Legacy global language/currency/licence/product fields remain for controlled compatibility, but they are market-unsafe and cannot authorize a new market-aware read. Later cleanup must follow measured cutover; this RFC does not set a deletion date.

The partial indexes retaining uniqueness for null-scoped legacy payments/providers/categories and the media ownership check are PostgreSQL migration constraints that Prisma cannot express directly. Migration drift review must preserve them until legacy rows are retired.

## Ingestion boundary

The frozen Phase 1/1.5 research corpus is read-only architecture evidence in this workstream. `CASINO-DATA-INGEST-02` will map that corpus into the canonical schema and test Betsson PE and SE in a non-Production environment. Ingestion must retain evidence classification, unknowns and contradictions and must independently establish any commercial authority. It may not infer an affiliate route from a factual profile.
