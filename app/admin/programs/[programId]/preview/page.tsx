import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramExperience } from "@/components/ProgramExperience";
import { getProgramSnapshot, programSnapshotToPublicSteps } from "@/lib/cms/program-builder";

export const metadata: Metadata = { title: "Draft Program Preview | SevenBet CMS", robots: { index: false, follow: false } };

export default async function ProgramPreviewPage({ params, searchParams }: { params: Promise<{ programId: string }>; searchParams: Promise<{ viewport?: string; user?: string; country?: string }> }) {
  const { programId } = await params;
  const options = await searchParams;
  const viewport = ["desktop", "tablet", "mobile"].includes(options.viewport || "") ? options.viewport! : "desktop";
  const user = ["first-time", "returning", "logged-out", "logged-in"].includes(options.user || "") ? options.user! : "first-time";
  const snapshot = getProgramSnapshot(programId);
  if (!snapshot) notFound();
  return <div className="adminPreview"><div className="adminPreviewBar"><strong>Authenticated draft preview · v{snapshot.program.draftVersion}</strong><form><select name="viewport" defaultValue={viewport} aria-label="Preview viewport"><option>desktop</option><option>tablet</option><option>mobile</option></select><select name="user" defaultValue={user} aria-label="Preview user state"><option>first-time</option><option>returning</option><option>logged-out</option><option>logged-in</option></select><input name="country" defaultValue={options.country || "global"} aria-label="Preview country"/><button className="button ghost" type="submit">Apply</button></form><Link className="button ghost" href={`/admin/programs/${programId}/builder`}>Back to builder</Link></div><div className={`previewViewport ${viewport}`} data-user-state={user}><ProgramExperience steps={programSnapshotToPublicSteps(snapshot)} /></div></div>;
}
