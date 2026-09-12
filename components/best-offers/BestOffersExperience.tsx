"use client";

import { useMemo, useState } from "react";

import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialBadges, CommercialFacts, CommercialScore } from "@/components/commercial/CommercialPrimitives";
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
  const offers = useMemo(() => rankBestOffersForCategory(shortlist, category, {
    country: presentation.marketCountryCode ?? undefined,
    includeDemonstration: inventoryMode === "DEMO_ONLY",
    limit: 3,
  }), [category, inventoryMode, presentation.marketCountryCode, shortlist]);

  const selectCategory = (next: BestOfferCategory) => {
    setCategory(next);
    productAnalyticsClient.commercialViewSelected(`BEST_OFFERS_${next.toUpperCase()}`);
  };

  return <section aria-labelledby="best-offers-heading" className={styles.commercialShortlist} data-nav-theme="light" id="shortlist">
    <div className={styles.shell}>
      <header className={styles.commercialHeading}>
        <p>{messages.bestOffers.sectionTitle}</p>
        <h2 id="best-offers-heading">{labels[category]}</h2>
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
            <span aria-label={`${messages.common.result} ${index + 1}`} className={styles.rankNumber}>#{index + 1}</span>
            <div className={styles.rankIdentity}>
              <div className={styles.rankLogo}>{card.logo ? <ResponsivePlacementImage alt="" height={card.logo.height ?? 80} media={card.logo} width={card.logo.width ?? 160} /> : <span aria-hidden="true">{card.casinoName.slice(0, 1)}</span>}</div>
              <div><h3>{card.casinoName}</h3><CommercialBadges badges={card.badges} /></div>
              <CommercialScore label={messages.common.editorScore} locale={presentation.locale} score={card.score} />
            </div>
            <h4>{card.headline}</h4>
            <CommercialFacts facts={card.facts} />
            <div className={styles.rankActions}>
              {card.action ? <CasinoOutboundAction action={card.action} context={{ source: "CTA", placement: "BEST_OFFERS_CARD" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}
              {card.reviewHref ? <TrackedReviewLink
                casinoId={published ? card.casinoId : undefined}
                href={productHref(presentation, card.reviewHref)}
                placement="BEST_OFFERS_CARD"
                position={index + 1}
                sourceSurface="best-offers"
              >{published ? messages.common.readReview : messages.common.viewDemonstration}</TrackedReviewLink> : null}
            </div>
          </article>;
        }) : <div className={styles.categoryEmpty} role="status">
          <strong>{messages.common.commercialUnavailable}</strong>
          <p>{messages.bestOffers.emptyCopy}</p>
        </div>}
      </div>
      <p className={styles.compactCommission}>{copy.compactDisclosure} · {messages.bestOffers.commissionNote}</p>
    </div>
  </section>;
}
