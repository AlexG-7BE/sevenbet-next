/**
 * The country a visitor picked above an offer list (OFFER-COUNTRY-FILTER-2026-10-21).
 * It is a view preference only: it never reaches the jurisdiction resolver, so it can
 * neither grant nor change a partner button.
 */
export const OFFER_COUNTRY_COOKIE = "b4g_offer_country";
export const OFFER_COUNTRY_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function parseOfferCountryChoice(value: string | null | undefined) {
  const token = value?.trim().toUpperCase();
  return token && /^[A-Z]{2}$/.test(token) ? token : null;
}
