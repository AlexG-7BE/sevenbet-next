import { NextResponse, type NextRequest } from "next/server";

import {
  getAdminLoginUrl,
  isLegacyPreviewTokenValid,
} from "@/lib/auth/policy";
import { resolveRuntimeCanonicalHost } from "@/lib/auth/runtime-canonical-host";
import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  createCspNonce,
  CSP_NONCE_REQUEST_HEADER,
} from "@/lib/security/content-security-policy";
import {
  isLocalizedPublicDestination,
  parsePublicMarketRoute,
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
} from "@/lib/market/routing";
import { homeTranslationReady } from "@/lib/i18n/review-state";
import {
  localeForLanguageSegment,
  marketEditorialPublicationApproved,
  marketProfileByRouteMarket,
  publicMarketPath,
} from "@/lib/market/registry";
import {
  isProgrammeLocale,
  programmeLocaleFromPath,
  parseProgrammeRoute,
  PROGRAMME_PRESENTATION_CONTEXT,
  programmeRoute,
} from "@/lib/programme/presentation";

const adminCookieName = "sevenbet_admin_preview";
const chatGptWorkOrigin = "https://chatgpt.com";
const commercialMcpConsentPath = "/admin/integrations/chatgpt-work/consent";
const internalPresentationTokenHeader = "x-b4gamble-internal-presentation-token";
const internalPresentationTokenMaxAgeMs = 30_000;
const localPresentationSigningSecret = "b4gamble-local-presentation-rewrite-v1";

function presentationSigningSecret() {
  const configured = process.env.BETTER_AUTH_SECRET?.trim();
  if (configured) return configured;
  return process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production"
    ? null
    : localPresentationSigningSecret;
}

function presentationTokenPayload({
  context,
  issuedAt,
  locale,
  market,
  origin,
  pathname,
  search,
}: {
  context: "public-v1" | "programme-v1";
  issuedAt: number;
  locale: string;
  market: string;
  origin: string;
  pathname: string;
  search: string;
}) {
  return [context, origin, `${pathname}${search}`, market, locale, String(issuedAt)].join("\u0000");
}

async function presentationSigningKey() {
  const secret = presentationSigningSecret();
  return secret
    ? crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { hash: "SHA-256", name: "HMAC" },
        false,
        ["sign", "verify"],
      )
    : null;
}

