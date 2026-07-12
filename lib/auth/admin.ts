import { NextResponse, type NextRequest } from "next/server";
import { cmsUsers } from "@/lib/cms/seed";
import type { CmsPermission } from "@/lib/cms/types";
import { canPerformAction, requirePermission } from "@/lib/cms/permissions";

const adminCookieName = "sevenbet_admin_preview";

export function getAdminPreviewToken() {
  return process.env.SEVENBET_ADMIN_PREVIEW_TOKEN || "phase-1-local-admin";
}

export function getAdminUserFromRequest(request: Request | NextRequest) {
  const headerToken = request.headers.get("x-sevenbet-admin-token");
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${adminCookieName}=`))
    ?.split("=")[1];

  if (headerToken === getAdminPreviewToken() || cookieToken === getAdminPreviewToken()) {
    return cmsUsers[0];
  }

  if (process.env.CMS_PHASE1_ALLOW_DEV_ADMIN === "true" && process.env.NODE_ENV !== "production") {
    return cmsUsers[0];
  }

  return null;
}

export function requireAdminUser(request: Request | NextRequest) {
  const user = getAdminUserFromRequest(request);
  if (!user) {
    throw new Error("Admin authentication required");
  }
  return user;
}

export function requireAdminPermission(request: Request | NextRequest, permission: CmsPermission) {
  const user = requireAdminUser(request);
  requirePermission(user, permission);
  return user;
}

export function canAdminPerform(request: Request | NextRequest, permission: CmsPermission) {
  return canPerformAction(getAdminUserFromRequest(request), permission);
}

export function createAdminPreviewResponse() {
  const response = NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4173"));
  response.cookies.set(adminCookieName, getAdminPreviewToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export { adminCookieName };
