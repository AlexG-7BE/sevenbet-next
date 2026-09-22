# FOUNDER-EGO-2026-09-22: EGO (SkillOnNet) catalogue and commercial routes

**Status:** Founder decision, recorded 22 September 2026
**Decision reference:** `FOUNDER-EGO-2026-09-22` (used as `decisionRef` for partner tracking registration)
**Source package:** `data/casino-ingestion/ego-skillonnet-2026-09-22/` (13 bundles + manifest) and `data/casino-ingestion/ego-skillonnet-source-20260922.md`

## Decision

1. Add partner **EGO (eGamingOnline, https://www.egamingonline.com)**, the SkillOnNet programme with affiliate tag `aname=b4gamble`. Commercial terms are agreed for every link in the supplied tracking sheet.
2. Import 13 casinos: PlayOJO, PlayOJO Bingo, PlayUZU, BacanaPlay, DrückGlück, SlotsMagic, EUcasino, Casino RedKings, AHTI Games, TurboNino, JackpotStar, MegawaysCasino, Regency Casino Online.
3. Register the sheet's `ACTIVATE` links as exact-market routes. `DO_NOT_ACTIVATE` and `NO_MARKET` links are never registered, and download-installer links are excluded.
4. The Founder accepts the risk, without a separate licence or domain check, for:
   - AT and Canada outside Ontario;
   - DK and SE;
   - DE for DrückGlück and TurboNino only;
   - GR for Regency only.
5. **Closed by law, never activated:** FI, NO, IN, JP, BG, HR, CZ, HU, SK, IT, PL, RO, RU, TR, AU, ZA, NZ, CA-ON; GR except Regency; DE except DrückGlück and TurboNino; ES except PlayUZU; GB for PlayUZU.
6. Editor Scores are not invented. They come from bundle facts using the six-component method of PR #256 (runbook table, 7.2–8.2). The Founder approved them for publication on 22 Sep 2026, and they are stored in `editorial.json`.

## Implementation scope

The decision is delivered in two steps (Founder choice, 22 Sep 2026):

- **Step 1 — `EGO-SKILLONNET-IMPORT-01`:** data, registry and a Founder-run executor. The executor registers every `ACTIVATE` market through `PartnerTrackingRegistrationService`. Only markets that the current legal authority tables already allow can become `ACTIVE`: AT, DK, SE and ES (PlayUZU), 29 markets. The rest are recorded with their blocking reason. See [the runbook](../06_Operations/EGO-SkillOnNet-Import-01-Runbook.md).
- **Step 2 (separate PR):** extend the legal authority tables for the other markets in point 4: 48 Canadian provincial markets outside Ontario, GB (12), DE (2) and GR (1). This changes commercial and legal authority, so it gets its own review. Re-running the step-1 executor afterwards is idempotent and activates those markets.

The code verifies each route before activation (`register()` activates only a `HEALTHY` route). This replaces the package note's "activate before verification"; route verification happens in the same command.
