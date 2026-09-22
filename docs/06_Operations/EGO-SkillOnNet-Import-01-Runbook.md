# EGO-SKILLONNET-IMPORT-01 runbook

Decision: [FOUNDER-EGO-2026-09-22](../07_Decisions/FOUNDER-EGO-SKILLONNET-2026-09-22.md). Executor: `scripts/ego-skillonnet-import-01.ts` (`npm run ego-skillonnet:import`).

The executor is a manual, Founder-run command. It refuses to write from CI or a Vercel build (the build stays read-only, PR #279). No agent and no CI job runs `apply` against Production.

## What `apply` does

1. Checks the sha256 of the 13 bundles and the source note against `manifest.v1.json`.
2. Imports the 13 casinos with the canonical importer (`ingestCasinoBundles`). The run is idempotent, and new casinos are `DRAFT`.
3. Creates the `AffiliateNetwork` "EGO — eGamingOnline" (`slug: ego`) if it is missing, with an audit row.
4. Registers each `ACTIVATE` market through `PartnerTrackingRegistrationService.register` with Founder authority `FOUNDER-EGO-2026-09-22`, one exact market per call:
   - `PartnerCasinoRelationship` rows are created on the way;
   - each route is verified live, and only a `HEALTHY` route whose market the legal authority tables allow becomes an `ACTIVE` exact `MarketActivation`;
   - every other market is reported with its reason (`ACTION_REQUIRED_REGULATORY`, `BROKEN_ROUTE`, …).
5. Runs route health for the 13 casinos and prints a JSON report. The report carries no raw tracking URL; links appear only as the first 12 characters of their sha256.

`DO_NOT_ACTIVATE` and `NO_MARKET` rows are never registered. Closed markets such as CA-ON and PlayUZU GB abort the run even if the sheet marks them `ACTIVATE`.

When one casino has several `ACTIVATE` links for the same market (EUcasino's language sites), the executor keeps one:
- a dedicated local domain first (`eucasino.dk` for DK);
- French for CA-QC;
- then the market-labelled site (GB, englishca).

`plan` lists every superseded row.

Expected from the sheet dated 2026-09-22:
- 92 registration commands.
- **29 can become ACTIVE** with today's legal tables (AT 8, DK 11, SE 9, ES 1), provided the route is healthy.
- The rest wait for step 2: 48 Canadian provincial markets, 12 GB, 2 DE, 1 GR.

## Inputs

- `ego-tracking-links.csv` from the EGO package, kept **outside git**. It holds raw partner URLs, and `*tracking-links*.csv` is git-ignored.
- An admin account email (`AdminUser`). The audit rows are attributed to it.

## Commands

Run from the repository root on the merged `main`.

1. Point the shell at the Production database. In the Production environment only `PRODDB_POSTGRES_URL` carries a usable connection string.
   ```bash
   vercel env pull /tmp/b4g-prod.env --environment=production --yes
   export DATABASE_URL="$(grep '^PRODDB_POSTGRES_URL=' /tmp/b4g-prod.env | cut -d= -f2- | tr -d '"')" DIRECT_URL="$DATABASE_URL" && rm /tmp/b4g-prod.env
   ```
2. Run the plan. It writes nothing, and it prints `targetDatabaseFingerprint`.
   ```bash
   npm run ego-skillonnet:import -- plan --links ~/Downloads/files/ego-tracking-links.csv
   ```
3. Run apply with the fingerprint from step 2.
   ```bash
   npm run ego-skillonnet:import -- apply --links ~/Downloads/files/ego-tracking-links.csv --confirm=EGO-SKILLONNET-IMPORT-01 --decision-ref=FOUNDER-EGO-2026-09-22 --actor-email=<admin email> --expected-database=<fingerprint>
   ```
4. Keep the JSON report. Anything marked `BROKEN_ROUTE`, or whose `finalHost` differs from `expectedOperatorHost`, goes back to EGO for a fix.

Re-running `apply` is safe. Already-registered links report `NO_CHANGE`.

## After the run

- `npm run casino-registry:verify` should report 29 casinos (15 published, 13 draft, 1 archived).
- The casinos stay `DRAFT` until published. A CTA needs a published casino, an `ACTIVE` route and a `HEALTHY` check (`lib/market-activation/runtime.ts`).
- Publish them with the approved Editor Scores and the fact-based content in `editorial.json`:
  ```bash
  npm run ego-skillonnet:import -- publish --confirm=EGO-SKILLONNET-IMPORT-01 --decision-ref=FOUNDER-EGO-2026-09-22 --actor-email=<admin email> --expected-database=<fingerprint>
  ```
  For each casino this writes the summary, description, "Best for" and "Things to know" lists, the Editor Score and SEO. It publishes the editorial review, then runs DRAFT → IN_REVIEW → APPROVED → PUBLISHED through `casinoService` with the normal publication validation, following `scripts/casino-real-catalog-03.ts`. Re-running it republishes the same content.
- The scheduled route-health workflow checks `ACTIVE` routes only.

## Editor Scores (approved by the Founder, 22 Sep 2026)

Six components, as in PR #256 (GoldenPlay 7.9), each derived only from bundle facts across the casino's AVAILABLE markets:

- **Trust:** 6.0 + 0.5 per regulator with a primary-verified `Active` licence, + 0.2 for the MGA licence (number not verified).
- **UX:** 6.8 + 0.25 per game category.
- **Payments:** 6.2 + 0.35 per payment method.
- **Games:** 6.2 + 0.15 per provider, + 0.5 for live casino.
- **Support:** 6.6 + 0.3 per support language, + 0.3 when every market has a support summary.
- **Responsible gambling:** 6.2 + 0.4 per verified regulator.

Each component is clamped to 6.0–9.0 (support ≤ 8.6, responsible gambling ≤ 8.2), and the score is the mean, rounded half-up to one decimal. No bundle carries a responsible-gambling page URL, which keeps that component low.

| Casino | Score | Trust | UX | Payments | Games | Support | RG | Verified regulators |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PlayOJO | **8.2** | 8.2 | 8.8 | 8.0 | 8.5 | 8.1 | 7.8 | DGOJ, Gambling Commission, Spelinspektionen, Spillemyndigheden |
| BacanaPlay | **8.0** | 7.2 | 8.6 | 9.0 | 8.1 | 8.1 | 7.0 | Gambling Commission, Serviço de Regulação e Inspeção de Jogos |
| DrückGlück | **8.0** | 7.2 | 8.6 | 9.0 | 8.5 | 7.8 | 7.0 | Gambling Commission, GGL |
| TurboNino | **8.0** | 7.7 | 8.6 | 8.7 | 7.9 | 7.8 | 7.4 | Gambling Commission, GGL, Spelinspektionen |
| Regency Casino Online | **7.9** | 7.2 | 8.6 | 9.0 | 7.9 | 7.5 | 7.0 | Gambling Commission, Hellenic Gaming Commission |
| AHTI Games | **7.8** | 7.2 | 8.6 | 8.0 | 8.2 | 7.8 | 7.0 | Gambling Commission, Spelinspektionen |
| EUcasino | **7.8** | 7.2 | 8.6 | 8.0 | 8.2 | 7.8 | 7.0 | Gambling Commission, Spillemyndigheden |
| SlotsMagic | **7.8** | 6.7 | 8.6 | 8.0 | 9.0 | 7.8 | 6.6 | Gambling Commission |
| JackpotStar | **7.7** | 7.2 | 7.8 | 8.0 | 8.2 | 8.1 | 7.0 | Gambling Commission, Spelinspektionen |
| Casino RedKings | **7.7** | 6.7 | 8.6 | 8.0 | 8.2 | 7.8 | 6.6 | Gambling Commission |
| PlayUZU | **7.7** | 6.7 | 8.6 | 8.0 | 8.2 | 7.8 | 6.6 | DGOJ |
| MegawaysCasino | **7.3** | 6.5 | 7.8 | 8.0 | 7.6 | 7.2 | 6.6 | Gambling Commission |
| PlayOJO Bingo | **7.2** | 6.5 | 7.5 | 8.0 | 7.2 | 7.2 | 6.6 | Gambling Commission |

Open items from the package: the MGA licence number, GB welcome offers for 9 brands, DK per-brand domains, the GGL check for TurboNino, the AGCO check for PlayOJO and SlotsMagic, and canonical logos.
