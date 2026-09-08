# Safe Offer Corpus — 60-row Direct-Link Audit

**Date:** 8 September 2026

**Authority:** explicit Founder instruction for SAFE OFFER CORPUS COMPLETION

**Executable audit:** `lib/casino-offer-corpus/direct-link-audit.ts`
**Regression:** `tests/safe-offer-corpus.test.ts`

## Evidence boundary

**DETECTED:** the repository raw source, normalized source and Founder-provided local CSV each contain 60 data rows. The title, description and tracking URL triples are identical and remain in the same order after newline normalization. The local file uses different line endings, so byte hashes are not treated as semantic disagreement.

**DETECTED:** every normalized row is classified `DETECTED`, has `productionEligible=False` and has no `routeSetupId`. Therefore all 60 rows have **no direct commercial mapping**. This does not remove or replace independently governed RFC-042 `MarketActivation` records.

**DETECTED:** a `WELCOME_OFFER` label proves an offer route exists in the named source scope. It does not prove an amount, percentage, currency, wagering rule, minimum deposit, eligibility, expiry, legal eligibility elsewhere or commercial authority.

**INFERRED:** row 53 is a sportsbook welcome route and is not a casino offer despite the source export's Product=Casino context. Row 28 is SuperCasino brand protection, not a welcome offer. Neither is converted into casino editorial or commercial data.

## Deterministic totals

| Measure | Result |
|---|---:|
| Total rows | 60 |
| `WELCOME_OFFER`-labelled rows | 20 |
| Casino offer rows | 19 |
| Non-offer rows | 40 |
| Non-casino welcome rows | 1 |
| Exact-market casino offers | 15 |
| Genuine ROW casino offers | 2 |
| Regional/non-ROW casino offers | 2 |
| Editorial matches after Phase B | 14 |
| Missing editorial matches retained intentionally | 5 |
| Phase B reconciliations | 3 |
| Intentional exclusions, including non-casino rows | 7 |
| Rows with no direct commercial mapping | 60 |
| Unresolved contradictions | 1 |

The 14 editorial matches count each source row, including language variants that correctly map to one existing Betsafe EE or LV bonus. They do not imply 14 distinct bonus records.

## Reconciliation decision

**DETECTED / RECONCILED:** exactly three omissions have sufficient scope evidence and an existing safe representation:

- row 10 — `starcasino-it-welcome`, attached to the existing Italian `CasinoCountry`;
- row 38 — `rizk-row-welcome`, a global `CasinoBonus` with no `casinoCountryId` and `geoMode=GLOBAL`;
- row 56 — `nordicbet-row-welcome`, using the same existing global mechanism.

Only route existence is established, so all three retain sparse terms. They create no affiliate, redirect, `MarketActivation`, media or score mutation.

**CONTRADICTION / INTENTIONAL EXCLUSION:** Rizk NZ remains absent because the direct link does not resolve the existing legal/footer contradiction.

**UNKNOWN / INTENTIONAL EXCLUSION:** Betsson CL and IS have no published country profiles to which an exact-market bonus can safely attach. Betsson EN is not explicitly ROW; Betsson LATAM is a regional scope with no country list. None is converted into global/ROW data by inference. Existing Betsson PE and SE editorial records remain the corresponding matches for those exact rows.

## Row-by-row audit

`NONE` in the commercial column means the direct-link source row has no B4GAMBLE commercial mapping. Raw tracking URLs and tokens are deliberately omitted from this document; provenance remains in the governed repository CSV.

