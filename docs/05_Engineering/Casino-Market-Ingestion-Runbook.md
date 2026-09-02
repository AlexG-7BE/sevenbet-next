# Casino Market Ingestion Runbook

Status: **DETECTED** on `CASINO-DATA-INGEST-02`; the importer is not a Production release mechanism.

**Production outcome — DETECTED 2 September 2026:** a separate exact-authority, execution-only mechanism in PR #119 imported and published the checksum-bound Betsson PE/SE bundle exactly once. PR #119 was then closed without merge. The ordinary importer described below remains non-Production and no reusable Production executor exists on `main`. See the [bounded release record](../06_Operations/Casino-Market-Data-Release-Record-2026-09-02.md).

## Authority and boundaries

**DETECTED:** `scripts/casino-market-ingest.ts` accepts one explicit, reviewed bundle. It does not scan research directories. Its default is a database-free dry run. Write mode requires all of: `--write`, `--confirm-disposable=CASINO_DATA_INGEST_02`, `CI=true`, matching `DATABASE_URL` and `DIRECT_URL`, a loopback host, and a database name ending `_ci`. Vercel Production and `NODE_ENV=production` are refused.

**DETECTED:** the contract accepts one to 50 exact factual markets per Casino. Commercial mappings are optional, report-only, unique and must name a factual market; the importer never writes them. The Betsson bundle remains backward compatible. `ingestCasinoBundles` validates unique Casino keys/slugs/domains and reconciles a reviewed multi-Casino batch in one serializable transaction, so a late collision rolls back the entire batch.

**DETECTED:** retries compare normalized business fields before updating. The importer neither deletes omitted/unrelated rows nor performs commercial, affiliate, tracking, asset, publication, deployment, or Production writes.

**DETECTED on CASINO-DATA-POPULATION-01:** `data/casino-ingestion/casino-data-population-01/manifest.v1.json` checksum-binds seven single-market GB factual bundles to 28 frozen bundle sources and five decision records. All seven preserve explicit `UNKNOWN` evidence and zero commercial mappings. Whole-batch disposable PostgreSQL verification creates 121 factual rows, reuses the shared White Hat operator five times, rolls back all seven Casinos on a last-bundle collision, and yields a read-only idempotency comparison of `0 created / 0 updated / 126 unchanged`.

## Explicit mapping contract

