import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Button, Card, Container } from "@/components/ui";
import { entityLabels } from "@/lib/cms/entities";
import type { AuditLogEntry, CmsEntity, CmsRecord } from "@/lib/cms/types";

const adminNav: Array<{ href: string; label: string; entity?: CmsEntity }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/programs", label: "Programs", entity: "program" },
  { href: "/admin/achievements", label: "Achievements", entity: "achievement" },
  { href: "/admin/xp-rules", label: "XP Rules", entity: "xp-rule" },
  { href: "/admin/learning", label: "Learning Center", entity: "article" },
  { href: "/admin/casinos", label: "Casinos", entity: "casino" },
  { href: "/admin/bonuses", label: "Bonuses", entity: "bonus" },
  { href: "/admin/affiliate", label: "Affiliate", entity: "affiliate-link" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings", entity: "settings" },
];

export function AdminPageShell({
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
  return (
    <div className="adminPage">
      <Container>
        <div className="adminShell">
          <aside className="adminSidebar" aria-label="CMS navigation">
            <Link className="brand adminBrand" href="/admin">
              <span className="mark">7</span>
              <span>SevenBet CMS</span>
            </Link>
            <nav>
              {adminNav.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <Card className="adminNotice" tone="soft">
              <Badge tone="warning">Phase 2</Badge>
              <p className="muted">Program Builder is active. Preview auth and in-memory storage remain temporary until PostgreSQL is connected.</p>
            </Card>
          </aside>

          <section className="adminMain">
            <div className="adminHeader">
              <div>
                <p className="eyebrow">Headless CMS</p>
                <h1>{title}</h1>
                <p className="lead">{intro}</p>
              </div>
              {actions}
            </div>
            {children}
          </section>
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
        <span>Title</span>
        <span>Type</span>
        <span>Status</span>
        <span>Updated</span>
      </div>
      {records.map((record) => (
        <div className="adminTableRow" role="row" key={`${record.entity}-${record.id}`}>
          <strong>{record.title}</strong>
          <span>{entityLabels[record.entity]}</span>
          <Badge tone={record.status === "PUBLISHED" || record.status === "ACTIVE" ? "green" : "warning"}>
            {record.status}
          </Badge>
          <span>{new Date(record.updatedAt).toLocaleDateString("en-US")}</span>
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

export function AdminApiActions({ entity }: { entity: CmsEntity }) {
  return (
    <div className="heroActions">
      <Button href={`/api/admin/${entity}`} variant="primary">
        Open API
      </Button>
      <Button href="/admin/settings" variant="ghost">
        Settings
      </Button>
    </div>
  );
}
