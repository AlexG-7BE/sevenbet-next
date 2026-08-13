import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminPageShell, AdminRecordTable, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { programBuilderService } from "@/lib/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Achievements | B4GAMBLE CMS", robots: { index: false, follow: false } };
export default async function AchievementsPage() { if (!await getAdminPageAccess(await headers(), "achievements")) return <AdminPermissionDenied />; const records = await programBuilderService.listAchievements(); return <AdminPageShell title="Achievement Builder" intro="Manage educational milestones without rewarding gambling, deposits, losses or registrations."><div className="adminStatsGrid"><AdminStatCard label="Achievements" value={records.length} note="Configured milestones"/><AdminStatCard label="Active" value={records.filter((item) => item.active).length} note="Eligible for rule evaluation"/><AdminStatCard label="Hidden" value={records.filter((item) => item.hidden).length} note="Not shown before award"/><AdminStatCard label="Award XP" value={records.reduce((sum, item) => sum + item.xpReward, 0)} note="Configured total"/></div><Card className="adminPanel"><AdminRecordTable records={records}/><p className="muted">Trigger configuration is stored in PostgreSQL and evaluated idempotently. Trigger simulation remains a separate future workflow.</p></Card></AdminPageShell>; }
