import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { BestOffersExperience } from "@/components/best-offers/BestOffersExperience";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "@/components/best-offers/BestOffers.module.css";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";

export const dynamic = "force-dynamic";
const loadBestOffersPageData = cache(async () => {
  const authority = await resolveServerJurisdiction({ routeCountryOrMarketSlug: "GB" });
  return publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 }, authority);
});

export async function generateMetadata(): Promise<Metadata> {
  const result = await loadBestOffersPageData();
  const unavailable = result.status === "unavailable";
  const demoOnly = result.inventoryMode === "DEMO_ONLY";
  const mixed = result.inventoryMode === "MIXED";
  const containsDemo = demoOnly || mixed;
  const title = unavailable
    ? "Casino Offer Comparison Unavailable | B4GAMBLE"
    : demoOnly
      ? "Casino Offer Ranking Demonstration | B4GAMBLE"
      : mixed
        ? "Published and Fictional Casino Offer Comparison | B4GAMBLE"
        : "Casino Offer Comparison for GB | B4GAMBLE";
  const description = unavailable
    ? "The published GB offer comparison is temporarily unavailable. No cached, legacy or invented listing is substituted."
    : demoOnly
      ? "An explainable ranking demonstration using fictional records, not current GB promotions or partner offers."
      : mixed
        ? "An explainable comparison of published offers and explicitly labelled fictional demonstrations without mixing their source or commercial status."
        : "An explainable editorial shortlist with material terms, methodology and commercial boundaries before action.";
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl("/best-offers") },
    robots: unavailable || containsDemo ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function BestOffersPage() {
  const result = await loadBestOffersPageData();
  const containsDemo = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  const schema = result.status === "available" && result.inventoryMode === "PUBLISHED_ONLY" ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "B4GAMBLE published GB offer shortlist",
    numberOfItems: result.records.length,
    itemListElement: result.records.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(`/casino/${offer.casino.slug}`),
    })),
  } : null;

  return <div className={styles.page}>
    <CommercialSurfaceView surface="best_offers" />
    {schema ? <JsonLd data={schema} /> : null}
    <section className={styles.hero}><div className={`${styles.shell} ${styles.heroInner}`}>
      <p className={styles.kicker}>✓ &nbsp; Researched &amp; verified</p>
      <h1><span>Three picks.</span><em>Not thirty.</em></h1>
      <p className={styles.heroCopy}>Independent reviews and real-money testing — ranked by what you actually keep, not by headline size.</p>
      <div className={styles.heroStats}><div><strong>50+</strong><span>casinos researched</span></div><div><strong>200+</strong><span>hours of testing</span></div><div><strong>100%</strong><span>independent &amp; transparent</span></div></div>
      <div className={styles.heroTicker}><span>Tested with real money — our own</span><span>Terms shown before every CTA</span><span>Updated from current data</span><Link href="/methodology">How we test →</Link></div>
    </div></section>
    {containsDemo ? <section className={styles.demoDisclosure} role="note"><div className={styles.shell}><p><strong>DEMONSTRATION DATA.</strong> Every fictional record is a product demonstration, not a current GB promotion, partner offer or claimable bonus. No commercial visit is available.</p></div></section> : null}
    {result.status === "available" ? <BestOffersExperience inventoryMode={result.inventoryMode} shortlist={result.records} /> : <section className={styles.statePage} id="shortlist"><div className={styles.shell}><div className={styles.statePanel} role="status"><p className={styles.kicker}>{result.status === "unavailable" ? "Listings unavailable · fail closed" : "No eligible records"}</p><h2>{result.status === "unavailable" ? "The comparison could not be loaded." : "Nothing currently clears every gate."}</h2><p>{result.status === "unavailable" ? "No cached, legacy or invented commercial result is substituted. Programme and protected Help remain separate and available." : "No current record has both GB availability and every required material term. B4GAMBLE does not relax the method to fill the page."}</p><Link href="/methodology">Review methodology</Link><Link href="/casinos">Browse casino reviews</Link></div></div></section>}
    <section className={styles.faq}><div className={styles.faqGrid}>
      <h2>Before you click</h2>
      <details open><summary>What does “wagering 35x” actually mean?</summary><p>You must stake the bonus amount 35 times before withdrawing winnings from it. On a €500 bonus that&apos;s €17,500 in total stakes — read our <Link href="/bonus-guide">bonus guide</Link> before deciding it&apos;s worth it.</p></details>
      <details><summary>Do you earn money if I sign up?</summary><p>Usually yes — we may earn a commission. Affiliate compensation does not determine Editor Score or natural editorial ranking. Full details in our <Link href="/affiliate-disclosure">affiliate disclosure</Link>.</p></details>
      <details><summary>Why only three offers?</summary><p>Because a page of twelve is a directory, not a recommendation. If you want the full field, the <Link href="/bonuses">Bonuses</Link> page has every offer with filters.</p></details>
      <details><summary>What happens when I click View Offer?</summary><p>You&apos;ll see a short confirmation that you&apos;re leaving B4GAMBLE, with the commission disclosure — then you continue to the operator, or stay.</p></details>
    </div></section>
  </div>;
}
