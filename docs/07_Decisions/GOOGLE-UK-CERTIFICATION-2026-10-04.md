# Site ready for Google's UK gambling certification

**Status:** ACCEPTED; **PROPOSED — NOT YET LIVE** until merged and deployed (the DrückGlück GB offer also needs the Founder-run import below)

**Decision authority:** explicit Founder decisions, 4 October 2026, on the certification prep (`b4gamble-content/research/2026-10-04_google_cert_prep.md`):

1. **Yes** to the footer change on every page, **including the frozen desktop Home footer**.
2. **Close Ireland** as a market.
3. **Withhold the DrückGlück GB offer** (60x, above the UK 10x cap) during the Google review.
4. **Northern Ireland is not changed.** It stays with GB; no `GB-NIR` rule is added.

## Why

YouTube lets the channel link to b4gamble.com only once Google Ads certifies the domain for "online gambling-promoting content" in the United Kingdom. Google's policy (adspolicy 15132179, read 4 Oct 2026) asks an affiliate site for an age warning, addiction resources, terms, a privacy policy naming the controller, and "a prominent statement confirming that all outbound links are exclusively to gambling entities licensed and authorised in the relevant geographic location" in the site footer.

## Decision

### Footer on every page

`components/footer-compliance/FooterCompliance.tsx` renders four lines above the footer baseline in `PublicFooter` (every public page, Home included) and, without the duplicate 18+ line and the Help link, in the `/start` footer:

- **18+:** "Adults only. Gambling involves financial risk and can be addictive." next to the 18+ badge (replaces "Gambling involves financial risk.").
- **Outbound statement:** "We only link to gambling sites licensed and authorised where you are. In Great Britain, that means a UK Gambling Commission licence." In white and semibold, the same size as the other lines.
- **Support:** "Free, confidential help in Great Britain, 24/7: National Gambling Helpline 0808 8020 133 (GamCare) · BeGambleAware.org · Block UK gambling sites with GAMSTOP · Outside Great Britain? Find local help" (the last link opens `/help` in the visitor's language).
- **Company:** "B4GAMBLE is run by 7BE Inc., New York, USA. We hold no gambling licence."

Every line is translated in each footer locale (`baseFooterMessages` in `lib/i18n/public-shell-catalog.ts`); the UK services keep their names. All lines read at 14px with a 1.5 line height (readability pass), never below the 12px floor. This reverses, for the footer only, the earlier "no phone numbers" choice of `components/protected-help/support-resources.ts`. The protected Help area keeps its own non-commercial footer (it links to no operator, and its pages already list the support services); the Help pages are unchanged. External support links open in a new tab, with a localized screen-reader hint.

### Ireland closed

`MARKET_RULES.IE` in `lib/market-access/register.ts` becomes `LICENCE_REQUIRED` (Gambling Regulatory Authority of Ireland). GRAI has licensed betting only, so no casino holds an Irish licence: from deployment, no Irish visitor sees an offer, a partner button or a working `/r/` route. The eleven Irish `ENABLE_TARGETS` of [IRELAND-EGO-ROUTES-2026-09-27](IRELAND-EGO-ROUTES-2026-09-27.md) are removed, and `market-access:release` now plans to disable every active Irish route (closure `NO_LOCAL_LICENCE`). The launch click check keeps Ireland, with no expected route: any Irish click that reaches a partner is a `VIOLATION`.

The disposable Navigation Stage 2 CI fixture was written against Ireland as the open grey zone. Behind its existing local-and-disposable guard (CI, loopback `_ci` database, never Vercel), `navigationStage2FixtureMarketRule` keeps that rule for the fixture only. Unit tests that used Ireland as a generic open market now use Luxembourg, a market with no rule.

### DrückGlück GB offer withheld

`drueckglueck-gb-welcome` in `data/casino-global-catalog-01/offers-gb.v1.json` carries `withheld` (since 4 Oct 2026), the mechanism of PR #441 (TurboNino). The import writes it `PAUSED`, and the `offers` re-activator skips it. The casino keeps its review and its partner button ("Visit casino").

### Northern Ireland

Unchanged. Visitors whose region is `GB-NIR` keep the GB rule and the UKGC-licensed operators.

## Production steps (Founder-run, after merge and deploy)

1. **DrückGlück GB** (required): plan, then import the one slug against Production, as in the [Casino Global Catalog runbook](../06_Operations/Casino-Global-Catalog-01-Runbook.md#withholding-an-offer).
2. **Irish routes** (hygiene; the register already makes them inert): `npm run market-access:release -- plan`, then `apply --only=disable` after the Founder confirms, as in the [release runbook](../06_Operations/Market-Access-Release-01-Runbook.md).

## Risks left open

- The outbound statement holds where the register requires a local licence (GB, SE, DK, DE, CA-ON, MT and the other `LICENCE_REQUIRED` markets) and where offers are prohibited. In markets with no rule (RFC-039), a partner button appears only where a route exists; on 4 Oct 2026 a US exit saw none (**DETECTED**, prep doc). Whether any route is active in a market with no rule is **UNKNOWN**; read Production activations before submitting the application.
- GambleAware the charity closed on 31 Mar 2026; begambleaware.org still forwards to the live gambleaware.org help site (**DETECTED** 4 Oct 2026).

## Rollback

Revert the PR. To reopen Ireland, restore its `GREY_ZONE` rule and the Irish `ENABLE_TARGETS`, then re-register the routes. To restore the DrückGlück offer, remove `withheld` once the operator states a term within the UK cap and re-import the slug.
