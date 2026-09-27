# Casinos lists what the visitor can open first; Terms go through the partner route

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 27 September 2026. After the pre-launch audit the Founder chose package A, "more clicks now": casinos with a working partner button first in the directory, and the Terms links through the partner route.

## Decision

1. **Casinos directory order.** Every Casinos view (Top Rated, Fast payouts, Low deposit) puts the casinos with a partner button that works for this visit first. Inside each group the view keeps its own order: editorial authority for Top Rated, payout timing for Fast payouts and deposit for Low deposit. The sort is stable and nothing is hidden. The rule is `casinosAvailableToVisitorFirst` in `lib/commercial/commercial-presentation.ts`. It extends [Bonuses shows what the visitor can take first](BONUSES-VISITOR-FIT-ORDER-2026-09-25.md) and the Best Offers rule of 24 September (#343) to the directory.
2. **The directory FAQ says so.** "Does commission affect ranking?" now answers in every locale that commission never changes the Editor Score, that casinos we can link to from the visitor's country come first, and that the Editor Score orders each group. The old answer, "does not determine … natural editorial ranking", stopped being true with the new order.
3. **Terms links.** Where an offer card or the review's offer section has a partner route, its "Terms" link opens the same `/r/{route}` with placement `CTA_BONUS_TERMS` or `CTA_CASINO_OFFER_TERMS`. Without a route the link stays the direct https link to the operator's terms.

## Why

- On Production 952d0e0b a GB visitor to `/en/casinos` saw six casinos that do not take UK players (Inkabet, Betsson, Betsafe, StarCasino, SuperCasino, NordicBet) before the first partner button, on card 7, about 3,500 px down on a phone.
- 17 of 18 GB bonus cards and every review's offer section linked "Terms" straight to the operator's promotion page, where the visitor finds the operator's own sign-up button without our referral. A sign-up from there earns nothing.

## Evidence

- `tests/commercial-ux-v1.test.ts` ("Casino views put casinos this visitor can open first…") pins the two groups and the per-view order inside them.
- `tests/legal-public-claims.test.ts` pins the new English answer and fails if the old one returns.
- Launch audit, 27 September 2026 (live GB page read and code review of `BonusOfferDirectory.tsx`, `CasinoProfile.tsx`, `casinosForCollectionView`).
