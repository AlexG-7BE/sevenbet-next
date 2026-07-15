import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";

export const metadata: Metadata = {
  title: "Casino Dashboard | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoDashboardPage({ params }: { params: Promise<{ casinoId: string }> }) {
  const { casinoId } = await params;
  const data = await loadCasinoBuilderData(casinoId);
  const { casino } = data;
  const commercialRecords = casino.casinoBonuses.length + casino.casinoLinks.length;

  return (
    <AdminPageShell
      title={casino.title}
      intro="Casino content health, structured comparison coverage, workflow and version history."
      actions={
        <div className="heroActions">
          <Link className="button ghost" href={`/admin/casinos/${casinoId}/preview`}>Preview</Link>
          <Link className="button gold" href={`/admin/casinos/${casinoId}/builder`}>Open builder</Link>
        </div>
      }
    >
      <div className="adminStatsGrid">
        <AdminStatCard label="Validation" value={data.validation.issues.length} note="Publication blockers" />
        <AdminStatCard label="Markets" value={casino.countries.length} note="Country availability records" />
        <AdminStatCard label="Payments" value={casino.paymentMethods.length} note="Structured payment methods" />
        <AdminStatCard label="Versions" value={`${casino.draftVersion}/${casino.publishedVersion}`} note="Draft / published" />
      </div>

      <div className="adminPanelGrid">
        <Card>
          <Badge tone={casino.status === "PUBLISHED" ? "green" : "warning"}>{casino.status}</Badge>
          <h2>Publication</h2>
          <p className="muted">Published {casino.publishedAt ? new Date(casino.publishedAt).toLocaleString("en-US") : "not yet"}. Workflow actions preserve revisions and immutable published snapshots.</p>
        </Card>
        <Card>
          <Badge>{casino.licenses.length} licenses</Badge>
          <h2>Trust coverage</h2>
          <p className="muted">Licenses, country rules and responsible gambling tools are loaded as structured records.</p>
          <Link href={`/admin/casinos/${casinoId}/builder?section=licenses`}>Review trust data</Link>
        </Card>
        <Card>
          <Badge>{commercialRecords} commercial records</Badge>
          <h2>Offers and links</h2>
          <p className="muted">Structured bonuses and managed destinations stay separate from editorial review content.</p>
          <Link href={`/admin/casinos/${casinoId}/builder?section=bonuses`}>Review offer data</Link>
        </Card>
        <Card>
          <Badge>{data.revisionCount} revisions</Badge>
          <h2>History</h2>
          <p className="muted">Every meaningful save records the previous aggregate before applying the update.</p>
          <Link href={`/admin/casinos/${casinoId}/revisions`}>Open revision history</Link>
        </Card>
      </div>
    </AdminPageShell>
  );
}
