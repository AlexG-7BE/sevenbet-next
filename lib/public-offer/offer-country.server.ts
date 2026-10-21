import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { editorialPresentation } from "@/lib/market/editorial-market";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { withOfferCountryChoice } from "./offer-country";
import { OFFER_COUNTRY_COOKIE, parseOfferCountryChoice } from "./offer-country-cookie";

/**
 * The presentation the offer lists and casino pages use: the visitor's editorial view,
 * moved to the country they picked above a list when the lists can show it.
 */
export const resolveServerOfferPresentation = cache(async function resolveServerOfferPresentation() {
  const [visitorPresentation, cookieStore, countries] = await Promise.all([
    resolveServerPresentationContext(),
    cookies(),
    publicOfferService.listOfferCountries(),
  ]);
  return withOfferCountryChoice(editorialPresentation(visitorPresentation), {
    visitorCountryCode: visitorPresentation.marketCountryCode,
    choice: parseOfferCountryChoice(cookieStore.get(OFFER_COUNTRY_COOKIE)?.value),
    countries,
  });
});
