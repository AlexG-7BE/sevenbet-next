import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import { shortlistReason } from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";

import styles from "./BestOffers.module.css";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function payout(offer: PublicOfferDTO) {
  return offer.casino.payments.find((item) => item.supportsWithdrawals && item.withdrawalTime)?.withdrawalTime
    ?? (offer.dataClassification === "DEMO_FIXTURE" ? "Not provided in demonstration" : "Not published");
}

function OfferAction({ offer, featured = false }: { offer: PublicOfferDTO; featured?: boolean }) {
  const governed = offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && Boolean(offer.action.href);
  if (!governed || !offer.action.href) return <span className={styles.unavailableAction}>Offer currently unavailable — review still available</span>;
  return <CasinoOutboundAction action={{ href: offer.action.href, label: featured ? `View ${offer.casino.name} offer` : `Visit ${offer.casino.name}` }} className={styles.commercialCta} />;
}

function OfferIdentity({ offer, size = "small" }: { offer: PublicOfferDTO; size?: "small" | "large" }) {
  return <div className={styles.identity} data-size={size}>
    <span aria-hidden="true">{offer.casino.name.slice(0, 1).toUpperCase()}</span>
    <h3>{offer.casino.name}</h3>
  </div>;
}

function OfferCompare({ offer }: { offer: PublicOfferDTO }) {
  if (offer.dataClassification === "DEMO_FIXTURE") return null;
  return <ContextualCompareToggle casinoName={offer.casino.name} casinoSlug={offer.casino.slug} />;
}

