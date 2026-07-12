import { NextResponse, type NextRequest } from "next/server";

const adminCookieName = "sevenbet_admin_preview";

function getAdminPreviewToken() {
  return process.env.SEVENBET_ADMIN_PREVIEW_TOKEN || "phase-1-local-admin";
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const token = searchParams.get("token");
  const configuredToken = getAdminPreviewToken();
  const cookieToken = request.cookies.get(adminCookieName)?.value;
  const headerToken = request.headers.get("x-sevenbet-admin-token");

  if (token && token === configuredToken) {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.set(adminCookieName, configuredToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  }

  if (cookieToken === configuredToken || headerToken === configuredToken) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
