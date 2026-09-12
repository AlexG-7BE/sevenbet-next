# Commercial UX v1

## Status and authority

**DETECTED — UNMERGED PR:** this document describes the Commercial UX v1 correction implemented on PR #276. It does not claim a Production release, market activation, partner-state change, migration application, or legal/commercial authority.

The public presentation adapter in `lib/commercial/commercial-presentation.ts` remains the boundary between canonical public DTOs and concise commercial UI. Governed action helpers remain fail-closed. Demonstration fixtures remain non-actionable.

## Deterministic ranking

Best Offers keeps exactly four views and at most three unique casinos per view.

- **Best Overall:** Editor Score, known material terms, review recency, then stable casino/offer slugs.
- **Fast Payouts:** normalized best withdrawal-time bucket, strongest single explicit timing statement, Editor Score, review recency, then stable slugs. Payment-method count is not a reliability signal.
- **Best Bonus Terms:** detected severe restriction count, lower known wagering, known non-severe conditions and eligibility, lower known minimum deposit, higher known maximum bet, later known expiry, Editor Score, review recency, then stable slugs. Missing values lose their factor tie-break and never count as favourable.
- **Low Deposit:** lower known minimum deposit above the Editor Score quality floor, then editorial and stable tie-breaks.

The severe-restriction signal is deliberately narrow. It detects canonical terms that explicitly describe caps on cashout/winnings, excluded or ineligible games/payment methods, invite/VIP-only eligibility, or voided bonus/winnings. It is a ranking guard, not a legal interpretation.

**KNOWN LIMITATION:** the canonical DTO does not provide structured game weighting, wagering base (bonus-only versus deposit-plus-bonus), numeric maximum cashout, redemption window, withdrawal lock, or country-specific restriction severity. Prose outside the narrow guard is not inferred. Unknown factors remain unknown and require Terms review.

## Presentation corrections

- Best Offers shows one short, category-specific fact reason per ranked item.
- Casinos stays one collection: exactly two columns on supported desktop widths and one column on mobile. Cards use payout, deposit, current offer, and at most one canonical highlight; wagering is not a casino-card fact.
- Bonuses renders one offer per row. It selects up to three useful known facts, using an unknown only when a material fact has no better known replacement. A safe HTTPS Terms link and Casino review are separate; Casino review is the only research link when Terms is unavailable.
- Casino review selects the exact `marketProfiles.countryCode` match. It never assumes the first profile. Verdict, strengths, caveat, and material restriction are derived from canonical summary/pros/cons/bonus fields. Support shows languages and canonical support summary only; no mobile-support proxy is used because structured support-channel fields are not currently modeled.

## Preview-only market inspection

The established `visualFixture=true` data fixture is available on Vercel Preview for the four Commercial UX surfaces. `qaMarket` is allowlisted to `DK`, `EE`, and `LV`. It changes only the non-actionable fixture DTO and presentation country; it does not change trusted GEO, jurisdiction resolution, commercial authority, partner eligibility, redirect state, or Production behavior.

Production always rejects the fixture. Local use still requires `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true`.

Inspection paths:

- `/en/best-offers?visualFixture=true&qaMarket=DK`
- `/en/casinos?visualFixture=true&qaMarket=EE`
- `/en/bonuses?visualFixture=true&qaMarket=LV`
- `/en/casino/demo-plume?visualFixture=true&qaMarket=EE`

All fixture records remain `DEMO_FIXTURE` or informational-only, all `/r/` actions remain absent, and market inspection does not create a durable market profile.

## Final product polish

**DETECTED — PR #276:** the public shell now resolves a generic `SUPPORTED_COMMERCIAL` / `EDITORIAL_ONLY` product state from the request jurisdiction plus the canonical `MarketActivation` runtime. A market is commercially supported only when editorial, commercial, and referral policy all permit the resolved country and at least one active, healthy canonical route applies to that market. Page result count is not an input, and no country-specific exception exists.

In `EDITORIAL_ONLY` state, primary and footer navigation omit Best Offers and Bonuses while Casinos, Learn, Methodology, Help, Responsible Gambling, Affiliate Disclosure, and the other applicable editorial/legal routes remain available. Direct Best Offers and Bonuses requests return short, market-accurate product states rather than empty selectors or foreign-market records. Casino collections and published casino reviews remain editorial, with every governed action placement suppressed.

The scan-first product architecture is unchanged. Bounded editorial framing now follows the primary task: Best Offers adds three trust principles and three “Before You Click” questions; Casinos adds three “Before You Choose” questions; Bonuses adds three evaluation principles plus the Bonus Guide; casino reviews add section navigation, a canonical overall-score verdict, and at most three FAQ items. No score dimensions, offer records, redirect authority, analytics events, or migrations were added.

## Analytics

Existing commercial surface views, selector changes, card impressions/positions, review clicks, and governed outbound actions remain intact. No additional Terms-click event or schema change is introduced in this correction pass. Migration `0038_commercial_ux_analytics_events` remains unapplied by this work.
