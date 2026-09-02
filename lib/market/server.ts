import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { parsePresentationPreference, PRESENTATION_PREFERENCE_COOKIE } from "./presentation-preference";
import { resolvePresentationContext } from "./presentation-resolver";
import {
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
} from "./routing";
import { PROGRAMME_PRESENTATION_CONTEXT } from "@/lib/programme/presentation";

export const resolveServerPresentationContext = cache(async function resolveServerPresentationContext() {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const context = requestHeaders.get(PRESENTATION_CONTEXT_HEADER);
  const publicPresentation = context === "public-v1";
  const programmePresentation = context === PROGRAMME_PRESENTATION_CONTEXT;
  const routeMarket = requestHeaders.get(PRESENTATION_MARKET_HEADER);
  const routeLanguage = requestHeaders.get(PRESENTATION_LANGUAGE_HEADER);
  const preference = publicPresentation
    ? parsePresentationPreference(cookieStore.get(PRESENTATION_PREFERENCE_COOKIE)?.value)
    : null;
  const trustedCountryCode = publicPresentation
    ? requestCountrySignalFromHeaders(requestHeaders)?.countryCode
    : null;
  const resolution = resolvePresentationContext({
    routeMarket: publicPresentation || programmePresentation ? routeMarket : null,
    routeLanguage: publicPresentation || programmePresentation ? routeLanguage : null,
    preference,
    trustedCountryCode,
    acceptLanguage: requestHeaders.get("accept-language"),
  });

  return {
    ...resolution,
    context: programmePresentation ? PROGRAMME_PRESENTATION_CONTEXT : publicPresentation ? "public-v1" : null,
    isExplicitRoute: resolution.source === "EXPLICIT_ROUTE",
  } as const;
});
