# Casino Market Data Production Release Record — 2 September 2026

**Status:** DETECTED — COMPLETE

**Scope:** migration 0025, market-aware runtime, and exactly one Betsson PE/SE factual import/publication

**Production origin:** `https://b4gamble.com`

**No credentials, connection URLs, tokens or private records are included.**

## Exact final state

- Application runtime baseline: `86470b8f05a9bc10f22fd7b18a09588319bfe2e0`.
- Ready runtime deployment serving `b4gamble.com`: `dpl_6CRSFtbV4kZwhVurucV7jtKp4QoZ`.
- Production database: Prisma Postgres `prisma-postgres-cobalt-school`, immutable provider ID `cmrixqbwl21xqyif8ab2vr2xw`, in project `cmrixqbwl21xsyif8kj8xl01s` and workspace `cmrixpep23o54wfdvy6ikjzc1`.
- Pooled runtime and direct administrative bindings resolved to the same database identity. Credentials were neither printed nor persisted.
- One Betsson global Casino identity is published with independent PE and SE factual market profiles. No other real operator was imported.
- No affiliate action, tracking-country row, commercial write, `productionEligible=true` route or asset publication exists for this release.
- Execution-only PR #119 is closed without merge. Its one-time Production executor is absent from `main`.

## Release sequence

| Step | Exact source / merge | Production deployment | Detected outcome |
| --- | --- | --- | --- |
| Migration 0025 | release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d` | `dpl_HAU77Wih5w52nhNfWqaTWwJY7Y8X` (`Error` intentionally) | `0025_casino_market_profile_architecture` applied and postflight verified. |
| [PR #114](https://github.com/AlexG-7BE/sevenbet-next/pull/114) | head `d8561f137777b0e3f010228d186d962bf47d8afe`; merge `5d16a2615a642625c916f63899ba1748e895d689` | `dpl_GTK12YtMs1xsaNGMq8SeNgxA2f1h` | Durable read-only 0025 steady-state guard. |
| [PR #111](https://github.com/AlexG-7BE/sevenbet-next/pull/111) | head `222c687840fd1fcb672fc55407a422f5a2e0b9c0`; merge `a6e643e6a9032658206d4ae30689f940c35b5462` | `dpl_2WjbYJ42tztC3c1HkT9QBf6BD3Cm` | Durable market-aware casino architecture/runtime. |
| [PR #117](https://github.com/AlexG-7BE/sevenbet-next/pull/117) | head `d8b9b7a796341ec32917e0a050b8a9ee020e16ba`; merge `ae775cab11e54caf4c1805193c26baf0c9bb5861` | `dpl_9mTAGt7i1YrfEtxgvwgwHAKief2Q` | Exact-country public casino-listing correction. |
| [PR #112](https://github.com/AlexG-7BE/sevenbet-next/pull/112) | head `021d5f9ca29309a148b073ccad53afc09627d0fb`; merge `89da68c17e776288c4f242ec14b511e581aa3b29` | `dpl_BNmky6Enr85bisgqrpZWSzJBt3bE` | Checksum-bound Betsson PE/SE importer restricted to disposable loopback `_ci` databases. |
| [PR #118](https://github.com/AlexG-7BE/sevenbet-next/pull/118) | head `aa52c5034924424394d95bb52de3c2d6ecadb179`; merge `86470b8f05a9bc10f22fd7b18a09588319bfe2e0` | `dpl_6CRSFtbV4kZwhVurucV7jtKp4QoZ` | Null-safe score mapping/sorting/schema plus legitimate post-0025 factual steady state. |
| [PR #119](https://github.com/AlexG-7BE/sevenbet-next/pull/119) | execution-only head `3a48739d668d5005eb2c4cdabfa2f23103549007`; no merge | `dpl_Fk23XAokr33hjubGsFKRSTdEFhRo` (`Error` intentionally) | Exact one-time factual import/publication, success sentinel, then closed unmerged. |

The #118 exact-main CI run `33607660809` and #119 exact-head CI run `33608256878` completed successfully. PR #119 Preview `dpl_32uGdBe1BXQ92XWKvxf2xtG6QZAr` was Ready and read-only before execution.

## Migration and recovery evidence

- Migration: `0025_casino_market_profile_architecture`.
- Repository SHA-256: `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.
- Production history: 0023 completed/checksum valid; 0024 completed/checksum valid; 0025 completed/checksum valid; no unresolved, rolled-back, pending or later migration.
- Pre-import preservation counts: Casino 26; CasinoCountry 25; CasinoLicense 25; CasinoPaymentMethod 56; CasinoGameProvider 50; CasinoGameCategory 50; CasinoBonus 25; MediaAsset 1; AffiliateTrackingLinkCountry 0.
- Live provider UI showed seven consecutive completed daily Production snapshots. The newest completed snapshot was displayed as `02 Sep 2026, 5:02 AM`, size `5.7 MiB`, before the import. No restore or provider mutation was performed. RFC-024's earlier isolated restore-to-new-target drill remains the recovery proof; there is no automatic data rollback.

## Exact import contract and result

