import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { MediaOperationsWorkbench } from "@/components/admin/media/MediaOperationsWorkbench";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { mediaOperationsService } from "@/lib/media-operations/service";

export const metadata: Metadata = { title: "Media Operations | B4GAMBLE CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MediaOperationsPage() {
  if (!await getAdminPageAccess(await headers(), "media-operations")) return <AdminPermissionDenied />;
  const casinos = await mediaOperationsService.references();
  return <AdminPageShell area="media-operations" title="Media Operations" intro="Ingest partner creatives into first-party storage, inspect evidence, and prepare protected draft assignments without publishing.">
    <MediaOperationsWorkbench casinos={casinos} />
  </AdminPageShell>;
}
