import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Badge, Card, Container } from "@/components/ui";
import type { CmsRecord, CmsUser } from "@/lib/cms/types";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { canAccessAdminArea, type AdminArea } from "@/lib/auth/admin-page-policy";

export const adminNav: Array<{ href: string; label: string; area: AdminArea }> = [
  { href: "/admin", label: "Dashboard", area: "dashboard" },
  { href: "/admin/programs", label: "Programs", area: "programs" },
  { href: "/admin/learning", label: "Learning Center", area: "learning" },
  { href: "/admin/casinos", label: "Casinos", area: "casinos" },
  { href: "/admin/affiliate", label: "Affiliate Operations", area: "affiliate" },
  { href: "/admin/commercial", label: "Commercial", area: "commercial" },
  { href: "/admin/customers", label: "Customers", area: "customers" },
  { href: "/admin/analytics", label: "Analytics", area: "analytics" },
  { href: "/admin/email", label: "Email", area: "email" },
  { href: "/admin/templates", label: "Email Templates", area: "templates" },
];

export async function AdminPageShell({
  title,
  intro,
  children,
  actions,
  area = "dashboard",
}: {
  title: string;
  intro: string;
  children: ReactNode;
  actions?: ReactNode;
  area?: AdminArea;
}) {
  const staff = await getAdminPageAccess(await headers(), area);
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
            <nav aria-label="Primary Admin navigation">
              {visibleNavigation.map((item) => (
                <Link aria-current={item.area === area ? "page" : undefined} href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <AdminLogoutButton />
            <Card className="adminNotice" tone="soft">
              <Badge tone="green">Admin protected</Badge>
              <p className="muted">Better Auth + TOTP protects privileged Admin access.</p>
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
          <span role="cell">{record.entity === "xp-rule" ? "XP Rules" : record.entity === "achievement" ? "Achievements" : record.entity.replaceAll("-", " ")}</span>
          <span role="cell"><Badge tone={record.status === "PUBLISHED" || record.status === "ACTIVE" ? "green" : "warning"}>
            {record.status}
          </Badge></span>
          <span role="cell">{new Date(record.updatedAt).toLocaleDateString("en-US")}</span>
        </div>
      ))}
    </div>
  );
}

function AdminLocalNavigation({
  label,
  current,
  staff,
  items,
}: {
  label: string;
  current: string;
  staff: Pick<CmsUser, "permissions" | "role">;
  items: Array<{ href: string; label: string; area: AdminArea; id: string }>;
}) {
  const visibleItems = items.filter((item) => canAccessAdminArea(staff, item.area));
  return <nav className="adminLocalNav" aria-label={label}>{visibleItems.map((item) => <Link aria-current={item.id === current ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}</nav>;
}

export function ProgrammeAdminNavigation({ staff, current }: { staff: Pick<CmsUser, "permissions" | "role">; current: "programs" | "xp-rules" | "achievements" }) {
  return <AdminLocalNavigation label="Programme management" current={current} staff={staff} items={[
    { href: "/admin/programs", label: "Programs", area: "programs", id: "programs" },
    { href: "/admin/xp-rules", label: "XP Rules", area: "xp-rules", id: "xp-rules" },
    { href: "/admin/achievements", label: "Achievements", area: "achievements", id: "achievements" },
  ]} />;
}

export function EmailAdminNavigation({ staff, current }: { staff: Pick<CmsUser, "permissions" | "role">; current: "email" | "templates" }) {
  return <AdminLocalNavigation label="Email management" current={current} staff={staff} items={[
    { href: "/admin/email", label: "Email", area: "email", id: "email" },
    { href: "/admin/templates", label: "Email Templates", area: "templates", id: "templates" },
  ]} />;
}
