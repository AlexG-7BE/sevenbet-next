import type { Metadata } from "next";
import { AffiliateListPage } from "@/components/admin/affiliate/AffiliateAdmin";
import { AdminPageShell } from "@/components/admin/AdminShell";
export const metadata: Metadata = { title: "Affiliate Offers | SevenBet CMS", robots: { index: false, follow: false } };
export default async function OffersPage({ searchParams }: { searchParams: Promise<{ casinoId?: string; status?: string }> }) {
  const { casinoId = "", status = "" } = await searchParams;
  return <AdminPageShell title="Affiliate Builder" intro="Manage casino offers, targeting and tracking link aggregates."><AffiliateListPage initialFilters={{ casinoId, status }} kind="offers" /></AdminPageShell>;
}
