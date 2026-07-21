import type { Metadata } from "next";
import { AffiliateDashboard } from "@/components/admin/affiliate/AffiliateAdmin";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Affiliate Builder | SevenBet CMS", robots: { index: false, follow: false } };
export default function AffiliatePage() { return <AdminPageShell title="Affiliate Platform" intro="Commercial operations for networks, programs, offers and tracking destinations."><AffiliateDashboard /></AdminPageShell>; }
