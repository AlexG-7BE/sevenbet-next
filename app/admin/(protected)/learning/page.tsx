import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge, Card } from "@/components/ui";
import { articleLocales } from "@/lib/articles/article-validation";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { articleService } from "@/lib/services";

export const metadata: Metadata = { title: "Learning Center | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function LearningAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; locale?: string; category?: string }> }) {
  if (!await getAdminPageAccess(await headers(), "learning")) return <AdminPermissionDenied />;
  const filters = await searchParams;
  const result = await articleService.listAdminArticles({ search: filters.q, status: filters.status, locale: filters.locale, category: filters.category });
  return <AdminPageShell area="learning" title="Learning Center" intro="Create, review, revise, publish and archive locale-scoped Articles in the canonical PostgreSQL CMS." actions={<Link className="button gold" href="/admin/learning/new">Create Article</Link>}>
    <div className="adminStatsGrid"><AdminStatCard label="Articles" value={result.total} note="Matching PostgreSQL records" /><AdminStatCard label="Published" value={result.records.filter((article) => article.status === "PUBLISHED").length} note="Public in the selected locale" /><AdminStatCard label="In review" value={result.records.filter((article) => article.status === "IN_REVIEW").length} note="Waiting for editorial decision" /><AdminStatCard label="Drafts" value={result.records.filter((article) => article.status === "DRAFT").length} note="Private working copies" /></div>
    <Card className="adminPanel">
      <form className="articleFilters">
        <input aria-label="Search Articles" defaultValue={filters.q} name="q" placeholder="Search title, slug or excerpt…" />
        <select aria-label="Filter by status" defaultValue={filters.status} name="status"><option value="">All statuses</option>{["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select>
        <select aria-label="Filter by locale" defaultValue={filters.locale} name="locale"><option value="">All locales</option>{articleLocales().map((locale) => <option key={locale}>{locale}</option>)}</select>
        <input aria-label="Filter by category" defaultValue={filters.category} name="category" placeholder="Category slug" />
        <button className="button ghost" type="submit">Apply filters</button>
      </form>
      <div className="casinoAdminList">{result.records.map((article) => <article key={article.id}><div><div className="badgeCluster"><Badge tone={article.status === "PUBLISHED" ? "green" : "warning"}>{article.status}</Badge><Badge>{article.locale}</Badge><Badge>{article.category}</Badge></div><h2>{article.title}</h2><p className="muted">/{article.category}/{article.slug}</p><p className="muted">Updated {new Date(article.updatedAt).toLocaleString("en-GB")}</p></div><div><Link className="button ghost" href={`/admin/learning/${article.id}/preview`}>Preview</Link><Link className="button gold" href={`/admin/learning/${article.id}`}>Open editor</Link></div></article>)}{!result.records.length && <div className="adminEmptyState"><h2>No Articles match these filters.</h2><p className="muted">No placeholder production content is created automatically.</p></div>}</div>
    </Card>
  </AdminPageShell>;
}
