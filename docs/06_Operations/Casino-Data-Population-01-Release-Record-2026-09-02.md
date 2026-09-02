# CASINO-DATA-POPULATION-01 Release Record — 2 September 2026

**Status:** PROPOSED UNTIL EXACT MERGE AND BOUNDED PRODUCTION EXECUTION

**Authority:** current explicit Founder instruction `FOUNDER EXECUTION — MERGE GEO LOCALIZATION AND MOVE DIRECTLY TO CASINO POPULATION`

**Production origin:** `https://b4gamble.com`

No credential, connection URL, token, private portal record or private source value is included here.

## Frozen corpus decision

Nine named casinos were considered. The exact proposed factual import set is seven GB profiles:

| Casino | Market | Proposed factual state | Material omissions retained |
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

## Exact candidate artifacts

- Manifest SHA-256: `5c11dc16eb20807fa20a705f0d58d6a64045b95d803f1447c051780d2213c8d2`.
- Hello Casino bundle: `9996b4c6ea195bcd259a4b84ade3276057e3a9e17110c71470555b9bc6e94d40`.
- Skol Casino bundle: `6d934fd81f34f19e9f906bc22a41cc5dcaedfc5669833790043e39a8ca9715b8`.
- Diamond7 bundle: `0abec393d1ec974a3212255c6e65ba469798a132e62ded092782d78163960940`.
- G'day Casino bundle: `3e4d43d3a070e83b73b8f1fb5646e6df77ecd105a32b95cfb08e1faba9efe679`.
- 21 Privé bundle: `7619d8019a1deb764a9fe1fdad44c4b8dfefc6d108e44a29ec22e513945a4f97`.
- Slotnite bundle: `013adbd77056271856b0e4a606336fe62f8f613a9836ddab626e5116244989f1`.
- DragonBet bundle: `3b8ebaae872deadaa364159cc31333a5dc660e5dae5ba64841db289c63742092`.
- Twenty-eight bundle source-file hashes and five decision-record hashes reproduce from the frozen corpus.

Planned factual rows: seven Casinos; seven market profiles; seven licences; 14 licence-evidence rows; 53 market-evidence rows; zero payments; zero bonuses; three DragonBet-only providers; 14 scoped categories; zero commercial writes.

## Disposable acceptance

**DETECTED:** all 25 migrations applied through the governed staged migration harness to a fresh local `_ci` PostgreSQL database. The seven-bundle test then passed:

- a conflict in the final ordered bundle rolled back all seven Casino writes;
- first reconciliation: `121 created / 0 updated / 5 unchanged`, where the five unchanged rows are repeated reuse of the one White Hat Gaming operator created by the first White Hat bundle;
- writable retry: `0 created / 0 updated / 126 unchanged`;
- read-only repeatable-read comparison: `0 created / 0 updated / 126 unchanged`;
- no payment, bonus, image, media, affiliate route-country, Casino affiliate-link or legacy affiliate-link row was created;
- the earlier Betsson PE/SE PostgreSQL regression remained green.

## Asset and commercial boundary

No asset is proposed for publication. Frozen asset evidence marks every candidate `publicationEligible=false`; Diamond7 creative GEO is unknown, and the other eligible profiles have no authorised binary. The existing verified fallback is therefore required on each new profile.

No outbound route is proposed. The six Superfly GB plans are denied for the B4GAMBLE account and the DragonBet affiliate account is disabled. No campaign, tracker, destination, offer or `productionEligible=true` authority is fabricated.

## Remaining gates

Before this record can become `DETECTED — COMPLETE`:

1. exact-head CI and Vercel Preview must pass;
2. the durable importer/bundle PR must merge and its exact `main` deployment must reach Ready;
3. a separate checksum/commit/environment-bound execution-only path must verify Production identity, migration history, baseline inventory, collision freedom and commercial preservation;
4. the seven bundles must import and publish exactly once, followed by a read-only idempotency comparison;
5. public GB localized directory/detail/compare/bonus/best-offer surfaces, database-backed filters, fallbacks, no affiliate action and non-GB leakage must pass;
6. the one-time executor must be closed unmerged and exact Production evidence must replace this proposed section.
