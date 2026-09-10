# Global Current-Partner Commercial Rollout — 10 September 2026

**Status:** GLOBAL CURRENT-PARTNER COMMERCIAL ROLLOUT COMPLETE  
**Evidence date:** 10 September 2026  
**Application baseline:** `dea5d22d5b0c998fd0e4ca36cec52d6e30e63b8c`  
**Production deployment:** `dpl_A64EXh8tYj8toWexhdDovMAz7EYa` — READY  
**Authority:** Founder decision of 9 September 2026  
**Implementation classification:** **DETECTED** unless explicitly labelled otherwise

## Authority and durable boundary

The Founder-approved current-partner commercial authority is recorded in [GLOBAL-CURRENT-PARTNER-COMMERCIAL-AUTHORITY-2026-09-09](../07_Decisions/GLOBAL-CURRENT-PARTNER-COMMERCIAL-AUTHORITY-2026-09-09.md). It closes Founder, partner, account, KYC, AML, GEO, country, market, contract-review, written-confirmation, creative, banner and MEDIA-GEO3 approval workstreams for current established partners. Partner-provided tracking URLs are sufficient tracking authority; generic links may serve several exact GEO activations and exact-GEO links take precedence.

RFC-042 remains the only Production CTA authority. Direct law/regulation and missing or broken underlying partner routes remain independent fail-closed gates. The independent GB jurisdiction policy was not changed by this rollout.

## Production release

