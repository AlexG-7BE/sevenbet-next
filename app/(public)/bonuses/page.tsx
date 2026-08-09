import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import {
  ActiveBonusFilters,
  BonusComparisonList,
  BonusEducation,
  BonusFilters,
  BonusPagination,
  BonusRelatedNavigation,
  FeaturedBonusCard,
} from "@/components/bonus-directory/BonusDirectory";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-seven-serif" });

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<PublicOfferSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parsePublicOfferQuery(await searchParams, 24);
  const filtered = hasPublicOfferFilters(query);
  const title = query.page > 1 ? `Casino Bonuses — Page ${query.page} | SevenBet` : "Published Casino Bonus Directory | SevenBet";
  const description = "Compare current published casino bonus terms by country preference, type, payment, deposit, wagering and governed action availability.";
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl("/bonuses") },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: "website", title, description, url: absoluteUrl("/bonuses") },
  };
}

export default async function BonusesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parsePublicOfferQuery(raw, 24);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country ?? null });
  const result = await publicOfferService.searchOffers(query, authority);
  const featured = result.records.slice(0, 3);
  const activeCount = [query.country, query.type, query.payment, query.crypto, query.maxDeposit, query.maxWagering, query.availability].filter((value) => value !== undefined).length;
  const startPosition = (result.page - 1) * result.pageSize + 1;
  const schema = {
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
  };

  return <div className={`${styles.page} ${instrumentSerif.variable}`}>
    <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} type="application/ld+json" />
    <section className={styles.hero}>
      <Image alt="" aria-hidden="true" className={styles.heroMedia} height={980} priority sizes="(max-width: 760px) 39vw, 53vw" src="/bonus-directory/material-field.png" width={1600} />
      <div className={styles.heroCopy}>
        <p className={`${styles.eyebrow} ${styles.desktopOnly}`}>Bonuses · Material Editorial Theatre · 18+</p>
        <p className={`${styles.eyebrow} ${styles.mobileOnly}`}>Bonus Terms</p>
        <h1>Terms<br />Before<br />The Number.</h1>
        <em className={styles.desktopOnly}>A bonus is a contract-shaped object.</em>
        <p className={styles.desktopOnly}>Compare current published records without hiding wagering, deposit, eligibility, expiry, licence context or commercial availability behind the headline.</p>
        <p className={`${styles.mobileHeroMicrocopy} ${styles.mobileOnly}`}>Read the conditions before you compare.</p>
      </div>
      <div aria-hidden="true" className={styles.termsScene}>
        <div className={styles.termSheet}><span>SevenBet / Terms Sheet</span><strong>Welcome Terms</strong><ul><li>Wagering / must be legible</li><li>Deposit / cash cost first</li><li>Expiry / time is material</li><li>Withdrawal / restrictions visible</li></ul></div>
        <div className={`${styles.termSheet} ${styles.termSheetSmall}`}><span>SevenBet / Terms Sheet</span><strong>Limits</strong><ul><li>Eligibility</li><li>Market</li><li>Availability</li></ul></div>
      </div>
      <div aria-hidden="true" className={styles.mobileTermSheet}><span>SevenBet / Terms Sheet</span><strong>Terms</strong><ul><li>Wagering</li><li>Min deposit</li><li>Expiry</li></ul></div>
    </section>

    <section className={styles.directorySection}>
      <div className={styles.shell}>
        <header className={styles.sectionHeading}><div><p className={`${styles.eyebrow} ${styles.desktopOnly}`}>Current published offer objects</p><h2 className={`${styles.display} ${styles.desktopOnly}`}>Featured Bonuses<br />As Product Objects.</h2><p className={`${styles.eyebrow} ${styles.mobileOnly}`}>Featured bonuses as product objects</p><h2 className={`${styles.mobileSectionTitle} ${styles.mobileOnly}`}>Read the contract before the headline.</h2></div><p><span className={styles.desktopOnly}>The first 3 results use the same server-owned order as the full directory. No sponsored override or static fixture determines their position.</span><span className={styles.mobileOnly}>Three published snapshots. The same material fields remain visible on every object.</span></p></header>
        {featured.length > 0 && <div className={styles.featuredGrid}>{featured.map((offer, index) => <FeaturedBonusCard key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} position={startPosition + index} primary={index === 0} />)}</div>}

        <div className={styles.controlsIntro}><div><p className={styles.eyebrow}><span className={styles.desktopOnly}>Published filters · URL owned</span><span className={styles.mobileOnly}>Full material ledger</span></p><h2>Compare Every Material Term.</h2></div><p><span className={styles.desktopOnly}>{result.total} real matching offer{result.total === 1 ? "" : "s"}. Every filter, sort and result count is resolved on the server from the latest current published database snapshots.</span><span className={styles.mobileOnly}>{result.records.length} results stay scannable on this page. Open a review only when you need the full evidence.</span></p></div>
        <BonusFilters activeCount={activeCount} facets={result.facets} query={result.query} total={result.total} />
        <ActiveBonusFilters query={result.query} raw={raw} />

        {result.records.length > 0 ? <>
          <header className={styles.resultsHeader}><div><p className={styles.eyebrow}>Full comparison results</p><h2>{result.total} Matching Offer{result.total === 1 ? "" : "s"}</h2></div><p aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? "result" : "results"} · Page {result.page} of {result.pageCount} · {result.pageSize} per page. Missing values stay neutral and sort after known values where applicable.</p></header>
          <BonusComparisonList offers={result.records} startPosition={startPosition} />
          <BonusPagination page={result.page} pageCount={result.pageCount} raw={raw} />
        </> : <section className={styles.empty}><p className={styles.eyebrow}>No matches / no substitute</p><h2>No Published Offers Match These Filters.</h2><p>Reset the comparison instead of substituting an ineligible or commercially available offer. Published casino reviews, methodology, education and protected Help remain available.</p><Link href="/bonuses">Reset Filters</Link></section>}
      </div>
    </section>

    <BonusEducation />
    <BonusRelatedNavigation />
    <section className={styles.disclosure}><div className={styles.shell}><strong>18+ · Commercial Disclosure</strong><p>SevenBet may receive compensation from some governed outbound links. Publication and server-owned sorting do not depend on affiliate availability. Verify current operator terms and local law before acting.</p><Link href="/affiliate-disclosure">Read Disclosure →</Link></div></section>
  </div>;
}
