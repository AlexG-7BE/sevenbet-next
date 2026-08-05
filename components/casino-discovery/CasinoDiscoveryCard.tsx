import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import type { PublicCasinoCardDto, PublicLabelDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { visitActionUnavailableCopy } from "@/lib/public-casino-discovery/visit-action-presentation";

export type CasinoCardClassNames = Record<
  "casinoCard" | "cardHeader" | "position" | "logo" | "score" | "description" | "cardFacts" | "tags" | "highlights" | "offerBlock" | "commission" | "unavailable" | "cardActions" | "featurePlaceholder" | "featureCard" | "featureTop",
  string
>;

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Tags({ children, classNames }: { children: ReactNode; classNames: CasinoCardClassNames }) {
  return <div className={classNames.tags}>{children}</div>;
}

function FactGroup({ label, values, classNames }: { label: string; values: PublicLabelDto[]; classNames: CasinoCardClassNames }) {
  if (!values.length) return null;
  return <div><span>{label}</span><Tags classNames={classNames}>{values.slice(0, 3).map((item) => <b key={item.key}>{item.label}</b>)}</Tags></div>;
}

export function CasinoDiscoveryCardMarkup({ casino, position, classNames }: { casino: PublicCasinoCardDto; position: number; classNames: CasinoCardClassNames }) {
  const canVisit = casino.visitAction.available && casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug);
  const unavailable = visitActionUnavailableCopy(casino.visitAction);
  const freshness = formatDate(casino.editorialUpdatedAt ?? casino.publishedAt);
  const hasFacts = Boolean(casino.licenses.length || casino.countries.length || casino.paymentMethods.length);
  return <article className={classNames.casinoCard}>
    <div className={classNames.cardHeader}>
      <span aria-label={`Directory result position ${position}`} className={classNames.position}>{String(position).padStart(2, "0")}</span>
      <div className={classNames.logo}>{casino.logo ? <img alt={casino.logo.alt} height={casino.logo.height ?? 72} loading="lazy" src={casino.logo.url} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 2).toUpperCase()}</span>}</div>
      <div><p>Published review</p><h2><Link href={`/casino/${casino.slug}`}>{casino.name}</Link></h2>{freshness && <small>Editorial check {freshness}</small>}</div>
      {casino.rating !== null && <div aria-label={`Editorial score ${casino.rating.toFixed(1)} out of 10`} className={classNames.score}><strong>{casino.rating.toFixed(1)}</strong><span>/10</span></div>}
    </div>
    {casino.shortDescription && <p className={classNames.description}>{casino.shortDescription}</p>}
    {hasFacts && <div className={classNames.cardFacts}>
      <FactGroup classNames={classNames} label="Licence" values={casino.licenses} />
      <FactGroup classNames={classNames} label="Published markets" values={casino.countries} />
      <FactGroup classNames={classNames} label="Payments" values={casino.paymentMethods} />
    </div>}
    {casino.highlights.length > 0 && <ul className={classNames.highlights}>{casino.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>}
    <div className={classNames.offerBlock}>
      {casino.featuredBonus ? <><span>Published bonus terms</span><strong>{casino.featuredBonus.title}</strong>{casino.featuredBonus.summary && <p>{casino.featuredBonus.summary}</p>}<Tags classNames={classNames}>{casino.featuredBonus.keyTerms.slice(0, 3).map((term) => <b key={term}>{term}</b>)}</Tags><small>18+ · Terms apply</small></> : <><span>Bonus status</span><p>No active public bonus is attached to this review.</p></>}
    </div>
    <p className={classNames.commission}>SevenBet may receive a commission if you use an eligible governed visit link. The editorial score is displayed separately from visit availability.</p>
    {unavailable && <p className={classNames.unavailable} role="note">{unavailable} The published review remains available.</p>}
    <div className={classNames.cardActions}><Link href={`/casino/${casino.slug}`}>Read review</Link>{canVisit && <a href={`/r/${casino.visitAction.redirectSlug}`} rel="nofollow sponsored noopener" target="_blank">{casino.visitAction.label}</a>}</div>
  </article>;
}

export function DirectoryReviewPreviewMarkup({ casino, classNames }: { casino: PublicCasinoCardDto | undefined; classNames: CasinoCardClassNames }) {
  if (!casino) return <div className={classNames.featurePlaceholder}><span>Published directory</span><strong>Reviews appear only after editorial publication.</strong><p>No placeholder casino or promotional claim is substituted.</p></div>;
  return <article className={classNames.featureCard}>
    <div className={classNames.featureTop}><span>Published review preview</span>{casino.rating !== null && <strong>{casino.rating.toFixed(1)}<small>/10</small></strong>}</div>
    <h2>{casino.name}</h2><p>{casino.shortDescription ?? "Open the full review for published evidence, terms and responsible gambling information."}</p>
    <Tags classNames={classNames}>{casino.licenses.slice(0, 2).map((item) => <b key={item.key}>{item.label}</b>)}{casino.categories.slice(0, 2).map((item) => <b key={item.key}>{item.label}</b>)}</Tags>
    <Link href={`/casino/${casino.slug}`}>Read the review <span aria-hidden="true">→</span></Link>
  </article>;
}
