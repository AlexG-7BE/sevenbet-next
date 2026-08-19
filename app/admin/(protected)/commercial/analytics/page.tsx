import { Badge, Card } from "@/components/ui";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { CommercialNav } from "@/components/admin/commercial/CommercialNav";
export const dynamic = "force-dynamic";
export default function CommercialAnalyticsPage() { return <AdminPageShell area="commercial" title="Commercial Analytics" intro="Verified aggregate performance only. No Programme, Help, vulnerability or user-level profiling data enters this area."><CommercialNav /><Card className="commercialEmpty"><Badge>Zero verified performance data</Badge><h2>Performance reporting begins when real affiliate events exist</h2><p className="muted">The current repository has no verified clicks, registrations, FTDs, revenue or commission event source, so this view deliberately reports no invented metrics.</p></Card></AdminPageShell>; }
