# Ireland opens eleven EGO brands on their GB links

**Status:** ACCEPTED; live in Production since 27 September 2026 (see [Production activation](#production-activation))

**Decision authority:** explicit Founder instruction, 27 September 2026 (launch eve): "да, открывай Ирландию для 11 брендов", after a click survey showed Ireland with 6 live partner routes and 22 open-market gaps.

## Decision

- **Ireland opens for eleven EGO/SkillOnNet brands:**
  - AHTI Games, BacanaPlay, Casino RedKings, DrückGlück and EUcasino;
  - JackpotStar, MegawaysCasino, PlayOJO, PlayOJO Bingo, SlotsMagic and TurboNino.

  Each reuses its EGO GB brand link unchanged (`ENABLE_TARGETS` in `lib/market-access/release.ts`, `sourceMarket: "GB"`).
- **Regency Casino is left out.** The register has no MGA licence for it, only GB, SE and a Greek licence.
- Activation goes through the existing release path: `PartnerTrackingRegistrationService`, verified from an Irish exit. A route that does not land on the brand's site from Ireland is not activated.

## Basis

- **DETECTED, register (RFC-054):** `MARKET_RULES.IE` is `GREY_ZONE`, open. GRAI licenses betting only; casino licensing comes in a later phase, so MGA operators serve Ireland lawfully until then. None of the eleven brands has an Irish operator block.
- **DETECTED, 27 Sep 2026:** each brand's GB `/r/` link was followed hop by hop from Irish residential exits (Globalping eyeball probes: AVS, Liberty Global, Digiweb, Vodafone). Every chain ended with HTTP 200 on the brand's own English site (www.playojo.com/en/, www.jackpotstar.com, www.slotsmagic.com, …), with no country-block page.
- **DETECTED, same survey:** Ireland already has 6 live Superfly routes (21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite). The eleven targets bring it to 17.

## Production activation

- **DETECTED, 27 Sep 2026, 13:22–13:26 UTC:** `market-access:release -- apply --only=enable` registered all eleven routes. Each was verified from a Dublin exit and converged to `ACTIVE_HEALTHY`.
- **PlayOJO Bingo** lives on playojo.com (`/bingo/`). Its Irish market profile named no site, so registration expected the brand's own domain and did not promote the route. The profile was pointed at `https://www.playojo.com/bingo/`, as in GB (audit log, `MARKET-ACCESS-RELEASE-01`), and the route then registered healthy.
- **DETECTED, launch click check from Dublin:** 17 partner clicks (the six Superfly routes and the eleven EGO brands) and no violation. The other 11 casinos have no Irish route.

## Open points

- **UNKNOWN:** whether EGO's deal pays for Irish players on these links. Confirm with EGO.
- **UNKNOWN:** whether Irish players can complete registration on each brand. The landing pages show no block, but sign-up was not tried.
- If GRAI opens casino licensing, Ireland moves to `LICENCE_REQUIRED` in the register. The release then disables every route without a local licence.

## Evidence

- `tests/market-access-release.test.ts`:
  - pins the eleven Irish targets, the unchanged GB links and the missing Irish operator blocks;
  - checks that every target market is open under the register.
- `docs/06_Operations/Market-Access-Release-01-Runbook.md`: plan table and result.