function MobileMaterialTerms({ offer }: { offer: PublicOfferDTO }) {
  return <dl className={styles.mobileMaterialTerms} aria-label={`${offer.casino.name} material offer terms`}>
    <div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}x`}</dd></div>
    <div><dt>Minimum deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div>
    <div><dt>Eligibility</dt><dd>{offer.bonus.eligibility || "Not listed"}</dd></div>
    <div><dt>Key restriction</dt><dd>{offer.bonus.importantConditions.join(" · ") || "Not listed"}</dd></div>
  </dl>;
}

export function BestOffersExperience({ shortlist, inventoryMode }: {
  shortlist: PublicOfferDTO[];
  inventoryMode: PublicOfferInventoryMode;
}) {
  const top = shortlist.slice(0, 3);
  const worthALook = shortlist.slice(3, 6);
  const featured = top[0] ?? null;

  if (!featured) return <section className={styles.statePage} data-nav-theme="light" id="shortlist"><div className={styles.shell}><div className={styles.statePanel}><h2>No eligible offers are available.</h2><p>B4GAMBLE does not relax the method to fill the page.</p><Link href="/casinos">Browse casino reviews</Link></div></div></section>;

  return <>
    <section className={styles.topThree} id="shortlist" aria-labelledby="top-three-title" data-inventory-mode={inventoryMode} data-motion-reveal data-nav-theme="light">
      <div className={styles.shell}>
        <div className={styles.sectionRule}><span id="top-three-title">The top three — material terms shown first</span><i /></div>
        <p className={styles.mobileAffiliateDisclosure}>We may earn a commission. Affiliate compensation does not determine Editor Score or natural editorial ranking. <Link href="/affiliate-disclosure">How we&apos;re funded →</Link></p>
        <article className={styles.featuredCard} data-testid="best-offer-product-card">
          <div className={styles.featuredCopy}>
            <div className={styles.rankLine}><span>01</span><b>{featured.dataClassification === "DEMO_FIXTURE" ? "Fictional demonstration" : "Best overall"}</b></div>
            <OfferIdentity offer={featured} size="large" />
            <div className={styles.score}><small>Editor Score</small><strong>{featured.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
            {featured.dataClassification === "DEMO_FIXTURE" ? <p className={styles.dataNotice}><strong>DEMONSTRATION DATA</strong> — Fictional example for interface testing. Not a real casino, current offer or B4GAMBLE partner. No gambling or affiliate link is available.</p> : null}
            <p className={`${styles.reason} ${styles.desktopReason}`}>{featured.casino.summary}</p>
            <p className={styles.mobileReason}>{shortlistReason(featured)}</p>
            <small className={styles.termLabel}>Welcome offer</small>
            <h4>{featured.bonus.title}</h4>
          </div>
          <div className={styles.featuredMark} aria-hidden="true"><span>▧</span><small>{featured.casino.name.replace(/\s+casino$/i, "")} media</small></div>
          <dl className={styles.featuredTerms}>
            <div><dt>Payout information</dt><dd>{payout(featured)}</dd></div>
            <div><dt>Wagering</dt><dd>{featured.bonus.wageringMultiplier === null ? "Not listed" : `${featured.bonus.wageringMultiplier}x · terms shown`}</dd></div>
            <div><dt>Minimum deposit</dt><dd>{money(featured.bonus.minimumDeposit, featured.bonus.currency)}</dd></div>
            <div><dt>Material term</dt><dd>{featured.bonus.importantConditions[0] || "Check full terms"}</dd></div>
            <div><dt>Full review</dt><dd>Evidence and scoring</dd></div>
          </dl>
          <MobileMaterialTerms offer={featured} />
          <div className={`${styles.actions} ${styles.featuredActions}`}><OfferAction featured offer={featured} /><Link href={`/casino/${featured.casino.slug}`}>Read Full Review →</Link><OfferCompare offer={featured} /></div>
        </article>

        <div className={styles.alternatives}>
          {top.slice(1).map((offer, index) => <article className={styles.alternativeCard} data-testid="ranked-offer-card" key={`${offer.casino.id}-${offer.bonus.id}`}>
            <div className={styles.altCopy}>
              <div className={styles.rankLine}><span>0{index + 2}</span><OfferIdentity offer={offer} /></div>
              <div className={styles.score}><small>Editor Score</small><strong>{offer.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
              {offer.dataClassification === "DEMO_FIXTURE" ? <p className={styles.dataNotice}><strong>DEMONSTRATION DATA</strong> — Fictional example for interface testing. No gambling or affiliate link is available.</p> : null}
              <p className={styles.mobileReason}>{shortlistReason(offer)}</p>
              <small className={styles.termLabel}>Welcome offer</small><h4>{offer.bonus.title}</h4>
              <p className={styles.termSummary}>Wagering {offer.bonus.wageringMultiplier === null ? "not listed" : `${offer.bonus.wageringMultiplier}x`} · Min deposit {money(offer.bonus.minimumDeposit, offer.bonus.currency)} · Payout {payout(offer)}</p>
              <p className={`${styles.reason} ${styles.altReason}`}>{offer.casino.summary}</p>
              <MobileMaterialTerms offer={offer} />
              <div className={styles.actions}><OfferAction offer={offer} /><Link href={`/casino/${offer.casino.slug}`}>Read Review</Link><OfferCompare offer={offer} /></div>
            </div>
            <div className={styles.altMark} aria-hidden="true"><span>▧</span><small>{offer.casino.name.replace(/\s+casino$/i, "")} media</small></div>
          </article>)}
        </div>
        {worthALook.length ? <section className={styles.worthALook} aria-labelledby="worth-a-look-title">
          <div className={styles.sectionRule}><span id="worth-a-look-title">Worth a look — just outside the top three</span><i /></div>
          <div className={styles.worthCards}>
            {worthALook.map((offer, index) => <article key={`${offer.casino.id}-${offer.bonus.id}`}>
              <div className={styles.worthHead}><OfferIdentity offer={offer} /><b>0{index + 4}</b></div>
              <div className={styles.worthScore}><small>Editor Score</small><strong>{offer.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
              <div className={styles.worthOffer}><small>Current offer</small><strong>{offer.bonus.title}</strong></div>
              <dl><div><dt>Payout</dt><dd>{payout(offer)}</dd></div><div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}x`}</dd></div><div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div></dl>
              <p className={styles.worthDesktopReason}>{offer.casino.summary}</p>
              <p className={styles.mobileReason}>{shortlistReason(offer)}</p>
              <MobileMaterialTerms offer={offer} />
              <div className={styles.actions}><OfferAction offer={offer} /><Link href={`/casino/${offer.casino.slug}`}>Review</Link><OfferCompare offer={offer} /></div>
            </article>)}
          </div>
          <Link className={styles.viewAll} href="/casinos">View all casinos →</Link>
        </section> : null}
      </div>
    </section>

    <section className={styles.whyPicked} aria-labelledby="why-picked-title" data-motion-reveal data-nav-theme="cream"><div className={styles.shell}>
      <div><p className={styles.lightKicker}>Why these records are shown</p><h2 id="why-picked-title">Eligibility, material terms and source status.</h2><p>{inventoryMode === "DEMO_ONLY" ? "These fictional records demonstrate the ranking presentation only. They are not current offers and cannot be claimed or compared as published casinos." : "Eligible published records are ranked under the disclosed method; incomplete or unavailable commercial actions fail closed."} <Link href="/methodology">Full methodology →</Link></p></div>
      <ol>
        <li><span>01</span><div><strong>Source status first</strong><p>Published and fictional records stay explicitly labelled and are never treated as interchangeable.</p></div></li>
        <li><span>02</span><div><strong>Material terms visible</strong><p>Wagering, minimum deposit, eligibility and key restrictions appear before any governed action.</p></div></li>
        <li><span>03</span><div><strong>Availability fails closed</strong><p>No commercial visit is inferred from a review, fixture or incomplete record.</p></div></li>
      </ol>
    </div></section>

    <section className={styles.faq} data-motion-reveal data-nav-theme="cream"><div className={styles.faqGrid}>
      <h2>Before you click</h2>
      <details><summary>What does “wagering 35x” actually mean?</summary><p>You must stake the bonus amount 35 times before withdrawing winnings from it. On a €500 bonus that&apos;s €17,500 in total stakes — read our <Link href="/bonus-guide">bonus guide</Link> before deciding it&apos;s worth it.</p></details>
      <details><summary>Do you earn money if I sign up?</summary><p>Usually yes — we may earn a commission. Affiliate compensation does not determine Editor Score or natural editorial ranking. Full details in our <Link href="/affiliate-disclosure">affiliate disclosure</Link>.</p></details>
      <details><summary>Why only three offers?</summary><p>The shortlist keeps the primary decision bounded. The <Link href="/bonuses">Bonuses</Link> page provides filters for every eligible published record currently available.</p></details>
      <details><summary>What happens when I click View Offer?</summary><p>You&apos;ll see a short confirmation that you&apos;re leaving B4GAMBLE, with the commission disclosure — then you continue to the operator, or stay.</p></details>
    </div></section>

    <section className={styles.finalOffer} aria-labelledby="final-offer-title" data-motion-reveal data-nav-theme="dark"><div>
      <p className={styles.darkKicker}>Still here? The answer hasn&apos;t changed.</p>
      <h2 id="final-offer-title">{featured.casino.name}.<em>{featured.dataClassification === "DEMO_FIXTURE" ? "Fictional rank 01." : "Rank 01 under the published method."}</em></h2>
      <p>{featured.bonus.title} · Wagering {featured.bonus.wageringMultiplier === null ? "not listed" : `${featured.bonus.wageringMultiplier}x`} · Min {money(featured.bonus.minimumDeposit, featured.bonus.currency)} · Payout {payout(featured)}</p>
      <OfferAction featured offer={featured} />
      <small>18+ · Terms apply · Gamble responsibly</small>
    </div></section>
  </>;
}
