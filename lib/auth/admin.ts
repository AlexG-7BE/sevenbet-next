import "server-only";

import { cache } from "react";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import type { CmsPermission } from "@/lib/cms/types";
import { canPerformAction } from "@/lib/cms/permissions";
import {
  canAccessAdminArea,
  type AdminArea,
} from "@/lib/auth/admin-page-policy";
import {
  AdminAuthError,
  getAdminLoginUrl,
  getAdminMfaEnrollmentUrl,
  isAdminAuthError,
} from "@/lib/auth/policy";
import type { StaffContext } from "@/lib/auth/staff-context";
import { requireStaff } from "@/lib/auth/staff";

function requestHeaders(request: Request | NextRequest | Headers) {
  return request instanceof Headers ? request : request.headers;
}

async function resolveAdminAccess(
  input: Request | NextRequest | Headers,
): Promise<StaffContext> {
  return requireStaff({ headers: requestHeaders(input) });
}

const resolveServerComponentAdminAccess = cache(async (
  cookieHeader: string | null,
) => {
  const headers = new Headers();
  if (cookieHeader) headers.set("cookie", cookieHeader);
  return resolveAdminAccess(headers);
});

function resolveRequestAdminAccess(input: Request | NextRequest | Headers) {
  return input instanceof Headers
    ? resolveServerComponentAdminAccess(input.get("cookie"))
    : resolveAdminAccess(input);
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
  try {
    return await resolveRequestAdminAccess(input);
  } catch (error) {
    if (!isAdminAuthError(error)) throw error;

    if (error.statusCode === 401 && onUnauthenticated === "redirect") {
      redirect(getAdminLoginUrl(callbackUrl));
    }

    if (
      error.code === "ADMIN_MFA_ENROLLMENT_REQUIRED" &&
      onUnauthenticated === "redirect"
    ) {
      redirect(getAdminMfaEnrollmentUrl(callbackUrl));
    }

    throw error;
  }
}

export async function requireAdminPermission(
  request: Request | NextRequest,
  permission: CmsPermission,
) {
  return requireAdminAnyPermission(request, [permission]);
}

export async function requireAdminAnyPermission(
  request: Request | NextRequest,
  permissions: readonly CmsPermission[],
) {
  const staff = await requireAdminAccess(request);
  if (!permissions.some((permission) => canPerformAction(staff, permission))) {
    throw new AdminAuthError(
      `Missing CMS permission: ${permissions.join(" or ")}`,
      403,
      "STAFF_PERMISSION_REQUIRED",
    );
  }
  return staff;
}

export async function getAdminPageAccess(
  input: Request | NextRequest | Headers,
  area: AdminArea,
) {
  try {
    const staff = await requireAdminAccess(input, {
      onUnauthenticated: "redirect",
    });
    return canAccessAdminArea(staff, area) ? staff : null;
  } catch (error) {
    if (isAdminAuthError(error) && error.statusCode === 403) return null;
    throw error;
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

export { adminAuthErrorResponse } from "@/lib/http/admin-auth-error";
