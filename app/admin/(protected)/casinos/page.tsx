import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { casinoService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Casinos | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const result = await casinoService.listCasinos({ search: q, take: 100 });
  const casinos = result.records.filter((casino) => !status || casino.status === status);

  return (
    <AdminPageShell
      title="Casinos"
      intro="Create, review, version and publish structured casino profiles through the PostgreSQL Casino CMS."
      actions={<Link className="button gold" href="/admin/casinos/new">Create casino</Link>}
    >
      <div className="adminStatsGrid">
        <AdminStatCard label="Casinos" value={result.total} note="PostgreSQL casino records" />
        <AdminStatCard label="Published" value={result.records.filter((item) => item.status === "PUBLISHED").length} note="Immutable public snapshots" />
        <AdminStatCard label="In review" value={result.records.filter((item) => item.status === "IN_REVIEW").length} note="Waiting for editorial action" />
        <AdminStatCard label="Drafts" value={result.records.filter((item) => item.status === "DRAFT").length} note="Private working copies" />
      </div>

      <Card className="adminPanel">
        <form className="casinoFilters">
          <input aria-label="Search casinos" defaultValue={q} name="q" placeholder="Search title, domain or operator..." />
          <select aria-label="Filter by status" defaultValue={status} name="status">
            <option value="">All statuses</option>
            <option>DRAFT</option>
            <option>IN_REVIEW</option>
            <option>APPROVED</option>
            <option>SCHEDULED</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </select>
          <button className="button ghost" type="submit">Apply filters</button>
        </form>

        <div className="casinoAdminList">
          {casinos.map((casino) => (
            <article key={casino.id}>
              <div>
                <div className="badgeCluster">
                  <Badge tone={casino.status === "PUBLISHED" ? "green" : "warning"}>{casino.status}</Badge>
                  <Badge>v{casino.publishedVersion}</Badge>
                  {casino.editorScore !== null && <Badge>{casino.editorScore.toFixed(1)}/10</Badge>}
                </div>
                <h2>{casino.title}</h2>
                <p className="muted">{casino.domain}{casino.operator ? ` · ${casino.operator}` : ""}</p>
                <p className="muted">Updated {casino.updatedAt.toLocaleString("en-US")}</p>
              </div>
              <div>
                <Link className="button ghost" href={`/admin/casinos/${casino.id}`}>Dashboard</Link>
                <Link className="button ghost" href={`/admin/casinos/${casino.id}/preview`}>Preview</Link>
                <Link className="button gold" href={`/admin/casinos/${casino.id}/builder`}>Open builder</Link>
              </div>
            </article>
          ))}
          {!casinos.length && <p className="muted">No casinos match these filters.</p>}
        </div>
      </Card>
    </AdminPageShell>
  );
}
