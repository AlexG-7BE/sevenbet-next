"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { formatProfileScore } from "@/lib/casino-profile/presentation";
import { commercialUiLabels } from "@/lib/i18n/commercial-ui-labels";
import { publicCasinoReviewHref } from "@/lib/public-casino/review-href";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import {
  curatedCasinoSelectors as selectors,
  resolveActiveCuratedCasinoSelector,
  selectAvailableCuratedCasinoResults,
  type CuratedCasinoSelector as Selector,
} from "@/lib/public-casino-discovery/curated-selector";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { formatCompactWagering } from "@/lib/presentation/commercial-terms";

import styles from "./CuratedCasinoShortlist.module.css";

function hasGovernedVisitAction(casino: PublicCasinoCardDto) {
  return casino.disposition === "PROMOTABLE"
    && casino.dataClassification !== "DEMO_FIXTURE"
    && casino.visitAction.available
    && Boolean(casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug));
}

function governedVisitAction(casino: PublicCasinoCardDto, presentation: PresentationResolution) {
  if (!hasGovernedVisitAction(casino) || !casino.visitAction.redirectSlug) return null;
  return {
    href: `/r/${casino.visitAction.redirectSlug}`,
    label: commercialUiLabels(presentation.locale).visitCasino,
  };
}

function selectorLabel(selector: Selector, messages: ProductPageMessages) {
  if (selector === "Best Overall") return messages.casinos.bestOverall;
  if (selector === "Crypto") return messages.casinos.crypto;
  if (selector === "Mobile") return messages.casinos.mobile;
  if (selector === "Best Bonuses") return messages.casinos.bestBonuses;
  return messages.casinos.newCasinos;
}

