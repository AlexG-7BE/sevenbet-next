import type { Metadata } from "next";
import { AdminPageShell, AdminRecordTable, AdminStatCard } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui";
import { listCmsRecords } from "@/lib/cms/repository";
import type { CmsAchievement } from "@/lib/cms/types";

export const metadata: Metadata = { title: "Achievements | SevenBet CMS", robots: { index: false, follow: false } };
export default function AchievementsPage() { const records = listCmsRecords("achievement") as CmsAchievement[]; return <AdminPageShell title="Achievement Builder" intro="Manage educational milestones without rewarding gambling, deposits, losses or registrations."><div className="adminStatsGrid"><AdminStatCard label="Achievements" value={records.length} note="Configured milestones"/><AdminStatCard label="Active" value={records.filter((item) => item.active).length} note="Eligible for rule evaluation"/><AdminStatCard label="Hidden" value={records.filter((item) => item.hidden).length} note="Not shown before award"/><AdminStatCard label="Award XP" value={records.reduce((sum, item) => sum + item.xpReward, 0)} note="Configured total"/></div><Card className="adminPanel"><AdminRecordTable records={records}/><p className="muted">Trigger configuration is stored as structured data and evaluated idempotently. Full database-backed trigger simulation is scheduled after the Prisma repository is connected.</p></Card></AdminPageShell>; }
