import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Edit Affiliate Network | SevenBet CMS", robots: { index: false, follow: false } };
export default async function NetworkPage({ params }: { params: Promise<{ networkId: string }> }) { return <AdminPageShell title="Affiliate Builder" intro="Edit network identity, lifecycle and integration capabilities."><AffiliateEntityEditor id={(await params).networkId} kind="networks" /></AdminPageShell>; }
