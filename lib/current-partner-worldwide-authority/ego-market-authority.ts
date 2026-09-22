// Founder decision FOUNDER-EGO-2026-09-22, step 2: exact market authority for EGO (SkillOnNet) casinos.
// Scoped to named casinos; it never lifts a BLOCKED_BY_LAW market and does not cover GR or any
// Canadian province (those stay ACTION_REQUIRED_REGULATORY, Founder decision 22 Sep 2026).

export const EGO_MARKET_AUTHORITY_RELEASE = "FOUNDER-EGO-2026-09-22";

/**
 * GB: Skill On Net Limited, UKGC licence 039326-R-319358-059, brand domains Active on the public
 * register (read 2026-09-22). Regency's GB site is a white label; the Founder accepted that risk.
 * PlayUZU is not on the register and is excluded.
 */
const EGO_GB_AUTHORITY_CASINOS = new Set([
  "ahti-games", "bacanaplay", "casino-redkings", "drueckglueck", "eucasino", "jackpotstar",
  "megawayscasino", "playojo", "playojo-bingo", "regencycasino", "slotsmagic", "turbonino",
]);

/** Exact regulatory prerequisites recorded for a casino × market (the country-level action is satisfied). */
const EGO_EXACT_REGULATORY_EVIDENCE: Record<string, string> = {
  // GGL whitelist: Skill On Net Limited, virtual slot games, GGL (länderübergreifend), since 29.12.2022.
  "drueckglueck:DE": "PUBLIC:https://www.gluecksspiel-behoerde.de/de/fuer-spielende/uebersicht-erlaubter-anbieter-whitelist#skill-on-net-limited:drueckglueck.de:2026-09-22",
  "turbonino:DE": "PUBLIC:https://www.gluecksspiel-behoerde.de/de/fuer-spielende/uebersicht-erlaubter-anbieter-whitelist#skill-on-net-limited:turbonino.de:2026-09-22",
};

export function egoFounderGbAuthorityApplies(casinoSlug: string) {
  return EGO_GB_AUTHORITY_CASINOS.has(casinoSlug.trim().toLowerCase());
}

export function egoExactRegulatoryEvidence(casinoSlug: string | null | undefined, geo: string) {
  if (!casinoSlug) return null;
  return EGO_EXACT_REGULATORY_EVIDENCE[`${casinoSlug.trim().toLowerCase()}:${geo}`] ?? null;
}
