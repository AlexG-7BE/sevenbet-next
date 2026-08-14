import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";

import {
  ActiveBonusFilters,
  BonusComparisonList,
  BonusFilters,
  BonusPagination,
  FeaturedBonusCard,
} from "@/components/bonus-directory/BonusDirectory";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import type { PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { isCpoCommercialPreviewEnabled } from "@/lib/cpo-commercial-preview";

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
  const result = await loadBonusDirectory(query);
  const featured = result.records.slice(0, 3);
  const activeCount = [query.country, query.type, query.payment, query.crypto, query.maxDeposit, query.maxWagering, query.availability].filter((value) => value !== undefined).length;
  const startPosition = (result.page - 1) * result.pageSize + 1;
  const commercialPreview = isCpoCommercialPreviewEnabled();
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
    {schema ? <JsonLd data={schema} /> : null}
    <section className={styles.hero}>
      <Image alt="" aria-hidden="true" className={styles.heroMedia} height={980} priority sizes="(max-width: 760px) 39vw, 53vw" src="/bonus-directory/material-field.png" width={1600} />
      <div className={styles.heroCopy}>
        <p className={`${styles.eyebrow} ${styles.desktopOnly}`}>Bonuses · Material Editorial Theatre · 18+</p>
        <p className={`${styles.eyebrow} ${styles.mobileOnly}`}>Bonus Terms</p>
        <h1>Terms<br />Before<br />The Number.</h1>
        <em className={styles.desktopOnly}>A bonus is a contract-shaped object.</em>
        <p className={styles.desktopOnly}>Compare each record without hiding wagering, deposit, eligibility, expiry, licence context or commercial availability behind the headline.</p>
        <p className={`${styles.mobileHeroMicrocopy} ${styles.mobileOnly}`}>Read the conditions before you compare.</p>
      </div>
      <div aria-hidden="true" className={styles.termsScene}>
        <div className={styles.termSheet}><span>B4GAMBLE / Terms Sheet</span><strong>Welcome Terms</strong><ul><li>Wagering / must be legible</li><li>Deposit / cash cost first</li><li>Expiry / time is material</li><li>Withdrawal / restrictions visible</li></ul></div>
        <div className={`${styles.termSheet} ${styles.termSheetSmall}`}><span>B4GAMBLE / Terms Sheet</span><strong>Limits</strong><ul><li>Eligibility</li><li>Market</li><li>Availability</li></ul></div>
      </div>
      <div aria-hidden="true" className={styles.mobileTermSheet}><span>B4GAMBLE / Terms Sheet</span><strong>Terms</strong><ul><li>Wagering</li><li>Min deposit</li><li>Expiry</li></ul></div>
    </section>

    <section className={styles.directorySection} id="top-offers">
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><div><p className={`${styles.eyebrow} ${styles.desktopOnly}`}>Server-ranked shortlist · no sponsored override</p><h2 className={`${styles.display} ${styles.desktopOnly}`}>Top 3<br />Offers.</h2><p className={`${styles.eyebrow} ${styles.mobileOnly}`}>Top 3 offers</p><h2 className={`${styles.mobileSectionTitle} ${styles.mobileOnly}`}>Start with the strongest terms-first shortlist.</h2></div><p><span className={styles.desktopOnly}>The first three records use the same server-owned order as the full directory. Material conditions stay visible before the action.</span><span className={styles.mobileOnly}>Terms and one primary next step stay visible on every pick.</span></p></header>
        {result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED" ? <aside className={styles.reviewSeparationNote} role="note"><strong>DEMONSTRATION DATA</strong><p>These fictional records show the comparison experience. They are not current GB promotions, partner offers or claimable bonuses. No commercial visit is available.</p></aside> : null}
        {result.inventoryMode === "UNAVAILABLE" ? <section className={styles.empty} role="status"><p className={styles.eyebrow}>Listings unavailable · fail closed</p><h2>The Published Directory Could Not Be Loaded.</h2><p>No cached, legacy, demonstration or invented offer is substituted. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/methodology">Review Methodology</Link></section> : <>
          {featured.length > 0 && <div className={styles.featuredGrid}>{featured.map((offer, index) => <FeaturedBonusCard key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} position={startPosition + index} primary={index === 0} previewSimulation={commercialPreview} />)}</div>}

          <div className={styles.controlsIntro} id="browse-all-offers"><div><p className={styles.eyebrow}><span className={styles.desktopOnly}>Browse all offers · server-owned filters</span><span className={styles.mobileOnly}>Browse all offers</span></p><h2>Search the Full Ledger.</h2></div><p><span className={styles.desktopOnly}>{result.total} matching comparison record{result.total === 1 ? "" : "s"}. Filters remain available after the shortlist for people who need more control.</span><span className={styles.mobileOnly}>{result.records.length} results remain available below the top picks.</span></p></div>
          <BonusFilters activeCount={activeCount} facets={result.facets} query={result.query} total={result.total} />
          <ActiveBonusFilters query={result.query} raw={raw} />

          {result.records.length > 0 ? <>
            <header className={styles.resultsHeader}><div><p className={styles.eyebrow}>Full comparison results</p><h2>{result.total} Matching Record{result.total === 1 ? "" : "s"}</h2></div><p aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? "result" : "results"} · Page {result.page} of {result.pageCount} · {result.pageSize} per page. Missing values stay neutral and sort after known values where applicable.</p></header>
            <BonusComparisonList offers={result.records} previewSimulation={commercialPreview} startPosition={startPosition} />
            <BonusPagination page={result.page} pageCount={result.pageCount} raw={raw} />
          </> : <section className={styles.empty}><p className={styles.eyebrow}>No matches / no substitute</p><h2>No Comparison Records Match These Filters.</h2><p>Reset the comparison instead of substituting an ineligible or commercial record. Casino reviews, methodology, education and protected Help remain available.</p><Link href="/bonuses">Reset Filters</Link></section>}
        </>}
      </div>
    </section>

    <section className={styles.disclosure}><div className={styles.shell}><strong>18+ · Commercial Disclosure</strong><p>B4GAMBLE may receive compensation from future eligible governed outbound links. Affiliate compensation does not determine Editor Score or natural editorial ranking. Verify current operator terms and local law before acting.</p><Link href="/affiliate-disclosure">Read Disclosure →</Link></div></section>
  </div>;
}
