import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Create Affiliate Network | SevenBet CMS", robots: { index: false, follow: false } };
export default function NewNetworkPage() { return <AdminPageShell title="Affiliate Builder" intro="Create a private affiliate network record."><AffiliateEntityEditor kind="networks" /></AdminPageShell>; }
