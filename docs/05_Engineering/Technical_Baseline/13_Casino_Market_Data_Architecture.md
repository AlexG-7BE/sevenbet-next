# Casino Market Data Architecture

## Audit scope and evidence

**DETECTED:** canonical repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` and isolated release worktrees were confirmed before reconciliation. The active repository scan covered 2,033 source/artifact paths while excluding dependencies, generated output, build artefacts, caches, and `tsconfig.tsbuildinfo` from source claims. The verified GEO runtime baseline is `1392829c5823354ed9e3cb7d04d29b963e96262c`; the database factual baseline still contains only the previously published Betsson PE/SE identity before CASINO-DATA-POPULATION-01 executes.

**DETECTED:** the frozen research staging directories were inspected read-only for representability. Their records and binaries are not imported, changed, published, or committed by this workstream.

## Implemented data boundary

**DETECTED:** `Casino` remains one global brand/editorial identity. `CasinoCountry` is extended as the Casino × ISO country factual boundary. `CasinoCountryLicense` associates existing licences with exact profiles; payment, provider, category, bonus, and media records can carry an optional exact profile association. Composite constraints prevent a scoped licence/payment/provider/category/bonus from naming a market owned by another Casino.

**DETECTED:** `CasinoCountryEvidence` preserves field-level provenance references while facts remain typed. Its source-type enum distinguishes official casino/operator/regulator/affiliate-portal evidence, official terms, partner communications, internal records, and other sources without collapsing frozen-corpus provenance. `UNKNOWN` and `CONTRADICTION` are first-class classifications; unknown typed values remain nullable rather than receiving defaults.

**DETECTED:** existing unscoped facts remain stored with null `casinoCountryId`. The migration contains no data DML and creates no market, fact, evidence, or licence-link row.

## Read and publication path

**DETECTED on the `GEO-LANGUAGE-GLOBAL-CATALOG-01` implementation candidate:**
[RFC-039](../../06_RFC/RFC-039-Language-Only-Public-Routing-and-Global-Casino-Catalog.md)
supersedes the earlier unqualified/stable-first-profile public query behavior.
Public pages now read all legitimate global published Casino identities while
the repository projects only the exact trusted request-market profile, or an
empty profile array. Language and legacy `country` query state cannot select
that profile. See [Technical Baseline 14](14_Geo_Language_Global_Catalog.md).

**DETECTED:** the Casino aggregate includes nested market profiles in version snapshots. The public mapper exposes only the exact trusted request-country profile and clears market facts when no exact profile exists. Discovery evaluates market-sensitive filters on that single projection while preserving the global Casino identity; it never aggregates separate country profiles. Comparison, detail, bonus, and best-offer services pass the trusted request country into the same boundary, and public query state cannot override it.

**INFERRED:** legacy already-published snapshots without nested scoped facts can continue to render global editorial identity, but their unscoped product/compliance facts are not sufficient for an arbitrary country projection. Separate verified ingestion/republication is required to make them market-complete.

## Commercial separation

**DETECTED:** no `PartnerRoute` table exists. The read projection composes the existing Affiliate Program/Offer/TrackingLink/country/redirect records with exact `CasinoCountry` state. `AffiliateTrackingLinkCountry.productionEligible` defaults false and is only one cumulative input. The public repository, discovery action, and direct redirect resolution require exact country authority and otherwise return no action.

**DETECTED:** the factual market Admin route requires `casino.edit` and has no commercial activation field. Ordinary Affiliate aggregate edits preserve existing route eligibility metadata for unchanged `ALLOW` country rows but cannot create it through the existing form payload.

**PROPOSED:** a dedicated Admin market-profile form is not part of this candidate. The authenticated server contract is usable by later ingestion/admin integration; explicit UI controls for retiring ambiguous legacy facts remain later work.

**DETECTED:** real frozen Betsson PE/SE factual profiles have been exercised in disposable PostgreSQL and through the public profile/discovery services. No real partner agreement, programme/account, offer, tracking authority, or production eligibility is established.

## Migration evidence

**DETECTED:** disposable PostgreSQL verification applies all 25 migrations cleanly. A staged 0024→0025 fixture preserves one Casino, one existing CasinoCountry, and one each of legacy licence/payment/provider/category/bonus records. All product facts remain unscoped, no licence join is inferred, no duplicate market profile appears, new unknown fields remain null/empty, and a second `migrate deploy` is a no-op.

**DETECTED:** Production migration 0025 is already completed with immutable repository checksum `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`. This ingestion candidate adds no migration after 0025 and contains no Production mutation path.

## Controlled ingestion validation

**DETECTED:** `data/casino-ingestion/betsson-pe-se.v1.json` is an explicit, checksum-bound Betsson PE/SE bundle. `scripts/casino-market-ingest.ts` defaults to database-free dry run and permits writes only to an explicitly confirmed loopback `_ci` database. It reconciles one global Casino and both market profiles in one transaction without deleting unrelated data, overwriting editorial workflow state, or writing affiliate/commercial authority.

**DETECTED on the CASINO-DATA-POPULATION-01 implementation branch:** the ingestion contract now accepts a positive bounded market set and factual-only bundles with no commercial mapping. Seven GB bundles are listed by a checksum-bound manifest. `ingestCasinoBundles` validates unique Casino identity keys and runs the entire set in one serializable transaction; its read-only verifier replays reconciliation under a read-only repeatable-read transaction and refuses any pending write.

**DETECTED:** the disposable PostgreSQL acceptance test exercises persisted Betsson PE and SE facts against public profile/discovery services, including idempotent retry, targeted evidence update, exact market filtering, visible contradictions/unknowns, and commercial fail-closed behavior. See `docs/05_Engineering/Casino-Market-Ingestion-Runbook.md`.

**DETECTED:** the seven-profile disposable acceptance creates exactly seven Casinos, seven GB profiles, seven licences, 14 licence-evidence rows, 53 market-evidence rows, 14 scoped categories and three DragonBet-only providers. It creates no payment, bonus, image, media or commercial row; six White Hat brands share one operator row without sharing brand-local facts. See the [CASINO-DATA-POPULATION-01 release record](../../06_Operations/Casino-Data-Population-01-Release-Record-2026-09-02.md).

## Production release outcome

**DETECTED:** after exact CI, Preview, Production identity, migration-history, collision and backup gates passed, execution-only PR #119 ran the exact nine-file bundle once from head `3a48739d668d5005eb2c4cdabfa2f23103549007`. Reconciliation was `78 created / 0 updated / 0 unchanged`; an immediate read-only comparison was `0 created / 0 updated / 78 unchanged`. One global Betsson Casino and independent PE/SE profiles were published as version 1 with `editorScore=null`; incomplete bonuses stayed `DRAFT`.

**DETECTED:** the Production-targeted `--skip-domain` executor deployment `dpl_Fk23XAokr33hjubGsFKRSTdEFhRo` emitted the success record and `CASINO_BETSSON_PE_SE_FACTUAL_RELEASE_COMPLETE_STOP`, then ended `Error` intentionally. `b4gamble.com` stayed on Ready runtime `dpl_6CRSFtbV4kZwhVurucV7jtKp4QoZ`. PR #119 was closed without merge, so no Production executor entered `main`.

**DETECTED:** PE/SE public projections preserve exact-market domains, currencies, payments, licences, `UNKNOWN` facts and `CONTRADICTION` evidence. The unqualified projection contains no PE/SE market facts. Affiliate action is unavailable, commercial writes are zero, route-country rows remain zero, `productionEligibleRoutes` remains zero, and no asset was published.

**PROPOSED:** any correction, second import, other operator/market, asset publication or commercial activation requires separate current authority and a newly reviewed bounded path. The completed release grants no standing Production mutation capability.
