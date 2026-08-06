import type { Metadata } from "next";
import Link from "next/link";

import { BestOffersExperience } from "@/components/best-offers/BestOffersExperience";
import styles from "@/components/best-offers/BestOffers.module.css";
import { bestFitWinners } from "@/lib/public-offer/best-offer-ranking";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { publicOfferService } from "@/lib/services/public-offer.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Best Published Casino Offers for GB Comparison | SevenBet",
  description: "An explainable editorial shortlist of current GB-available published casino offers, with complete material terms, methodology and commercial boundaries before action.",
  alternates: { canonical: absoluteUrl("/best-offers") },
  robots: { index: true, follow: true },
};

export default async function BestOffersPage() {
  const result = await publicOfferService.getBestOffersPageData({ country: "GB", limit: 12 });
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SevenBet published GB offer shortlist",
    numberOfItems: result.records.length,
    itemListElement: result.records.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${offer.casino.name}: ${offer.bonus.title}`,
      url: absoluteUrl(`/casino/${offer.casino.slug}`),
    })),
  };

  return <div className={styles.page}>
    <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} type="application/ld+json" />
    <section className={styles.hero}><div className={`${styles.shell} ${styles.heroInner}`}><p className={styles.kicker}>Best offers · GB comparison · 18+</p><h1>The shortlist <em>that survives the small print.</em></h1><p className={styles.heroCopy}>A database-driven editorial shortlist of current published offers. Complete terms, ranking reasons and commercial boundaries appear before any action. A GB comparison preference is not proof of location or legal eligibility.</p><div className={styles.heroMeta}><span>Latest published snapshots</span><span>Complete material terms</span><span>Not ranked by commission</span></div></div></section>
    {result.status === "available" ? <BestOffersExperience shortlist={result.records} winners={bestFitWinners(result.records)} /> : <section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="status"><p className={styles.kicker}>{result.status === "unavailable" ? "Listings unavailable · fail closed" : "No eligible offers"}</p><h1>{result.status === "unavailable" ? "The published shortlist could not be loaded." : "Nothing currently clears every gate."}</h1><p>{result.status === "unavailable" ? "No cached, legacy or invented commercial result is substituted. Programme and protected Help remain separate and available." : "No current published offer has both GB availability and every required material term. SevenBet does not relax the method to fill the page."}</p><Link href="/methodology">Review methodology</Link><Link href="/casinos">Browse casino reviews</Link></div></div></section>}
    <section className={styles.evidenceSection}><div className={styles.shell}><p className={styles.kicker}>Evidence building blocks</p><div className={styles.evidenceCards}><article><span>01 · TERMS</span><h3>Comparable before clickable.</h3><p>Deposit, wagering, eligibility, conditions and withdrawal signals stay in a consistent location before the handoff.</p></article><article><span>02 · CONTEXT</span><h3>Published, local, current.</h3><p>Only latest published, non-archived snapshots and explicitly available GB records can enter this shortlist.</p></article><article><span>03 · INDEPENDENCE</span><h3>Editorial order stays editorial.</h3><p>Partner availability and affiliate economics do not determine the shortlist or criterion winners.</p></article></div><div className={styles.editorial}><blockquote>“If we cannot explain why an offer ranks where it does, it does not belong in the shortlist.”</blockquote><aside><strong>SevenBet Editorial Desk</strong><p>Scores and signals are comparison aids, not guarantees of safety, winnings, access or payout speed. Verify the operator’s current terms before acting.</p></aside></div></div></section>
    <section className={styles.faq}><div className={`${styles.shell} ${styles.faqGrid}`}><div><p className={styles.kicker}>Questions before action</p><h2>Questions? Answers.</h2></div><div className={styles.faqList}><details><summary>What does “best” mean here?</summary><p>The strongest balance under the published method: eligibility and completeness first, then editor score, editorial flags, wagering, deposit, payout evidence and deterministic tie-breakers.</p></details><details><summary>Does the largest bonus rank first?</summary><p>No. A headline amount does not override material terms, eligibility, editorial evidence or the commercial boundary.</p></details><details><summary>Does “faster payout signal” guarantee speed?</summary><p>No. It compares the wording stored in current published snapshots. It is not a performance guarantee.</p></details><details><summary>Can a partner buy the top rank?</summary><p>No. Commercial availability and compensation are not inputs to the selectors.</p></details><details><summary>Are these real UK operators and offers?</summary><p>No. The current records are explicitly fictional pre-launch data used to demonstrate the product contract.</p></details></div></div></section>
    <section className={styles.related}><div className={`${styles.shell} ${styles.relatedGrid}`}><div><p className={styles.kicker}>Another way to choose</p><h2>Read the operator. Compare the number.</h2></div><nav aria-label="Related discovery routes"><Link href="/casinos"><span>Read the casino review</span><b>Casinos →</b></Link><Link href="/bonuses"><span>Compare the full bonus directory</span><b>Bonuses →</b></Link></nav></div></section>
    <section className={styles.demoDisclosure}><div className={styles.shell}><p><strong>Illustrative pre-launch offer data.</strong> Fictional Demo operators, terms and withdrawal signals are used for product demonstration. They are not real UK operators, partnerships or live promotions and will be replaced with verified partner data before commercial launch.</p></div></section>
  </div>;
}
