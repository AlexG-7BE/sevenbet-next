import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BestCasinoDecisionLayer } from "@/components/commercial-decision/BestCasinoDecisionLayer";
import { isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { publicOfferService } from "@/lib/services/public-offer.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Best Casinos — CPO Preview | B4GAMBLE",
  description: "A preview-only recommendation-first decision layer using B4GAMBLE's existing editorial evidence.",
  robots: { index: false, follow: false },
};

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  variable: "--font-seven-serif",
  display: "swap",
});

const loadShortlist = cache(async () => {
  const authority = await resolveServerJurisdiction({ routeCountryOrMarketSlug: "GB" });
  return publicOfferService.getBestOffersPageData({ country: "GB", limit: 3 }, authority);
});

export default async function BestCasinosPage() {
  if (!isCpoCommercialPreviewEnabled()) notFound();
  const result = await loadShortlist();
  if (result.status !== "available" || !result.records.length) {
    return <section style={{ margin: "0 auto", maxWidth: 900, padding: "96px 24px" }}><p>LISTINGS UNAVAILABLE · FAIL CLOSED</p><h1>The shortlist cannot be loaded.</h1><p>No cached or invented commercial result has been substituted.</p><LinkFallback /></section>;
  }
  return <div className={instrumentSerif.variable}><BestCasinoDecisionLayer inventoryMode={result.inventoryMode} records={result.records} /></div>;
}

function LinkFallback() {
  return <a href="/methodology">Review methodology</a>;
}
