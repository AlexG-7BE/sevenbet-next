"use client";

import { useMemo, useState } from "react";

import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialFacts, CommercialScore } from "@/components/commercial/CommercialPrimitives";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { availableBonusViews, offerCardPresentation, offersForBonusView, type BonusDirectoryView } from "@/lib/commercial/commercial-presentation";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import styles from "./BonusOfferDirectory.module.css";

export function BonusOfferDirectory({ messages, offers, presentation }: {
  messages: ProductPageMessages;
  offers: readonly PublicOfferDTO[];
  presentation: PresentationResolution;
}) {
  const copy = commercialUxMessages(presentation.locale);
  const views = useMemo(() => availableBonusViews(offers), [offers]);
  const labels: Record<BonusDirectoryView, string> = {
    all: copy.all,
    welcome: copy.welcome,
    low_wagering: copy.lowWagering,
    low_deposit: copy.lowDeposit,
    free_spins: copy.freeSpins,
    cashback: copy.cashback,
    no_deposit: copy.noDeposit,
  };
  const [view, setView] = useState<BonusDirectoryView>("all");
  const results = useMemo(() => offersForBonusView(offers, view), [offers, view]);
  const selectView = (next: BonusDirectoryView) => {
    setView(next);
    productAnalyticsClient.commercialViewSelected(`BONUSES_${next.toUpperCase()}`);
  };

  return <div className={styles.directory}>
    <div aria-label={messages.bonuses.directoryTitle} className={styles.viewRail} role="tablist">
      {views.map((key) => <button aria-controls="bonus-directory-results" aria-selected={view === key} id={`bonus-view-${key}`} key={key} onClick={() => selectView(key)} role="tab" type="button">{labels[key]}</button>)}
    </div>
    <p aria-atomic="true" aria-live="polite" className={styles.count} role="status">{results.length} {copy.offersShown}</p>
    {results.length ? <div aria-labelledby={`bonus-view-${view}`} className={styles.cards} id="bonus-directory-results" role="tabpanel">
      {results.map((offer, index) => {
        const card = offerCardPresentation(offer, presentation.locale, messages, copy, "bonus_directory");
        const published = offer.dataClassification === "PUBLISHED_RECORD";
        const placement = `BONUSES_${view.toUpperCase()}`;
        return <article
          className={styles.card}
          data-analytics-card-key={published ? `${view}:${card.offerKey}` : undefined}
          data-analytics-casino-id={published ? card.casinoId : undefined}
          data-analytics-offer-key={published ? card.offerKey : undefined}
          data-analytics-placement={published ? placement : undefined}
          data-analytics-position={published ? index + 1 : undefined}
          data-commercial-bonus-card
          key={card.offerKey}
        >
          <div className={styles.offerHead}><h2>{card.headline}</h2></div>
          <div className={styles.casinoLine}><strong>{card.casinoName}</strong><CommercialScore label={messages.common.editorScore} locale={presentation.locale} score={card.score} /></div>
          <CommercialFacts facts={card.facts} />
          <div className={styles.actions}>
            {card.action ? <CasinoOutboundAction action={card.action} context={{ source: "CTA", placement: "BONUS_CARD" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}
            <div className={styles.researchLinks}>
              {card.termsUrl ? <a href={card.termsUrl} rel="noopener noreferrer" target="_blank">{copy.terms}</a> : null}
              {card.reviewHref ? <TrackedReviewLink
                casinoId={published ? card.casinoId : undefined}
                href={productHref(presentation, card.reviewHref)}
                placement="BONUS_CARD"
                position={index + 1}
                sourceSurface="bonuses"
              >{published ? copy.casinoReview : messages.common.viewDemonstration}</TrackedReviewLink> : null}
            </div>
          </div>
        </article>;
      })}
    </div> : <div aria-labelledby={`bonus-view-${view}`} className={styles.empty} id="bonus-directory-results" role="tabpanel"><strong>{messages.bonuses.noMatchesTitle.replace("{market}", presentation.marketDisplayName)}</strong></div>}
  </div>;
}
