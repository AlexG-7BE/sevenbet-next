import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { CommercialNav } from "@/components/admin/commercial/CommercialNav";
import { commercialService } from "@/lib/commercial/commercial-service";
export const dynamic = "force-dynamic";
export default async function CommercialPartnersPage() { const records = await commercialService.list(); return <AdminPageShell area="commercial" title="Partners & Prospects" intro="One canonical record from uncertain prospect through relationship maturity."><CommercialNav /><Card className="adminPanel">{records.length ? <div className="commercialDirectory">{records.map((record) => <Link href={`/admin/commercial/partners/${record.id}`} key={record.id}><span><strong>{record.displayName}</strong><small>{record.legalName || "Legal identity not yet detected"}</small></span><Badge>{record.stage}</Badge><span>{record.organizationType}</span><span>{record.owner?.name || "Unassigned"}</span></Link>)}</div> : <div className="commercialEmpty"><h2>No records yet</h2><p className="muted">Create the first evidence-led prospect from Pipeline.</p><Link className="button" href="/admin/commercial">Open Pipeline</Link></div>}</Card></AdminPageShell>; }