function Visit({ casino, messages, presentation }: { casino: PublicCasinoCardDto; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const action = governedVisitAction(casino, presentation);
  if (!action) return <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>;
  return <CasinoOutboundAction action={action} className={styles.visit} context={{ source: "CTA", placement: "CASINO_DIRECTORY_CARD" }} messages={messages.outbound} />;
}

function minimumDeposit(casino: PublicCasinoCardDto, messages: ProductPageMessages, locale: string) {
  const offer = casino.featuredBonus;
  if (offer?.minimumDeposit === null || offer?.minimumDeposit === undefined) return messages.common.notListed;
  if (!offer.currency) return String(offer.minimumDeposit);
  try { return new Intl.NumberFormat(locale, { style: "currency", currency: offer.currency, maximumFractionDigits: 2 }).format(offer.minimumDeposit); }
  catch { return `${offer.minimumDeposit} ${offer.currency}`; }
}

function wagering(casino: PublicCasinoCardDto, messages: ProductPageMessages, presentation: PresentationResolution) {
  return formatCompactWagering(casino.featuredBonus?.wageringRequirement, null, {
    notListed: messages.common.notListed,
    notStated: commercialUiLabels(presentation.locale).notStated,
  });
}

export function CuratedCasinoShortlist({
  bestBonusCasinoIds = [],
  casinos,
  messages,
  presentation,
}: {
  bestBonusCasinoIds?: readonly string[];
  casinos: PublicCasinoCardDto[];
  messages: ProductPageMessages;
  presentation: PresentationResolution;
}) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const editorialCasinos = useMemo(() => casinos.filter((casino) => casino.disposition !== "HIDDEN"), [casinos]);
  const availableResults = useMemo(
    () => selectAvailableCuratedCasinoResults(editorialCasinos, { bestBonusCasinoIds }),
    [bestBonusCasinoIds, editorialCasinos],
  );
  const availableSelectors = useMemo(() => availableResults.map((result) => result.selector), [availableResults]);
  const activeSelector = resolveActiveCuratedCasinoSelector(selector, availableSelectors);
  const top = activeSelector ? availableResults.find((result) => result.selector === activeSelector)?.items ?? [] : [];
  const selectedLabel = activeSelector ? selectorLabel(activeSelector, messages) : "";
  const market = presentation.marketDisplayName;

  useEffect(() => {
    if (activeSelector && activeSelector !== selector) setSelector(activeSelector);
  }, [activeSelector, selector]);

  if (!activeSelector) return null;

  return <section className={styles.section} aria-labelledby="curated-title" data-motion-reveal data-nav-theme="light">
    <div className={styles.shell}>
      <div className={styles.tabs} aria-label={messages.casinos.directoryTitle} data-selector-group="curated-casinos" role="group">
        {selectors.filter((label) => availableSelectors.includes(label)).map((label) => <button aria-pressed={activeSelector === label} key={label} onClick={() => setSelector(label)} type="button">{selectorLabel(label, messages)}</button>)}
      </div>
      <p className={styles.context} id="curated-title"><strong>{selectedLabel}</strong><span>{messages.casinos.proofLimit} · {messages.casinos.proofEvidence}</span></p>
      <div className={styles.cards}>
        {top.map((casino, index) => {
          const fixture = casino.dataClassification !== "PUBLISHED_RECORD";
          const fixtureDisclosure = casino.dataClassification === "DEMO_FIXTURE" ? messages.common.demoDisclosure : messages.common.marketPresentationNotice;
          const reviewHref = publicCasinoReviewHref(casino);
          const strengths = casino.highlights.slice(0, 3);
          return <article
            className={styles.card}
            data-mobile-presentation-family="LOGO_ONLY"
            data-presentation-family="LOGO_ONLY"
            key={casino.id}
          >
            <div className={styles.cardBody}>
              <div className={styles.recommendationContext}><span>{selectedLabel}</span><b>{String(index + 1).padStart(2, "0")} / {String(top.length).padStart(2, "0")}</b></div>
              {fixture ? <p className={styles.demoLabel}><strong>{messages.common.demoData}</strong> · {fixtureDisclosure}</p> : null}
              <div className={styles.cardHead}>
                <div className={styles.mark}>{casino.logo ? <ResponsivePlacementImage alt="" height={casino.logo.height ?? 120} media={casino.logo} width={casino.logo.width ?? 240} /> : null}</div>
                <div className={styles.identity}><small>{messages.profile.operatorReview}</small><h2>{casino.name}</h2></div>
                <div className={styles.score} aria-label={`${messages.common.editorScore} ${casino.rating === null ? messages.common.notListed : formatProfileScore(casino.rating, presentation.locale)} / 10`}><small>{messages.common.editorScore}</small><strong>{casino.rating === null ? "—" : formatProfileScore(casino.rating, presentation.locale)}<span>/10</span></strong></div>
              </div>
              <p className={styles.bestFor}><span>{messages.profile.bestFor}</span><strong>{selectedLabel}</strong></p>
              <p className={styles.reason}>{casino.shortDescription || formatProductMessage(messages.casinos.heroCopy, { market })}</p>
              {strengths.length ? <ul className={styles.strengths}>{strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul> : null}
              <div className={styles.offer}>
                <small>{fixture ? messages.common.demoData : messages.common.published}</small>
                <strong>{casino.featuredBonus?.title ?? messages.common.notListed}</strong>
                {casino.featuredBonus ? <dl className={styles.terms}>
                  <div><dt>{messages.common.wagering}</dt><dd>{wagering(casino, messages, presentation)}</dd></div>
                  <div><dt>{messages.common.minimumDeposit}</dt><dd>{minimumDeposit(casino, messages, presentation.locale)}</dd></div>
                  <div><dt>{messages.common.materialTerms}</dt><dd>{casino.featuredBonus.keyTerms[0] ?? messages.common.readReview}</dd></div>
                </dl> : null}
              </div>
              <div className={styles.actions}><Visit casino={casino} messages={messages} presentation={presentation} />{reviewHref ? <Link href={productHref(presentation, reviewHref)}>{fixture ? messages.common.viewDemonstration : messages.common.readReview}</Link> : null}{!fixture ? <ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} messages={messages.comparison} /> : null}</div>
            </div>
          </article>;
        })}
      </div>
      <div className={styles.why}><strong>{messages.bestOffers.whyTitle}</strong><span>{messages.casinos.proofEvidence}</span><span>{messages.casinos.proofPublished}</span><Link href={productHref(presentation, "/methodology")}>{messages.common.methodology} →</Link></div>
    </div>
  </section>;
}
