import type { Metadata } from "next";
import { AffiliateEntityEditor } from "@/components/admin/affiliate/AffiliateEditors";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Edit Affiliate Offer | SevenBet CMS", robots: { index: false, follow: false } };
export default async function OfferPage({ params }: { params: Promise<{ offerId: string }> }) { return <AdminPageShell title="Affiliate Builder" intro="Edit commercial terms and tracking destinations as one revisioned aggregate."><AffiliateEntityEditor id={(await params).offerId} kind="offers" /></AdminPageShell>; }
