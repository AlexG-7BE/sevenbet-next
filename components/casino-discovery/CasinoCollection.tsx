"use client";

import { useMemo, useRef, useState } from "react";

import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialBadges, CommercialFacts, CommercialScore } from "@/components/commercial/CommercialPrimitives";
import { useRevealResults } from "@/components/commercial/useRevealResults";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { CASINO_COLLECTION_VIEWS, casinoCardPresentation, casinosForCollectionView, filterCasinosByName, type CasinoCollectionView } from "@/lib/commercial/commercial-presentation";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

import styles from "./CasinoCollection.module.css";

export function CasinoCollection({ casinos, initialSearch = "", messages, presentation }: {
  casinos: readonly PublicCasinoCardDto[];
  initialSearch?: string;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
}) {
  const copy = commercialUxMessages(presentation.locale);
  const labels: Record<CasinoCollectionView, string> = {
    top_rated: copy.topRated,
    fast_payouts: copy.fastPayouts,
    low_deposit: copy.lowDeposit,
  };
  const [view, setView] = useState<CasinoCollectionView>("top_rated");
  const [search, setSearch] = useState(initialSearch);
  const results = useMemo(() => {
    const ordered = casinosForCollectionView(casinos, view);
    return filterCasinosByName(ordered, search, presentation.locale);
  }, [casinos, presentation.locale, search, view]);

  const controlsRef = useRef<HTMLDivElement>(null);
  const resultsStartRef = useRef<HTMLParagraphElement>(null);
  useRevealResults(controlsRef, resultsStartRef, `${view}|${search}`);

  const selectView = (next: CasinoCollectionView) => {
    setView(next);
    productAnalyticsClient.commercialViewSelected(`CASINOS_${next.toUpperCase()}`);
  };

  return <div className={styles.collection} data-collection-size={casinos.length} data-header-autohide="">
    <div className={styles.controls} ref={controlsRef}>
      <label>
        <span>{copy.searchCasinos}</span>
        <input
          autoComplete="off"
          name="casino-search"
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder={copy.searchPlaceholder}
          type="search"
          value={search}
        />
      </label>
      <div aria-label={messages.casinos.directoryTitle} className={styles.viewRail} role="tablist">
        {CASINO_COLLECTION_VIEWS.map((key) => <button aria-controls="casino-collection-results" aria-selected={view === key} id={`casino-view-${key}`} key={key} onClick={() => selectView(key)} role="tab" type="button">{labels[key]}</button>)}
      </div>
    </div>
    <p aria-atomic="true" aria-live="polite" className={styles.count} ref={resultsStartRef} role="status">{results.length} {copy.casinosShown}</p>
    {results.length ? <div aria-labelledby={`casino-view-${view}`} className={styles.cards} id="casino-collection-results" role="tabpanel">
      {results.map((casino, index) => {
        const card = casinoCardPresentation(casino, presentation.locale, messages, copy);
        const published = casino.dataClassification === "PUBLISHED_RECORD";
        const placement = `CASINOS_${view.toUpperCase()}`;
        return <article
          className={styles.card}
          data-analytics-card-key={published ? `${view}:${card.casinoId}` : undefined}
          data-analytics-casino-id={published ? card.casinoId : undefined}
          data-analytics-placement={published ? placement : undefined}
          data-analytics-position={published ? index + 1 : undefined}
          data-commercial-casino-card
          key={card.casinoId}
        >
          <span aria-hidden="true" className={styles.rank}>{copy.rankPrefix} {String(index + 1).padStart(2, "0")}</span>
          <header>
            <div className={styles.logo}>{card.logo ? <ResponsivePlacementImage alt="" height={card.logo.height ?? 76} loading="lazy" media={card.logo} width={card.logo.width ?? 152} /> : <span aria-hidden="true">{card.name.slice(0, 1)}</span>}</div>
            <div className={styles.identity}><h2>{card.name}</h2><CommercialBadges badges={card.badges} className={styles.badges} /></div>
          </header>
          <div className={styles.cardLine}>
            {card.headline ? <h3>{card.headline}</h3> : <span />}
            <CommercialScore className={styles.score} label={messages.common.editorScore} locale={presentation.locale} score={card.score} />
          </div>
          <CommercialFacts facts={card.facts} className={styles.facts} />
          {view === "top_rated" && card.reason ? <p className={styles.reason}>{card.reason}</p> : null}
          <div className={styles.actions}>
            {card.action ? <CasinoOutboundAction action={card.action} className={styles.offerAction} context={{ source: "CTA", placement: "CASINO_COLLECTION_CARD" }} messages={messages.outbound} showDisclosure={false} /> : card.reviewHref ? null : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}
            {card.reviewHref ? <TrackedReviewLink
              casinoId={published ? card.casinoId : undefined}
              className={card.action ? undefined : styles.reviewPrimary}
              href={productHref(presentation, card.reviewHref)}
              pendingLabel={published ? messages.common.readReview : messages.common.viewDemonstration}
              placement="CASINO_COLLECTION_CARD"
              position={index + 1}
              primary={!card.action}
              sourceSurface="casinos"
            >{published ? messages.common.readReview : messages.common.viewDemonstration} <span aria-hidden="true">→</span></TrackedReviewLink> : null}
          </div>
        </article>;
      })}
    </div> : <div aria-labelledby={`casino-view-${view}`} className={styles.empty} id="casino-collection-results" role="tabpanel"><strong>{copy.noSearchResults}</strong></div>}
  </div>;
}
