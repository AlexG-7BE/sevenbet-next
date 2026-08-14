import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Badge, Button, Card, Container } from "@/components/ui";
import { entityLabels } from "@/lib/cms/entities";
import type { AuditLogEntry, CmsEntity, CmsRecord } from "@/lib/cms/types";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canAccessAdminArea, type AdminArea } from "@/lib/auth/admin-page-policy";

export const adminNav: Array<{ href: string; label: string; area: AdminArea }> = [
  { href: "/admin", label: "Dashboard", area: "dashboard" },
  { href: "/admin/programs", label: "Programs", area: "programs" },
  { href: "/admin/program-settings", label: "Program settings", area: "program-settings" },
  { href: "/admin/achievements", label: "Achievements", area: "achievements" },
  { href: "/admin/xp-rules", label: "XP Rules", area: "xp-rules" },
  { href: "/admin/learning", label: "Learning Center", area: "learning" },
  { href: "/admin/casinos", label: "Casinos", area: "casinos" },
  { href: "/admin/bonuses", label: "Bonuses", area: "bonuses" },
  { href: "/admin/affiliate", label: "Affiliate", area: "affiliate" },
  { href: "/admin/users", label: "Users", area: "users" },
  { href: "/admin/analytics", label: "Analytics", area: "analytics" },
  { href: "/admin/settings", label: "Settings", area: "settings" },
];

export async function AdminPageShell({
  title,
  intro,
  children,
  actions,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const staff = await getAdminPageAccess(await headers(), "dashboard");
  if (!staff) return <AdminPermissionDenied />;
  const visibleNavigation = adminNav.filter((item) => canAccessAdminArea(staff, item.area));

  return (
    <div className="adminPage">
      <Container>
        <div className="adminShell">
          <aside className="adminSidebar" aria-label="CMS navigation">
            <Link className="brand adminBrand" href="/admin">
              <span className="mark">B4</span>
              <span>B4GAMBLE CMS</span>
            </Link>
            <nav>
              {visibleNavigation.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <AdminLogoutButton />
            <Card className="adminNotice" tone="soft">
              <Badge tone="green">Dual auth</Badge>
              <p className="muted">Better Auth staff sessions are active. The preview token remains a temporary, environment-gated fallback.</p>
            </Card>
          </aside>

          <main className="adminMain">
            <div className="adminHeader">
              <div>
                <p className="eyebrow">Headless CMS</p>
                <h1>{title}</h1>
                <p className="lead">{intro}</p>
              </div>
              {actions}
            </div>
            {children}
          </main>
        </div>
      </Container>
    </div>
  );
}

export function AdminStatCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <Card className="adminStat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </Card>
  );
}

export function AdminRecordTable({ records }: { records: CmsRecord[] }) {
  return (
    <div className="adminTable" role="table" aria-label="CMS records">
      <div className="adminTableRow adminTableHead" role="row">
        <span role="columnheader">Title</span>
        <span role="columnheader">Type</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Updated</span>
      </div>
      {records.map((record) => (
        <div className="adminTableRow" role="row" key={`${record.entity}-${record.id}`}>
          <strong role="cell">{record.title}</strong>
          <span role="cell">{entityLabels[record.entity]}</span>
          <span role="cell"><Badge tone={record.status === "PUBLISHED" || record.status === "ACTIVE" ? "green" : "warning"}>
            {record.status}
          </Badge></span>
          <span role="cell">{new Date(record.updatedAt).toLocaleDateString("en-US")}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminAuditList({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries.length) {
    return (
      <Card>
        <h3>No audit activity yet</h3>
        <p className="muted">Create or update CMS records through the admin API to populate the audit log.</p>
      </Card>
    );
  }

  return (
    <div className="adminAudit">
      {entries.slice(0, 8).map((entry) => (
        <Card key={entry.id}>
          <Badge>{entry.action}</Badge>
          <h3>{entry.summary}</h3>
          <p className="muted">{new Date(entry.timestamp).toLocaleString("en-US")}</p>
        </Card>
      ))}
    </div>
  );
}

export function AdminApiActions({ entity, showSettings = false }: { entity: CmsEntity; showSettings?: boolean }) {
  return (
    <div className="heroActions">
      <Button href={`/api/admin/${entity}`} variant="primary">
        Open API
      </Button>
      {showSettings ? <Button href="/admin/settings" variant="ghost">Settings</Button> : null}
    </div>
  );
}
