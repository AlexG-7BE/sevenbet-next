import Link from "next/link";
import Image from "next/image";
import React from "react";
import type { ReactNode } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import { TrackedReviewLink } from "@/components/analytics/TrackedReviewLink";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { visitActionUnavailableCopy } from "@/lib/public-casino-discovery/visit-action-presentation";
import { formatProductMessage, productPageMessages, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { resolvePresentationContext } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

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

function ReviewCardContents({ casino, position, classNames, messages, presentation }: { casino: PublicCasinoCardDto; position?: number; classNames: CasinoCardClassNames; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const demo = casino.dataClassification !== "PUBLISHED_RECORD";
  const canVisit = casino.visitAction.available && casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug);
  const unavailable = visitActionUnavailableCopy(casino.visitAction);
  const freshness = formatDate(casino.editorialUpdatedAt ?? casino.publishedAt, presentation.locale);
  const signals = [
    casino.licenses[0]?.label,
    casino.paymentMethods.length ? casino.paymentMethods.slice(0, 2).map((item) => item.label).join(" + ") : null,
    casino.responsibleGamblingLabel,
  ].filter((value): value is string => Boolean(value));

  return <>
    {position !== undefined && <span aria-label={`${messages.common.result} ${position}`} className={classNames.position}>{String(position).padStart(2, "0")}</span>}
    <div className={classNames.cardHeader}>
      <div className={classNames.logo}>{casino.logo ? <img alt={casino.logo.alt} height={casino.logo.height ?? 72} loading="lazy" src={casino.logo.url} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}</div>
      <div className={classNames.identity}><h2><Link href={productHref(presentation, `/casino/${casino.slug}`)}>{casino.name}</Link></h2>{demo ? <small>{messages.common.demoData}</small> : casino.highlights.length ? <small>{casino.highlights.slice(0, 2).join(" · ")}</small> : freshness && <small>{messages.common.current} {freshness}</small>}</div>
      {casino.rating !== null && <div aria-label={`${messages.common.editorScore} ${casino.rating.toFixed(1)} / 10`} className={classNames.score}><strong>{casino.rating.toFixed(1)}</strong><span>/10</span></div>}
    </div>
    {casino.shortDescription && <p className={classNames.description}>{casino.shortDescription}</p>}
    {signals.length > 0 && <div className={classNames.signals}>{signals.map((signal) => <Signal classNames={classNames} key={signal}>{signal}</Signal>)}</div>}
    <div className={classNames.offerBlock}>
      {casino.featuredBonus ? <><span>{messages.common.current}</span><strong>{casino.featuredBonus.title}</strong>{casino.featuredBonus.summary && <p>{casino.featuredBonus.summary}</p>}{casino.featuredBonus.keyTerms.length > 0 && <small>{casino.featuredBonus.keyTerms.slice(0, 3).join(" · ")} · {demo ? messages.common.demoData : messages.common.published}</small>}</> : <><span>{messages.common.commercialUnavailable}</span><strong>{messages.common.reviewOnly}</strong><p>{messages.common.reviewAvailableNoAction}</p></>}
    </div>
    <p className={classNames.commission}>{demo ? messages.common.demoDisclosure : messages.bestOffers.commissionNote}</p>
    {unavailable && <p className={classNames.unavailable} role="note">{messages.common.reviewAvailableNoAction}</p>}
    <div className={classNames.cardActions}>{canVisit && <CasinoOutboundAction action={{ href: `/r/${casino.visitAction.redirectSlug}`, label: casino.visitAction.label }} messages={messages.outbound} />}<TrackedReviewLink href={productHref(presentation, `/casino/${casino.slug}`)} sourceSurface="casinos">{demo ? messages.common.viewDemonstration : messages.common.readReview}</TrackedReviewLink><ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} messages={messages.comparison} /></div>
  </>;
}

export function CasinoDiscoveryCardMarkup({ casino, position, classNames, messages = productPageMessages("en-GB"), presentation = resolvePresentationContext({}) }: { casino: PublicCasinoCardDto; position: number; classNames: CasinoCardClassNames; messages?: ProductPageMessages; presentation?: PresentationResolution }) {
  return <article className={classNames.casinoCard}><ReviewCardContents casino={casino} classNames={classNames} messages={messages} position={position} presentation={presentation} /></article>;
}

export function DirectoryFeaturedTheatreMarkup({ casino, classNames, messages = productPageMessages("en-GB"), presentation = resolvePresentationContext({}) }: { casino: PublicCasinoCardDto | undefined; classNames: CasinoCardClassNames; messages?: ProductPageMessages; presentation?: PresentationResolution }) {
  if (!casino) return <div className={classNames.featurePlaceholder}><span>{messages.casinos.directoryTitle}</span><strong>{formatProductMessage(messages.casinos.noPublishedTitle, { market: presentation.market.seoDisplayName })}</strong><p>{formatProductMessage(messages.casinos.noMatchesCopy, { market: presentation.market.seoDisplayName })}</p></div>;
  return <section aria-label={messages.casinos.directoryTitle} className={classNames.featureTheatre}>
    <Image alt="" aria-hidden="true" className={classNames.featureMedia} fill priority sizes="(max-width: 760px) 1px, (max-width: 1280px) 100vw, 1280px" src={DIRECTORY_EDITORIAL_MEDIA} />
    <div aria-hidden="true" className={classNames.featureOverlay} />
    <div className={classNames.featureCopy}><span className={classNames.featureEyebrow}>{casino.dataClassification === "DEMO_FIXTURE" ? messages.common.demoData : messages.common.published} · 18+</span><h2>{messages.casinos.heroLead}<br /><em>{messages.casinos.heroEmphasis}</em></h2><p>{formatProductMessage(messages.casinos.heroCopy, { market: presentation.market.seoDisplayName })}</p><div className={classNames.featureMetrics}><span><b>10</b> {messages.common.editorScore}</span><span><b>{messages.common.sourceStatus}</b></span><span><b>{messages.common.reviewOnly}</b></span></div></div>
    <article className={classNames.featureCard}><ReviewCardContents casino={casino} classNames={classNames} messages={messages} presentation={presentation} /></article>
  </section>;
}
