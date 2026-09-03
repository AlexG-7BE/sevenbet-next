import { NextResponse, type NextRequest } from "next/server";

import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import {
  PRESENTATION_PREFERENCE_COOKIE,
  serializePresentationPreference,
} from "@/lib/market/presentation-preference";
import { resolvePresentationContext } from "@/lib/market/presentation-resolver";
import { isLocalizedPublicDestination, localizePublicPath, parsePublicMarketRoute } from "@/lib/market/routing";
import { languageRouteByPublicSlug, marketProfileByLocale } from "@/lib/market/registry";

const oneYearInSeconds = 365 * 24 * 60 * 60;
const maximumReturnPathLength = 2_048;

function invalidPreference() {
  return NextResponse.json(
    { ok: false, code: "INVALID_PRESENTATION_PREFERENCE" },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidPreference();
  }

  const choice = formData.get("choice");
  const requestedReturnPath = formData.get("returnTo");
  if (typeof choice !== "string") return invalidPreference();

  const automatic = choice === "automatic";
  const requestedLanguage = automatic ? null : languageRouteByPublicSlug(choice);
  if (!automatic && (!requestedLanguage || !requestedLanguage.published)) return invalidPreference();

  const resolution = resolvePresentationContext({
    routeLanguage: requestedLanguage?.language,
    trustedCountryCode: requestCountrySignalFromHeaders(request.headers)?.countryCode,
    acceptLanguage: request.headers.get("accept-language"),
  });
  const destinationLanguage = languageRouteByPublicSlug(resolution.language);
  const destinationProfile = marketProfileByLocale(resolution.locale);
  if (!destinationLanguage?.published || !destinationProfile) return invalidPreference();

  const rawReturnPath = typeof requestedReturnPath === "string" ? requestedReturnPath : "/";
  if (
    rawReturnPath.length > maximumReturnPathLength
    || !rawReturnPath.startsWith("/")
    || rawReturnPath.startsWith("//")
    || rawReturnPath.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(rawReturnPath)
  ) return invalidPreference();
  let returnUrl: URL;
  try {
    returnUrl = new URL(rawReturnPath, request.nextUrl.origin);
  } catch {
    return invalidPreference();
  }
  const parsedReturnPath = parsePublicMarketRoute(returnUrl.pathname);
  if (parsedReturnPath.kind === "INVALID" && parsedReturnPath.reason === "ENCODED_SEPARATOR") {
    return invalidPreference();
  }
  const equivalentPathname = parsedReturnPath.kind === "INVALID" ? "/" : parsedReturnPath.pathname;
  const returnPath = isLocalizedPublicDestination(equivalentPathname, destinationProfile) ? equivalentPathname : "/";
  returnUrl.searchParams.delete("country");
  const safeQuery = returnUrl.searchParams.toString();
  const equivalentReturnPath = `${returnPath}${safeQuery ? `?${safeQuery}` : ""}`;
  const destination = localizePublicPath(destinationProfile, resolution.locale, equivalentReturnPath);

  const response = new NextResponse(null, {
    status: 303,
    headers: { "Cache-Control": "no-store", Location: destination },
  });
  response.cookies.set(
    PRESENTATION_PREFERENCE_COOKIE,
    automatic ? "" : serializePresentationPreference(destinationLanguage.language),
    {
      httpOnly: true,
      maxAge: automatic ? 0 : oneYearInSeconds,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    },
  );
  return response;
}
