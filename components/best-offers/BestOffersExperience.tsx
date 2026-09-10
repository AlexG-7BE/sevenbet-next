import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { hasGovernedCommercialOfferAction, OperatorLogo } from "@/components/commercial-media/OperatorIdentityPanel";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import { formatProfileScore } from "@/lib/casino-profile/presentation";
import { commercialUiLabels } from "@/lib/i18n/commercial-ui-labels";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { formatCompactPayout, formatCompactWagering } from "@/lib/presentation/commercial-terms";
import { publicCasinoReviewHref } from "@/lib/public-casino/review-href";
import { offerPresentationCopy } from "@/lib/public-offer/offer-presentation-copy";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";

import styles from "./BestOffers.module.css";

function money(value: number | null, currency: string | null, locale: string, notListed: string) {
  if (value === null) return notListed;
  if (!currency) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try { return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value} ${currency}`; }
}

function offerLabel(offer: PublicOfferDTO, messages: ProductPageMessages, presentation: PresentationResolution) {
  return offer.dataClassification === "DEMO_FIXTURE"
    ? messages.common.demoData
    : offerPresentationCopy(offer.offerPresentation, messages, presentation).label;
}

function Score({ offer, messages, presentation }: { offer: PublicOfferDTO; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const score = formatProfileScore(offer.casino.editorScore, presentation.locale);
  return <div className={styles.score} aria-label={`${messages.common.editorScore} ${score} / 10`}><strong>{score}</strong><span aria-hidden="true">★★★★★</span><small>{messages.common.editorScore}</small></div>;
}

function Identity({ offer }: { offer: PublicOfferDTO }) {
  return <div className={styles.identity}>{offer.casino.logo ? <OperatorLogo offer={offer} prominent /> : null}<h3>{offer.casino.name}</h3></div>;
}

function Terms({ offer, messages, presentation, compact = false }: { offer: PublicOfferDTO; messages: ProductPageMessages; presentation: PresentationResolution; compact?: boolean }) {
  const labels = commercialUiLabels(presentation.locale);
  return <dl className={compact ? styles.compactTerms : styles.terms} data-material-terms>
    <div><dt>{messages.common.wagering}</dt><dd>{formatCompactWagering(offer.bonus.wageringMultiplier, offer.bonus.wageringText, { notListed: messages.common.notListed, notStated: labels.notStated })}</dd></div>
    <div><dt>{messages.common.minimumDeposit}</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency, presentation.locale, messages.common.notListed)}</dd></div>
    <div><dt>{messages.common.payout}</dt><dd>{formatCompactPayout(offer.casino.payments, messages.common.notListed)}</dd></div>
    {!compact ? <div><dt>{messages.common.eligibility}</dt><dd>{offer.bonus.eligibility || messages.common.notListed}</dd></div> : null}
  </dl>;
}

function Actions({ offer, messages, presentation, placement = "UNSPECIFIED" }: { offer: PublicOfferDTO; messages: ProductPageMessages; presentation: PresentationResolution; placement?: "BEST_OFFER_FEATURED" | "BEST_OFFER_SECONDARY" | "UNSPECIFIED" }) {
  const labels = commercialUiLabels(presentation.locale);
  const reviewHref = publicCasinoReviewHref(offer.casino);
  const available = hasGovernedCommercialOfferAction(offer) && Boolean(offer.action.href);
  return <div className={styles.actions} data-governed-actions>
    {available && offer.action.href
      ? <CasinoOutboundAction action={{ href: offer.action.href, label: labels.visitCasino }} className={styles.commercialCta} context={{ source: "CTA", placement }} messages={messages.outbound} />
      : <span className={styles.unavailableAction}>{messages.common.reviewOnly}</span>}
    {reviewHref ? <Link href={productHref(presentation, reviewHref)}>{messages.common.readReview}</Link> : null}
    {offer.dataClassification !== "DEMO_FIXTURE" ? <ContextualCompareToggle casinoName={offer.casino.name} casinoSlug={offer.casino.slug} messages={messages.comparison} /> : null}
  </div>;
}

function OfferNotice({ offer, messages }: { offer: PublicOfferDTO; messages: ProductPageMessages }) {
  return offer.dataClassification === "DEMO_FIXTURE" ? <p className={styles.dataNotice}><strong>{messages.common.demoData}</strong> — {messages.common.demoDisclosure}</p> : null;
}

export function BestOffersExperience({ shortlist, inventoryMode, messages, presentation }: {
  shortlist: PublicOfferDTO[];
  inventoryMode: PublicOfferInventoryMode;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
}) {
  const top = shortlist.slice(0, 3);
  const more = shortlist.slice(3, 6);
  const featured = top[0] ?? null;

  if (!featured) return <section className={styles.statePage} data-nav-theme="light" id="shortlist"><div className={styles.shell}><div className={styles.statePanel}><h2>{formatProductMessage(messages.bestOffers.emptyTitle, { market: presentation.marketDisplayName })}</h2><p>{messages.bestOffers.emptyCopy}</p><div className={styles.stateActions}><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link></div></div></div></section>;

  return <>
    <section className={styles.topThree} id="shortlist" aria-labelledby="top-three-title" data-inventory-mode={inventoryMode} data-motion-reveal data-nav-theme="light">
      <div className={styles.shell}>
        <div className={styles.sectionRule}><span id="top-three-title">{messages.bestOffers.sectionTitle}</span><i /></div>

        <article className={styles.featuredCard} data-testid="best-offer-product-card">
          <div className={styles.featuredLead}>
            <div className={styles.rankLine}><span>01</span><b>{offerLabel(featured, messages, presentation)}</b></div>
            <Identity offer={featured} />
            <Score messages={messages} offer={featured} presentation={presentation} />
            <OfferNotice messages={messages} offer={featured} />
            <h4>{featured.bonus.title}</h4>
            <p className={styles.reason}>{featured.casino.summary}</p>
            <Actions messages={messages} offer={featured} placement="BEST_OFFER_FEATURED" presentation={presentation} />
          </div>
          <div className={styles.featuredFacts}>
            <small>{messages.common.materialOfferTerms}</small>
            <Terms messages={messages} offer={featured} presentation={presentation} />
            <p>{featured.bonus.importantConditions.slice(0, 2).join(" · ") || featured.bonus.summary}</p>
          </div>
        </article>

        <div className={styles.alternatives}>
          {top.slice(1).map((offer, index) => <article className={styles.alternativeCard} data-testid="ranked-offer-card" key={`${offer.casino.id}-${offer.bonus.id}`}>
            <div className={styles.rankLine}><span>0{index + 2}</span><b>{offerLabel(offer, messages, presentation)}</b></div>
            <Identity offer={offer} />
            <Score messages={messages} offer={offer} presentation={presentation} />
            <OfferNotice messages={messages} offer={offer} />
            <h4>{offer.bonus.title}</h4>
            <Terms compact messages={messages} offer={offer} presentation={presentation} />
            <p className={styles.reason}>{offer.casino.summary}</p>
            <Actions messages={messages} offer={offer} placement="BEST_OFFER_SECONDARY" presentation={presentation} />
          </article>)}
        </div>

        {more.length ? <section className={styles.worthALook} aria-labelledby="worth-a-look-title">
          <div className={styles.sectionRule}><span id="worth-a-look-title">{messages.bestOffers.worthALookTitle}</span><i /></div>
          <div className={styles.worthCards}>{more.map((offer, index) => <article key={`${offer.casino.id}-${offer.bonus.id}`}>
            <div className={styles.rankLine}><span>0{index + 4}</span><b>{offerLabel(offer, messages, presentation)}</b></div>
            <Identity offer={offer} />
            <Score messages={messages} offer={offer} presentation={presentation} />
            <strong className={styles.offerTitle}>{offer.bonus.title}</strong>
            <Terms compact messages={messages} offer={offer} presentation={presentation} />
            <Actions messages={messages} offer={offer} presentation={presentation} />
          </article>)}</div>
          <Link className={styles.viewAll} href={productHref(presentation, "/bonuses")}>{messages.bonuses.directoryTitle} →</Link>
        </section> : null}
      </div>
    </section>

    <section className={styles.whyPicked} aria-labelledby="why-picked-title" data-nav-theme="cream"><div className={styles.shell}><p>{messages.bestOffers.whyTitle}</p><h2 id="why-picked-title">{messages.common.materialTerms} · {messages.common.sourceStatus}</h2><span>{inventoryMode === "PUBLISHED_ONLY" ? messages.bestOffers.whyCopy : messages.bestOffers.demoCopy} <Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology} →</Link></span></div></section>
    <section className={styles.faq} data-nav-theme="cream"><div className={styles.faqGrid}><h2>{messages.bestOffers.beforeClick}</h2><details><summary>{messages.bestOffers.faqWageringQuestion}</summary><p>{messages.bestOffers.faqWageringAnswer}</p></details><details><summary>{messages.bestOffers.faqCommissionQuestion}</summary><p>{messages.bestOffers.faqCommissionAnswer} <Link href="/affiliate-disclosure">{messages.common.affiliateDisclosure}</Link>.</p></details><details><summary>{messages.bestOffers.faqWhyThreeQuestion}</summary><p>{messages.bestOffers.faqWhyThreeAnswer}</p></details></div></section>
  </>;
}
