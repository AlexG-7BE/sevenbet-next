import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { ProgramExperience } from "@/components/ProgramExperience";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canAccessAdminArea } from "@/lib/auth/admin-page-policy";
import { programSnapshotToPublicSteps } from "@/lib/services";
import { programBuilderService } from "@/lib/services";

export const metadata: Metadata = { title: "Draft Program Preview | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function ProgramPreviewPage({ params, searchParams }: { params: Promise<{ programId: string }>; searchParams: Promise<{ viewport?: string; user?: string; country?: string }> }) {
  const staff = await getAdminPageAccess(await headers(), "program-preview");
  if (!staff) return <AdminPermissionDenied />;
  const { programId } = await params;
  const options = await searchParams;
  const viewport = ["desktop", "tablet", "mobile"].includes(options.viewport || "") ? options.viewport! : "desktop";
  const user = ["first-time", "returning", "logged-out", "logged-in"].includes(options.user || "") ? options.user! : "first-time";
  const snapshot = await programBuilderService.findSnapshot(programId);
  if (!snapshot) notFound();
  const returnHref = canAccessAdminArea(staff, "program-edit") ? `/admin/programs/${programId}/builder` : `/admin/programs/${programId}`;
  const returnLabel = canAccessAdminArea(staff, "program-edit") ? "Back to builder" : "Back to program";
  return <div className="adminPreview"><div className="adminPreviewBar"><strong>Authenticated draft preview · v{snapshot.program.draftVersion}</strong><form><select name="viewport" defaultValue={viewport} aria-label="Preview viewport"><option>desktop</option><option>tablet</option><option>mobile</option></select><select name="user" defaultValue={user} aria-label="Preview user state"><option>first-time</option><option>returning</option><option>logged-out</option><option>logged-in</option></select><input name="country" defaultValue={options.country || "global"} aria-label="Preview country"/><button className="button ghost" type="submit">Apply</button></form><Link className="button ghost" href={returnHref}>{returnLabel}</Link></div><div className={`previewViewport ${viewport}`} data-user-state={user}><ProgramExperience steps={programSnapshotToPublicSteps(snapshot)} /></div></div>;
}
