import "server-only";

import { cookies, headers } from "next/headers";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { parsePresentationPreference, PRESENTATION_PREFERENCE_COOKIE } from "./presentation-preference";
import { resolvePresentationContext } from "./presentation-resolver";
import {
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
} from "./routing";

export async function resolveServerPresentationContext() {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const presentationEnabled = requestHeaders.get(PRESENTATION_CONTEXT_HEADER) === "public-v1";
  const routeMarket = requestHeaders.get(PRESENTATION_MARKET_HEADER);
  const routeLanguage = requestHeaders.get(PRESENTATION_LANGUAGE_HEADER);
  const preference = presentationEnabled
    ? parsePresentationPreference(cookieStore.get(PRESENTATION_PREFERENCE_COOKIE)?.value)
    : null;
  const trustedCountryCode = presentationEnabled
    ? requestCountrySignalFromHeaders(requestHeaders)?.countryCode
    : null;
  const resolution = resolvePresentationContext({
    routeMarket,
    routeLanguage,
    preference,
    trustedCountryCode,
  });

  return {
    ...resolution,
    isExplicitRoute: resolution.source === "EXPLICIT_ROUTE",
  } as const;
}
