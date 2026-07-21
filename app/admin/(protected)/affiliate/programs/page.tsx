import type { Metadata } from "next";
import { AffiliateListPage } from "@/components/admin/affiliate/AffiliateAdmin";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Affiliate Programs | SevenBet CMS", robots: { index: false, follow: false } };
export default function ProgramsPage() { return <AdminPageShell title="Affiliate Builder" intro="Manage operator programs within affiliate networks."><AffiliateListPage kind="programs" /></AdminPageShell>; }
