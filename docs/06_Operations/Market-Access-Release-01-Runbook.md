# MARKET-ACCESS-RELEASE-01 — align activations with the licence register

**Decision:** `FOUNDER-MARKET-ACCESS-2026-09-24` ([RFC-054](../06_RFC/RFC-054-Licence-Market-Access.md))
**Command:** `npm run market-access:release -- <plan|verify|apply>`
**Writes Production:** only `apply`, only after the Founder's explicit confirmation of the plan below.

## What it does

RFC-054's register already stops the button, `/r/` and the offer in every closed
market the moment the code is deployed. This release removes the dead weight and
opens the licensed markets that have a partner link:

- **Disable** every `ACTIVE` MarketActivation in a market the register closes
  (operator block, prohibition by law, no local licence, closed grey zone), through
  `marketActivationController.disableCasinoInGeo`. The German advertising window
  never disables a route; it is a runtime rule.
- **Enable** each licensed market in `ENABLE_TARGETS` (`lib/market-access/release.ts`)
  through `PartnerTrackingRegistrationService`, the one canonical route writer. The
  route is verified **from a real exit in that market** (Globalping), so a German link
  is checked from Germany and a SkillOnNet block page (HTTP 200) counts as broken.
  A route that fails verification is not activated.

Links are taken from the same casino's route in another market (EGO's `aname=b4gamble`
brand link, the Superfly canonical link), or from EGO's link sheet when passed with
`--ego-links <path>`. Where a link for the market was staged earlier, its stored hash
must match. No raw partner URL is printed or kept in git.

## Plan (read against the Production copy, 24 Sep 2026)

**Disable — 25 activations**

| Closure | Casino × market |
| --- | --- |
| Operator blocks (10) | AHTI Games, BacanaPlay, Casino RedKings, EUcasino, JackpotStar, PlayOJO, PlayUZU, SlotsMagic in AT; Casino RedKings and JackpotStar in DK |
| No local licence (10) | GoldenPlay in AT, BE, BR, CH, DK, FR, PT, SE, SI; PlayUZU in DK |
| Prohibited by law (5) | GoldenPlay in CZ, HR, NO, PL, ZA (already inert since #341) |

**Enable — 11 licensed markets**

| Market | Casino | Link |
| --- | --- | --- |
| DE | DrückGlück, TurboNino | EGO German links (`cg=german`), hash-matched to the 22 Sep staging; verified healthy from Germany on 24 Sep (www.drueckglueck.de, www.turbonino.de) |
| GB | 21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite | Superfly canonical links (UKGC 52894) |
| SE | MegawaysCasino | EGO brand link reused (Founder choice, 24 Sep) |
| DK | MegawaysCasino | EGO brand link reused |
| DK | EUcasino | EUcasino's Swedish EGO link reused (Founder choice, 25 Sep) |

**Cannot open yet:** Betsafe SE (no Swedish link from BGA), DragonBet GB (no link;
Brothers Bet account disabled), Regency SE (regencycasino.se answers 401 — not live),
PlayUZU SE (no Swedish site).

GB referral also needs PR #365 (the licence register as Great Britain's operator
evidence): without it no GB route produces a click, whatever the activation says.

Result after the release and #365: **GB 18 of 19, SE 12 of 15, DK 10 of 10, DE 2 of 2**.

## Steps

1. Pull a Production env file (`vercel env pull .env.production --environment=production`).
   The Production database URL is the `PRODDB_POSTGRES_URL` key.
2. Plan, read-only:
   `npm run market-access:release -- plan --db-env-file .env.production --db-env-key PRODDB_POSTGRES_URL`
   Compare the output with the plan above; note the `database` fingerprint.
3. Optional, read-only: `verify` opens every link to be registered from its market and
   reports where a visitor lands.
4. Apply, after the Founder confirms:
   ```
   npm run market-access:release -- apply --db-env-file .env.production --db-env-key PRODDB_POSTGRES_URL \
     --confirm=MARKET-ACCESS-RELEASE-01 --decision-ref=FOUNDER-MARKET-ACCESS-2026-09-24 \
     --actor-email=<admin email> --expected-database=<fingerprint from step 2> \
     [--ego-links <path to ego-tracking-links.csv>]
   ```
   `apply` refuses CI and Vercel builds, a missing confirmation and a database whose
   fingerprint differs. Every write is idempotent; a partial run can be repeated.
5. Keep the JSON report. `BROKEN_ROUTE` means the market exit did not land on the
   expected operator host: re-check the link with the partner before retrying.
6. Delete `.env.production`.

## Rollback

A disabled market is re-enabled by registering its link again (step 4 with
`--only=enable` after adding it to `ENABLE_TARGETS`). An enabled market is disabled
through the controller. The register itself is code: reverting RFC-054 reopens the
closed markets for any activation that remains.
