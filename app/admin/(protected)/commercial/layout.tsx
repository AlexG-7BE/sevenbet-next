import { headers } from "next/headers";
import type { ReactNode } from "react";

import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { getAdminPageAccess } from "@/lib/auth/admin";

export default async function CommercialAdminLayout({ children }: { children: ReactNode }) {
  if (!await getAdminPageAccess(await headers(), "commercial")) return <AdminPermissionDenied />;
  return children;
}
