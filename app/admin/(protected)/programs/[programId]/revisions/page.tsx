import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { programBuilderService } from "@/lib/services";

export const metadata: Metadata = { title: "Program Revisions | SevenBet CMS", robots: { index: false, follow: false } };

export default async function ProgramRevisionsPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const snapshot = await programBuilderService.findSnapshot(programId);
  if (!snapshot) notFound();
  const revisions = await programBuilderService.listRevisions(programId);
  return (
    <AdminPageShell title="Revision history" intro={`Immutable history for ${snapshot.program.title}. Restoring creates a new revision.`} actions={<Link className="button gold" href={`/admin/programs/${programId}/builder`}>Back to builder</Link>}>
      <Card className="adminPanel"><div className="revisionList">{revisions.map((revision) => <article key={revision.id}><Badge>Revision {revision.revisionNumber}</Badge><div><h3>{revision.summary}</h3><p className="muted">{revision.entityType} · {new Date(revision.createdAt).toLocaleString("en-US")} · {revision.createdBy}</p></div></article>)}{!revisions.length && <p className="muted">No revisions yet. The first meaningful builder save creates one.</p>}</div></Card>
    </AdminPageShell>
  );
}
