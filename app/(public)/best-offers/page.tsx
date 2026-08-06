import type { Metadata } from "next";
import Link from "next/link";

import { FeaturedOfferCard, OfferComparisonList } from "@/components/public-offers/PublicOffers";
import styles from "@/components/public-offers/PublicOffers.module.css";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Best Published Casino Offers | SevenBet",
  description: "A regulated-first editorial shortlist of published casino offers with material terms, licensing, payments and action availability shown before any referral.",
  alternates: { canonical: absoluteUrl("/best-offers") },
  robots: { index: true, follow: true },
};

export default async function BestOffersPage() {
  const offers = await publicOfferService.getFeaturedOffers({ country: "GB", limit: 12 });
  const featured = offers.slice(0, 3);
  const remaining = offers.slice(3);
  const schema = { "@context": "https://schema.org", "@type": "ItemList", name: "SevenBet published offer shortlist", numberOfItems: offers.length, itemListElement: offers.map((offer, index) => ({ "@type": "ListItem", position: index + 1, name: `${offer.casino.name}: ${offer.bonus.title}`, url: absoluteUrl(`/casino/${offer.casino.slug}`) })) };
  return <main className={styles.page}>
    <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} type="application/ld+json" />
    <section className={styles.hero}><div className={`${styles.shell} ${styles.heroGrid}`}><header><p className={styles.eyebrow}>GB comparison context · published snapshots · 18+</p><h1>Best offers,<br /><em>terms first.</em></h1><p className={styles.heroIntro}>A database-driven shortlist of current published editorial offers. Market information is a comparison preference, not proof of location or legal eligibility. Review every material term before any action.</p></header><aside className={styles.heroAside}><strong>{offers.length}</strong><span>eligible published offers in this bounded shortlist. Commercial availability never controls editorial visibility.</span></aside></div></section>
    {offers.length ? <>
      <section className={styles.section}><div className={styles.shell}><header className={styles.sectionHead}><div><p className={styles.eyebrow}>Featured comparison</p><h2>Three offers worth reading closely.</h2></div><p>Selected from the latest published snapshots using GB availability, completeness of terms, editorial flags, score and lower-friction term signals. This is not a promise of winnings, safety or access.</p></header><div className={styles.featuredGrid}>{featured.map((offer, index) => <FeaturedOfferCard key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} rank={index + 1} />)}</div></div></section>
      {remaining.length > 0 && <section className={styles.sectionDark}><div className={styles.shell}><header className={styles.sectionHead}><div><p className={styles.eyebrow}>Compare the shortlist</p><h2>Evidence before action.</h2></div><p>Score, deposit, wagering, bonus value, licence, payments, responsible-gambling context and review access remain visible even when an action is unavailable.</p></header><OfferComparisonList offers={remaining} startRank={4} /></div></section>}
    </> : <section className={styles.section}><div className={`${styles.shell} ${styles.empty}`}><h2>No eligible published offers are available.</h2><p>Editorial reviews remain available in the casino directory while offer publication or market information is unavailable.</p><Link href="/casinos">Browse published casino reviews</Link></div></section>}
    <section className={styles.sectionDark}><div className={styles.shell}><div className={styles.disclosure}><strong>How this shortlist works.</strong> SevenBet reads only the latest published Casino Builder snapshots. Draft, archived, future and expired bonuses are excluded. Raw destinations are never exposed; available actions use governed internal redirects and otherwise fail closed. <Link href="/methodology">Read the methodology →</Link></div></div></section>
  </main>;
}
