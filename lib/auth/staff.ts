import "server-only";

import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import type { CmsPermission } from "@/lib/cms/types";
import { getServerSession } from "@/lib/auth/session";
import {
  AdminAuthError,
  getAdminAccessStatus,
  getAdminLoginUrl,
} from "@/lib/auth/policy";
import {
  createStaffContext,
  type StaffContext,
} from "@/lib/auth/staff-context";

type RequireStaffOptions = {
  headers?: Headers;
  onUnauthenticated?: "throw" | "redirect";
  callbackUrl?: string;
};

async function resolveStaff(requestHeaders?: Headers) {
  const session = await getServerSession(requestHeaders);

  if (!session) {
    return { session: null, staff: null };
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { userId: session.user.id },
  });

  if (!adminUser) {
    return { session, staff: null };
  }

  return {
    session,
    staff: createStaffContext({
      user: session.user,
      adminUser,
      authMethod: "better-auth",
    }),
  };
}

export async function getCurrentStaff(
  requestHeaders?: Headers,
): Promise<StaffContext | null> {
  const { staff } = await resolveStaff(requestHeaders);
  return staff;
}

export async function requireStaff({
  headers,
  onUnauthenticated = "throw",
  callbackUrl,
}: RequireStaffOptions = {}): Promise<StaffContext> {
  const { session, staff } = await resolveStaff(headers);
  const status = getAdminAccessStatus({
    hasSession: Boolean(session),
    hasStaffProfile: Boolean(staff),
    role: staff?.role,
  });

  if (status === 401) {
    if (onUnauthenticated === "redirect") {
      redirect(getAdminLoginUrl(callbackUrl));
    }

    throw new AdminAuthError(
      "Admin authentication required",
      401,
      "ADMIN_AUTH_REQUIRED",
    );
  }

  if (status === 403 || !staff) {
    throw new AdminAuthError(
      "This account is not linked to a SevenBet staff profile",
      403,
      "STAFF_ACCESS_REQUIRED",
    );
  }

  return staff;
}

export async function requireStaffPermission(
  permission: CmsPermission,
  options: RequireStaffOptions = {},
) {
  const staff = await requireStaff(options);
  const status = getAdminAccessStatus({
    hasSession: true,
    hasStaffProfile: true,
    role: staff.role,
    permission,
  });

  if (status === 403) {
    throw new AdminAuthError(
      `Missing CMS permission: ${permission}`,
      403,
      "STAFF_PERMISSION_REQUIRED",
    );
  }

  return staff;
}

export type { StaffContext } from "@/lib/auth/staff-context";
