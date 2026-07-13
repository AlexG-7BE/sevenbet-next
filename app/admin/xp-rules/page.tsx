import type { Metadata } from "next";
import { AdminPageShell, AdminRecordTable, AdminStatCard } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui";
import { listCmsRecords } from "@/lib/cms/repository";
import type { CmsXpRule } from "@/lib/cms/types";

export const metadata: Metadata = { title: "XP Rules | SevenBet CMS", robots: { index: false, follow: false } };
export default function XpRulesPage() { const records = listCmsRecords("xp-rule") as CmsXpRule[]; return <AdminPageShell title="XP Rules" intro="Configure calm educational rewards with immutable award keys and effective dates."><div className="adminStatsGrid"><AdminStatCard label="Rules" value={records.length} note="Educational event rules"/><AdminStatCard label="Active" value={records.filter((item) => item.active).length} note="Available for new events"/><AdminStatCard label="Configured XP" value={records.filter((item) => item.active).reduce((sum, item) => sum + item.xp, 0)} note="Does not rewrite earned XP"/><AdminStatCard label="Safety cap" value="1,000" note="Maximum XP per rule"/></div><Card className="adminPanel"><AdminRecordTable records={records}/><p className="muted">Every future user XP event must use a unique award key. Rule changes apply prospectively and never recalculate historical events.</p></Card></AdminPageShell>; }
