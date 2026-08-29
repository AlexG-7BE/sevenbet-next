import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialOfferMedia, OperatorLogo } from "@/components/commercial-media/CommercialOfferMedia";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import styles from "./BestOffers.module.css";

function money(value: number | null, currency: string | null, locale: string, notListed: string) {
  if (value === null) return notListed;
  if (!currency) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function payout(offer: PublicOfferDTO, messages: ProductPageMessages) {
  return offer.casino.payments.find((item) => item.supportsWithdrawals && item.withdrawalTime)?.withdrawalTime
    ?? messages.common.notListed;
}

function OfferAction({ offer, featured = false, messages }: { offer: PublicOfferDTO; featured?: boolean; messages: ProductPageMessages }) {
  const governed = offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && Boolean(offer.action.href);
  if (!governed || !offer.action.href) return <span className={styles.unavailableAction}>{messages.common.reviewAvailableNoAction}</span>;
  return <CasinoOutboundAction action={{ href: offer.action.href, label: `${featured ? messages.common.current : messages.common.actionAvailable}: ${offer.casino.name}` }} className={styles.commercialCta} messages={messages.outbound} />;
}

function OfferIdentity({ offer, size = "small" }: { offer: PublicOfferDTO; size?: "small" | "large" }) {
  return <div className={styles.identity} data-size={size}>
    <OperatorLogo offer={offer} prominent={size === "large"} />
    <h3>{offer.casino.name}</h3>
  </div>;
}

function OfferCompare({ offer, messages }: { offer: PublicOfferDTO; messages: ProductPageMessages }) {
  if (offer.dataClassification === "DEMO_FIXTURE") return null;
  return <ContextualCompareToggle casinoName={offer.casino.name} casinoSlug={offer.casino.slug} messages={messages.comparison} />;
}

function MobileMaterialTerms({ offer, messages, locale }: { offer: PublicOfferDTO; messages: ProductPageMessages; locale: string }) {
  return <dl className={styles.mobileMaterialTerms} aria-label={`${offer.casino.name} · ${messages.common.materialTerms}`}>
    <div><dt>{messages.common.wagering}</dt><dd>{offer.bonus.wageringMultiplier === null ? messages.common.notListed : `${offer.bonus.wageringMultiplier}x`}</dd></div>
    <div><dt>{messages.common.minimumDeposit}</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency, locale, messages.common.notListed)}</dd></div>
    <div><dt>{messages.common.eligibility}</dt><dd>{offer.bonus.eligibility || messages.common.notListed}</dd></div>
    <div><dt>{messages.common.materialTerms}</dt><dd>{offer.bonus.importantConditions.join(" · ") || messages.common.notListed}</dd></div>
  </dl>;
}

