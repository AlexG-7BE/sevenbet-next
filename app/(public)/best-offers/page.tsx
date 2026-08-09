import type { Metadata } from "next";
import Link from "next/link";

import { BestOffersExperience } from "@/components/best-offers/BestOffersExperience";
import styles from "@/components/best-offers/BestOffers.module.css";
import { bestFitWinners } from "@/lib/public-offer/best-offer-ranking";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const authority = await resolveServerJurisdiction({ routeCountryOrMarketSlug: "GB" });
  const result = await publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 }, authority);
  const containsDemo = result.inventoryMode !== "PUBLISHED_ONLY";
  return {
    title: containsDemo ? "Casino Offer Ranking Demonstration | B4GAMBLE" : "Casino Offer Comparison for GB | B4GAMBLE",
    description: containsDemo ? "An explainable ranking demonstration using fictional records, not current GB promotions or partner offers." : "An explainable editorial shortlist with material terms, methodology and commercial boundaries before action.",
    alternates: { canonical: absoluteUrl("/best-offers") },
    robots: containsDemo ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function BestOffersPage() {
  const authority = await resolveServerJurisdiction({ routeCountryOrMarketSlug: "GB" });
  const result = await publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 }, authority);
  const schema = result.inventoryMode === "PUBLISHED_ONLY" ? {
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
    {schema ? <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} type="application/ld+json" /> : null}
    <section className={styles.hero}><div className={`${styles.shell} ${styles.heroInner}`}>
      <p className={styles.kicker}>Best offers · GB comparison · 18+</p>
      <h1><span>The shortlist</span><em>that survives the small print.</em></h1>
      <p className={styles.heroCopy}>A terms-first comparison. See the recorded cost, ranking reason, data status and commercial boundary before any action.</p>
      <div aria-label="Ranking dimensions" className={styles.mobileHeroSignals}><span>Overall</span><span>Wagering</span><span>Payout</span></div>
      <div className={styles.heroActions}><Link href="#shortlist">See the shortlist</Link><span>Affiliate compensation does not determine Editor Score or natural editorial ranking</span></div>
    </div></section>
    {result.inventoryMode !== "PUBLISHED_ONLY" ? <section className={styles.demoDisclosure} role="note"><div className={styles.shell}><p><strong>DEMONSTRATION DATA.</strong> Every fictional record is a product demonstration, not a current GB promotion, partner offer or claimable bonus. No commercial visit is available.</p></div></section> : null}
    {result.status === "available" ? <BestOffersExperience inventoryMode={result.inventoryMode} shortlist={result.records} winners={bestFitWinners(result.records)} /> : <section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="status"><p className={styles.kicker}>{result.status === "unavailable" ? "Listings unavailable · fail closed" : "No eligible records"}</p><h2>{result.status === "unavailable" ? "The comparison could not be loaded." : "Nothing currently clears every gate."}</h2><p>{result.status === "unavailable" ? "No cached, legacy or invented commercial result is substituted. Programme and protected Help remain separate and available." : "No current record has both GB availability and every required material term. B4GAMBLE does not relax the method to fill the page."}</p><Link href="/methodology">Review methodology</Link><Link href="/casinos">Browse casino reviews</Link></div></div></section>}
    <section className={styles.faq}><div className={`${styles.shell} ${styles.faqGrid}`}>
      <div className={styles.faqIntro}><h2><span>Questions?</span><em>Answers.</em></h2><p>What to know before you compare or click.</p><aside><span>Important</span><strong>Offers can change. The operator’s current terms control the final decision.</strong></aside></div>
      <div className={styles.faqList}>
        <details><summary>What does “Best Offer” mean?</summary><p>The strongest balance under the published method: completeness first, then editor score, wagering, deposit and payout visibility.</p></details>
        <details><summary>Are the biggest bonuses ranked first?</summary><p>No. A headline amount never overrides material terms, eligibility or editorial evidence.</p></details>
        <details><summary>Can offer terms change?</summary><p>Yes. Published terms are a comparison snapshot; verify the operator’s current terms before acting.</p></details>
        <details><summary>Does B4GAMBLE earn a commission?</summary><p>B4GAMBLE may receive compensation from future eligible governed links. Affiliate compensation does not determine Editor Score or natural editorial ranking.</p></details>
        <details><summary>How often is the shortlist checked?</summary><p>The page uses the latest published, non-archived snapshots available to the public service.</p></details>
      </div>
    </div></section>
    <section className={styles.related}><div className={styles.shell}>
      <p className={styles.kicker}>More from B4GAMBLE</p><h2>Keep comparing with the full picture.</h2>
      <nav aria-label="Related discovery routes" className={styles.relatedCards}>
        <Link href="/casinos"><span>Casinos</span><strong>Read the operator before the offer.</strong><p>Reviews, licensing context and payment-method details.</p><b>Explore casinos</b></Link>
        <Link href="/bonuses"><span>Bonuses</span><strong>Compare the bonus, not just the number.</strong><p>Standardised wagering, expiry and deposit fields.</p><b>Compare bonuses</b></Link>
      </nav>
    </div></section>
    <section className={styles.demoDisclosure}><div className={styles.shell}><p><strong>Data status stays visible.</strong> Server classification determines whether a record is demonstration or published inventory. Demonstration records never expose a commercial action.</p></div></section>
  </div>;
}
