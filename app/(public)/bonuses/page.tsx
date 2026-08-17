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
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import finalStyles from "./BonusesFinal.module.css";
import { BonusCalculator } from "./BonusCalculator";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import type { PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { isLocalHandoffVisualDataFixture, withHandoffBonusDirectoryData } from "@/lib/final-handoff/visual-data-fixture";

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
  const query = parsePublicOfferQuery(raw, 24);
  const result = withHandoffBonusDirectoryData(
    await loadBonusDirectory(query),
    isLocalHandoffVisualDataFixture(raw.visualFixture),
  );
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

  return <div className={`${styles.page} ${instrumentSerif.variable}`} data-runtime-renderer="bonuses">
    <CommercialSurfaceView surface="bonuses" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={finalStyles.hero} data-nav-theme="dark">
      <div className={finalStyles.heroCopy}>
        <small><span className={finalStyles.desktopKicker}>Bonuses · Terms first · 18+</span><span className={finalStyles.mobileKicker}>Ranked by what you keep</span></small>
        <h1>Value, measured<em>by terms.</em></h1>
        <p>A big headline means nothing after wagering. We rank bonuses by realistic net value — deposits, playthrough and expiry included.</p>
      </div>
      <div className={finalStyles.heroMeta}><span>Material terms shown first</span><span>No guaranteed-money claims</span><span>Source status kept visible</span></div>
    </section>

    {result.inventoryMode !== "UNAVAILABLE" ? <CuratedBonusShortlist offers={result.records} /> : null}

    <section className={styles.directorySection} data-motion-reveal data-nav-theme="cream">
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><h2 className={styles.display}>All bonuses</h2><p>{result.total} offers · sorted by net value</p></header>
        {result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED" ? <aside className={styles.reviewSeparationNote} role="note"><strong>DEMONSTRATION DATA</strong><p>These fictional records show the comparison experience. They are not current GB promotions, partner offers or claimable bonuses. No commercial visit is available.</p></aside> : null}
        {result.inventoryMode === "UNAVAILABLE" ? <section className={styles.empty} role="status"><p className={styles.eyebrow}>Listings unavailable · fail closed</p><h2>The Published Directory Could Not Be Loaded.</h2><p>No cached, legacy, demonstration or invented offer is substituted. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/methodology">Review Methodology</Link></section> : <>
          <BonusFilters activeCount={activeCount} facets={result.facets} query={result.query} total={result.total} />
          <ActiveBonusFilters query={result.query} raw={raw} />

          {result.records.length > 0 ? <>
            <p className={styles.resultsStatus} aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? "result" : "results"} · Page {result.page} of {result.pageCount}</p>
            <BonusComparisonList offers={result.records} startPosition={startPosition} />
            <BonusPagination page={result.page} pageCount={result.pageCount} raw={raw} />
          </> : <section className={styles.empty}><p className={styles.eyebrow}>No matches / no substitute</p><h2>No Comparison Records Match These Filters.</h2><p>Reset the comparison instead of substituting an ineligible or commercial record. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/bonuses">Reset Filters</Link></section>}
        </>}
      </div>
    </section>

    <BonusCalculator />
    <section className={finalStyles.method} data-motion-reveal data-nav-theme="cream"><div><div><small>How we evaluate bonus terms</small><h2>The fine print is <em>the product.</em></h2><p>Wagering, weighting, deposit floors and expiry decide what a bonus is really worth. Learn to read them in ten minutes.</p><Link className={finalStyles.guideAction} href="/bonus-guide">Read the Bonus Guide →</Link></div><ol><li><span>01</span><div><strong>Wagering, recalculated</strong><p>35x on €500 means €17,500 in stakes — we show the number, not the marketing.</p></div></li><li><span>02</span><div><strong>Restrictions, surfaced</strong><p>Game weighting, max bets and win caps move a bonus up or down the ranking.</p></div></li><li><span>03</span><div><strong>Casino quality counts</strong><p>A generous offer at a casino that fails our payout tests doesn&apos;t rank at all.</p></div></li></ol></div></section>
    <section className={styles.disclosure} data-nav-theme="dark"><div className={styles.shell}><strong>18+ · Commercial Disclosure</strong><p>B4GAMBLE may receive compensation from future eligible governed outbound links. Affiliate compensation does not determine Editor Score or natural editorial ranking. Verify current operator terms and local law before acting.</p><Link href="/affiliate-disclosure">Read Disclosure →</Link></div></section>
  </div>;
}