- Bundle SHA-256: `9f6d15e18e7217fbc9648c86eb8a2ba4ad8aa47fb1e8e06ac7ab60b672f3960c`; nine source files verified.
- Plan: 1 Casino; 2 market profiles; 3 licences; 4 licence-evidence rows; 22 payments; 2 draft bonuses; 0 providers; 14 categories; 24 market-evidence rows; 0 commercial writes.
- Preflight collision candidates were zero for Casinos, brands, operators, markets, licences, bonuses and aliases.
- Reconciliation: `78 created / 0 updated / 0 unchanged`.
- Read-only idempotency comparison: `0 created / 0 updated / 78 unchanged`.
- Exactly one import execution occurred. No retry was performed.

| Model | Created | Updated | Unchanged |
| --- | ---: | ---: | ---: |
| CasinoBrand | 1 | 0 | 0 |
| Casino | 1 | 0 | 0 |
| CasinoOperator | 2 | 0 | 0 |
| CasinoCountry | 2 | 0 | 0 |
| CasinoCountryEvidence | 24 | 0 | 0 |
| CasinoLicense | 3 | 0 | 0 |
| CasinoCountryLicense | 3 | 0 | 0 |
| CasinoLicenseEvidence | 4 | 0 | 0 |
| CasinoPaymentMethod | 22 | 0 | 0 |
| CasinoGameCategory | 14 | 0 | 0 |
| CasinoBonus | 2 | 0 | 0 |

## Publication and factual-integrity postflight

- Casino ID `2c6b8a18-5bfa-59c6-8d17-c8a43c75b081` was published as version 1; version ID `9c4638a3-a06c-46f0-bf03-b93965ec4c05`; revision ID `4711456e-f9db-4a6a-8b7c-82d51a30963e`.
- `editorScore` and `trustScore` remain `null`. No false zero score or Rating schema is emitted.
- PE and SE incomplete bonus observations remain `DRAFT` / `DRAFT`; public bonus arrays are empty.
- PE public projection contains only Betsson: `www.betsson.pe`, PEN, PE-only payment methods including Yape, and active MINCETUR licences `11002586010000` and `21002586010000`.
- SE public projection contains fictional Demo Prism plus Betsson: `www.betsson.com/sv`, SEK, SE-only payment methods including Swish, and active Spelinspektionen licence `23Si2176`.
- Both profiles retain explicit `UNKNOWN` facts and `CONTRADICTION` evidence. The PE licence-number conflict and SE unassigned regulator-line conflict were not erased or silently resolved.
- Cross-market leakage was false. The unqualified Betsson projection has empty countries, payments and market profiles.
- Affiliate action is `{ href: null, available: false }` in PE, SE and the unqualified projection.
- No Betsson asset was published. Generic and Swedish directory/detail routes render without a broken required image.

## Commercial firewall and final inventory

The executor reported `commercialMutation=false`, `migrationExecutionAuthorised=false`, `runtimePromotionAuthorised=false`, `productionEligibleRoutesBefore=0`, `productionEligibleRoutesAfter=0`, `affiliateRouteCountriesBefore=0` and `affiliateRouteCountriesAfter=0`.

Final bounded inventory: Casinos 27; market profiles 27; operators 2; brands 1; licences 28; licence evidence 4; market evidence 24; market/licence links 3; payments 78; providers 50; categories 64; bonuses 27; media 1; images 75; versions 45; revisions 242; SEO records 25; editorial reviews 25; affiliate programmes 5; affiliate offers 5; affiliate tracking links 5; affiliate route countries 0; affiliate redirects 5; Casino affiliate links 0; legacy affiliate links 0; commercial opportunities 60; Production-eligible routes 0.

## Runtime and deployment postflight

- `/`, `/casinos`, `/se/casinos` and `/se/casino/betsson` returned HTTP 200.
- PE API returned one record, Betsson. SE API returned two records, fictional Demo Prism and Betsson.
- The execution deployment emitted `casino_betsson_pe_se_production_release_preflight_verified`, `casino_betsson_pe_se_production_import_succeeded`, `casino_betsson_pe_se_factual_publication_succeeded`, `casino_betsson_pe_se_production_factual_release_succeeded`, then `CASINO_BETSSON_PE_SE_FACTUAL_RELEASE_COMPLETE_STOP`.
- `mutationPerformed=true`, `importPerformed=true`, `publicationPerformed=true`, `importExecutions=1` and `commercialMutation=false`.
- The temporary Production-targeted build ended `Error` intentionally after the stop sentinel. It did not replace the Ready `b4gamble.com` runtime.

## Warnings and residual boundaries

- During Preview smoke, four protected requests were issued concurrently against a database pool limit of one. One `/casinos` request returned Prisma `P2024`; the immediate sequential request returned 200, exact hosted Browser CI passed, and no Production failure was observed. This remains a bounded capacity signal to monitor, not evidence of data corruption.
- PE factual data is live through the exact-country public API, but PE is not currently a registered public presentation market in RFC-037's route registry. No PE-localized canonical page was added by this release.
- No automatic rollback exists for the imported rows. A correction or removal requires separate current Founder authority and a newly reviewed bounded data path; the consumed executor must not be rerun.
- This record grants no authority for another operator, market, import, migration, asset, affiliate route, commercial activation or `productionEligible=true` change.
