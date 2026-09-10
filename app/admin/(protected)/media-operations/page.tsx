import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { getAdminPageAccess } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Media Operations | B4GAMBLE CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MediaOperationsPage() {
  if (!await getAdminPageAccess(await headers(), "media-operations")) return <AdminPermissionDenied />;
  return <AdminPageShell area="media-operations" title="Media Operations retired" intro="Promotional creative ingestion and placement assignment are no longer part of the B4GAMBLE product.">
    <section className="adminSurface"><h2>Logo-only media policy</h2><p>Manage canonical operator logos from the Casino editor. Historical promotional-media records remain read-only and are not published.</p></section>
  </AdminPageShell>;
}
