/**
 * The commercial section of b4gamble.com: the casino, bonus and offer pages.
 *
 * Founder decision, 17 October 2026 (docs/07_Decisions/COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md):
 * b4gamble.com is the commercial site for adults who already gamble, so Casinos, Bonuses and Best
 * Offers reach every visitor from the menu of every public page. No navigation gate reads this
 * list; the market rule (`commercialDestinationsNavigable`) is the only thing that withholds a
 * link, and it is unchanged.
 *
 * The list stays because two guards still need one place that names these routes: the Programme
 * shows none of them to anyone and no letter links to one (Founder, 16 October 2026,
 * docs/07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md). This module imports nothing.
 */
export const COMMERCIAL_SECTION_ROOTS = [
  "/best-offers",
  "/casinos",
  "/casino",
  "/bonuses",
  "/compare",
  "/bonus-guide",
  "/wagering-calculator",
  "/outbound",
] as const;