| Source field | Normalized field | Prisma target | Transformation | Evidence requirement | Unknown behaviour |
| --- | --- | --- | --- | --- | --- |
| Phase 1 canonical name and slug | global identity | `Casino.title`, `internalName`, `slug` | one Betsson record | official operator evidence cited on both profiles | reject missing identity |
| Phase 1 global domain | global domain | `Casino.domain`, `websiteUrl` | host is canonicalized separately from HTTPS URL | official brand/casino evidence | do not substitute a market domain |
| Phase 1 global brand | brand identity | `CasinoBrand`, `Casino.brandProfileId` | global brand has no single operator because operators vary by residence | official operator evidence | global operator remains null |
| Phase 1.5 market | exact country key | `CasinoCountry.countryCode` | uppercase ISO alpha-2 | profile readiness and exact market evidence | reject invalid/duplicate market |
| Local availability | availability | `CasinoCountry.availability` | source state mapped to enum | exact regulator/operator evidence | `UNKNOWN`, never global fallback |
| Local domain and URL | local identity | `CasinoCountry.localDomain`, `localWebsiteUrl` | domain and safe HTTPS URL stored independently | same-market regulator/operator evidence | null |
| Market legal entity | operator | `CasinoOperator`, `CasinoCountry.operatorProfileId`, `operatingLegalEntity` | one operator profile per legal entity; registration detail retained in text | same-market regulator/operator/privacy evidence | null; never use another market's operator |
| Legal and safety URLs | exact market links | `CasinoCountry.termsUrl`, `privacyUrl`, `responsibleGamblingUrl` | HTTPS only | exact official page | null |
| Language and currency | localization | `primaryLanguage`, `supportedLanguages`, `primaryCurrency`, `supportedCurrencies` | exact market arrays; no global population | same-market official evidence | null/empty array |
| Minimum age | minimum age | `CasinoCountry.minimumAge` | none | exact evidence required | null for PE and SE |
| KYC | verification summary | `CasinoCountry.kycSummary` | bounded evidence-backed summary | same-market official evidence | null |
| Withdrawal facts | withdrawal summary | `CasinoCountry.withdrawalSummary` plus payment timing | multi-currency minimums retained in summary because one scalar cannot represent them losslessly | same-market official evidence | null |
| Support facts | support summary | `CasinoCountry.supportSummary`, `supportLanguages` | no inference from global support | exact market evidence | null/empty array |
| Regulator record | canonical licence | `CasinoLicense` | source `VIGENTE` maps to canonical `ACTIVE`; source status/type remains in notes | regulator evidence | nullable expiry/type fields |
| Licence provenance | licence evidence | `CasinoLicenseEvidence` | exact source reference and review time | at least one item per licence | `UNKNOWN` status where unverified |
| Market/licence membership | exact relation | `CasinoCountryLicense` | composite relation includes the owning Casino | exact country evidence | no inferred cross-market link |
| Payment method | scoped payment | `CasinoPaymentMethod.casinoCountryId` | stable method key; booleans remain nullable | same-market official payment evidence | unknown withdrawal support is null |
| Bonus observation | non-public draft | `CasinoBonus.casinoCountryId` | incomplete offers are stored `DRAFT`/`DRAFT`; contradictory numeric facts remain null | official evidence plus market evidence classification | incomplete terms remain null and cannot surface publicly |
| Product category | scoped category | `CasinoGameCategory.casinoCountryId` | evidence-backed product labels become stable category keys | same-market official product evidence | omit |
| Provider name | scoped provider | `CasinoGameProvider.casinoCountryId` | no providers in this bundle because the frozen names do not prove current lobby availability | exact current same-market evidence | omit |
| Market claim/provenance | typed evidence | `CasinoCountryEvidence` | stable ID from Casino/market/source key; classification, URL, dates, notes and field keys retained | every material detected fact needs a citation | explicit `UNKNOWN` row and null fact |
| Specialist official source categories | lossless raw category | `CasinoCountryEvidence.sourceType=OTHER`, `sourceReference`, notes | raw `OFFICIAL_PRIVACY`/`OFFICIAL_RESPONSIBLE_GAMBLING` value retained as `rawSourceType` | frozen source record | do not relabel as another authority |
| PE footer sports reference | contradiction | `CasinoCountryEvidence` only | regulator `21002586010000` is canonical; footer `21002586020000` is not linked as Betsson licence | both regulator and official-site evidence | contradiction remains visible |
| Route/setup and portal state | commercial report only | no Prisma write | PE `9721`; SE `38112`; both `productionEligible=false` | affiliate portal source file | no campaign/tracker/route creation |

## Invocation

Dry run with exact source verification:

```sh
npm run casino-market:ingest -- \
  --bundle data/casino-ingestion/betsson-pe-se.v1.json \
  --source-root /path/to/the/frozen-workspace
```

Disposable write mode additionally requires the explicit confirmation and safe environment described above. Production credentials are not an accepted target.

## Validation

**DETECTED:** `tests/casino-ingestion.test.ts` covers bundle strictness, deterministic planning/IDs, source checksums, the write guard, PE licence contradiction, market separation, and commercial fail-closed behavior.

**DETECTED:** `tests/casino-ingestion-postgres.test.ts` requires migration 0025, ingests the real reviewed bundle, verifies database cardinality and ownership, retries with no business-field changes, updates one evidence row only, preserves an unrelated Casino, exercises public profile/discovery services from persisted relations, and proves no commercial authority is created.

**DETECTED:** `tests/casino-data-population.test.ts` verifies the seven bundle hashes, 28 frozen bundle-source hashes, five decision-record hashes, exact-market scope, skipped records, explicit unknowns, asset fallback and zero commercial mappings. `tests/casino-data-population-postgres.test.ts` proves whole-batch atomicity, exact model counts, shared-operator reuse, writable retry equivalence, read-only idempotency and zero commercial-table change.

**DETECTED:** migration 0025 and the one authorised Betsson PE/SE factual import/publication are complete. The current Founder instruction separately authorises the bounded CASINO-DATA-POPULATION-01 Production factual release after its exact CI/Preview/preflight gates. The ordinary importer remains non-Production and grants no reusable Production execution, asset-publication or commercial-activation authority.
