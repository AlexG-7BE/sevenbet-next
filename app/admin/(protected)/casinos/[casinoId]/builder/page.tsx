import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { CasinoBuilderLayout } from "@/components/admin/CasinoBuilder";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { isCasinoBuilderSection } from "@/lib/casino-builder/sections";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";
import { canPerformAction } from "@/lib/cms/permissions";

export const metadata: Metadata = {
  title: "Casino Builder | B4GAMBLE CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ casinoId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const staff = await getAdminPageAccess(await headers(), "casinos");
  if (!staff) return <AdminPermissionDenied />;
  const { casinoId } = await params;
  const { section } = await searchParams;
  const data = await loadCasinoBuilderData(casinoId);
  const canManageAffiliate = canPerformAction(staff, "affiliate.manage");
  const canManageMedia = canPerformAction(staff, "media.manage");
  const requestedSection = isCasinoBuilderSection(section) ? section : "general";
  const initialSection = requestedSection === "affiliate-links" && !canManageAffiliate
    || requestedSection === "media" && !canManageMedia
    ? "general"
    : requestedSection;

  return (
    <CasinoBuilderLayout
      initialData={data}
      initialSection={initialSection}
      canManageAffiliate={canManageAffiliate}
      canManageMedia={canManageMedia}
    />
  );
}
