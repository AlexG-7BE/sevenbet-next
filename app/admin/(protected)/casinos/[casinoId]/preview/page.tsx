import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, Container } from "@/components/ui";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";

export const metadata: Metadata = {
  title: "Draft Casino Preview | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoPreviewPage({ params }: { params: Promise<{ casinoId: string }> }) {
  const { casinoId } = await params;
  const { casino, validation } = await loadCasinoBuilderData(casinoId);

  return (
    <div className="adminPreview casinoDraftPreview">
      <div className="adminPreviewBar">
        <div>
          <strong>Authenticated draft preview · v{casino.draftVersion}</strong>
          <Badge tone={casino.status === "PUBLISHED" ? "green" : "warning"}>{casino.status}</Badge>
        </div>
        <Link className="button ghost" href={`/admin/casinos/${casinoId}/builder`}>Back to builder</Link>
      </div>
      <Container>
        <header className="casinoPreviewHero">
          <div>
            <p className="eyebrow">Editorial casino preview</p>
            <h1>{casino.title}</h1>
            <p className="lead">{casino.summary || "No editorial summary has been added yet."}</p>
            <div className="badgeCluster">
              <Badge>{casino.domain}</Badge>
              <Badge>{casino.operator || "Operator not recorded"}</Badge>
              <Badge tone={validation.valid ? "green" : "warning"}>{validation.valid ? "Publication checks passed" : `${validation.issues.length} blockers`}</Badge>
            </div>
          </div>
          <Card>
            <span className="muted">Editor score</span>
            <strong className="casinoPreviewScore">{casino.editorScore?.toFixed(1) ?? "--"}</strong>
            <span className="muted">out of 10</span>
          </Card>
        </header>

        <div className="casinoPreviewGrid">
          <Card><h2>Overview</h2><p className="muted">{casino.description || "No review description has been added."}</p></Card>
          <Card><h2>Licensing</h2><p className="muted">{casino.licenses.length ? casino.licenses.map((item) => `${item.authority}: ${item.status}`).join(" · ") : "No structured licenses recorded."}</p></Card>
          <Card><h2>Payments</h2><p className="muted">{casino.paymentMethods.length ? casino.paymentMethods.map((item) => item.name).join(", ") : "No payment methods recorded."}</p></Card>
          <Card><h2>Responsible gambling</h2><p className="muted">{casino.responsibleGamblingTools.length ? casino.responsibleGamblingTools.join(", ") : "No responsible gambling tools recorded."}</p></Card>
        </div>
      </Container>
    </div>
  );
}
