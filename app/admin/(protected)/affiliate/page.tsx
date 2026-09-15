import type { Metadata } from "next";
import { AffiliateDashboard } from "@/components/admin/affiliate/AffiliateAdmin";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Affiliate Operations | B4GAMBLE CMS", robots: { index: false, follow: false } };
export default function AffiliatePage() { return <AdminPageShell area="affiliate" title="Affiliate Operations" intro="Operational network, program, offer and tracking configuration outside public Commercial authority."><AffiliateDashboard /></AdminPageShell>; }
