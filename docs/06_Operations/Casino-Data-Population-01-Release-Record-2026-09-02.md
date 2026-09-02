# CASINO-DATA-POPULATION-01 Release Record — 2 September 2026

**Status:** DETECTED — COMPLETE

**Authority:** current explicit Founder instruction `FOUNDER EXECUTION — MERGE GEO LOCALIZATION AND MOVE DIRECTLY TO CASINO POPULATION`

**Production origin:** `https://b4gamble.com`

No credential, connection URL, token, private portal record or private source value is included here.

## Frozen corpus decision

Nine named casinos were considered. The exact imported factual set is seven GB profiles:

| Casino | Market | Imported factual state | Material omissions retained |
| --- | --- | --- | --- |
| Hello Casino | GB | exact domain, White Hat operator, active Gambling Commission remote-casino licence, Casino category | legal/safety links, language, currency, payments, KYC, withdrawals, bonuses, providers and assets remain `UNKNOWN` |
| Skol Casino | GB | exact domain, White Hat operator, active Gambling Commission remote-casino licence, Casino category | legal/safety links, language, currency, payments, KYC, withdrawals, bonuses, providers and assets remain `UNKNOWN` |
| Diamond7 | GB | exact domain, White Hat operator, active Gambling Commission remote-casino licence, Casino category | language, currency, payments, KYC, withdrawals, bonuses and providers remain `UNKNOWN`; portal assets are not publication-eligible |
| G'day Casino | GB | exact domain/operator/licence, official terms and safer-gambling links, English support, 18+ verification/KYC and bounded withdrawal summary | currency, exact payment set, bonus, provider catalogue, privacy URL and assets remain `UNKNOWN` |
| 21 Privé | GB | exact domain/operator/licence, official terms and safer-gambling links, English support, 18+ verification/KYC and bounded withdrawal summary | currency, exact payment set, bonus, provider catalogue, privacy URL and assets remain `UNKNOWN` |
| Slotnite | GB | exact domain/operator/licence, official terms and safer-gambling links, English support, 18+ verification/KYC and bounded withdrawal summary | currency, exact payment set, bonus, provider catalogue, privacy URL and assets remain `UNKNOWN` |
| DragonBet | GB | exact DragonBet Ltd domain/operator/licence, official legal/safety links, English, product categories and three observed providers | currency, payments, KYC, withdrawals, bonus and minimum age remain `UNKNOWN`; legacy trading-name contradiction is retained |

Skipped:

- Betsson — `UNCHANGED_ALREADY_PRESENT`: PE and SE were already imported and published in Production; the Founder instruction forbids re-import.
- Gentleman Jim — `BLOCKED_NO_CURRENT_ACTIVE_GB_CASINO`: its GB remote-casino licence is surrendered, exact domain is inactive, site returned HTTP 503, affiliate account is disabled and portal inventory is stale/contradictory.

## Exact frozen artifacts

- Manifest SHA-256: `5c11dc16eb20807fa20a705f0d58d6a64045b95d803f1447c051780d2213c8d2`.
- Hello Casino bundle: `9996b4c6ea195bcd259a4b84ade3276057e3a9e17110c71470555b9bc6e94d40`.
- Skol Casino bundle: `6d934fd81f34f19e9f906bc22a41cc5dcaedfc5669833790043e39a8ca9715b8`.
- Diamond7 bundle: `0abec393d1ec974a3212255c6e65ba469798a132e62ded092782d78163960940`.
- G'day Casino bundle: `3e4d43d3a070e83b73b8f1fb5646e6df77ecd105a32b95cfb08e1faba9efe679`.
- 21 Privé bundle: `7619d8019a1deb764a9fe1fdad44c4b8dfefc6d108e44a29ec22e513945a4f97`.
- Slotnite bundle: `013adbd77056271856b0e4a606336fe62f8f613a9836ddab626e5116244989f1`.
- DragonBet bundle: `3b8ebaae872deadaa364159cc31333a5dc660e5dae5ba64841db289c63742092`.
- Twenty-eight bundle source-file hashes and five decision-record hashes reproduce from the frozen corpus.

Imported factual rows: seven Casinos; seven market profiles; seven licences; 14 licence-evidence rows; 53 market-evidence rows; zero payments; zero bonuses; three DragonBet-only providers; 14 scoped categories; zero commercial writes.

## Disposable acceptance

**DETECTED:** all 25 migrations applied through the governed staged migration harness to a fresh local `_ci` PostgreSQL database. The seven-bundle test then passed:

- a conflict in the final ordered bundle rolled back all seven Casino writes;
- first reconciliation: `121 created / 0 updated / 5 unchanged`, where the five unchanged rows are repeated reuse of the one White Hat Gaming operator created by the first White Hat bundle;
- writable retry: `0 created / 0 updated / 126 unchanged`;
- read-only repeatable-read comparison: `0 created / 0 updated / 126 unchanged`;
- no payment, bonus, image, media, affiliate route-country, Casino affiliate-link or legacy affiliate-link row was created;
- the earlier Betsson PE/SE PostgreSQL regression remained green.

## Durable merge and bounded Production execution

