import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { requireAdminAccess } from "@/lib/auth/admin";
import { isAdminAuthError } from "@/lib/auth/policy";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireAdminAccess(await headers(), {
      onUnauthenticated: "redirect",
    });
  } catch (error) {
    if (isAdminAuthError(error) && error.statusCode === 403) {
      return <AdminAccessDenied />;
    }

    throw error;
  }

  return children;
}
