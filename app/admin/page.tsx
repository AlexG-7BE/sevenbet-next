import type { Metadata } from "next";
import { AdminAuditList, AdminPageShell, AdminRecordTable, AdminStatCard } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui";
import { listAuditEntries, listCmsRecords } from "@/lib/cms/repository";

export const metadata: Metadata = {
  title: "CMS Dashboard | SevenBet",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  const records = listCmsRecords();
  const audits = listAuditEntries();
  const countByStatus = (status: string) => records.filter((record) => record.status === status).length;

  return (
    <AdminPageShell
      title="CMS Dashboard"
      intro="Manage the SevenBet program, learning content, casino reviews, bonuses, affiliate links and editorial workflow."
    >
      <div className="adminStatsGrid">
        <AdminStatCard label="Published" value={countByStatus("PUBLISHED")} note="Public records available to read APIs" />
        <AdminStatCard label="Drafts" value={countByStatus("DRAFT")} note="Content not visible publicly" />
        <AdminStatCard label="Program steps" value={listCmsRecords("program-step").length} note="10-Step Control Program structure" />
        <AdminStatCard label="Active bonuses" value={listCmsRecords("bonus").filter((record) => record.status === "PUBLISHED").length} note="Offers ready for comparison views" />
      </div>

      <Card className="adminPanel">
        <h2>Recent CMS Records</h2>
        <AdminRecordTable records={records.slice(0, 12)} />
      </Card>

      <section className="adminPanelGrid">
        <Card>
          <h2>Workflow Foundation</h2>
          <p className="muted">
            Draft, review, approve, schedule, publish, archive and revision events are modeled for every editorial object.
          </p>
        </Card>
        <Card>
          <h2>Public Publishing Layer</h2>
          <p className="muted">
            Public APIs only expose records marked as published. Bonus offers also require an active offer status.
          </p>
        </Card>
      </section>

      <div className="adminPanel">
        <h2>Audit Activity</h2>
        <AdminAuditList entries={audits} />
      </div>
    </AdminPageShell>
  );
}