- Application baseline: `dea5d22d5b0c998fd0e4ca36cec52d6e30e63b8c`; READY deployment `dpl_A64EXh8tYj8toWexhdDovMAz7EYa`.
- Implementation PRs: [#223](https://github.com/AlexG-7BE/sevenbet-next/pull/223), [#224](https://github.com/AlexG-7BE/sevenbet-next/pull/224), [#225](https://github.com/AlexG-7BE/sevenbet-next/pull/225), [#226](https://github.com/AlexG-7BE/sevenbet-next/pull/226), [#227](https://github.com/AlexG-7BE/sevenbet-next/pull/227), [#229](https://github.com/AlexG-7BE/sevenbet-next/pull/229), [#230](https://github.com/AlexG-7BE/sevenbet-next/pull/230) and [#231](https://github.com/AlexG-7BE/sevenbet-next/pull/231).
- Final CRM correction merge: `dea5d22d5b0c998fd0e4ca36cec52d6e30e63b8c`.
- No schema migration was required. The fingerprint-guarded RFC-042 reconciliation normalized the current corpus and converged exact MarketActivations.
- The final private before-state snapshot was written to `/private/tmp/global-current-partner-rollout-2026-09-10-before-2026-09-10T16-02-38-586Z.json` with SHA-256 `3c717d9508b309049b96d4659f2b1e8ef732dd9254cac503fe4a1bd7399c966a`.
- The final successful result was written to `/private/tmp/global-current-partner-rollout-2026-09-10-result-2026-09-10T16-02-38-586Z.json` with SHA-256 `7d6251472638dedf75c3b3d4b9ffd4b41180ac662a0846bef07db642f5fa0546`.
- The first normalization attempt met a concurrent PostgreSQL serialization conflict while the merge deployment was building and rolled back atomically. The bounded retry after deployment READY completed successfully.
- Rollback remains possible from the private before-state snapshots and the preceding known-good Vercel deployment; no destructive migration occurred.

## Current partners and exact casino set

| Current partner | Casinos/brands represented |
| --- | --- |
| Betsson Group Affiliates | Betsafe, Betsson, Inkabet, NordicBet, Rizk, StarCasino, SuperCasino |
| NetoPartners / Anakatech / GoldenPlay | GoldenPlay |
| Super Partners | Aladdin Slots, All Slots, All Star Games, Amazon Slots, Aztec Wins, Betway, Big Thunder Slots, Buffalo Spins, Cash Arcade, Casper Games, Cop Slots, Crush Wins, Crystal Slots, Daily Record Bingo, Dove Bingo, Dove Slots, Eagle Spins, Euro Palace, Express Wins, Fairground Slots, Free Spins Bingo, Gaming Club, Grizzly's Quest, Hippodrome, Immortal Wins, Incredible Spins, Jackpot City, Lights Camera Bingo, Lit Wins, Loot Casino, Lucky Nugget, Matchup Casino, Mirror Bingo, Mr Wolf Slots, Mummys Gold, New Spins, OK Bingo, On Point Bingo, Pirate Slots, Platinum Play, Rainbow Spins, Riverbelle, Royal Vegas, Ruby Fortune, Showreel Bingo, Simba Slots, Slots Animal, Slots Kingdom, Space Wins, Spin Casino, Spin Galaxy, Spin Palace, Spy Slots, Star Wins, Sunny Wins, The Sun Play, Viking Bingo, Wild West Wins, Zeus Bingo |
| Superfly Partners / White Hat Gaming | 21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite |

Counts: **4 partners**, **73 casinos**, **25 unique supported GEO labels**, **540 Partner × Casino × GEO rows**.

Exact GEO labels: `AR`, `BR`, `CA`, `CA-ON`, `CA-OTHER`, `CL`, `CO`, `DE`, `DK`, `EE`, `ES`, `FI`, `GB`, `IE`, `IS`, `IT`, `LT`, `LV`, `MT`, `MX`, `NO`, `NZ`, `PE`, `RS`, `SE`.

## Classification and acceptance equation

| Final classification | Rows |
| --- | ---: |
| ACTIVE_HEALTHY | 24 |
| BLOCKED_BY_LAW | 24 |
| ACTION_REQUIRED_REGULATORY | 17 |
| BROKEN_ROUTE | 1 |
| MISSING_TRACKING_ROUTE | 474 |
| **Total** | **540** |

Acceptance equation: **540 = 24 + 24 + 17 + 1 + 474**. There are no unclassified rows and no other terminal states.

The complete machine-readable row authority is [matrix.v1.json](../../data/current-partner-global-rollout/matrix.v1.json).

## ACTIVE_HEALTHY — every row

Tracking identities below are bounded canonical identifiers, never raw URLs or tokens.

| Partner | Casino | GEO | AffiliateOffer | TrackingLink identity | Scope | Internal redirect | MarketActivation | Route verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Betsson Group Affiliates | Betsafe | EE | Betsson Group Affiliates:Betsafe:CASINO | BGA_DIRECT_LINK_ROW:30 | EXACT_GEO | /r/betsafe-casino | betsafe:EE:CASINO | HEALTHY — offers.betsafe.ee |
| Betsson Group Affiliates | Betsafe | LV | Betsson Group Affiliates:Betsafe:CASINO | BGA_DIRECT_LINK_ROW:1 | EXACT_GEO | /r/betsafe-casino | betsafe:LV:CASINO | HEALTHY — www.betsafe.lv |
| Betsson Group Affiliates | Betsson | BR | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:54 | GENERIC/GLOBAL | /r/betsson-casino | betsson:BR:CASINO | HEALTHY — www.betsson.com |
| Betsson Group Affiliates | Betsson | CO | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:54 | GENERIC/GLOBAL | /r/betsson-casino | betsson:CO:CASINO | HEALTHY — www.betsson.com |
| Betsson Group Affiliates | Betsson | DK | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:18 | GENERIC/GLOBAL | /r/betsson-casino | betsson:DK:CASINO | HEALTHY — www.betsson.com |
| Betsson Group Affiliates | Betsson | ES | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:54 | GENERIC/GLOBAL | /r/betsson-casino | betsson:ES:CASINO | HEALTHY — www.betsson.com |
| Betsson Group Affiliates | Betsson | MX | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:54 | GENERIC/GLOBAL | /r/betsson-casino | betsson:MX:CASINO | HEALTHY — www.betsson.com |
| Betsson Group Affiliates | Betsson | PE | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:47 | EXACT_GEO | /r/betsson-casino | betsson:PE:CASINO | HEALTHY — www.betsson.pe |
| Betsson Group Affiliates | Betsson | SE | Betsson Group Affiliates:Betsson:CASINO | BGA_DIRECT_LINK_ROW:19 | EXACT_GEO | /r/betsson-casino | betsson:SE:CASINO | HEALTHY — casino.betsson.com |
| Betsson Group Affiliates | NordicBet | DK | Betsson Group Affiliates:NordicBet:CASINO | BGA_DIRECT_LINK_ROW:14 | GENERIC/GLOBAL | /r/nordicbet-casino | nordicbet:DK:CASINO | HEALTHY — www.nordicbet.com |
| Betsson Group Affiliates | NordicBet | SE | Betsson Group Affiliates:NordicBet:CASINO | BGA_DIRECT_LINK_ROW:13 | EXACT_GEO | /r/nordicbet-casino | nordicbet:SE:CASINO | HEALTHY — www.nordicbet.com |
| Betsson Group Affiliates | Rizk | RS | Betsson Group Affiliates:Rizk:CASINO | BGA_DIRECT_LINK_ROW:5 | EXACT_GEO | /r/rizk-casino | rizk:RS:CASINO | HEALTHY — rizk.rs |
| Superfly Partners / White Hat Gaming | 21 Privé | IE | Superfly Partners / White Hat Gaming:21 Privé:CASINO | SUPERFLY_CANONICAL:21-prive | GENERIC/GLOBAL | /r/21-prive-welcome | 21-prive:IE:CASINO | HEALTHY — 21prive.com |
| Superfly Partners / White Hat Gaming | 21 Privé | MT | Superfly Partners / White Hat Gaming:21 Privé:CASINO | SUPERFLY_CANONICAL:21-prive | GENERIC/GLOBAL | /r/21-prive-welcome | 21-prive:MT:CASINO | HEALTHY — 21prive.com |
| Superfly Partners / White Hat Gaming | Diamond7 | IE | Superfly Partners / White Hat Gaming:Diamond7:CASINO | SUPERFLY_CANONICAL:diamond7 | GENERIC/GLOBAL | /r/diamond7-welcome | diamond7:IE:CASINO | HEALTHY — www.diamond7casino.com |
| Superfly Partners / White Hat Gaming | Diamond7 | MT | Superfly Partners / White Hat Gaming:Diamond7:CASINO | SUPERFLY_CANONICAL:diamond7 | GENERIC/GLOBAL | /r/diamond7-welcome | diamond7:MT:CASINO | HEALTHY — www.diamond7casino.com |
| Superfly Partners / White Hat Gaming | G'day Casino | IE | Superfly Partners / White Hat Gaming:G'day Casino:CASINO | SUPERFLY_CANONICAL:gday-casino | GENERIC/GLOBAL | /r/gday-casino-welcome | gday-casino:IE:CASINO | HEALTHY — www.gdaycasino.com |
| Superfly Partners / White Hat Gaming | G'day Casino | MT | Superfly Partners / White Hat Gaming:G'day Casino:CASINO | SUPERFLY_CANONICAL:gday-casino | GENERIC/GLOBAL | /r/gday-casino-welcome | gday-casino:MT:CASINO | HEALTHY — www.gdaycasino.com |
| Superfly Partners / White Hat Gaming | Hello Casino | IE | Superfly Partners / White Hat Gaming:Hello Casino:CASINO | SUPERFLY_CANONICAL:hello-casino | GENERIC/GLOBAL | /r/hello-casino-welcome | hello-casino:IE:CASINO | HEALTHY — www.hellocasino.com |
| Superfly Partners / White Hat Gaming | Hello Casino | MT | Superfly Partners / White Hat Gaming:Hello Casino:CASINO | SUPERFLY_CANONICAL:hello-casino | GENERIC/GLOBAL | /r/hello-casino-welcome | hello-casino:MT:CASINO | HEALTHY — www.hellocasino.com |
| Superfly Partners / White Hat Gaming | Skol Casino | IE | Superfly Partners / White Hat Gaming:Skol Casino:CASINO | SUPERFLY_CANONICAL:skol-casino | GENERIC/GLOBAL | /r/skol-casino-welcome | skol-casino:IE:CASINO | HEALTHY — www.skolcasino.com |
| Superfly Partners / White Hat Gaming | Skol Casino | MT | Superfly Partners / White Hat Gaming:Skol Casino:CASINO | SUPERFLY_CANONICAL:skol-casino | GENERIC/GLOBAL | /r/skol-casino-welcome | skol-casino:MT:CASINO | HEALTHY — www.skolcasino.com |
| Superfly Partners / White Hat Gaming | Slotnite | IE | Superfly Partners / White Hat Gaming:Slotnite:CASINO | SUPERFLY_CANONICAL:slotnite | GENERIC/GLOBAL | /r/slotnite-welcome | slotnite:IE:CASINO | HEALTHY — www.slotnite.com |
| Superfly Partners / White Hat Gaming | Slotnite | MT | Superfly Partners / White Hat Gaming:Slotnite:CASINO | SUPERFLY_CANONICAL:slotnite | GENERIC/GLOBAL | /r/slotnite-welcome | slotnite:MT:CASINO | HEALTHY — www.slotnite.com |

## NON-ACTIVE — law, regulation and broken route, every row

| Partner | Casino | GEO | Final classification | Exact reason |
| --- | --- | --- | --- | --- |
| Betsson Group Affiliates | Betsafe | CA | ACTION_REQUIRED_REGULATORY | Establish exact province-level operator authority and routing before any Canada-wide commercial CTA. |
| Betsson Group Affiliates | Betsson | AR | ACTION_REQUIRED_REGULATORY | Add exact province-level authority and routing; current evidence is limited to the Province of Buenos Aires and must not create an Argentina-wide CTA. |
| Betsson Group Affiliates | Betsson | CL | BLOCKED_BY_LAW | Current Chile regulator evidence directly blocks ordinary commercial online-casino promotion. |
| Betsson Group Affiliates | Betsson | IS | ACTION_REQUIRED_REGULATORY | Establish current exact Iceland operator/domain authority before commercial activation. |
| Betsson Group Affiliates | Betsson | IT | BLOCKED_BY_LAW | The current B4GAMBLE Italy baseline is informational-only and blocks an ordinary affiliate CTA. |
| Betsson Group Affiliates | Inkabet | PE | BROKEN_ROUTE | All six captured Inkabet PE partner routes reach Inkabet but persistently return HTTP 403 under repeated canonical browser-like verification. |
| Betsson Group Affiliates | NordicBet | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Betsson Group Affiliates | Rizk | CA-ON | ACTION_REQUIRED_REGULATORY | Ontario requires exact provincial operator/domain authority and activation timing; current evidence schedules support after the present rollout date. |
| Betsson Group Affiliates | Rizk | CA-OTHER | ACTION_REQUIRED_REGULATORY | Map each supported Canadian province and its operator authority before enabling the generic Canada route. |
| Betsson Group Affiliates | Rizk | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Betsson Group Affiliates | StarCasino | IT | BLOCKED_BY_LAW | The current B4GAMBLE Italy baseline is informational-only and blocks an ordinary affiliate CTA. |
| Betsson Group Affiliates | SuperCasino | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | 21 Privé | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | 21 Privé | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | 21 Privé | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | 21 Privé | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | 21 Privé | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | Diamond7 | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | Diamond7 | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | Diamond7 | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | Diamond7 | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | Diamond7 | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | G'day Casino | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | G'day Casino | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | G'day Casino | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | G'day Casino | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | G'day Casino | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | Hello Casino | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | Hello Casino | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | Hello Casino | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | Hello Casino | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | Hello Casino | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | Skol Casino | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | Skol Casino | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | Skol Casino | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | Skol Casino | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | Skol Casino | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |
| Superfly Partners / White Hat Gaming | Slotnite | CA | ACTION_REQUIRED_REGULATORY | Implement and evidence exact Canadian province routing/authority before enabling a country-wide CTA; Ontario and other provincial regimes must not be bypassed. |
| Superfly Partners / White Hat Gaming | Slotnite | FI | BLOCKED_BY_LAW | Current Finnish law blocks the relevant foreign affiliate promotion before July 2027. |
| Superfly Partners / White Hat Gaming | Slotnite | GB | ACTION_REQUIRED_REGULATORY | The exact White Hat Gaming licence and domain are currently active in the UKGC register, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. An explicit GB legal/commercial policy activation is required before the exact route may serve a CTA. |
| Superfly Partners / White Hat Gaming | Slotnite | NO | BLOCKED_BY_LAW | Current Norwegian law blocks marketing of unauthorized foreign gambling. |
| Superfly Partners / White Hat Gaming | Slotnite | NZ | BLOCKED_BY_LAW | Current New Zealand affiliate/referral prohibition blocks this commercial CTA. |

## NON-ACTIVE — missing tracking route, every row

Each GEO in a grouped cell is one individual canonical matrix row. Rows are grouped only where partner, casino, classification and exact reason are identical. The groups below represent all **474** MISSING_TRACKING_ROUTE rows.

| Partner | Casino | GEO row(s) | Final classification | Exact reason |
| --- | --- | --- | --- | --- |
| Betsson Group Affiliates | Betsafe | LT | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| NetoPartners / Anakatech / GoldenPlay | GoldenPlay | GB | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Aladdin Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | All Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | All Star Games | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Amazon Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Aztec Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Betway | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Big Thunder Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Buffalo Spins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Cash Arcade | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Casper Games | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Cop Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Crush Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Crystal Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Daily Record Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Dove Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Dove Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Eagle Spins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Euro Palace | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Express Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Fairground Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Free Spins Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Gaming Club | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Grizzly's Quest | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Hippodrome | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Immortal Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Incredible Spins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Jackpot City | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Lights Camera Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Lit Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Loot Casino | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Lucky Nugget | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Matchup Casino | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Mirror Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Mr Wolf Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Mummys Gold | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | New Spins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | OK Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | On Point Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Pirate Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Platinum Play | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Rainbow Spins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Riverbelle | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Royal Vegas | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Ruby Fortune | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Showreel Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Simba Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Slots Animal | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Slots Kingdom | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Space Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Spin Casino | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Spin Galaxy | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Spin Palace | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Spy Slots | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Star Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Sunny Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | The Sun Play | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Viking Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Wild West Wins | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |
| Super Partners | Zeus Bingo | CA-ON, DE, ES, GB, IE, IT, MT, MX | MISSING_TRACKING_ROUTE | No actual partner-provided affiliate URL is present in the authorized current repository, Production, or CRM data. |

## CRM reconciliation

- All four current opportunities are `ACTIVE`, `waitingOn=NONE`, with current Founder authority evidence.
- Stale approval, KYC, AML, GEO, country, media, banner, contract-review and written-confirmation evidence/tasks were superseded or completed without deleting history.
- Current actions are limited to two Superfly regulatory actions (Canada exact-province routing and explicit GB legal/commercial policy activation), three BGA actions (Inkabet route repair, exact Argentina/Iceland/Canadian regulatory work, and a truly missing Betsafe LT partner URL), one GoldenPlay missing-URL action and one grouped Super Partners missing-route action.
- No current action requests partner, Founder, KYC/AML, GEO/country, contract, written confirmation, promotional creative, banner or MEDIA-GEO3 approval.

## Tracking and route evidence

- All 60 discovered BGA direct links were normalized. Existing six Superfly canonical partner links were retained and reused across exact supported GEO activations.
- Generic/global links were reused where appropriate; exact-GEO links take precedence for Betsafe EE/LV, Betsson PE/SE, NordicBet SE and Rizk RS.
- Neutral evergreen `Visit Casino` AffiliateOffers were used where exact bonus terms were not known; no bonus claim was invented.
- The 25 explicitly authorized remaining partner routes were checked through bounded neutral egress at 2026-09-10T14:32:18.249Z: **25/25 HEALTHY**, expected exact hosts reached, attribution retained where deterministically checkable, and raw URL emission zero.
- The sanitized 25-route result file is `/private/tmp/current-partner-authorized-route-verification-result-v10.json`, SHA-256 `cf015f41c502c213a7e2e67b2a02748ccd3eab66f65fce94995daafa9bd561b2`.
- Inkabet PE remains BROKEN_ROUTE: all six captured partner routes reach Inkabet but persistently return real HTTP 403 responses.
- GoldenPlay receipt evidence exists, but its stored CRM corpus contains only public `www.netopartners.com` sources and Production contains zero GoldenPlay canonical or legacy tracking links. No partner URL value exists to normalize, so none was manufactured.
- Super Partners has no captured underlying partner URL for its current merchant inventory; those rows remain MISSING_TRACKING_ROUTE.

## GB policy reconciliation

The [UKGC White Hat Gaming licence summary](https://www.gamblingcommission.gov.uk/public-register/business/detail/52894) identifies Remote Casino authority as active, and the [UKGC White Hat domain register](https://www.gamblingcommission.gov.uk/public-register/business/detail/domain-names/52894) lists the exact six domains. This is public regulator evidence, not partner-approval reverification.

The exact operator/domain evidence is current, but B4GAMBLE's independent GB jurisdiction policy still denies commercial/referral capability. All six Superfly GB MarketActivations are therefore canonically DISABLED and ACTION_REQUIRED_REGULATORY until an explicit GB legal/commercial policy activation occurs. Their underlying partner routes remain technically healthy; no Founder or partner reapproval is required afterward.

The first Production runtime pass correctly returned controlled unavailability for five newly proposed GB routes; reconciliation then removed the inconsistent pre-existing Diamond7 GB activation as well. The final runtime pass proved all six GB routes disabled.

## Locales and SEO

- Published locale set remains: `en-GB`, `de-DE`, `es-ES`, `el-GR`, `sv-SE`, `da-DK`, `it-IT`, `pt-PT`, `nl-NL`, `fi-FI`, `nb-NO`.
- `fr-FR` remains unpublished because it is absent from the canonical language registry, public-shell catalog, Programme catalog, QA corpus and Founder publication acceptance evidence. No French content was generated.
- No other complete unpublished locale was detected.
- No localized Product page was newly made indexable. Current localized surfaces remain intentionally `noindex, follow` under `LOCAL_LEGAL_REVIEW_REQUIRED`; commercial activation does not override the independent SEO publication gate.

## Production verification

- Focused rollout tests: 11/11 passed; typecheck and Production build passed.
- PR #230 CI run `34492289015` passed Agent Core, Quality, Database/Migration Verification, Build/Browser and Vercel.
- Canonical read-only DB postflight passed with 540 expected matrix rows, 24 expected ACTIVE_HEALTHY rows, 72 activation records, 60 normalized BGA links, four CRM opportunities and seven legitimate current tasks.
- Final isolated Production-runtime verifier `dpl_AAtSbBzTxDs7BErngcvANyzvgSFs` was created with `--skip-domain`, called once through Vercel protection, and deleted immediately afterward.
- Runtime result at 2026-09-10T15:37:05.085Z: 24 active routes passed governed 302 and attribution-identity checks; six GB routes passed controlled policy-denied 303 checks; eight negative cross-GEO probes passed; leakage count zero; raw URL emission zero.
- The sanitized runtime result file is `/private/tmp/current-partner-final-runtime-result.json`, SHA-256 `8bc2f0ac1c913112c58428501f0439b11d6c90160f9b4a20b41923c177777579`.
- Production diagnostic audit: nine verifier activity records; zero raw URL patterns, zero `trackingUrl` fields and zero token-like query parameters.
- Exact global fallback rows remain disabled; Rizk country-wide Canada remains disabled; locale selection does not alter trusted jurisdiction.
- Logo-only Product and MEDIA-GEO3 retirement remain unchanged.

## Remaining items — terminal classifications only

- **BLOCKED_BY_LAW:** the 24 rows listed above.
- **ACTION_REQUIRED_REGULATORY:** the 17 rows listed above, including the independent six-route GB policy action.
- **BROKEN_ROUTE:** Inkabet PE only.
- **MISSING_TRACKING_ROUTE:** the 474 rows exhaustively represented above.

There is no remaining partner approval, KYC, AML, GEO approval, Founder approval, contract review, written-confirmation request, MEDIA-GEO3 task, or internal technical failure disguised as a blocker.
