/**
 * German-facing terminology guard (Founder decision, 24 Sep 2026).
 *
 * Germany licenses only virtual slot games ("virtuelle Automatenspiele", GGL);
 * online table games and jackpots are not permitted, and our German partner
 * (EGO / SkillOnNet) requires German copy never to use generic "Casino" /
 * "Online-Casino" wording (including inflections and compounds) or to mention
 * jackpots or table games. German copy uses "Anbieter", "Online-Spielothek",
 * "virtuelle Automatenspiele", "Slots" or neutral "Glücksspiel" instead.
 *
 * Operator brand names are proper names and are preserved exactly; they are
 * removed before matching so only generic wording is reported.
 */
export const GERMAN_PROPER_NAME_ALLOWLIST = [
  "Regency Casino Online",
  "Casino RedKings",
  "Solvane Casino",
  "MegawaysCasino",
  "EUcasino",
  "G'day Casino",
  "Hello Casino",
  "Skol Casino",
  "StarCasino",
  "SuperCasino",
  "JackpotStar",
] as const;

export const GERMAN_PROHIBITED_TERMINOLOGY =
  /casino|kasino|jackpot|tischspiel|roulette|blackjack|baccarat|poker|live-dealer|live-tisch|croupier/i;

export function germanProhibitedTerms(value: string): string[] {
  const withoutProperNames = GERMAN_PROPER_NAME_ALLOWLIST.reduce((text, name) => text.split(name).join(" "), value);
  const pattern = new RegExp(GERMAN_PROHIBITED_TERMINOLOGY.source, "gi");
  return [...withoutProperNames.matchAll(pattern)].map((match) => match[0]);
}
