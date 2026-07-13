import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminApiActions, AdminPageShell, AdminRecordTable, AdminStatCard } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { entityLabels } from "@/lib/cms/entities";
import { listCmsRecords } from "@/lib/cms/repository";
import type { CmsEntity } from "@/lib/cms/types";

const sectionConfig: Record<string, { title: string; intro: string; entities: CmsEntity[] }> = {
  learning: {
    title: "Learning Center",
    intro: "Manage educational articles, categories, tags, difficulty, reading time, schema and internal links.",
    entities: ["article"],
  },
  casinos: {
    title: "Casino Reviews",
    intro: "Maintain casino profiles, licensing details, scores, review dates and comparison metadata.",
    entities: ["casino"],
  },
  bonuses: {
    title: "Bonus Directory",
    intro: "Manage welcome offers, wagering terms, expiry status, verification dates and comparison fields.",
    entities: ["bonus"],
  },
  affiliate: {
    title: "Affiliate Links",
    intro: "Manage tracked partner destinations without exposing raw commercial URLs directly in public templates.",
    entities: ["affiliate-link"],
  },
  users: {
    title: "Users and Roles",
    intro: "Preview the role and permission model for admins, editors, reviewers, affiliate managers and analysts.",
    entities: [],
  },
  analytics: {
    title: "Analytics",
    intro: "Prepare editorial and affiliate reporting views for traffic, content freshness and offer performance.",
    entities: [],
  },
  settings: {
    title: "Settings",
    intro: "Manage navigation, disclosure defaults, site-wide copy, redirects and platform configuration.",
    entities: ["navigation", "settings"],
  },
};

export const metadata: Metadata = {
  title: "CMS Section | SevenBet",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return Object.keys(sectionConfig).map((section) => ({ section }));
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "program") redirect("/admin/programs");
  const config = sectionConfig[section];
  if (!config) notFound();

  const records = config.entities.flatMap((entity) => listCmsRecords(entity));
  const primaryEntity = config.entities[0];

  return (
    <AdminPageShell
      title={config.title}
      intro={config.intro}
      actions={primaryEntity ? <AdminApiActions entity={primaryEntity} /> : undefined}
    >
      <div className="adminStatsGrid">
        <AdminStatCard label="Records" value={records.length} note="Seeded in the Phase 1 CMS repository" />
        <AdminStatCard label="Published" value={records.filter((record) => record.status === "PUBLISHED").length} note="Visible through public APIs" />
        <AdminStatCard label="Draft or review" value={records.filter((record) => record.status !== "PUBLISHED").length} note="Hidden from public APIs" />
      </div>

      {records.length ? (
        <Card className="adminPanel">
          <div className="adminToolbar">
            <div>
              <h2>Managed records</h2>
              <p className="muted">Filtering, search and forms are represented here as the Phase 1 admin shell.</p>
            </div>
            <div className="badgeCluster">
              {config.entities.map((entity) => (
                <Badge key={entity}>{entityLabels[entity]}</Badge>
              ))}
            </div>
          </div>
          <AdminRecordTable records={records} />
        </Card>
      ) : (
        <Card>
          <Badge tone="warning">Foundation only</Badge>
          <h2>{config.title} workspace</h2>
          <p className="muted">
            The permission model and navigation shell are ready. Data tables for this workspace are part of the Prisma schema.
          </p>
        </Card>
      )}
    </AdminPageShell>
  );
}
