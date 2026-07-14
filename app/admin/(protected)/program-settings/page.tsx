import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Program Settings | SevenBet CMS", robots: { index: false, follow: false } };
export default function ProgramSettingsPage() { return <AdminPageShell title="Program Settings" intro="Global defaults for progress, versions, preview security and publication behavior."><div className="adminPanelGrid"><Card><h2>Progress compatibility</h2><p className="muted">Current browser progress remains stored under sevenbet-program-progress-v1 and references stable step numbers. Database enrollment version pinning is prepared in the Phase 2 schema.</p></Card><Card><h2>Draft preview</h2><p className="muted">Preview routes are protected by admin middleware, excluded from search indexing, and never returned by public CMS APIs.</p></Card><Card><h2>Publication</h2><p className="muted">Critical validation findings block publication. A successful publish writes a stable snapshot while the next draft can evolve separately.</p></Card><Card><h2>Program management</h2><Link href="/admin/programs">Open Programs</Link><br/><Link href="/admin/xp-rules">Open XP Rules</Link><br/><Link href="/admin/achievements">Open Achievements</Link></Card></div></AdminPageShell>; }
