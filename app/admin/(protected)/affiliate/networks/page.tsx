import type { Metadata } from "next";
import { AffiliateListPage } from "@/components/admin/affiliate/AffiliateAdmin";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Affiliate Networks | SevenBet CMS", robots: { index: false, follow: false } };
export default function NetworksPage() { return <AdminPageShell title="Affiliate Builder" intro="Manage the new affiliate platform independently from legacy redirect records."><AffiliateListPage kind="networks" /></AdminPageShell>; }
