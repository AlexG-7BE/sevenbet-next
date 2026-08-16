import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { cache } from "react";

import {
  ActiveBonusFilters,
  BonusComparisonList,
  BonusFilters,
  BonusPagination,
} from "@/components/bonus-directory/BonusDirectory";
import { CuratedBonusShortlist } from "@/components/bonus-directory/CuratedBonusShortlist";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { HandoffPage } from "@/components/final-handoff/HandoffPage";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import finalStyles from "./BonusesFinal.module.css";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import type { PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { isLocalHandoffVisualFixture } from "@/lib/final-handoff/visual-fixture";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<PublicOfferSearchParams> };
const loadBonusDirectoryResult = cache(async (queryKey: string) => {
  const query = JSON.parse(queryKey) as PublicOfferQuery;
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country ?? null });
  return publicOfferService.searchOffers(query, authority);
});

function loadBonusDirectory(query: PublicOfferQuery) {
  return loadBonusDirectoryResult(JSON.stringify(query));
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parsePublicOfferQuery(await searchParams, 24);
  const filtered = hasPublicOfferFilters(query);
  const result = await loadBonusDirectory(query);
  const unavailable = result.inventoryMode === "UNAVAILABLE";
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const empty = result.total === 0;
  const title = unavailable
    ? "Casino Bonus Directory Unavailable | B4GAMBLE"
    : query.page > 1
      ? `Casino Bonus Comparison — Page ${query.page} | B4GAMBLE`
      : containsDemo
        ? "Casino Bonus Demonstration | B4GAMBLE"
        : "Casino Bonus Comparison | B4GAMBLE";
  const description = unavailable
    ? "The published casino bonus directory is temporarily unavailable. No cached, legacy, demonstration or invented listing is substituted."
    : containsDemo
      ? "Fictional demonstration records showing how B4GAMBLE compares casino bonus terms. Not current GB promotions or partner offers."
      : "Compare casino bonus terms by country preference, type, payment, deposit, wagering and governed action availability.";
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl("/bonuses") },
    robots: unavailable || filtered || containsDemo || empty ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: "website", title, description, url: absoluteUrl("/bonuses") },
  };
}

export default async function BonusesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  if (isLocalHandoffVisualFixture(raw.visualFixture)) return <HandoffPage name="bonuses" />;
  const query = parsePublicOfferQuery(raw, 24);
  const result = await loadBonusDirectory(query);
  const activeCount = [query.country, query.type, query.payment, query.crypto, query.maxDeposit, query.maxWagering, query.availability].filter((value) => value !== undefined).length;
  const startPosition = (result.page - 1) * result.pageSize + 1;
  const schema = result.inventoryMode === "PUBLISHED_ONLY" && result.total > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Published casino bonus directory",
    numberOfItems: result.total,
    itemListElement: result.records.map((offer, index) => ({
      "@type": "ListItem",
      position: startPosition + index,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(`/casino/${offer.casino.slug}`),
    })),
  } : null;

  return <div className={`${styles.page} ${instrumentSerif.variable}`}>
    <CommercialSurfaceView surface="bonuses" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={finalStyles.hero}><div><small>Bonuses · Terms first · 18+</small><h1>Value, measured<em>by terms.</em></h1><p>A big headline means nothing after wagering. We rank bonuses by realistic net value — deposits, playthrough and expiry included.</p></div></section>

    {result.inventoryMode !== "UNAVAILABLE" ? <CuratedBonusShortlist offers={result.records} /> : null}

    <section className={styles.directorySection}>
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><div><p className={styles.eyebrow}>Full directory</p><h2 className={styles.display}>All bonuses</h2></div><p>The same material fields remain visible on every record. No sponsored override changes natural editorial position.</p></header>
        {result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED" ? <aside className={styles.reviewSeparationNote} role="note"><strong>DEMONSTRATION DATA</strong><p>These fictional records show the comparison experience. They are not current GB promotions, partner offers or claimable bonuses. No commercial visit is available.</p></aside> : null}
        {result.inventoryMode === "UNAVAILABLE" ? <section className={styles.empty} role="status"><p className={styles.eyebrow}>Listings unavailable · fail closed</p><h2>The Published Directory Could Not Be Loaded.</h2><p>No cached, legacy, demonstration or invented offer is substituted. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/methodology">Review Methodology</Link></section> : <>
          <div className={styles.controlsIntro}><div><p className={styles.eyebrow}><span className={styles.desktopOnly}>Server-owned filters · URL owned</span><span className={styles.mobileOnly}>Full material ledger</span></p><h2>Run the numbers<br />before you claim.</h2></div><p><span className={styles.desktopOnly}>{result.total} matching comparison record{result.total === 1 ? "" : "s"}. Every filter, sort, classification and result count is resolved on the server.</span><span className={styles.mobileOnly}>{result.records.length} results stay scannable on this page. Open a review only when you need the full evidence.</span></p></div>
          <BonusFilters activeCount={activeCount} facets={result.facets} query={result.query} total={result.total} />
          <ActiveBonusFilters query={result.query} raw={raw} />

          {result.records.length > 0 ? <>
            <header className={styles.resultsHeader}><div><p className={styles.eyebrow}>Full comparison results</p><h2>{result.total} Matching Record{result.total === 1 ? "" : "s"}</h2></div><p aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? "result" : "results"} · Page {result.page} of {result.pageCount} · {result.pageSize} per page. Missing values stay neutral and sort after known values where applicable.</p></header>
            <BonusComparisonList offers={result.records} startPosition={startPosition} />
            <BonusPagination page={result.page} pageCount={result.pageCount} raw={raw} />
          </> : <section className={styles.empty}><p className={styles.eyebrow}>No matches / no substitute</p><h2>No Comparison Records Match These Filters.</h2><p>Reset the comparison instead of substituting an ineligible or commercial record. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/bonuses">Reset Filters</Link></section>}
        </>}
      </div>
    </section>

    <section className={finalStyles.calculator}><div><div><small>Bonus calculator</small><h2>Run the numbers before you claim.</h2><p>Enter the offer as advertised. We convert it into required turnover and the statistically expected cost of clearing it.</p></div><div className={finalStyles.calcCard}><div><span>Example bonus</span><strong>€200</strong></div><div><span>Wagering</span><strong>35x</strong></div><div><span>Required turnover</span><strong>€7,000</strong></div><div><span>At 96% RTP, expected cost</span><strong>€280</strong></div></div></div></section>
    <section className={finalStyles.method}><div><div><small>Why the terms matter</small><h2>The fine print is the product.</h2><p>Wagering, weighting, deposit floors and expiry decide what a bonus is really worth. <Link href="/bonus-guide">Learn to read them in ten minutes.</Link></p></div><ol><li><span>01</span><strong>Wagering before headline</strong></li><li><span>02</span><strong>Deposit cost made visible</strong></li><li><span>03</span><strong>Expiry and eligibility checked</strong></li><li><span>04</span><strong>Missing terms stay missing</strong></li></ol></div></section>
    <section className={styles.disclosure}><div className={styles.shell}><strong>18+ · Commercial Disclosure</strong><p>B4GAMBLE may receive compensation from future eligible governed outbound links. Affiliate compensation does not determine Editor Score or natural editorial ranking. Verify current operator terms and local law before acting.</p><Link href="/affiliate-disclosure">Read Disclosure →</Link></div></section>
  </div>;
}
