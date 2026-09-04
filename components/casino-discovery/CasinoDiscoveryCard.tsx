import Link from "next/link";
import Image from "next/image";
import React from "react";
import type { ReactNode } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { publicCasinoReviewHref } from "@/lib/public-casino/review-href";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { visitActionUnavailableCopy } from "@/lib/public-casino-discovery/visit-action-presentation";
import { formatProductMessage, productPageMessages, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolvePresentationContext } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { formatProfileScore } from "@/lib/casino-profile/presentation";

const DIRECTORY_EDITORIAL_MEDIA = "/casino-directory/editorial-media.jpg";

export type CasinoCardClassNames = Record<
  | "casinoCard" | "cardHeader" | "position" | "logo" | "identity" | "score"
  | "description" | "signals" | "signal" | "offerBlock" | "commission"
  | "unavailable" | "cardActions" | "featurePlaceholder" | "featureTheatre"
  | "featureMedia" | "featureOverlay" | "featureCopy" | "featureMetrics"
  | "featureCard" | "featureEyebrow",
  string
>;

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Signal({ children, classNames }: { children: ReactNode; classNames: CasinoCardClassNames }) {
  return <span className={classNames.signal}><i aria-hidden="true" />{children}</span>;
}

function hasGovernedVisitAction(casino: PublicCasinoCardDto) {
  return casino.disposition === "PROMOTABLE"
    && casino.dataClassification !== "DEMO_FIXTURE"
    && casino.visitAction.available
    && Boolean(casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug));
}

function ReviewCardContents({ casino, position, classNames, messages, presentation }: { casino: PublicCasinoCardDto; position?: number; classNames: CasinoCardClassNames; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const demo = casino.dataClassification !== "PUBLISHED_RECORD";
  const canVisit = hasGovernedVisitAction(casino);
  const unavailable = visitActionUnavailableCopy(casino.visitAction);
  const reviewHref = publicCasinoReviewHref(casino);
  const freshness = formatDate(casino.editorialUpdatedAt ?? casino.publishedAt, presentation.locale);
  const formattedRating = casino.rating === null ? null : formatProfileScore(casino.rating, presentation.locale);
  const disclosure = casino.dataClassification === "PUBLISHED_RECORD"
    ? casino.disposition === "PROMOTABLE"
      ? messages.bestOffers.commissionNote
      : messages.common.reviewAvailableNoAction
    : casino.dataClassification === "DEMO_FIXTURE"
      ? messages.common.demoDisclosure
      : messages.common.marketPresentationNotice;
  const signals = [
    casino.licenses[0]?.label,
    casino.paymentMethods.length ? casino.paymentMethods.slice(0, 2).map((item) => item.label).join(" + ") : null,
    casino.responsibleGamblingLabel,
  ].filter((value): value is string => Boolean(value));

  return <>
    {position !== undefined && <span aria-label={`${messages.common.result} ${position}`} className={classNames.position}>{String(position).padStart(2, "0")}</span>}
    <div className={classNames.cardHeader}>
      <div className={classNames.logo}>{casino.logo ? <ResponsivePlacementImage alt="" height={casino.logo.height ?? 72} loading="lazy" media={casino.logo} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}</div>
      <div className={classNames.identity}><h2>{reviewHref ? <Link href={productHref(presentation, reviewHref)}>{casino.name}</Link> : casino.name}</h2>{demo ? <small>{messages.common.demoData}</small> : casino.highlights.length ? <small>{casino.highlights.slice(0, 2).join(" · ")}</small> : freshness && <small>{messages.common.current} {freshness}</small>}</div>
      {formattedRating !== null && <div aria-label={`${messages.common.editorScore} ${formattedRating} / 10`} className={classNames.score}><strong>{formattedRating}</strong><span>/10</span></div>}
    </div>
    {casino.shortDescription && <p className={classNames.description}>{casino.shortDescription}</p>}
    {signals.length > 0 && <div className={classNames.signals}>{signals.map((signal) => <Signal classNames={classNames} key={signal}>{signal}</Signal>)}</div>}
    <div className={classNames.offerBlock}>
      {casino.featuredBonus ? <><span>{demo ? messages.common.demoData : messages.common.published}</span><strong>{casino.featuredBonus.title}</strong>{casino.featuredBonus.summary && <p>{casino.featuredBonus.summary}</p>}{casino.featuredBonus.keyTerms.length > 0 && <small>{casino.featuredBonus.keyTerms.slice(0, 3).join(" · ")} · {demo ? messages.common.demoData : messages.common.published}</small>}</> : <><span>{messages.common.bonusAvailability}</span><strong>{messages.common.notListed}</strong></>}
    </div>
    <p className={classNames.commission}>{disclosure}</p>
    {unavailable && <p className={classNames.unavailable} role="note">{messages.common.reviewAvailableNoAction}</p>}
    <div className={classNames.cardActions}>{canVisit && <CasinoOutboundAction action={{ href: `/r/${casino.visitAction.redirectSlug}`, label: casino.visitAction.label }} messages={messages.outbound} />}{reviewHref ? <TrackedReviewLink href={productHref(presentation, reviewHref)} sourceSurface="casinos">{demo ? messages.common.viewDemonstration : messages.common.readReview}</TrackedReviewLink> : null}<ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} messages={messages.comparison} /></div>
  </>;
}

