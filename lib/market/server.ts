import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { parsePresentationPreference, PRESENTATION_PREFERENCE_COOKIE } from "./presentation-preference";
import { neutralRouteLocale } from "./neutral-route";
import { resolvePresentationContext } from "./presentation-resolver";
import { languageRouteByPublicSlug } from "./registry";
import {
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
} from "./routing";
import { PROGRAMME_PRESENTATION_CONTEXT } from "@/lib/programme/presentation";

export const resolveServerPresentationContext = cache(async function resolveServerPresentationContext() {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const context = requestHeaders.get(PRESENTATION_CONTEXT_HEADER);
  const publicPresentation = context === "public-v1";
  const programmePresentation = context === PROGRAMME_PRESENTATION_CONTEXT;
  const routeLanguage = requestHeaders.get(PRESENTATION_LANGUAGE_HEADER);
  const preference = publicPresentation || programmePresentation
    ? parsePresentationPreference(cookieStore.get(PRESENTATION_PREFERENCE_COOKIE)?.value)
    : null;
  const trustedSignal = publicPresentation || programmePresentation
    ? requestCountrySignalFromHeaders(requestHeaders)
    : null;
  const trustedCountryCode = trustedSignal?.countryCode ?? null;
  const resolution = resolvePresentationContext({
    routeLanguage: publicPresentation || programmePresentation ? routeLanguage : null,
    preference,
    trustedCountryCode,
    acceptLanguage: requestHeaders.get("accept-language"),
  });
  const programmeLocale = programmePresentation
    ? languageRouteByPublicSlug(resolution.language)?.defaultLocale ?? "en-GB"
    : null;
  // Every page, prefixed or not, knows where an unprefixed public link would send this visitor.
  const neutralLocale = neutralRouteLocale({
    preference: preference ?? parsePresentationPreference(cookieStore.get(PRESENTATION_PREFERENCE_COOKIE)?.value),
    trustedCountryCode: trustedCountryCode ?? requestCountrySignalFromHeaders(requestHeaders)?.countryCode,
    acceptLanguage: requestHeaders.get("accept-language"),
  });

  return {
    ...resolution,
    neutralRouteLocale: neutralLocale,
    locale: programmeLocale ?? resolution.locale,
    context: programmePresentation ? PROGRAMME_PRESENTATION_CONTEXT : publicPresentation ? "public-v1" : null,
    marketCode: trustedSignal?.marketCode ?? trustedCountryCode,
    isExplicitRoute: resolution.source === "EXPLICIT_ROUTE",
  } as const;
});
