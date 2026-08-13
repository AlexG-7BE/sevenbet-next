import { NextResponse, type NextRequest } from "next/server";

import {
  getAdminLoginUrl,
  isLegacyPreviewTokenValid,
} from "@/lib/auth/policy";
import { resolveRuntimeCanonicalHost } from "@/lib/auth/runtime-canonical-host";

const adminCookieName = "sevenbet_admin_preview";

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
  const canonicalHost = resolveRuntimeCanonicalHost(request.url);
  if (canonicalHost.kind === "redirect") {
    return NextResponse.redirect(canonicalHost.location, canonicalHost.status);
  }
  if (canonicalHost.kind === "reject") {
    return NextResponse.json(
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
    );
  }

  const { pathname, searchParams } = request.nextUrl;
  const programmeMutation = pathname.startsWith("/api/program/") && request.method !== "GET";
  if (programmeMutation && request.headers.get("x-sevenbet-age-attestation") !== "18-or-over") {
    return NextResponse.json(
      { ok: false, error: "Confirm that you are 18 or over before saving Programme progress", code: "AGE_ATTESTATION_REQUIRED" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return NextResponse.next();

  // API authorization is always resolved by the server route, never by cookie presence.
  if (isAdminApi) return privateAdminResponse(NextResponse.next());
  if (pathname === "/admin/login") return privateAdminResponse(NextResponse.next());

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
    return privateAdminResponse(response);
  }

  if (
    isLegacyPreviewTokenValid({
      enabled: legacyEnabled,
      configuredToken,
      providedTokens: [cookieToken, headerToken],
    })
  ) {
    return privateAdminResponse(NextResponse.next());
  }

  // This is only a lightweight UX redirect. The protected layout verifies the session.
  if (hasPossibleBetterAuthSession(request)) return privateAdminResponse(NextResponse.next());

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.searchParams.delete("token");
  return privateAdminResponse(NextResponse.redirect(
    new URL(
      getAdminLoginUrl(`${callbackUrl.pathname}${callbackUrl.search}`),
      request.url,
    ),
  ));
}

export const config = {
  matcher: ["/:path*"],
};
