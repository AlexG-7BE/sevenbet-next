import { EditorialStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canAccessAdminArea, type AdminArea } from "@/lib/auth/admin-page-policy";
import { listCustomers } from "@/lib/customers/admin.server";
import { articleService, casinoService, programService } from "@/lib/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | B4GAMBLE",
  robots: { index: false, follow: false },
};

const operationalDomains: Array<{ area: AdminArea; href: string; title: string; description: string }> = [
  { area: "programs", href: "/admin/programs", title: "Programs", description: "Educational Programme structure, review, revisions and publication." },
  { area: "learning", href: "/admin/learning", title: "Learning Center", description: "Locale-scoped Article drafts, review, publication and revisions." },
  { area: "casinos", href: "/admin/casinos", title: "Casinos", description: "Casino profiles, structured bonuses and immutable published snapshots." },
  { area: "affiliate", href: "/admin/affiliate", title: "Affiliate Operations", description: "Network, program, offer and tracking configuration; not public route authority." },
  { area: "commercial", href: "/admin/commercial", title: "Commercial", description: "Relationship, evidence and pipeline operations outside runtime authority." },
  { area: "customers", href: "/admin/customers", title: "Customers", description: "Registered identities, consent, Programme state and safe outbound history." },
  { area: "analytics", href: "/admin/analytics", title: "Analytics", description: "Fixed Product Core dashboards from canonical events and persisted state." },
  { area: "email", href: "/admin/email", title: "Email", description: "Reviewed lifecycle and campaign records with consent enforcement." },
  { area: "templates", href: "/admin/templates", title: "Email Templates", description: "Versioned operational email copy and active locale versions." },
];

export default async function AdminDashboardPage() {
  const staff = await getAdminPageAccess(await headers(), "dashboard");
  if (!staff) return <AdminPermissionDenied />;

  const [programs, articles, casinos, customers] = await Promise.all([
    canAccessAdminArea(staff, "programs") ? programService.listPrograms() : Promise.resolve(null),
    canAccessAdminArea(staff, "learning") ? articleService.listAdminArticles({ status: EditorialStatus.PUBLISHED, take: 1 }) : Promise.resolve(null),
    canAccessAdminArea(staff, "casinos") ? casinoService.listCasinos({ status: EditorialStatus.PUBLISHED, take: 1 }) : Promise.resolve(null),
    canAccessAdminArea(staff, "customers") ? listCustomers() : Promise.resolve(null),
  ]);
  const visibleDomains = operationalDomains.filter((domain) => canAccessAdminArea(staff, domain.area));

  return (
    <AdminPageShell
      title="Operations Dashboard"
      intro="A truthful overview of the current PostgreSQL-backed editorial and operational domains available to this staff role."
    >
      <div className="adminStatsGrid">
        {programs ? <AdminStatCard label="Published Programs" value={programs.filter((program) => program.status === EditorialStatus.PUBLISHED).length} note={`${programs.length} total PostgreSQL records`} /> : null}
        {articles ? <AdminStatCard label="Published Articles" value={articles.total} note="Canonical Learning Center records" /> : null}
        {casinos ? <AdminStatCard label="Published Casinos" value={casinos.total} note="Canonical Casino CMS records" /> : null}
        {customers ? <AdminStatCard label="Registered Customers" value={customers.total} note="Canonical registered identities" /> : null}
      </div>

      <Card className="adminPanel">
        <div>
          <p className="eyebrow">Current systems</p>
          <h2>Operational domains</h2>
          <p className="muted">Every count above is read from its current PostgreSQL service. No Phase-1 seed or in-memory CMS record is included.</p>
        </div>
        <div className="adminDomainGrid">
          {visibleDomains.map((domain) => <Link href={domain.href} key={domain.href}><strong>{domain.title}</strong><span>{domain.description}</span><small>Open workspace →</small></Link>)}
        </div>
      </Card>
    </AdminPageShell>
  );
}
