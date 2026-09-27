import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminInternalTrafficMarker } from "@/components/admin/InternalTrafficMarker";
import { hasAnalyticsInternalMarker } from "@/lib/analytics/identity.server";
import { requireAdminAccess } from "@/lib/auth/admin";
import { isAdminAuthError } from "@/lib/auth/policy";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = await headers();
  try {
    await requireAdminAccess(requestHeaders, {
      onUnauthenticated: "redirect",
    });
  } catch (error) {
    if (isAdminAuthError(error) && error.statusCode === 403) {
      return <AdminAccessDenied />;
    }

    throw error;
  }

  // A signed-in staff browser without the internal-traffic marker gets it now.
  return <>
    {children}
    {hasAnalyticsInternalMarker(requestHeaders) ? null : <AdminInternalTrafficMarker />}
  </>;
}
