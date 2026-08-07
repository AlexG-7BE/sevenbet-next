import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { visitActionUnavailableCopy } from "@/lib/public-casino-discovery/visit-action-presentation";

const DIRECTORY_EDITORIAL_MEDIA = "/casino-directory/editorial-media.jpg";

export type CasinoCardClassNames = Record<
  | "casinoCard" | "cardHeader" | "position" | "logo" | "identity" | "score"
  | "description" | "signals" | "signal" | "offerBlock" | "commission"
  | "unavailable" | "cardActions" | "featurePlaceholder" | "featureTheatre"
  | "featureMedia" | "featureOverlay" | "featureCopy" | "featureMetrics"
  | "featureCard" | "featureEyebrow",
  string
>;

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Signal({ children, classNames }: { children: ReactNode; classNames: CasinoCardClassNames }) {
  return <span className={classNames.signal}><i aria-hidden="true" />{children}</span>;
}

function ReviewCardContents({ casino, position, classNames }: { casino: PublicCasinoCardDto; position?: number; classNames: CasinoCardClassNames }) {
  const canVisit = casino.visitAction.available && casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug);
  const unavailable = visitActionUnavailableCopy(casino.visitAction);
  const freshness = formatDate(casino.editorialUpdatedAt ?? casino.publishedAt);
  const signals = [
    casino.licenses[0]?.label,
    casino.paymentMethods.length ? casino.paymentMethods.slice(0, 2).map((item) => item.label).join(" + ") : null,
    casino.responsibleGamblingLabel,
  ].filter((value): value is string => Boolean(value));

  return <>
    {position !== undefined && <span aria-label={`Directory result position ${position}`} className={classNames.position}>{String(position).padStart(2, "0")}</span>}
    <div className={classNames.cardHeader}>
      <div className={classNames.logo}>{casino.logo ? <img alt={casino.logo.alt} height={casino.logo.height ?? 72} loading="lazy" src={casino.logo.url} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}</div>
      <div className={classNames.identity}><h2><Link href={`/casino/${casino.slug}`}>{casino.name}</Link></h2>{freshness && <small>Reviewed {freshness}</small>}</div>
      {casino.rating !== null && <div aria-label={`Editorial score ${casino.rating.toFixed(1)} out of 10`} className={classNames.score}><strong>{casino.rating.toFixed(1)}</strong><span>/10</span></div>}
    </div>
    {casino.shortDescription && <p className={classNames.description}>{casino.shortDescription}</p>}
    {signals.length > 0 && <div className={classNames.signals}>{signals.map((signal) => <Signal classNames={classNames} key={signal}>{signal}</Signal>)}</div>}
    <div className={classNames.offerBlock}>
      {casino.featuredBonus ? <><span>Published bonus terms · 18+</span><strong>{casino.featuredBonus.title}</strong>{casino.featuredBonus.summary && <p>{casino.featuredBonus.summary}</p>}{casino.featuredBonus.keyTerms.length > 0 && <small>{casino.featuredBonus.keyTerms.slice(0, 3).join(" · ")} · Terms apply</small>}</> : <><span>Bonus unavailable</span><strong>No active public bonus</strong><p>The review remains available without a commercial bonus.</p></>}
    </div>
    <p className={classNames.commission}>Review access is editorial. A visit action is conditional and may compensate SevenBet.</p>
    {unavailable && <p className={classNames.unavailable} role="note">{unavailable} The published review remains available.</p>}
    <div className={classNames.cardActions}><Link href={`/casino/${casino.slug}`}>Read review</Link>{canVisit && <CasinoOutboundAction action={{ href: `/r/${casino.visitAction.redirectSlug}`, label: casino.visitAction.label }} />}</div>
  </>;
}

export function CasinoDiscoveryCardMarkup({ casino, position, classNames }: { casino: PublicCasinoCardDto; position: number; classNames: CasinoCardClassNames }) {
  return <article className={classNames.casinoCard}><ReviewCardContents casino={casino} classNames={classNames} position={position} /></article>;
}

export function DirectoryFeaturedTheatreMarkup({ casino, classNames }: { casino: PublicCasinoCardDto | undefined; classNames: CasinoCardClassNames }) {
  if (!casino) return <div className={classNames.featurePlaceholder}><span>Published directory</span><strong>Reviews appear only after editorial publication.</strong><p>No placeholder casino or promotional claim is substituted.</p></div>;
  return <section aria-label="Published review preview" className={classNames.featureTheatre}>
    <img alt="" aria-hidden="true" className={classNames.featureMedia} height={720} src={DIRECTORY_EDITORIAL_MEDIA} width={1280} />
    <div aria-hidden="true" className={classNames.featureOverlay} />
    <div className={classNames.featureCopy}><span className={classNames.featureEyebrow}>Published casino review · 18+</span><h2>Know the operator<br /><em>before the offer.</em></h2><p>Licence, payments, controls and material bonus terms—read in one calm snapshot.</p><div className={classNames.featureMetrics}><span><b>10-point</b> Editor Score</span><span><b>Published</b> evidence</span><span><b>Review</b> before visit</span></div></div>
    <article className={classNames.featureCard}><ReviewCardContents casino={casino} classNames={classNames} /></article>
  </section>;
}
