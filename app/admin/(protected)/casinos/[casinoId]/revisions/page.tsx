import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageShell } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";
import { casinoService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Casino Revisions | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoRevisionsPage({ params }: { params: Promise<{ casinoId: string }> }) {
  const { casinoId } = await params;
  const data = await loadCasinoBuilderData(casinoId);
  const revisions = await casinoService.getRevisionHistory(casinoId);

  return (
    <AdminPageShell
      title="Casino revision history"
      intro={`Immutable pre-change snapshots for ${data.casino.title}.`}
      actions={<Link className="button gold" href={`/admin/casinos/${casinoId}/builder?section=history`}>Back to builder</Link>}
    >
      <Card className="adminPanel">
        <div className="casinoRevisionTable" role="table" aria-label="Casino revisions">
          <div className="casinoRevisionRow head" role="row">
            <span>Revision #</span>
            <span>Author</span>
            <span>Created</span>
            <span>Workflow Status</span>
            <span>Published Version</span>
          </div>
          {revisions.map((revision) => (
            <div className="casinoRevisionRow" key={revision.id} role="row">
              <span><Badge>#{revision.revisionNumber}</Badge></span>
              <span><strong>{revision.author}</strong>{revision.authorEmail && <small>{revision.authorEmail}</small>}</span>
              <span>{new Date(revision.createdAt).toLocaleString("en-US")}</span>
              <span><Badge tone={revision.workflowStatus === "PUBLISHED" ? "green" : "warning"}>{revision.workflowStatus}</Badge></span>
              <span>v{revision.publishedVersion}</span>
            </div>
          ))}
          {!revisions.length && <p className="muted">No revisions yet. The first successful Builder save creates one.</p>}
        </div>
      </Card>
    </AdminPageShell>
  );
}
