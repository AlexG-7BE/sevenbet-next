import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Create Affiliate Offer | SevenBet CMS", robots: { index: false, follow: false } };
export default async function NewOfferPage({ searchParams }: { searchParams: Promise<{ casinoId?: string }> }) { return <AdminPageShell title="Affiliate Builder" intro="Create a draft offer and its initial tracking destinations."><AffiliateEntityEditor initialCasinoId={(await searchParams).casinoId} kind="offers" /></AdminPageShell>; }
