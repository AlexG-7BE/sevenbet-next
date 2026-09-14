import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { CommercialNav } from "@/components/admin/commercial/CommercialNav";
export const dynamic = "force-dynamic";
export default function CommercialAnalyticsPage() {
  return <AdminPageShell area="commercial" title="Commercial reporting" intro="Two bounded reporting contracts, kept distinct. Reporting observes activity and never grants or vetoes a public commercial action.">
    <CommercialNav />
    <div className="analyticsGrid">
      <Card className="adminPanel">
        <Badge tone="green">Detailed runtime attribution</Badge>
        <h2>Commercial Product Core</h2>
        <p className="muted">Current OutboundClick attempts, successes and blocks sit beside consented funnel events in the fixed Commercial dashboard.</p>
        <Link className="button" href="/admin/analytics?view=commercial&range=30">Open fixed dashboard</Link>
      </Card>
      <Card className="adminPanel">
        <Badge>Aggregate-only accounting</Badge>
        <h2>Successful affiliate click report</h2>
        <p className="muted">The success-only UTC daily aggregate preserves historical click coverage that is not present in detailed storage. New successful traffic can exist in both stores, so never add their totals.</p>
        <Link className="button" href="/api/admin/affiliate/outbound-clicks">Open 30-day aggregate report</Link>
      </Card>
    </div>
    <Card className="commercialEmpty">
      <Badge tone="warning">Outcome data unavailable</Badge>
      <h2>No verified registrations, FTDs, revenue or commission source</h2>
      <p className="muted">Those outcomes remain unreported rather than inferred from clicks. Programme, Help, vulnerability and user-level profiling data never enter Commercial reporting.</p>
    </Card>
  </AdminPageShell>;
}