**DETECTED:** the checksum-bound importer, frozen bundles, execution guard and regression coverage merged through PR #123 as `ae17cdd5384f185545c5ed7e5e9493bcb721824a`. Its cold Preview deployment `dpl_Gdry15omMNUSXNZMbWZB96g763SF` and post-merge Production deployment `dpl_GzNDBNViJN7NDXRmGpijrQ1BW6fG` reached Ready before Production mutation.

**DETECTED:** the one-shot execution branch was fixed at `f6a0c289693133b8505ef62be6847a1636daf2e5`. PR #124 passed Quality, Agent Core, Database / Migration Verification, Build / Browser and Vercel Preview, then the exact Production executor `dpl_6GR4ggFz8vYKvuUeoCeyB7dSJmjT` performed the bounded transaction. Preflight confirmed the exact Vercel project and Production environment, the same database identity for pooled and direct connections, all 25 migrations applied, the expected baseline, no candidate collisions and unchanged Betsson PE/SE records.

The committed reconciliation was exactly:

| Model | Created | Updated | Unchanged |
| --- | ---: | ---: | ---: |
| CasinoBrand | 7 | 0 | 0 |
| Casino | 7 | 0 | 0 |
| CasinoOperator | 2 | 0 | 5 |
| CasinoCountry | 7 | 0 | 0 |
| CasinoCountryEvidence | 53 | 0 | 0 |
| CasinoLicense | 7 | 0 | 0 |
| CasinoCountryLicense | 7 | 0 | 0 |
| CasinoLicenseEvidence | 14 | 0 | 0 |
| CasinoGameCategory | 14 | 0 | 0 |
| CasinoGameProvider | 3 | 0 | 0 |
| **Total** | **121** | **0** | **5** |

The in-transaction idempotency comparison and the final post-commit read-only comparison were both exactly `0 created / 0 updated / 126 unchanged`. The executor then stopped at the intentional `CASINO_DATA_POPULATION_01_COMPLETE_STOP`; its deployment is `Error` by design and was never promoted or assigned the public domain. PR #124 was closed unmerged after the committed database result was verified.

The exact post-commit Production inventory reported by the executor was: 34 Casinos, 34 markets, four operators, eight brands, 35 licences, 18 licence-evidence rows, 77 market-evidence rows, ten market-licence links, 78 payments, 53 providers, 78 categories, 27 bonuses, one media row, 75 images, 52 versions, 249 revisions, 25 SEO rows, 25 editorial reviews, five affiliate programmes, five affiliate offers, five affiliate tracking links, zero affiliate route countries, five affiliate redirects, zero Casino affiliate links, zero legacy affiliate links, 60 commercial opportunities and zero Production-eligible routes.

## Asset and commercial boundary

No asset was published. Frozen asset evidence marks every candidate `publicationEligible=false`; Diamond7 creative GEO is unknown, and the other eligible profiles have no authorised binary. All seven Production profiles therefore use the existing verified fallback.

No outbound route was published. The six Superfly GB plans are denied for the B4GAMBLE account and the DragonBet affiliate account is disabled. No campaign, tracker, destination, offer or `productionEligible=true` authority was fabricated. All seven public records expose `affiliate.available=false` and `affiliate.href=null`.

## Final Production acceptance

**DETECTED:** the scoreless-profile comparison defect discovered during live acceptance was fixed through PR #125. Merge `8e4cc093f5bbd9775ad60d586101aabd07308b78` passed all six CI/Preview gates and deployed as Ready Production deployment `dpl_7Y4v58gkALDRNjkprNxCRhtzRLfR`, aliased to `b4gamble.com` and `www.b4gamble.com`.

Live acceptance against that exact release confirmed:

- `/api/public/casinos?country=GB` returns 25 records, including exactly the seven imported slugs; PE returns one record (`betsson`) and SE returns two (`demo-prism`, `betsson`), with none of the seven leaking outside GB;
- GB search for Hello Casino returns only `hello-casino`; the Inspired and Live Casino filters each return only `dragonbet`; the Gambling Commission filter returns exactly the seven imported profiles;
- all seven `/en-gb/casino/{slug}` routes return 200 with exact names, self-canonicals, `Suitable artwork unavailable`, `Offer unavailable` and no `/r/` or `/go/` route;
- explicit Hello Casino / DragonBet comparison returns `available`, retains both null editorial scores as `Unknown`, retains all other missing evidence as `Unknown` or `Unavailable`, and exposes no commercial action;
- legacy `/compare` resolves to the canonical localized Casino directory with the exact selection;
- the GB bonus API returns zero records, while `/en-gb/bonuses`, `/en-gb/best-offers` and `/program` return 200 with no imported casino name or commercial route.

## Retained gaps

This release does not claim completeness where evidence is absent. The material omissions in the frozen-corpus table remain `UNKNOWN`; DragonBet's legacy trading-name evidence remains `CONTRADICTION`; all seven profiles remain without an authorised image, evidenced bonus, evidenced payment method or commercial route. Gentleman Jim remains blocked rather than imported. Betsson remains the unchanged pre-existing PE/SE record. These are explicit evidence boundaries, not failed release gates.
