import type { Metadata } from "next";
import Link from "next/link";

import { ActiveOfferFilters, FeaturedOfferCard, OfferComparisonList, OfferFilters, OfferPagination } from "@/components/public-offers/PublicOffers";
import styles from "@/components/public-offers/PublicOffers.module.css";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { hasPublicOfferFilters, parsePublicOfferQuery, type PublicOfferSearchParams } from "@/lib/public-offer/query";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<PublicOfferSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parsePublicOfferQuery(await searchParams);
  const filtered = hasPublicOfferFilters(query);
  const title = query.page > 1 ? `Casino Bonuses — Page ${query.page} | SevenBet` : "Published Casino Bonus Directory | SevenBet";
  const description = "Filter eligible published casino bonuses by country, type, payment, crypto, deposit, wagering and governed action availability.";
  return { title, description, alternates: { canonical: absoluteUrl("/bonuses") }, robots: filtered ? { index: false, follow: true } : { index: true, follow: true }, openGraph: { type: "website", title, description, url: absoluteUrl("/bonuses") } };
}
export default async function BonusesPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parsePublicOfferQuery(raw, 24);
  const result = await publicOfferService.searchOffers(query);
  const featured = result.records.slice(0, 3);
  const schema = { "@context": "https://schema.org", "@type": "ItemList", name: "Published casino bonus directory", numberOfItems: result.total, itemListElement: result.records.map((offer, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: `${offer.casino.name}: ${offer.bonus.title}`, url: absoluteUrl(`/casino/${offer.casino.slug}`) })) };
  return <main className={styles.page}>
    <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} type="application/ld+json" />
    <section className={styles.hero}><div className={`${styles.shell} ${styles.heroGrid}`}><header><p className={styles.eyebrow}>Published bonus directory · material terms · 18+</p><h1>Compare offers<br /><em>without shortcuts.</em></h1><p className={styles.heroIntro}>Filter current published bonus records while keeping wagering, minimum deposit, licence context, responsible-gambling tools and full editorial reviews ahead of any action.</p></header><aside className={styles.heroAside}><strong>{result.total}</strong><span>eligible offers match this URL. Filters are server rendered and remain usable without JavaScript.</span></aside></div></section>
    <section className={styles.section}><div className={styles.shell}><header className={styles.sectionHead}><div><p className={styles.eyebrow}>Filter and sort</p><h2>Refine the facts that matter.</h2></div><p>Country is a declared comparison preference, not automatic location detection or legal advice. Facet counts include eligible published offers only.</p></header><OfferFilters facets={result.facets} query={result.query} /><ActiveOfferFilters query={result.query} />
      {result.records.length ? <><div className={styles.resultsHead}><div><p className={styles.eyebrow}>Featured from these results</p><h2>{result.total} matching offer{result.total === 1 ? "" : "s"}</h2></div><p>Page {result.page} of {result.pageCount} · {result.pageSize} per page</p></div><div className={styles.featuredGrid}>{featured.map((offer, index) => <FeaturedOfferCard key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} rank={(result.page - 1) * result.pageSize + index + 1} />)}</div></> : <div className={styles.empty}><h2>No offers match these filters.</h2><p>Clear the filters to return to all eligible published offers. Casino reviews remain available independently of commercial state.</p><Link href="/bonuses">Clear filters</Link></div>}
    </div></section>
    {result.records.length > 0 && <section className={styles.sectionDark}><div className={styles.shell}><header className={styles.sectionHead}><div><p className={styles.eyebrow}>Full filtered results</p><h2>Compare every material term.</h2></div><p>Results use deterministic server-owned sorting. Missing term values remain explicit and never receive a hidden ranking advantage.</p></header><OfferComparisonList offers={result.records} startRank={(result.page - 1) * result.pageSize + 1} /><OfferPagination page={result.page} pageCount={result.pageCount} searchParams={raw} /></div></section>}
    <section className={styles.section}><div className={styles.shell}><div className={styles.disclosure}><strong>Affiliate and safety disclosure.</strong> Some future actions may be commercial, but publication and ranking remain editorial contracts. A bonus should never override your limits. Verify operator terms and local law before acting. <Link href="/responsible-gambling">Responsible gambling support →</Link></div></div></section>
  </main>;
}
