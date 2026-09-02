# Casino Market Data Architecture

## Audit scope and evidence

**DETECTED:** canonical repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` was confirmed before implementation and the isolated release worktree was re-confirmed before reconciliation. The active repository scan covered 2,014 files while excluding dependencies, generated output, build artefacts, caches, and `tsconfig.tsbuildinfo` from source claims. The authoritative post-migration base is `5d16a2615a642625c916f63899ba1748e895d689`; this document describes the `CASINO-DATA-ARCH-01` implementation candidate layered on that base.

**DETECTED:** the frozen research staging directories were inspected read-only for representability. Their records and binaries are not imported, changed, published, or committed by this workstream.

## Implemented candidate data boundary

**DETECTED:** `Casino` remains one global brand/editorial identity. `CasinoCountry` is extended as the Casino × ISO country factual boundary. `CasinoCountryLicense` associates existing licences with exact profiles; payment, provider, category, bonus, and media records can carry an optional exact profile association. Composite constraints prevent a scoped licence/payment/provider/category/bonus from naming a market owned by another Casino.

**DETECTED:** `CasinoCountryEvidence` preserves field-level provenance references while facts remain typed. Its source-type enum distinguishes official casino/operator/regulator/affiliate-portal evidence, official terms, partner communications, internal records, and other sources without collapsing frozen-corpus provenance. `UNKNOWN` and `CONTRADICTION` are first-class classifications; unknown typed values remain nullable rather than receiving defaults.

**DETECTED:** existing unscoped facts remain stored with null `casinoCountryId`. The migration contains no data DML and creates no market, fact, evidence, or licence-link row.

## Read and publication path

**DETECTED:** the Casino aggregate includes nested market profiles in version snapshots. The public mapper exposes those profiles and exact-country projection clears market facts when no exact profile exists. Discovery constructs one working record per explicit available profile, composes all market-sensitive filters on that record, then de-duplicates the Casino identity. Comparison, detail, bonus, and best-offer services pass the selected presentation country into the same projection.

**INFERRED:** legacy already-published snapshots without nested scoped facts can continue to render global editorial identity, but their unscoped product/compliance facts are not sufficient for an arbitrary country projection. Separate verified ingestion/republication is required to make them market-complete.

## Commercial separation

**DETECTED:** no `PartnerRoute` table exists. The read projection composes the existing Affiliate Program/Offer/TrackingLink/country/redirect records with exact `CasinoCountry` state. `AffiliateTrackingLinkCountry.productionEligible` defaults false and is only one cumulative input. The public repository, discovery action, and direct redirect resolution require exact country authority and otherwise return no action.

**DETECTED:** the factual market Admin route requires `casino.edit` and has no commercial activation field. Ordinary Affiliate aggregate edits preserve existing route eligibility metadata for unchanged `ALLOW` country rows but cannot create it through the existing form payload.

**PROPOSED:** a dedicated Admin market-profile form is not part of this candidate. The authenticated server contract is usable by later ingestion/admin integration; explicit UI controls for retiring ambiguous legacy facts remain later work.

**UNKNOWN:** no real Casino market profile or route correctness is established by synthetic fixture coverage. No real partner agreement, programme/account, offer, tracking authority, or production eligibility is established.

## Migration evidence

**DETECTED:** disposable PostgreSQL verification applies all 25 migrations cleanly. A staged 0024→0025 fixture preserves one Casino, one existing CasinoCountry, and one each of legacy licence/payment/provider/category/bonus records. All product facts remain unscoped, no licence join is inferred, no duplicate market profile appears, new unknown fields remain null/empty, and a second `migrate deploy` is a no-op.

**DETECTED:** Production migration 0025 is already completed with immutable repository checksum `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`. This runtime candidate changes the Prisma schema/client and application behavior only; it adds no migration after 0025 and contains no Production mutation path.

## Remaining boundary

**PROPOSED:** the separate `CASINO-DATA-INGEST-02` release maps the frozen Phase 1/1.5 corpus, including distinct Betsson PE and SE profiles, only after this runtime architecture passes its release gates. It must not activate routes or publish staged affiliate assets.
