import Link from "next/link";

import { CommercialAnalyticsLink, CommercialDecisionLayerView } from "@/components/commercial-decision/CommercialAnalytics";
import styles from "@/components/commercial-decision/CommercialDecisionLayer.module.css";
import { previewOutboundHref } from "@/lib/cpo-commercial-preview";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function visibleLimitation(offer: PublicOfferDTO) {
  if (offer.dataClassification === "DEMO_FIXTURE") return "Fictional demonstration record. Not a current operator, partner or claimable offer.";
  return offer.bonus.importantConditions[0]
    || offer.bonus.eligibility
    || "Current availability and operator terms require independent verification.";
}

function reasons(offer: PublicOfferDTO) {
  return [
    offer.casino.licenses[0]?.authority ? `${offer.casino.licenses[0].authority} licence evidence is listed.` : null,
    offer.bonus.wageringMultiplier !== null ? `${offer.bonus.wageringMultiplier}× wagering is recorded.` : "Missing wagering stays visible.",
  ].filter((value): value is string => Boolean(value));
}

function facts(offer: PublicOfferDTO) {
  const payout = offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime)?.withdrawalTime;
  return [
    ["Licence", offer.casino.licenses[0]?.authority || "Not listed"],
    ["Min deposit", money(offer.bonus.minimumDeposit, offer.bonus.currency)],
    ["Wagering", offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Not listed" : `${offer.bonus.wageringMultiplier}×`],
    ["Payout evidence", payout || "Not listed"],
  ];
}

const positionLabels = ["Best overall", "Strong alternative", "Worth comparing"] as const;

export function BestCasinoDecisionLayer({ records, inventoryMode }: { records: PublicOfferDTO[]; inventoryMode: PublicOfferInventoryMode }) {
  return <div className={styles.page}>
    <CommercialDecisionLayerView placement="shortlist" sourceRoute="best_casinos" />
    <section className={styles.hero}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>B4GAMBLE PICKS · 3 DECISIONS, NOT 30 · 18+</p>
        <h1>Start with<br /><em>our shortlist.</em></h1>
        <div className={styles.heroFoot}>
          <p>Three editorial picks from the same server-owned evidence and ranking method used across B4GAMBLE. Open the full review only when you want more proof.</p>
          <aside><strong>PREVIEW</strong><span>Every Visit action ends inside B4GAMBLE. No operator traffic, partner status or live offer is implied.</span></aside>
        </div>
      </div>
    </section>

    <section aria-labelledby="shortlist-title" className={styles.shortlist}>
      <div className={styles.shell}>
        <header className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>EDITORIAL ORDER · NO SPONSORED OVERRIDE</p><h2 id="shortlist-title">The top three.</h2></div>
          <p>Rankings are public and the same for everyone. Your Programme answers, limits, Help activity and private wording never influence this list.</p>
        </header>
        {inventoryMode !== "PUBLISHED_ONLY" ? <aside className={styles.dataNote} role="note"><strong>{inventoryMode === "DEMO_ONLY" ? "DEMONSTRATION DATA" : "MIXED SOURCE STATUS"}</strong><span>Fictional fixtures are labelled and never presented as live operators, licences, promotions or commercial partners.</span></aside> : null}
        <ol className={styles.cards}>
          {records.slice(0, 3).map((offer, index) => {
            const rank = (index + 1) as 1 | 2 | 3;
            return <li className={index === 0 ? styles.primaryCard : styles.card} key={`${offer.casino.id}:${offer.bonus.id}`}>
              <article>
                <div className={styles.cardTop}><span className={styles.rank}>{String(rank).padStart(2, "0")}</span><span className={styles.position}>{positionLabels[index]}</span><span className={styles.score}><b>{offer.casino.editorScore.toFixed(1)}</b>/10</span></div>
                <div className={styles.identity}><div aria-hidden="true">{offer.casino.name.slice(0, 2).toUpperCase()}</div><div><p>{offer.dataClassification === "DEMO_FIXTURE" ? "FICTIONAL OPERATOR" : "PUBLISHED REVIEW"}</p><h3>{offer.casino.name}</h3></div></div>
                <dl className={styles.factLedger}>{facts(offer).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                <div className={styles.offer}><span>OFFER RECORD</span><strong>{offer.bonus.title}</strong><p>{offer.bonus.summary}</p></div>
                <div className={styles.why}><span>WHY IT MADE THE LIST</span><ul>{reasons(offer).map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
                <p className={styles.limitation}><strong>Keep in view:</strong> {visibleLimitation(offer)}</p>
                <div className={styles.actions}>
                  <CommercialAnalyticsLink action={{ event: "outbound", operatorSlug: offer.casino.slug, recommendationRank: rank }} className={styles.primaryAction} href={previewOutboundHref({ slug: offer.casino.slug, sourceRoute: "best_casinos", rank, placement: "shortlist" })} sourceRoute="best_casinos">Visit Casino <span aria-hidden="true">→</span></CommercialAnalyticsLink>
                  <CommercialAnalyticsLink action={{ event: "review", operatorSlug: offer.casino.slug }} className={styles.reviewAction} href={`/casino/${offer.casino.slug}`} sourceRoute="best_casinos">Read full review</CommercialAnalyticsLink>
                  <CommercialAnalyticsLink action={{ event: "compare", operatorSlug: offer.casino.slug }} className={styles.compareAction} href={`/compare?casino=${encodeURIComponent(offer.casino.slug)}&country=GB`} sourceRoute="best_casinos">Compare</CommercialAnalyticsLink>
                </div>
                <small className={styles.simulation}>Preview simulation · no external visit</small>
              </article>
            </li>;
          })}
        </ol>
      </div>
    </section>

    <section className={styles.nextSteps}><div className={styles.shell}>
      <div><p className={styles.eyebrow}>NEED MORE EVIDENCE?</p><h2>Research only as far as you need.</h2></div>
      <nav aria-label="Decision evidence routes">
        <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "casinos" }} href="/casinos" sourceRoute="best_casinos"><span>01</span><strong>All Casinos</strong><small>Search and filter every review</small></CommercialAnalyticsLink>
        <Link href="/methodology"><span>02</span><strong>Methodology</strong><small>See how ranking works</small></Link>
        <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "compare" }} href="/compare" sourceRoute="best_casinos"><span>03</span><strong>Compare</strong><small>Check selected differences</small></CommercialAnalyticsLink>
      </nav>
    </div></section>
  </div>;
}