export function BestOffersExperience({ shortlist, inventoryMode, messages, presentation }: {
  shortlist: PublicOfferDTO[];
  inventoryMode: PublicOfferInventoryMode;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
}) {
  const top = shortlist.slice(0, 3);
  const worthALook = shortlist.slice(3, 6);
  const featured = top[0] ?? null;

  if (!featured) return <section className={styles.statePage} data-nav-theme="light" id="shortlist"><div className={styles.shell}><div className={styles.statePanel}><h2>{messages.bestOffers.emptyTitle}</h2><p>{messages.bestOffers.emptyCopy}</p><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link></div></div></section>;

  return <>
    <section className={styles.topThree} id="shortlist" aria-labelledby="top-three-title" data-inventory-mode={inventoryMode} data-motion-reveal data-nav-theme="light">
      <div className={styles.shell}>
        <div className={styles.sectionRule}><span id="top-three-title">{messages.bestOffers.sectionTitle}</span><i /></div>
        <p className={styles.mobileAffiliateDisclosure}>{messages.bestOffers.commissionNote} <Link href="/affiliate-disclosure">{messages.common.affiliateDisclosure} →</Link></p>
        <article className={styles.featuredCard} data-testid="best-offer-product-card">
          <div className={styles.featuredCopy}>
            <div className={styles.rankLine}><span>01</span><b>{featured.dataClassification === "DEMO_FIXTURE" ? messages.common.demoData : messages.common.current}</b></div>
            <OfferIdentity offer={featured} size="large" />
            <div className={styles.score}><small>{messages.common.editorScore}</small><strong>{featured.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
            {featured.dataClassification === "DEMO_FIXTURE" ? <p className={styles.dataNotice}><strong>{messages.common.demoData}</strong> — {messages.common.demoDisclosure}</p> : null}
            <p className={`${styles.reason} ${styles.desktopReason}`}>{featured.casino.summary}</p>
            <p className={styles.mobileReason}>{messages.bestOffers.whyCopy}</p>
            <small className={styles.termLabel}>{messages.common.current}</small>
            <h4>{featured.bonus.title}</h4>
          </div>
          <CommercialOfferMedia offer={featured} variant="featured" />
          <dl className={styles.featuredTerms}>
            <div><dt>{messages.common.payout}</dt><dd>{payout(featured, messages)}</dd></div>
            <div><dt>{messages.common.wagering}</dt><dd>{featured.bonus.wageringMultiplier === null ? messages.common.notListed : `${featured.bonus.wageringMultiplier}x`}</dd></div>
            <div><dt>{messages.common.minimumDeposit}</dt><dd>{money(featured.bonus.minimumDeposit, featured.bonus.currency, presentation.locale, messages.common.notListed)}</dd></div>
            <div><dt>{messages.common.materialTerms}</dt><dd>{featured.bonus.importantConditions[0] || messages.common.notListed}</dd></div>
            <div><dt>{messages.common.readReview}</dt><dd>{messages.common.sourceStatus}</dd></div>
          </dl>
          <MobileMaterialTerms locale={presentation.locale} messages={messages} offer={featured} />
          <div className={`${styles.actions} ${styles.featuredActions}`}><OfferAction featured messages={messages} offer={featured} /><Link href={productHref(presentation, `/casino/${featured.casino.slug}`)}>{messages.common.readReview} →</Link><OfferCompare messages={messages} offer={featured} /></div>
        </article>

        <div className={styles.alternatives}>
          {top.slice(1).map((offer, index) => <article className={styles.alternativeCard} data-testid="ranked-offer-card" key={`${offer.casino.id}-${offer.bonus.id}`}>
            <div className={styles.altCopy}>
              <div className={styles.rankLine}><span>0{index + 2}</span><OfferIdentity offer={offer} /></div>
              <div className={styles.score}><small>{messages.common.editorScore}</small><strong>{offer.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
              {offer.dataClassification === "DEMO_FIXTURE" ? <p className={styles.dataNotice}><strong>{messages.common.demoData}</strong> — {messages.common.demoDisclosure}</p> : null}
              <p className={styles.mobileReason}>{messages.bestOffers.whyCopy}</p>
              <small className={styles.termLabel}>{messages.common.current}</small><h4>{offer.bonus.title}</h4>
              <p className={styles.termSummary}>{messages.common.wagering} {offer.bonus.wageringMultiplier === null ? messages.common.notListed : `${offer.bonus.wageringMultiplier}x`} · {messages.common.minimumDeposit} {money(offer.bonus.minimumDeposit, offer.bonus.currency, presentation.locale, messages.common.notListed)} · {messages.common.payout} {payout(offer, messages)}</p>
              <p className={`${styles.reason} ${styles.altReason}`}>{offer.casino.summary}</p>
              <MobileMaterialTerms locale={presentation.locale} messages={messages} offer={offer} />
              <div className={styles.actions}><OfferAction messages={messages} offer={offer} /><Link href={productHref(presentation, `/casino/${offer.casino.slug}`)}>{messages.common.readReview}</Link><OfferCompare messages={messages} offer={offer} /></div>
            </div>
            <CommercialOfferMedia offer={offer} variant="secondary" />
          </article>)}
        </div>
        {worthALook.length ? <section className={styles.worthALook} aria-labelledby="worth-a-look-title">
          <div className={styles.sectionRule}><span id="worth-a-look-title">{messages.bestOffers.whyTitle}</span><i /></div>
          <div className={styles.worthCards}>
            {worthALook.map((offer, index) => <article key={`${offer.casino.id}-${offer.bonus.id}`}>
              <div className={styles.worthHead}><OfferIdentity offer={offer} /><b>0{index + 4}</b></div>
              <div className={styles.worthScore}><small>{messages.common.editorScore}</small><strong>{offer.casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span></div>
              <div className={styles.worthOffer}><small>{messages.common.current}</small><strong>{offer.bonus.title}</strong></div>
              <dl><div><dt>{messages.common.payout}</dt><dd>{payout(offer, messages)}</dd></div><div><dt>{messages.common.wagering}</dt><dd>{offer.bonus.wageringMultiplier === null ? messages.common.notListed : `${offer.bonus.wageringMultiplier}x`}</dd></div><div><dt>{messages.common.minimumDeposit}</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency, presentation.locale, messages.common.notListed)}</dd></div></dl>
              <p className={styles.worthDesktopReason}>{offer.casino.summary}</p>
              <p className={styles.mobileReason}>{messages.bestOffers.whyCopy}</p>
              <MobileMaterialTerms locale={presentation.locale} messages={messages} offer={offer} />
              <div className={styles.actions}><OfferAction messages={messages} offer={offer} /><Link href={productHref(presentation, `/casino/${offer.casino.slug}`)}>{messages.common.readReview}</Link><OfferCompare messages={messages} offer={offer} /></div>
            </article>)}
          </div>
          <Link className={styles.viewAll} href={productHref(presentation, "/casinos")}>{messages.common.browseReviews} →</Link>
        </section> : null}
      </div>
    </section>

    <section className={styles.whyPicked} aria-labelledby="why-picked-title" data-motion-reveal data-nav-theme="cream"><div className={styles.shell}>
      <div><p className={styles.lightKicker}>{messages.bestOffers.whyTitle}</p><h2 id="why-picked-title">{messages.common.materialTerms} · {messages.common.sourceStatus}</h2><p>{inventoryMode === "DEMO_ONLY" ? messages.common.demoDisclosure : messages.bestOffers.whyCopy} <Link href="/methodology">{messages.common.reviewMethodology} →</Link></p></div>
      <ol>
        <li><span>01</span><div><strong>{messages.common.sourceStatus}</strong><p>{messages.common.demoDisclosure}</p></div></li>
        <li><span>02</span><div><strong>{messages.common.materialTerms}</strong><p>{messages.bestOffers.whyCopy}</p></div></li>
        <li><span>03</span><div><strong>{messages.common.commercialUnavailable}</strong><p>{messages.common.marketPresentationNotice}</p></div></li>
      </ol>
    </div></section>

    <section className={styles.faq} data-motion-reveal data-nav-theme="cream"><div className={styles.faqGrid}>
      <h2>{messages.bestOffers.beforeClick}</h2>
      <details><summary>{messages.bestOffers.faqWageringQuestion}</summary><p>{messages.bestOffers.faqWageringAnswer} <Link href="/bonus-guide">{messages.common.bonusGuide}</Link>.</p></details>
      <details><summary>{messages.bestOffers.faqCommissionQuestion}</summary><p>{messages.bestOffers.faqCommissionAnswer} <Link href="/affiliate-disclosure">{messages.common.affiliateDisclosure}</Link>.</p></details>
      <details><summary>{messages.bestOffers.faqWhyThreeQuestion}</summary><p>{messages.bestOffers.faqWhyThreeAnswer} <Link href={productHref(presentation, "/bonuses")}>{messages.common.bonusGuide}</Link>.</p></details>
    </div></section>

    <section className={styles.finalOffer} aria-labelledby="final-offer-title" data-motion-reveal data-nav-theme="dark"><div>
      <p className={styles.darkKicker}>{messages.bestOffers.beforeClick}</p>
      <h2 id="final-offer-title">{featured.casino.name}.<em>{messages.bestOffers.sectionTitle}</em></h2>
      <p>{featured.bonus.title} · {messages.common.wagering} {featured.bonus.wageringMultiplier === null ? messages.common.notListed : `${featured.bonus.wageringMultiplier}x`} · {messages.common.minimumDeposit} {money(featured.bonus.minimumDeposit, featured.bonus.currency, presentation.locale, messages.common.notListed)} · {messages.common.payout} {payout(featured, messages)}</p>
      <OfferAction featured messages={messages} offer={featured} />
      <small>{messages.common.marketPresentationNotice}</small>
    </div></section>
  </>;
}
