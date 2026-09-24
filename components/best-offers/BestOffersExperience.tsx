"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialBadges, CommercialFacts, CommercialScore, EmphasisTail } from "@/components/commercial/CommercialPrimitives";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { offerCardPresentation } from "@/lib/commercial/commercial-presentation";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { BEST_OFFER_CATEGORIES, rankBestOffersForCategory, type BestOfferCategory } from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";

import styles from "./BestOffers.module.css";

export function BestOffersExperience({ inventoryMode, messages, presentation, shortlist }: {
  inventoryMode: PublicOfferInventoryMode;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
  shortlist: PublicOfferDTO[];
}) {
  const copy = commercialUxMessages(presentation.locale);
  const labels: Record<BestOfferCategory, string> = {
    best_overall: copy.bestOverall,
    fast_payouts: copy.fastPayouts,
    best_bonus_terms: copy.bestBonusTerms,
    low_deposit: copy.lowDeposit,
  };
  const [category, setCategory] = useState<BestOfferCategory>("best_overall");
  // The shortlist the page hands down is already filtered by the visibility
  // policy, so a record reaching here may be ranked on its own terms. Filtering
  // again on a governed route would leave every category empty wherever no
  // partner link exists, which is the page's whole problem.
  const offers = useMemo(() => rankBestOffersForCategory(shortlist, category, {
    country: presentation.marketCountryCode ?? undefined,
    includeDemonstration: inventoryMode === "DEMO_ONLY",
    includeWithoutRoute: true,
    limit: 3,
  }), [category, inventoryMode, presentation.marketCountryCode, shortlist]);

  const selectCategory = (next: BestOfferCategory) => {
    setCategory(next);
    productAnalyticsClient.commercialViewSelected(`BEST_OFFERS_${next.toUpperCase()}`);
  };

  return <section aria-labelledby="best-offers-heading" className={styles.commercialShortlist} data-nav-theme="dark" id="shortlist">
    <div className={styles.shell}>
      <header className={styles.commercialHeading}>
        <p>{messages.bestOffers.sectionTitle}</p>
        <h2 id="best-offers-heading"><EmphasisTail text={labels[category]} /></h2>
      </header>
      <div aria-label={messages.bestOffers.sectionTitle} className={styles.categoryRail} role="tablist">
        {BEST_OFFER_CATEGORIES.map((key) => <button
          aria-controls="best-offer-results"
          aria-selected={category === key}
          key={key}
          onClick={() => selectCategory(key)}
          role="tab"
          type="button"
        >{labels[key]}</button>)}
      </div>

      <div aria-live="polite" className={styles.rankList} id="best-offer-results" role="tabpanel">
        {offers.length ? offers.map((offer, index) => {
          const card = offerCardPresentation(offer, presentation.locale, messages, copy, category);
          const published = offer.dataClassification === "PUBLISHED_RECORD";
          const placement = `BEST_OFFERS_${category.toUpperCase()}`;
          const primary = index === 0;
          const rankNumber = <span aria-label={`${messages.common.result} ${index + 1}`} className={styles.rankNumber}>#{index + 1}</span>;
          return <article
            className={index === 0 ? styles.rankPrimary : styles.rankSecondary}
            data-analytics-card-key={published ? `${category}:${card.offerKey}` : undefined}
            data-analytics-casino-id={published ? card.casinoId : undefined}
            data-analytics-offer-key={published ? card.offerKey : undefined}
            data-analytics-placement={published ? placement : undefined}
            data-analytics-position={published ? index + 1 : undefined}
            data-commercial-best-offer-card
            key={card.offerKey}
          >
            {primary ? <span aria-hidden="true" className={styles.rankGlow} /> : null}
            {primary ? rankNumber : null}
            <div className={styles.rankIdentity}>
              {primary ? null : rankNumber}
              <div className={styles.rankLogo}>{card.logo ? <ResponsivePlacementImage alt="" height={card.logo.height ?? 80} media={card.logo} width={card.logo.width ?? 160} /> : <span aria-hidden="true">{card.casinoName.slice(0, 1)}</span>}</div>
              <div className={styles.rankName}>
                <h3>{card.casinoName}</h3>
                <div className={styles.rankMeta}>
                  <CommercialScore className={styles.rankScore} label={messages.common.editorScore} locale={presentation.locale} score={card.score} />
                  {primary && card.score !== null ? <span aria-hidden="true" className={styles.rankScoreLabel}>{messages.common.editorScore}</span> : null}
                  <CommercialBadges badges={card.badges} className={styles.rankBadges} />
                </div>
              </div>
            </div>
            <div className={styles.rankOffer}><h4>{card.headline}</h4>{card.reason ? <p>{card.reason}</p> : null}</div>
            <div className={styles.rankTerms}>
              <CommercialFacts facts={card.facts} className={styles.rankFacts} />
              <div className={styles.rankActions}>
                {card.action ? <CasinoOutboundAction action={card.action} className={styles.offerAction} context={{ source: "CTA", placement: "BEST_OFFERS_CARD" }} messages={messages.outbound} showDisclosure={false} /> : card.reviewHref ? null : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}
                {card.reviewHref ? <TrackedReviewLink
                  casinoId={published ? card.casinoId : undefined}
                  className={card.action ? undefined : styles.reviewPrimary}
                  href={productHref(presentation, card.reviewHref)}
                  pendingLabel={published ? messages.common.readReview : messages.common.viewDemonstration}
                  placement="BEST_OFFERS_CARD"
                  position={index + 1}
                  primary={!card.action}
                  sourceSurface="best-offers"
                >{published ? messages.common.readReview : messages.common.viewDemonstration} <span aria-hidden="true">→</span></TrackedReviewLink> : null}
              </div>
            </div>
          </article>;
        }) : <div className={styles.categoryEmpty} role="status">
          <strong>{messages.common.commercialUnavailable}</strong>
          <p>{messages.bestOffers.emptyCopy}</p>
          <Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link>
        </div>}
      </div>
      <p className={styles.compactCommission}>{copy.compactDisclosure} · {messages.bestOffers.commissionNote}</p>
    </div>
  </section>;
}