| Row | Brand | Scope | Lang | Intent | Casino offer | Editorial | Editorial record / exclusion | Commercial | Contradiction |
|---:|---|---|---|---|:---:|---|---|---|:---:|
| 1 | Betsafe Baltics | COUNTRY/LV | lv | Homepage | NO | NOT_APPLICABLE | — | NONE | NO |
| 2 | Rizk | COUNTRY/RS | sr | Jackpot Slots | NO | NOT_APPLICABLE | — | NONE | NO |
| 3 | Rizk | COUNTRY/RS | sr | Registration Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 4 | Rizk | COUNTRY/RS | sr | Bonus Terms | NO | NOT_APPLICABLE | — | NONE | NO |
| 5 | Rizk | COUNTRY/RS | sr | Slots Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 6 | Rizk | COUNTRY/RS | sr | Wheel Of Rizk | NO | NOT_APPLICABLE | — | NONE | NO |
| 7 | Rizk | COUNTRY/RS | sr | Terms & Conditions | NO | NOT_APPLICABLE | — | NONE | NO |
| 8 | Rizk | EXACT_MARKET | sr | Welcome Offer | YES | MATCH | rizk-rs-welcome | NONE | NO |
| 9 | Rizk | COUNTRY/RS | sr | Promotions Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 10 | StarCasino | EXACT_MARKET | it | Bonus Benvenuto Casino | YES | PHASE_B_RECONCILED | starcasino-it-welcome | NONE | NO |
| 11 | Betsson | EXACT_MARKET | sv | Casino Welcome Bonus | YES | MATCH | betsson-se-casino-welcome-observation | NONE | NO |
| 12 | Rizk | EXACT_MARKET | en | Casino Welcome Offer | YES | MISSING_INTENTIONAL | RIZK_NZ_LEGAL_PROFILE_UNRESOLVED | NONE | YES |
| 13 | NordicBet | COUNTRY/SE | sv | Casino Lobby Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 14 | NordicBet | ROW | en | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 15 | Betsson | COUNTRY/IS | is | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 16 | Betsson | REGIONAL | en | Casino Welcome Bonus | YES | MISSING_INTENTIONAL | BETSSON_EN_SCOPE_IS_NOT_EXPLICIT_ROW | NONE | NO |
| 17 | Betsson | EN | en | Casino Scratch Lobby Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 18 | Betsson | EN | en | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 19 | Betsson | COUNTRY/SE | sv | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 20 | Betsafe Baltics | EXACT_MARKET | lv | Casino Welcome Offer | YES | MATCH | betsafe-lv-welcome | NONE | NO |
| 21 | Betsson | COUNTRY/CL | es | El Proximo Crack De Chile | NO | NOT_APPLICABLE | — | NONE | NO |
| 22 | Inkabet | COUNTRY/PE | es | Aviator | NO | NOT_APPLICABLE | — | NONE | NO |
| 23 | Rizk | EXACT_MARKET | en | Casino Welcome Offer | YES | MATCH | rizk-ca-welcome | NONE | NO |
| 24 | Betsson | COUNTRY/SE | sv | King Millions Blazing Bison Gold Blitz | NO | NOT_APPLICABLE | — | NONE | NO |
| 25 | Betsson | COUNTRY/CL | es | Casino Tournament Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 26 | Betsafe Baltics | EXACT_MARKET | en | Casino Welcome Offer | YES | MATCH | betsafe-ee-welcome | NONE | NO |
| 27 | Inkabet | COUNTRY/PE | es | Inkatonazo | NO | NOT_APPLICABLE | — | NONE | NO |
| 28 | SuperCasino | COUNTRY/NZ | en | Brand Protection | NO | NOT_APPLICABLE | SUPERCASINO_BRAND_PROTECTION_ROW_IS_NOT_AN_OFFER | NONE | NO |
| 29 | Betsafe Baltics | EXACT_MARKET | ru | Casino Welcome Offer | YES | MATCH | betsafe-lv-welcome | NONE | NO |
| 30 | Betsafe Baltics | EXACT_MARKET | et | Casino Welcome Offer | YES | MATCH | betsafe-ee-welcome | NONE | NO |
| 31 | Betsafe Baltics | EXACT_MARKET | en | Casino Welcome Offer | YES | MATCH | betsafe-lv-welcome | NONE | NO |
| 32 | StarCasino | COUNTRY/IT | it | App | NO | NOT_APPLICABLE | — | NONE | NO |
| 33 | Rizk | COUNTRY/CA | en | Signup Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 34 | Betsson | COUNTRY/CL | es | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 35 | Betsson | COUNTRY/CL | es | Registration Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 36 | Betsson | COUNTRY/PE | es | Juegos Crash | NO | NOT_APPLICABLE | — | NONE | NO |
| 37 | Betsson | COUNTRY/PE | es | Juegos Exclusivos | NO | NOT_APPLICABLE | — | NONE | NO |
| 38 | Rizk | ROW | en | Casino Welcome Offer | YES | PHASE_B_RECONCILED | rizk-row-welcome | NONE | NO |
| 39 | Rizk | COUNTRY/NZ | en | Rizk Race | NO | NOT_APPLICABLE | — | NONE | NO |
| 40 | Rizk | COUNTRY/NZ | en | Wheel of Rizk | NO | NOT_APPLICABLE | — | NONE | NO |
| 41 | Rizk | COUNTRY/NZ | en | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 42 | Betsson | EXACT_MARKET | es | Casino Welcome Offer | YES | MISSING_INTENTIONAL | BETSSON_CL_HAS_NO_PUBLISHED_COUNTRY_PROFILE | NONE | NO |
| 43 | Rizk | ROW | en | Wheel of Rizk | NO | NOT_APPLICABLE | — | NONE | NO |
| 44 | Rizk | ROW | en | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 45 | Inkabet | COUNTRY/PE | es | Ruleta Inkabet | NO | NOT_APPLICABLE | — | NONE | NO |
| 46 | Betsson | EXACT_MARKET | is | Casino Welcome Bonus | YES | MISSING_INTENTIONAL | BETSSON_IS_HAS_NO_PUBLISHED_COUNTRY_PROFILE | NONE | NO |
| 47 | Betsson | COUNTRY/PE | es | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 48 | StarCasino | COUNTRY/IT | it | Registration Page | NO | NOT_APPLICABLE | — | NONE | NO |
| 49 | Betsson | LATAM | es | Top 3 - Piggy Bank | NO | NOT_APPLICABLE | — | NONE | NO |
| 50 | Betsson | LATAM | es | Top 1 - First Person American roulette | NO | NOT_APPLICABLE | — | NONE | NO |
| 51 | Inkabet | COUNTRY/PE | es | Casino lobby page | NO | NOT_APPLICABLE | — | NONE | NO |
| 52 | Inkabet | EXACT_MARKET | es | Casino Welcome Offer | YES | MATCH | inkabet-pe-welcome | NONE | NO |
| 53 | Inkabet | COUNTRY/PE | es | Sportsbook Welcome Offer | NO | NOT_APPLICABLE | SPORTSBOOK_OFFER_OUTSIDE_CASINO_OFFER_CORPUS | NONE | NO |
| 54 | Betsson | LATAM | es | Casino Lobby | NO | NOT_APPLICABLE | — | NONE | NO |
| 55 | NordicBet | EXACT_MARKET | sv | Casino Welcome Bonus | YES | MATCH | nordicbet-se-welcome | NONE | NO |
| 56 | NordicBet | ROW | en | ROW \| Casino Welcome Offer | YES | PHASE_B_RECONCILED | nordicbet-row-welcome | NONE | NO |
| 57 | Betsson | EXACT_MARKET | es | Casino Welcome Offer | YES | MATCH | betsson-pe-casino-welcome-observation | NONE | NO |
| 58 | Betsson | EN | en | Live Casino Home | NO | NOT_APPLICABLE | — | NONE | NO |
| 59 | Betsson | REGIONAL | es | Casino Welcome Offer | YES | MISSING_INTENTIONAL | BETSSON_LATAM_SCOPE_IS_NOT_ROW_AND_HAS_NO_COUNTRY_LIST | NONE | NO |
| 60 | Betsafe Baltics | COUNTRY/LV | lv | Registration page | NO | NOT_APPLICABLE | — | NONE | NO |
