/**
 * Reconciles legacy consumer-brand copy only at an explicitly selected public
 * presentation boundary. Compatibility identifiers and historical records are
 * intentionally outside this helper.
 */
export function currentPublicBrandText(value: string) {
  return value.replaceAll("SevenBet", "B4GAMBLE").replaceAll("SEVENBET", "B4GAMBLE");
}