export function CasinoDiscoveryCardMarkup({ casino, position, classNames, messages = productPageMessages("en-GB"), presentation = resolvePresentationContext({}) }: { casino: PublicCasinoCardDto; position: number; classNames: CasinoCardClassNames; messages?: ProductPageMessages; presentation?: PresentationResolution }) {
  return <article className={classNames.casinoCard}><ReviewCardContents casino={casino} classNames={classNames} messages={messages} position={position} presentation={presentation} /></article>;
}

export function DirectoryFeaturedTheatreMarkup({ casino, classNames, messages = productPageMessages("en-GB"), presentation = resolvePresentationContext({}) }: { casino: PublicCasinoCardDto | undefined; classNames: CasinoCardClassNames; messages?: ProductPageMessages; presentation?: PresentationResolution }) {
  if (!casino) return <div className={classNames.featurePlaceholder}><span>{messages.casinos.directoryTitle}</span><strong>{formatProductMessage(messages.casinos.noPublishedTitle, { market: presentation.marketDisplayName })}</strong><p>{formatProductMessage(messages.casinos.noMatchesCopy, { market: presentation.marketDisplayName })}</p></div>;
  const formattedRating = casino.rating === null ? messages.common.notListed : `${formatProfileScore(casino.rating, presentation.locale)} / 10`;
  const visitAvailability = hasGovernedVisitAction(casino) ? messages.common.actionAvailable : messages.common.reviewOnly;
  return <section aria-label={messages.casinos.directoryTitle} className={classNames.featureTheatre}>
    <Image alt="" aria-hidden="true" className={classNames.featureMedia} fill priority sizes="(max-width: 760px) 1px, (max-width: 1280px) 100vw, 1280px" src={DIRECTORY_EDITORIAL_MEDIA} />
    <div aria-hidden="true" className={classNames.featureOverlay} />
    <div className={classNames.featureCopy}><span className={classNames.featureEyebrow}>{casino.dataClassification !== "PUBLISHED_RECORD" ? messages.common.demoData : messages.common.published} · 18+</span><h2>{messages.casinos.heroLead}<br /><em>{messages.casinos.heroEmphasis}</em></h2><p>{formatProductMessage(messages.casinos.heroCopy, { market: presentation.marketDisplayName })}</p><div className={classNames.featureMetrics}><span><b>{formattedRating}</b> {messages.common.editorScore}</span><span><b>{messages.common.sourceStatus}</b></span><span><b>{visitAvailability}</b></span></div></div>
    <article className={classNames.featureCard}><ReviewCardContents casino={casino} classNames={classNames} messages={messages} presentation={presentation} /></article>
  </section>;
}
