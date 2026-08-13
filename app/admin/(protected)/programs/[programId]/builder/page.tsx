import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { ProgramBuilder } from "@/components/admin/ProgramBuilder";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canPerformAction } from "@/lib/cms/permissions";
import { programBuilderService } from "@/lib/services";

export const metadata: Metadata = { title: "Program Builder | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function ProgramBuilderPage({ params }: { params: Promise<{ programId: string }> }) {
  const staff = await getAdminPageAccess(await headers(), "program-edit");
  if (!staff) return <AdminPermissionDenied />;
  const { programId } = await params;
  const snapshot = await programBuilderService.findSnapshot(programId);
  if (!snapshot) notFound();
  return <ProgramBuilder
    initialSnapshot={snapshot}
    canReview={canPerformAction(staff, "program.review")}
    canApprove={canPerformAction(staff, "program.approve")}
    canPublish={canPerformAction(staff, "program.publish")}
  />;
}
