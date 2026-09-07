# B4GAMBLE — Betsson Network Casino Import Pack

Observed: 2026-09-07

## Scope
Prepared from the Founder-supplied Betsson Media Store direct-link export (60 rows) plus current official casino/operator/regulator/Betsson Group Affiliates sources.

Brands in source: Betsson (22 routes), Rizk (17), Betsafe Baltics (7), Inkabet (6), NordicBet (4), StarCasino (3), SuperCasino (1).

## Repository targets
- `data/casino-ingestion/*.v1.json` — canonical ingestion-contract bundles, all new casinos remain DRAFT when imported by the existing importer.
- `data/casino-real-catalog-02/betsson-network-drafts.v1.json` — PROPOSED editorial scorecards only; NOT runtime authority.
- `research_staging/betsson-network-2026-09-07/` — frozen partner export, normalized direct links, research/evidence, logo manifest.
- `public/casino-brands/<slug>/source.json` — logo provenance / target-path metadata.

## Commercial route safety
The exported tracking tokens are partner tracking paths, not numeric internal `routeSetupId` values. Therefore every ingestion bundle intentionally has `commercialMappings: []`. Nothing in this pack sets `productionEligible=true` or `trackingVerifiedEndToEnd=true`.

## Ratings
The current runtime catalog uses editorial score categories (evidence depth, product breadth, payments, terms clarity, regulatory record). Proposed scores are supplied for review only. Existing Betsson runtime score/profile is untouched.

## Logos
Official BGA logo-download provenance is captured for Betsafe, Inkabet, NordicBet and Rizk. The BGA public download page is bot-protected in this environment, so no third-party logo was substituted and no fake binary was generated. `source.json` files include a 256px official-domain favicon retrieval URL as a provisional fallback. Final visual QA should replace the fallback with the BGA-provided wordmark binary where available. StarCasino/SuperCasino provenance points to their official domains.

## Material unresolved items
- Betsafe EE exact cashier method inventory remains account-gated.
- Rizk NZ is AVAILABLE by live route/site evidence, but its current NZ footer presents an older Zecure/Netplay licence structure that conflicts with current global licence migration. Treat legal profile as CONTRADICTION until resolved.
- No Canadian provincial licence was established for Rizk CA.
- StarCasino current exact Bonus Benvenuto mechanics were not captured; Italy publication also requires current compliance review.
- SuperCasino exact method-level cashier limits remain incomplete.
- Betsson CL/IS local market availability is detected, but no local Chile/Iceland licence is claimed.

## Validation
JSON structure and required ingestion fields are validated by `validation-report.json`. No Production write, import, merge or publication has been performed.
