import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { commercialDashboard, emailDashboard, founderOverview, programmeDashboard } from "@/lib/analytics/dashboard.server";
import { analyticsRange, canonicalMetricDefinitions, percentage } from "@/lib/analytics/metrics";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics | B4GAMBLE", robots: { index: false, follow: false } };
type View = "overview" | "programme" | "commercial" | "email";
type RankedRow = readonly [string | number, number] | { label: string; count: number };

function isRankedTuple(row: RankedRow): row is readonly [string | number, number] {
  return Array.isArray(row);
}

function RankedList({ rows, empty = "No Production data in this range." }: { rows: RankedRow[]; empty?: string }) {
  if (!rows.length) return <p className="muted">{empty}</p>;
  const maximum = Math.max(...rows.map((row) => isRankedTuple(row) ? row[1] : row.count), 1);
  return <div className="analyticsRanks">{rows.map((row, index) => {
    const label = isRankedTuple(row) ? String(row[0]) : row.label;
    const count = isRankedTuple(row) ? row[1] : row.count;
    return <div key={`${label}-${index}`}><span>{label}</span><i style={{ width: `${Math.max(2, count / maximum * 100)}%` }} /><strong>{count}</strong></div>;
  })}</div>;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!await getAdminPageAccess(await headers(), "analytics")) return <AdminPermissionDenied />;
  const search = await searchParams;
  const view: View = ["programme", "commercial", "email"].includes(search.view ?? "") ? search.view as View : "overview";
  const range = analyticsRange({ range: search.range, from: search.from, to: search.to });
  const data = view === "overview" ? await founderOverview(range)
    : view === "programme" ? await programmeDashboard(range)
      : view === "commercial" ? await commercialDashboard(range)
        : await emailDashboard(range);
  const baseRange = `range=${encodeURIComponent(search.range ?? "30")}${search.from ? `&from=${search.from}` : ""}${search.to ? `&to=${search.to}` : ""}`;
  return (
    <AdminPageShell area="analytics" title="Analytics" intro="Fixed Product Core dashboards. Production human traffic only; Preview, test, internal, and obvious bot traffic is excluded.">
      <nav className="analyticsTabs" aria-label="Analytics dashboards">
        {(["overview", "programme", "commercial", "email"] as const).map((item) => <Link aria-current={view === item ? "page" : undefined} href={`/admin/analytics?view=${item}&${baseRange}`} key={item}>{item === "overview" ? "Founder overview" : item[0].toUpperCase() + item.slice(1)}</Link>)}
      </nav>
      <Card className="adminPanel"><form className="analyticsRange" method="get"><input name="view" type="hidden" value={view} /><label><span>Range</span><select defaultValue={search.range ?? "30"} name="range"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="custom">Custom UTC range</option></select></label><label><span>From</span><input defaultValue={search.from ?? range.fromDate} name="from" type="date" /></label><label><span>To</span><input defaultValue={search.to ?? range.toDate} name="to" type="date" /></label><button className="button" type="submit">Update</button><p>{range.fromDate} → {range.toDate} · UTC</p></form></Card>
      {view === "overview" && "registeredUsers" in data ? <>
        <div className="adminStatsGrid"><AdminStatCard label="Registered users" value={data.registeredUsers} note="Canonical identities at period end" /><AdminStatCard label="New registrations" value={data.newRegistrations} note="Created in selected range" /><AdminStatCard label="Active users" value={data.activeUsers} note="Distinct consented authenticated actors" /><AdminStatCard label="Programme starts" value={data.programmeStarts} note="Selected start cohort" /><AdminStatCard label="Programme completions" value={data.programmeCompletions} note="Canonical completedAt" /><AdminStatCard label="Programme completion" value={percentage(data.programmeCompletionRate)} note={`${data.programmeCompletions}/${data.programmeStarts} selected-cohort starts`} /><AdminStatCard label="Outbound attempts" value={data.outboundClicks} note={`${data.successfulOutbound} success · ${data.blockedOutbound} blocked`} /><AdminStatCard label="Unique outbound actors" value={data.uniqueOutboundActors} note="User, otherwise session" /></div>
        <div className="analyticsGrid"><Card className="adminPanel"><h2>Sessions by GEO</h2><RankedList rows={data.topGeos} /></Card><Card className="adminPanel"><h2>Sessions by acquisition source</h2><RankedList rows={data.topAcquisitionSources} /></Card><Card className="adminPanel"><h2>Casinos by outbound traffic</h2><RankedList rows={data.topCasinos} /></Card><Card className="adminPanel"><h2>Pages producing outbound traffic</h2><RankedList rows={data.topOutboundPages} /></Card></div>
      </> : null}
      {view === "programme" && "starts" in data ? <><div className="adminStatsGrid"><AdminStatCard label="Programme starts" value={data.starts} note="Canonical enrollments" /><AdminStatCard label="Completions" value={data.completions} note="Canonical completedAt" /><AdminStatCard label="Completion rate" value={percentage(data.completionRate)} note="Same start cohort" /></div><div className="analyticsGrid"><Card className="adminPanel"><h2>Step views, completions & drop-off</h2><div className="analyticsStepTable"><div><strong>Step</strong><strong>Views</strong><strong>Completed</strong><strong>From starts</strong><strong>Drop-off</strong></div>{data.steps.map((step) => <div key={step.step}><span>Step {step.step}</span><span>{step.views}</span><span>{step.completed}</span><span>{percentage(step.completionFromStarts)}</span><span>{step.dropOff}</span></div>)}</div><p className="muted">Views are consented Product Core events. Completion and drop-off come from canonical persisted Programme state, never from views.</p></Card><Card className="adminPanel"><h2>Starts by UTC day</h2><RankedList rows={data.trend.map(({ date, count }) => ({ label: date, count }))} /></Card></div></> : null}
      {view === "commercial" && "outboundAttempts" in data ? <><div className="adminStatsGrid"><AdminStatCard label="Casino views" value={data.casinoViews} note="Canonical events" /><AdminStatCard label="Offer views" value={data.offerViews} note="CTR denominator" /><AdminStatCard label="CTA clicks" value={data.ctaClicks} note="Consented commercial clicks" /><AdminStatCard label="Successful outbound" value={data.outboundSuccesses} note={`${data.outboundBlocks} blocked of ${data.outboundAttempts} attempts`} /><AdminStatCard label="CTR" value={percentage(data.ctr)} note="CTA clicks ÷ offer views" /></div><div className="analyticsGrid"><Card className="adminPanel"><h2>Outbound by casino</h2><RankedList rows={data.byCasino} /></Card><Card className="adminPanel"><h2>Outbound by GEO</h2><RankedList rows={data.byGeo} /></Card><Card className="adminPanel"><h2>Outbound by source page</h2><RankedList rows={data.bySourcePage} /></Card><Card className="adminPanel"><h2>Outbound by acquisition</h2><RankedList rows={data.byAcquisition} /></Card></div></> : null}
      {view === "email" && "sent" in data ? <><div className="adminStatsGrid"><AdminStatCard label="Sent" value={data.sent} note="Provider accepted" /><AdminStatCard label="Delivered" value={data.delivered} note={percentage(data.deliveryRate)} /><AdminStatCard label="Bounced" value={data.bounced} note={percentage(data.bounceRate)} /><AdminStatCard label="Clicked" value={data.clicked} note={`${percentage(data.clickRate)} of delivered`} /><AdminStatCard label="Unsubscribed" value={data.unsubscribed} note="Immediate send suppression" /></div><div className="analyticsGrid"><Card className="adminPanel"><h2>Sent by template</h2><RankedList rows={data.byTemplate} /></Card><Card className="adminPanel"><h2>Sent by campaign</h2><RankedList rows={data.byCampaign} empty="No campaign sends in this range." /></Card><Card className="adminPanel"><h2>Sent by locale</h2><RankedList rows={data.byLocale} /></Card></div></> : null}
      <Card className="adminPanel"><details><summary>Canonical metric definitions</summary><dl className="metricDefinitions">{Object.entries(canonicalMetricDefinitions).map(([name, definition]) => <div key={name}><dt>{name}</dt><dd>{definition}</dd></div>)}</dl></details></Card>
    </AdminPageShell>
  );
}
