import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Edit Affiliate Program | SevenBet CMS", robots: { index: false, follow: false } };
export default async function ProgramPage({ params }: { params: Promise<{ programId: string }> }) { return <AdminPageShell title="Affiliate Builder" intro="Edit program markets, account reference and lifecycle."><AffiliateEntityEditor id={(await params).programId} kind="programs" /></AdminPageShell>; }
