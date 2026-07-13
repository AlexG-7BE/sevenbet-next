import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { Badge, Card } from "@/components/ui";
import { programBuilderService } from "@/lib/services";
import { validateProgramSnapshot } from "@/lib/cms/program-validation";

export const metadata: Metadata = { title: "Program Dashboard | SevenBet CMS", robots: { index: false, follow: false } };

export default async function ProgramDashboard({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const snapshot = await programBuilderService.findSnapshot(programId);
  if (!snapshot) notFound();
  const validation = validateProgramSnapshot(snapshot);
  const lessons = snapshot.steps.flatMap((step) => step.lessons);
  const blocks = lessons.flatMap((lesson) => lesson.blocks.filter((block) => !block.archived));
  const revisions = await programBuilderService.listRevisions(programId);
  return (
    <AdminPageShell title={snapshot.program.title} intro="Program health, workflow, versions and recent structural changes." actions={<div className="heroActions"><Link className="button ghost" href={`/admin/programs/${programId}/preview`}>Preview</Link><Link className="button gold" href={`/admin/programs/${programId}/builder`}>Open builder</Link></div>}>
      <div className="adminStatsGrid"><AdminStatCard label="Structure" value={`${snapshot.steps.length}/${lessons.length}`} note="Steps / lessons" /><AdminStatCard label="Blocks" value={blocks.length} note="Structured lesson blocks" /><AdminStatCard label="Validation" value={validation.errors} note={`${validation.warnings} warnings`}/><AdminStatCard label="Versions" value={`${snapshot.program.draftVersion}/${snapshot.program.publishedVersion}`} note="Draft / published" /></div>
      <div className="adminPanelGrid">
        <Card><Badge tone={snapshot.program.status === "PUBLISHED" ? "green" : "warning"}>{snapshot.program.status}</Badge><h2>Publication</h2><p className="muted">Published {snapshot.program.publishedAt ? new Date(snapshot.program.publishedAt).toLocaleString("en-US") : "not yet"}. Publication is blocked by critical validation errors.</p></Card>
        <Card><Badge>{revisions.length} revisions</Badge><h2>Recent changes</h2><p className="muted">Meaningful saves preserve snapshots. Restoring creates another revision and never erases audit history.</p><Link href={`/admin/programs/${programId}/revisions`}>Open revision history</Link></Card>
        <Card><Badge>{snapshot.achievements.length} achievements</Badge><h2>Learning rewards</h2><p className="muted">XP is awarded by idempotent event keys. Rule edits do not rewrite previously earned user XP.</p><Link href="/admin/xp-rules">Manage XP rules</Link></Card>
        <Card><Badge tone="dark">Stable IDs</Badge><h2>Progress safety</h2><p className="muted">Renaming and reordering preserve IDs. Breaking removals are archived and require an explicit migration before database-backed rollout.</p></Card>
      </div>
    </AdminPageShell>
  );
}
