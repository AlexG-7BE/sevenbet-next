import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Create Affiliate Program | SevenBet CMS", robots: { index: false, follow: false } };
export default function NewProgramPage() { return <AdminPageShell title="Affiliate Builder" intro="Create an operator program under an active network."><AffiliateEntityEditor kind="programs" /></AdminPageShell>; }
