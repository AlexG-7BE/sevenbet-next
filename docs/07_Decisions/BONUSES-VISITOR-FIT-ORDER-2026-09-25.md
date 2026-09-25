# Bonuses shows what the visitor can take first

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026: a visitor from any country should see first the bonuses available in that country, to raise conversion.

## Decision

Every Bonuses view (All, Welcome, Low wagering, Low deposit, Free spins, and Cashback or No deposit) orders its cards in four tiers:

1. offers with a partner button that works for this visit;
2. the offer published for the visitor's own market (`EXACT`);
3. worldwide offers (`ROW`, or no market relation);
4. offers published for another market (`OTHER_MARKET`).

Inside a tier, the view keeps its own order: editorial authority for All and Welcome, wagering for Low wagering, deposit for Low deposit and spins for Free spins. The sort is stable. Nothing is hidden. The register (RFC-054) still decides which offers appear at all. Demonstration records carry no market of their own and sit in tier 3.

The rule lives in `visitorFitTier` / `availableToVisitorFirst` in `lib/public-offer/best-offer-ranking.ts`. `offersForBonusView` applies it. It extends the Best Offers rule of 24 September 2026 (#343, actionable offers first) to the Bonuses directory.

## Why

Before this, the directory ranked every offer by editorial order alone, so other markets' offers came first. In Ireland on the local copy of the Production database, 27 cards were shown and the seven with a partner button sat at positions 7, 9, 11, 16, 17, 24 and 27. None of the first six had a button, and five of them were other markets' offers. After the change the seven buttons fill positions 1–7. In Kazakhstan, which has no routes, the eight worldwide offers now come before the 18 from other markets.

The Bonuses page makes no ranking claim. The Editor Score never reads route availability.

## Evidence

- `tests/commercial-ux-v1.test.ts` ("Bonus views put what this visitor can take first…") pins the tier order, the per-view order inside a tier, and the neutral tier for demonstration records.
