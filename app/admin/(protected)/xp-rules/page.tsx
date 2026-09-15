import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminPageShell, AdminRecordTable, AdminStatCard, ProgrammeAdminNavigation } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { programBuilderService } from "@/lib/services";

export const metadata: Metadata = { title: "XP Rules | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function XpRulesPage() {
  const staff = await getAdminPageAccess(await headers(), "xp-rules");
  if (!staff) return <AdminPermissionDenied />;
  const records = await programBuilderService.listXpRules();
  return <AdminPageShell area="xp-rules" title="XP Rules" intro="Configure calm educational rewards with immutable award keys and effective dates.">
    <ProgrammeAdminNavigation current="xp-rules" staff={staff} />
    <div className="adminStatsGrid">
      <AdminStatCard label="Rules" value={records.length} note="Educational event rules" />
      <AdminStatCard label="Active" value={records.filter((item) => item.active).length} note="Available for new events" />
      <AdminStatCard label="Configured XP" value={records.filter((item) => item.active).reduce((sum, item) => sum + item.xp, 0)} note="Does not rewrite earned XP" />
      <AdminStatCard label="Safety cap" value="1,000" note="Maximum XP per rule" />
    </div>
    <Card className="adminPanel"><AdminRecordTable records={records} /><p className="muted">Rules are loaded from PostgreSQL. Every future user XP event must use a unique award key, and rule changes never recalculate historical events.</p></Card>
  </AdminPageShell>;
}
