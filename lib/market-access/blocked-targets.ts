/**
 * Licensed markets that cannot open yet, and why. Kept apart from the release script's module
 * (lib/market-access/release.ts re-exports it) so that page code can read it without node:crypto:
 * a review of a blocked target leads to no button, so it stays out of the index too
 * (lib/seo/review-indexing.ts).
 */
export const BLOCKED_TARGETS = Object.freeze([
  { casinoSlug: "betsafe", market: "SE", reason: "No Swedish Betsafe link from Betsson Group Affiliates." },
  { casinoSlug: "dragonbet", market: "GB", reason: "No DragonBet link from Brothers Bet; the account was disabled." },
  { casinoSlug: "regencycasino", market: "SE", reason: "Licensed, but regencycasino.se answers 401 (password-protected) on 25 Sep 2026: not live yet." },
  { casinoSlug: "playuzu", market: "SE", reason: "Licensed, but playuzu.com/se is 404 and playuzu.se does not resolve on 25 Sep 2026: no Swedish site." },
]);
