/**
 * Where published offer information may be presented.
 *
 * RFC-039 already separates the two ideas: "globally published offer
 * information may remain visible because publication is not route
 * eligibility". The Bonuses and Best Offers pages did not follow it — they
 * hid every offer whenever no partner route existed for the reader's country,
 * so a visitor from any country we have not activated saw an empty page even
 * though the offers themselves are published.
 *
 * Under the Founder decision of 24 September 2026 an offer is presented
 * wherever gambling advertising is not prohibited, and the visit action stays
 * governed separately: no route simply means no button. The default is
 * therefore visible, and this list is the exception.
 *
 * Presenting an offer is marketing to the reader's country, so a market enters
 * this list when that country prohibits or tightly restricts advertising of
 * operators it has not licensed. Sources are the closed-market register in
 * `data/casino-ingestion/ego-skillonnet-source-20260922.md` and the matrix in
 * `docs/04_Compliance/Global-Casino-Market-Presentation-Policy.md`.
 */
export const OFFER_PRESENTATION_PROHIBITED_MARKETS: Readonly<Record<string, string>> = Object.freeze({
  AU: "Interactive Gambling Act: supply and advertising of online casino to Australian residents is prohibited.",
  BG: "A local licence is required and unlicensed sites are blocked.",
  CZ: "A Ministry of Finance licence is required and unlicensed sites are blocked.",
  FI: "Marketing of unlicensed gambling is prohibited during the transition to the new licensing system.",
  GR: "The Hellenic Gaming Commission requires affiliate registration, which B4GAMBLE does not hold.",
  HR: "A local licence is required and unlicensed sites are blocked.",
  HU: "An SZTFH licence or concession is required and unlicensed sites are blocked.",
  IN: "The Promotion and Regulation of Online Gaming Act 2025 bans real-money online games and their advertising.",
  IT: "Italy's advertising restrictions leave no room for promotional presentation.",
  JP: "Online casino is illegal for residents.",
  NL: "The Ksa enforces against affiliate promotion of unlicensed offers.",
  NO: "Marketing and affiliate links for unlicensed operators are prohibited.",
  NZ: "The Online Casino Gambling Act 2026 prohibits advertising platforms not licensed by the DIA.",
  PL: "A local licence is required and unlicensed sites are blocked.",
  RO: "A local licence is required for any offer presented to residents.",
  RU: "Online gambling and its advertising are prohibited.",
  SK: "A local licence is required and unlicensed sites are blocked.",
  TR: "Online gambling and its advertising are prohibited.",
  ZA: "Online casino is prohibited for residents, and so is advertising it.",
});

/**
 * Published offers may be presented unless the reader's country prohibits it.
 * An unresolved country is treated as permitted: nothing is known that forbids
 * it, and hiding every offer from an unrecognised request is what emptied the
 * pages in the first place.
 */
export function offersMayBePresented(countryCode?: string | null) {
  const market = countryCode?.trim().toUpperCase();
  if (!market || !/^[A-Z]{2}$/.test(market)) return true;
  return !(market in OFFER_PRESENTATION_PROHIBITED_MARKETS);
}

export function offerPresentationProhibitionReason(countryCode?: string | null) {
  const market = countryCode?.trim().toUpperCase();
  if (!market) return null;
  return OFFER_PRESENTATION_PROHIBITED_MARKETS[market] ?? null;
}