function encodeBase64Url(value: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(value));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signInternalPresentation(
  rewriteUrl: URL,
  market: string,
  locale: string,
  context: "public-v1" | "programme-v1",
) {
  const key = await presentationSigningKey();
  if (!key) return null;
  const issuedAt = Date.now();
  const payload = presentationTokenPayload({
    context,
    issuedAt,
    locale,
    market,
    origin: rewriteUrl.origin,
    pathname: rewriteUrl.pathname,
    search: rewriteUrl.search,
  });
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${issuedAt}.${encodeBase64Url(signature)}`;
}

async function inheritedPresentation(request: NextRequest, pathname: string) {
  const token = request.headers.get(internalPresentationTokenHeader);
  const context = request.headers.get(PRESENTATION_CONTEXT_HEADER);
  if (!token || (context !== "public-v1" && context !== PROGRAMME_PRESENTATION_CONTEXT)) return null;

  const market = marketProfileByRouteMarket(request.headers.get(PRESENTATION_MARKET_HEADER));
  const locale = market
    ? localeForLanguageSegment(market, request.headers.get(PRESENTATION_LANGUAGE_HEADER))
    : null;
  if (!market || !locale) return null;
  const validDestination = context === "public-v1"
    ? isLocalizedPublicDestination(pathname, market)
    : isProgrammeLocale(locale)
      && programmeRoute(locale).routeMarket === market.routeMarket
      && (pathname === "/program" || pathname.startsWith("/program/"));
  if (!validDestination) return null;

  const [issuedAtValue, signatureValue, ...extra] = token.split(".");
  const issuedAt = Number(issuedAtValue);
  const age = Date.now() - issuedAt;
  if (
    extra.length
    || !Number.isSafeInteger(issuedAt)
    || age < -5_000
    || age > internalPresentationTokenMaxAgeMs
    || !/^[A-Za-z0-9_-]{43}$/.test(signatureValue ?? "")
  ) return null;

  const key = await presentationSigningKey();
  if (!key) return null;
  const payload = presentationTokenPayload({
    context,
    issuedAt,
    locale,
    market: market.routeMarket,
    origin: request.nextUrl.origin,
    pathname,
    search: request.nextUrl.search,
  });
  try {
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signatureValue),
      new TextEncoder().encode(payload),
    );
    return verified ? { context, locale, market } : null;
  } catch {
    return null;
  }
}

function getAdminPreviewToken() {
  return process.env.SEVENBET_ADMIN_PREVIEW_TOKEN?.trim() || null;
}

function isLegacyPreviewEnabled() {
  return process.env.CMS_PHASE1_ALLOW_DEV_ADMIN === "true";
}

function hasPossibleBetterAuthSession(request: NextRequest) {
  return [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "better-auth-session_token",
    "__Secure-better-auth-session_token",
  ].some((name) => Boolean(request.cookies.get(name)?.value));
}

function privateAdminResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  const vary = response.headers.get("Vary");
  if (!vary?.split(",").some((value) => value.trim().toLowerCase() === "cookie")) {
    response.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const nonce = createCspNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
    formActionOrigins: pathname === commercialMcpConsentPath ? [chatGptWorkOrigin] : [],
    upgradeInsecureRequests: request.nextUrl.protocol === "https:",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(PRESENTATION_CONTEXT_HEADER);
  requestHeaders.delete(PRESENTATION_LANGUAGE_HEADER);
  requestHeaders.delete(PRESENTATION_MARKET_HEADER);
  requestHeaders.delete(internalPresentationTokenHeader);
  requestHeaders.set(CSP_NONCE_REQUEST_HEADER, nonce);
  requestHeaders.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
  const nextResponse = (rewriteUrl?: URL) => rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  const secureResponse = (response: NextResponse) => {
    response.headers.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
    return response;
  };

  const canonicalHost = resolveRuntimeCanonicalHost(request.url);
  if (canonicalHost.kind === "redirect") {
    return secureResponse(NextResponse.redirect(canonicalHost.location, canonicalHost.status));
  }
  if (canonicalHost.kind === "reject") {
    return secureResponse(NextResponse.json(
      {
        ok: false,
        code: canonicalHost.reason === "metadata"
          ? "PREVIEW_CANONICAL_HOST_UNAVAILABLE"
          : "PREVIEW_HOST_NOT_ALLOWED",
      },
      {
        status: canonicalHost.reason === "metadata" ? 503 : 421,
        headers: { "Cache-Control": "no-store" },
      },
    ));
  }

  // Next invokes middleware again for an internal rewrite. Carry presentation
  // only when the preceding invocation supplied a fresh HMAC bound to this
  // origin, destination, market and locale. Client presentation headers remain
  // untrusted and are removed before either pass reaches the application.
  const inherited = await inheritedPresentation(request, pathname);
  if (inherited?.context === "public-v1" && !homeTranslationReady(inherited.locale)) {
    return secureResponse(nextResponse());
  }
  if (
    inherited?.context === "public-v1"
    && process.env.VERCEL_ENV === "production"
    && !marketEditorialPublicationApproved(inherited.market)
  ) {
    return secureResponse(nextResponse());
  }

  if (inherited) {
    requestHeaders.set(PRESENTATION_CONTEXT_HEADER, inherited.context);
    requestHeaders.set(PRESENTATION_MARKET_HEADER, inherited.market.routeMarket);
    requestHeaders.set(PRESENTATION_LANGUAGE_HEADER, inherited.locale.split("-")[0].toLowerCase());
    const response = nextResponse();
    response.headers.set("Content-Language", inherited.locale);
    return secureResponse(response);
  }

  // A login transition may inherit Programme presentation only from an exact,
  // validated Programme return path. This affects request-local language only;
  // it creates no public publication, commercial, cookie or identity authority.
  const programmeLoginLocale = pathname === "/login"
    ? programmeLocaleFromPath(searchParams.get("returnTo"))
    : null;
  if (programmeLoginLocale) {
    const route = programmeRoute(programmeLoginLocale);
    const market = marketProfileByRouteMarket(route.routeMarket);
    if (market) {
      requestHeaders.set(PRESENTATION_CONTEXT_HEADER, PROGRAMME_PRESENTATION_CONTEXT);
      requestHeaders.set(PRESENTATION_MARKET_HEADER, market.routeMarket);
      requestHeaders.set(PRESENTATION_LANGUAGE_HEADER, programmeLoginLocale.split("-")[0].toLowerCase());
      const response = nextResponse();
      response.headers.set("Content-Language", programmeLoginLocale);
      return secureResponse(response);
    }
  }

  const programmeMarketRoute = parseProgrammeRoute(pathname);
  if (programmeMarketRoute?.trailingSlash) {
    const destination = new URL(request.url);
    destination.pathname = programmeMarketRoute.pathname;
    return secureResponse(NextResponse.redirect(destination, 308));
  }
  if (programmeMarketRoute) {
    const market = marketProfileByRouteMarket(programmeMarketRoute.route.routeMarket);
    if (!market) return secureResponse(nextResponse());
    requestHeaders.set(PRESENTATION_CONTEXT_HEADER, PROGRAMME_PRESENTATION_CONTEXT);
    requestHeaders.set(PRESENTATION_MARKET_HEADER, market.routeMarket);
    requestHeaders.set(PRESENTATION_LANGUAGE_HEADER, programmeMarketRoute.route.locale.split("-")[0].toLowerCase());
    const rewriteUrl = pathname === programmeMarketRoute.rendererPathname
      ? undefined
      : request.nextUrl.clone();
    if (rewriteUrl) {
      rewriteUrl.pathname = programmeMarketRoute.rendererPathname;
      const token = await signInternalPresentation(
        rewriteUrl,
        market.routeMarket,
        programmeMarketRoute.route.locale,
        PROGRAMME_PRESENTATION_CONTEXT,
      );
      if (!token) return secureResponse(nextResponse());
      requestHeaders.set(internalPresentationTokenHeader, token);
    }
    const response = nextResponse(rewriteUrl);
    response.headers.set("Content-Language", programmeMarketRoute.route.locale);
    return secureResponse(response);
  }

  const publicMarketRoute = parsePublicMarketRoute(pathname);
  if (
    publicMarketRoute.kind !== "INVALID"
    && !homeTranslationReady(publicMarketRoute.locale)
  ) {
    return secureResponse(nextResponse());
  }
  if (
    publicMarketRoute.kind !== "INVALID"
    && process.env.VERCEL_ENV === "production"
    && !marketEditorialPublicationApproved(publicMarketRoute.market)
  ) {
    return secureResponse(nextResponse());
  }
  if (publicMarketRoute.kind === "LEGACY_REDUNDANT_LOCALE" || publicMarketRoute.kind === "DEFAULT_MARKET_ALIAS") {
    const destination = new URL(request.url);
    destination.pathname = publicMarketRoute.canonicalPath;
    return secureResponse(NextResponse.redirect(destination, 308));
  }

  if (publicMarketRoute.kind !== "INVALID") {
    const canonicalPathname = publicMarketPath(
      publicMarketRoute.market,
      publicMarketRoute.locale,
      publicMarketRoute.pathname,
    );
    if (pathname !== canonicalPathname) {
      const destination = new URL(request.url);
      destination.pathname = canonicalPathname;
      return secureResponse(NextResponse.redirect(destination, 308));
    }
    requestHeaders.set(PRESENTATION_CONTEXT_HEADER, "public-v1");
    requestHeaders.set(PRESENTATION_MARKET_HEADER, publicMarketRoute.market.routeMarket);
    requestHeaders.set(PRESENTATION_LANGUAGE_HEADER, publicMarketRoute.locale.split("-")[0].toLowerCase());
    const rewriteUrl = publicMarketRoute.kind === "UNPREFIXED_DEFAULT" ? undefined : request.nextUrl.clone();
    if (rewriteUrl) {
      rewriteUrl.pathname = publicMarketRoute.pathname;
      const token = await signInternalPresentation(
        rewriteUrl,
        publicMarketRoute.market.routeMarket,
        publicMarketRoute.locale,
        "public-v1",
      );
      if (!token) return secureResponse(nextResponse());
      requestHeaders.set(internalPresentationTokenHeader, token);
    }
    const response = nextResponse(rewriteUrl);
    response.headers.set("Content-Language", publicMarketRoute.locale);
    return secureResponse(response);
  }

  // `skipTrailingSlashRedirect` lets market homes keep `/de/`. Preserve the
  // framework's prior no-trailing-slash behavior everywhere else, including
  // protected/internal routes, with the same method-preserving status.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const destination = new URL(request.url);
    destination.pathname = pathname.replace(/\/+$/, "") || "/";
    return secureResponse(NextResponse.redirect(destination, 308));
  }

  const programmeMutation = pathname.startsWith("/api/program/") && request.method !== "GET";
  if (programmeMutation && request.headers.get("x-sevenbet-age-attestation") !== "18-or-over") {
    return secureResponse(NextResponse.json(
      { ok: false, error: "Confirm that you are 18 or over before saving Programme progress", code: "AGE_ATTESTATION_REQUIRED" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    ));
  }
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return secureResponse(nextResponse());

  // API authorization is always resolved by the server route, never by cookie presence.
  if (isAdminApi) return privateAdminResponse(secureResponse(nextResponse()));
  const isCommercialMcpAuthPage = pathname === "/admin/integrations/chatgpt-work/login"
    || pathname === commercialMcpConsentPath;
  if (pathname === "/admin/login" || isCommercialMcpAuthPage) {
    return privateAdminResponse(secureResponse(nextResponse()));
  }

  const configuredToken = getAdminPreviewToken();
  const legacyEnabled = isLegacyPreviewEnabled();
  const queryToken = searchParams.get("token");
  const cookieToken = request.cookies.get(adminCookieName)?.value;
  const headerToken = request.headers.get("x-sevenbet-admin-token");

  if (
    isLegacyPreviewTokenValid({
      enabled: legacyEnabled,
      configuredToken,
      providedTokens: [queryToken],
    }) &&
    configuredToken
  ) {
    const destination = request.nextUrl.clone();
    destination.searchParams.delete("token");
    const response = NextResponse.redirect(destination);
    response.cookies.set(adminCookieName, configuredToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return privateAdminResponse(secureResponse(response));
  }

  if (
    isLegacyPreviewTokenValid({
      enabled: legacyEnabled,
      configuredToken,
      providedTokens: [cookieToken, headerToken],
    })
  ) {
    return privateAdminResponse(secureResponse(nextResponse()));
  }

  // This is only a lightweight UX redirect. The protected layout verifies the session.
  if (hasPossibleBetterAuthSession(request)) return privateAdminResponse(secureResponse(nextResponse()));

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.searchParams.delete("token");
  return privateAdminResponse(secureResponse(NextResponse.redirect(
    new URL(
      getAdminLoginUrl(`${callbackUrl.pathname}${callbackUrl.search}`),
      request.url,
    ),
  )));
}

export const config = {
  matcher: ["/:path*"],
};
