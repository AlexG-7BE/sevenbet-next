import type { AdminRole, CmsPermission } from "@/lib/cms/types";
import { permissionsByRole } from "@/lib/cms/permissions";

export type AdminAccessStatus = 200 | 401 | 403;

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403,
    public readonly code:
      | "ADMIN_AUTH_REQUIRED"
      | "STAFF_ACCESS_REQUIRED"
      | "STAFF_PERMISSION_REQUIRED"
      | "LEGACY_ACTOR_UNAVAILABLE",
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function getAdminAccessStatus({
  hasSession,
  hasStaffProfile,
  role,
  permission,
}: {
  hasSession: boolean;
  hasStaffProfile: boolean;
  role?: AdminRole;
  permission?: CmsPermission;
}): AdminAccessStatus {
  if (!hasSession) return 401;
  if (!hasStaffProfile || !role) return 403;
  if (permission && !permissionsByRole[role].includes(permission)) return 403;
  return 200;
}

export function isLegacyPreviewTokenValid({
  enabled,
  configuredToken,
  providedTokens,
}: {
  enabled: boolean;
  configuredToken: string | null | undefined;
  providedTokens: Array<string | null | undefined>;
}) {
  if (!enabled || !configuredToken) return false;
  return providedTokens.some((token) => Boolean(token) && token === configuredToken);
}

export function getSafeAdminCallback(candidate?: string | null) {
  if (
    !candidate ||
    !candidate.startsWith("/admin") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "/admin";
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate, "http://sevenbet.local");
  } catch {
    return "/admin";
  }

  const isAdminPath =
    parsed.pathname === "/admin" || parsed.pathname.startsWith("/admin/");

  if (
    parsed.origin !== "http://sevenbet.local" ||
    !isAdminPath ||
    parsed.pathname === "/admin/login"
  ) {
    return "/admin";
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function getAdminLoginUrl(callbackUrl?: string | null) {
  const safeCallback = getSafeAdminCallback(callbackUrl);
  return `/admin/login?callbackUrl=${encodeURIComponent(safeCallback)}`;
}

export function getAdminLoginErrorMessage() {
  return "Email or password is incorrect.";
}

export function isAdminAuthError(error: unknown): error is AdminAuthError {
  return error instanceof AdminAuthError;
}
