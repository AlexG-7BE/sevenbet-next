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
  parsePublicMarketRoute,
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
} from "@/lib/market/routing";
import { publicMarketPath } from "@/lib/market/registry";

const adminCookieName = "sevenbet_admin_preview";
const chatGptWorkOrigin = "https://chatgpt.com";
const commercialMcpConsentPath = "/admin/integrations/chatgpt-work/consent";

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

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const nonce = createCspNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
    formActionOrigins: pathname === commercialMcpConsentPath ? [chatGptWorkOrigin] : [],
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(PRESENTATION_CONTEXT_HEADER);
  requestHeaders.delete(PRESENTATION_LANGUAGE_HEADER);
  requestHeaders.delete(PRESENTATION_MARKET_HEADER);
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

  const publicMarketRoute = parsePublicMarketRoute(pathname);
  if (publicMarketRoute.kind === "LEGACY_REDUNDANT_LOCALE" || publicMarketRoute.kind === "DEFAULT_MARKET_ALIAS") {
    const destination = request.nextUrl.clone();
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
      const destination = request.nextUrl.clone();
      destination.pathname = canonicalPathname;
      return secureResponse(NextResponse.redirect(destination, 308));
    }
    requestHeaders.set(PRESENTATION_CONTEXT_HEADER, "public-v1");
    requestHeaders.set(PRESENTATION_MARKET_HEADER, publicMarketRoute.market.routeMarket);
    requestHeaders.set(PRESENTATION_LANGUAGE_HEADER, publicMarketRoute.locale.split("-")[0].toLowerCase());
    const rewriteUrl = publicMarketRoute.kind === "UNPREFIXED_DEFAULT" ? undefined : request.nextUrl.clone();
    if (rewriteUrl) rewriteUrl.pathname = publicMarketRoute.pathname;
    const response = nextResponse(rewriteUrl);
    response.headers.set("Content-Language", publicMarketRoute.locale);
    return secureResponse(response);
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
