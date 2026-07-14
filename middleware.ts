import { NextResponse, type NextRequest } from "next/server";

import {
  getAdminLoginUrl,
  isLegacyPreviewTokenValid,
} from "@/lib/auth/policy";

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

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return NextResponse.next();

  // API authorization is always resolved by the server route, never by cookie presence.
  if (isAdminApi) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

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
    return response;
  }

  if (
    isLegacyPreviewTokenValid({
      enabled: legacyEnabled,
      configuredToken,
      providedTokens: [cookieToken, headerToken],
    })
  ) {
    return NextResponse.next();
  }

  // This is only a lightweight UX redirect. The protected layout verifies the session.
  if (hasPossibleBetterAuthSession(request)) return NextResponse.next();

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.searchParams.delete("token");
  return NextResponse.redirect(
    new URL(
      getAdminLoginUrl(`${callbackUrl.pathname}${callbackUrl.search}`),
      request.url,
    ),
  );
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
