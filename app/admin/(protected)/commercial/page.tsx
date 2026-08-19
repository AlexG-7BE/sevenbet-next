import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Badge, Card } from "@/components/ui";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { CommercialCreateProspectForm } from "@/components/admin/commercial/CommercialActions";
import { CommercialNav } from "@/components/admin/commercial/CommercialNav";
import { commercialService } from "@/lib/commercial/commercial-service";
import { getAdminPageAccess } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Commercial Pipeline | B4GAMBLE CMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CommercialPipelinePage() {
  if (!await getAdminPageAccess(await headers(), "commercial")) return <AdminPermissionDenied />;
  const records = await commercialService.list(); const now = Date.now(); const overdue = records.filter((item) => item.nextActionDueAt && item.nextActionDueAt.getTime() < now && !["ACTIVE", "REJECTED"].includes(item.stage)); const founder = records.filter((item) => item.waitingOn === "FOUNDER_DECISION"); const approved = records.filter((item) => item.stage === "APPROVED");
  return <AdminPageShell area="commercial" title="Commercial Pipeline" intro="Evidence-led partner operations from prospect through activation preparation. CRM state never authorises a public route.">
    <CommercialNav />
    <div className="adminStatsGrid"><AdminStatCard label="Open records" value={records.filter((item) => !["ACTIVE", "REJECTED"].includes(item.stage)).length} note="Internal opportunities" /><AdminStatCard label="Overdue" value={overdue.length} note="Past next-action date" /><AdminStatCard label="Founder decision" value={founder.length} note="Explicitly waiting" /><AdminStatCard label="Approved / not active" value={approved.length} note="Still behind RFC-015" /></div>
    <Card className="adminPanel"><div className="adminToolbar"><div><h2>Operating queue</h2><p className="muted">List-first, with evidence counts and real next actions.</p></div></div>{records.length ? <div className="commercialTable" role="table" aria-label="Commercial pipeline"><div className="commercialTableRow commercialTableHead" role="row"><span>Name</span><span>Stage</span><span>Priority</span><span>Next action</span><span>Evidence</span><span>Updated</span></div>{records.map((item) => <Link className="commercialTableRow" role="row" href={`/admin/commercial/partners/${item.id}`} key={item.id}><strong>{item.displayName}</strong><span><Badge tone={item.stage === "APPROVED" ? "warning" : "neutral"}>{item.stage}</Badge></span><span>{item.priority}</span><span>{item.nextActionSummary || "Not set"}{item.nextActionDueAt ? <small>{item.nextActionDueAt.toLocaleDateString("en-GB")}</small> : null}</span><span>{item._count.evidence}</span><span>{item.updatedAt.toLocaleDateString("en-GB")}</span></Link>)}</div> : <div className="commercialEmpty"><Badge>Truthful empty state</Badge><h3>No commercial prospects</h3><p className="muted">No partner relationship is implied and no synthetic data has been seeded.</p></div>}</Card>
    <Card className="adminPanel"><h2>Create prospect</h2><p className="muted">Create only a potential organisation. Qualification, approval and GB eligibility require later evidence.</p><CommercialCreateProspectForm /></Card>
  </AdminPageShell>;
}
