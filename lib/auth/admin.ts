import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import type { CmsPermission } from "@/lib/cms/types";
import { canPerformAction } from "@/lib/cms/permissions";
import {
  AdminAuthError,
  getAdminLoginUrl,
  isAdminAuthError,
  isLegacyPreviewTokenValid,
} from "@/lib/auth/policy";
import {
  createStaffContext,
  type StaffContext,
} from "@/lib/auth/staff-context";
import {
  requireStaff,
  requireStaffPermission,
} from "@/lib/auth/staff";

const adminCookieName = "sevenbet_admin_preview";

function requestHeaders(request: Request | NextRequest | Headers) {
  return request instanceof Headers ? request : request.headers;
}

function getCookie(headers: Headers, name: string) {
  const value = headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getAdminPreviewToken() {
  return process.env.SEVENBET_ADMIN_PREVIEW_TOKEN?.trim() || null;
}

export function isLegacyPreviewEnabled() {
  return process.env.CMS_PHASE1_ALLOW_DEV_ADMIN === "true";
}

async function getLegacyPreviewStaff(
  input: Request | NextRequest | Headers,
): Promise<StaffContext | null> {
  const headers = requestHeaders(input);
  const validToken = isLegacyPreviewTokenValid({
    enabled: isLegacyPreviewEnabled(),
    configuredToken: getAdminPreviewToken(),
    providedTokens: [
      headers.get("x-sevenbet-admin-token"),
      getCookie(headers, adminCookieName),
    ],
  });

  if (!validToken) return null;

  const candidates = await prisma.adminUser.findMany({
    where: {
      role: "SUPER_ADMIN",
      userId: { not: null },
    },
    include: { user: true },
    take: 2,
  });

  const candidate = candidates.length === 1 ? candidates[0] : null;

  if (!candidate?.user) {
    throw new AdminAuthError(
      "Legacy preview authentication has no unique linked staff actor",
      403,
      "LEGACY_ACTOR_UNAVAILABLE",
    );
  }

  return createStaffContext({
    user: candidate.user,
    adminUser: candidate,
    authMethod: "legacy-preview",
  });
}

export async function requireAdminAccess(
  input: Request | NextRequest | Headers,
  {
    onUnauthenticated = "throw",
    callbackUrl,
  }: {
    onUnauthenticated?: "throw" | "redirect";
    callbackUrl?: string;
  } = {},
) {
  const headers = requestHeaders(input);

  try {
    return await requireStaff({ headers });
  } catch (error) {
    if (!isAdminAuthError(error)) throw error;

    const legacyStaff = await getLegacyPreviewStaff(headers);
    if (legacyStaff) return legacyStaff;

    if (error.statusCode === 401 && onUnauthenticated === "redirect") {
      redirect(getAdminLoginUrl(callbackUrl));
    }

    throw error;
  }
}

export async function requireAdminPermission(
  request: Request | NextRequest,
  permission: CmsPermission,
) {
  try {
    return await requireStaffPermission(permission, {
      headers: request.headers,
    });
  } catch (error) {
    if (!isAdminAuthError(error)) throw error;

    const legacyStaff = await getLegacyPreviewStaff(request);

    if (!legacyStaff) throw error;

    if (!canPerformAction(legacyStaff, permission)) {
      throw new AdminAuthError(
        `Missing CMS permission: ${permission}`,
        403,
        "STAFF_PERMISSION_REQUIRED",
      );
    }

    return legacyStaff;
  }
}

export async function getAdminUserFromRequest(
  request: Request | NextRequest,
) {
  try {
    return await requireAdminAccess(request);
  } catch (error) {
    if (isAdminAuthError(error)) return null;
    throw error;
  }
}

export async function requireAdminUser(request: Request | NextRequest) {
  return requireAdminAccess(request);
}

export async function canAdminPerform(
  request: Request | NextRequest,
  permission: CmsPermission,
) {
  const user = await getAdminUserFromRequest(request);
  return canPerformAction(user, permission);
}

export function adminAuthErrorResponse(error: unknown) {
  if (!isAdminAuthError(error)) return null;

  return NextResponse.json(
    {
      ok: false,
      error: error.message,
      code: error.code,
    },
    { status: error.statusCode },
  );
}

export function createAdminPreviewResponse() {
  const token = getAdminPreviewToken();

  if (!isLegacyPreviewEnabled() || !token) {
    throw new Error("Legacy preview authentication is not configured");
  }

  const response = NextResponse.redirect(
    new URL(
      "/admin",
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4173",
    ),
  );
  response.cookies.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export { adminCookieName };
