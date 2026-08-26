"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ContextualCompareToggle } from "@/components/comparison-context/ContextualCompareToggle";
import {
  curatedCasinoSelectors as selectors,
  selectCuratedCasinos,
  type CuratedCasinoSelector as Selector,
} from "@/lib/public-casino-discovery/curated-selector";
import { classifyMediaRatio, isFeaturedCardMediaCompatible, mayPresentPromotionalMedia } from "@/lib/media/media-presentation";
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

import styles from "./CuratedCasinoShortlist.module.css";

function Visit({ casino }: { casino: PublicCasinoCardDto }) {
  if (casino.dataClassification === "DEMO_FIXTURE" || !casino.visitAction.available || !casino.visitAction.redirectSlug) return <span className={styles.reviewOnly}>Review only</span>;
  return <CasinoOutboundAction action={{ href: `/r/${casino.visitAction.redirectSlug}`, label: `Visit ${casino.name}` }} className={styles.visit} />;
}

function minimumDeposit(casino: PublicCasinoCardDto) {
  const offer = casino.featuredBonus;
  if (offer?.minimumDeposit === null || offer?.minimumDeposit === undefined) return "Not listed";
  const currency = offer.currency === "EUR" ? "€" : offer.currency === "GBP" ? "£" : `${offer.currency || "GBP"} `;
  return `${currency}${offer.minimumDeposit}`;
}

function wagering(casino: PublicCasinoCardDto) {
  const value = casino.featuredBonus?.wageringRequirement;
  return value === null || value === undefined ? "Not listed" : `${value}x`;
}

function RecommendationMedia({ casino }: { casino: PublicCasinoCardDto }) {
  const ratio = classifyMediaRatio({ width: casino.hero?.width, height: casino.hero?.height });
  const demonstration = casino.dataClassification !== "PUBLISHED_RECORD";
  const mediaAllowed = mayPresentPromotionalMedia({ demonstration, governedActionAvailable: casino.visitAction.available });
  if (casino.hero && mediaAllowed && isFeaturedCardMediaCompatible(ratio)) {
    return <div aria-label={`${casino.name} media`} className={styles.mediaFrame} data-media-ratio={ratio}>
      <img
        alt={casino.hero.alt || `${casino.name} campaign media`}
        height={casino.hero.height ?? 900}
        loading="lazy"
        src={casino.hero.url}
        width={casino.hero.width ?? 1600}
      />
    </div>;
  }
  return <div className={styles.mediaFallback} data-media-ratio={casino.hero ? ratio : "missing"} role="img" aria-label={`No suitable operator campaign media available for ${casino.name}`}>
    <span>B4GAMBLE / MEDIA</span>
    <strong>Suitable creative unavailable.</strong>
    <p>The editorial recommendation continues without cropped, invented or commercially unavailable artwork.</p>
    <i aria-hidden="true" />
  </div>;
}

export function CuratedCasinoShortlist({ casinos }: { casinos: PublicCasinoCardDto[] }) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const top = useMemo(() => selectCuratedCasinos(casinos, selector), [casinos, selector]);

  return <section className={styles.section} aria-labelledby="curated-title" data-motion-reveal data-nav-theme="light">
    <div className={styles.shell}>
      <div className={styles.tabs} aria-label="Casino use-case selectors" role="tablist">
        {selectors.map((label) => <button aria-selected={selector === label} key={label} onClick={() => setSelector(label)} role="tab" type="button">{label}</button>)}
      </div>
      <p className={styles.context} id="curated-title"><strong>{selector}</strong><span>Top 3 for “{selector}” — three equal picks, ranked by results in this use-case.</span></p>
      {!top.length ? <div className={styles.empty} role="status"><strong>No eligible matches available</strong><p>{selector === "Best Bonuses" ? "The casino directory does not expose enough authoritative offer-ranking evidence to name a best bonus here." : selector === "Crypto" || selector === "Mobile" ? `No published casino record has sufficient evidence of ${selector.toLowerCase()} support.` : "No eligible published casino records are available for this selector."}</p></div> : <div className={styles.cards}>
        {top.map((casino, index) => {
          const fixture = casino.dataClassification !== "PUBLISHED_RECORD";
          const previewAction = casino.dataClassification === "LOCAL_PREVIEW_FIXTURE";
          const strengths = casino.highlights.slice(0, 3);
          return <article className={styles.card} key={casino.id}>
            <div className={styles.cardBody}>
              <div className={styles.recommendationContext}><span>{selector}</span><b>Recommendation {String(index + 1).padStart(2, "0")} / {String(top.length).padStart(2, "0")}</b></div>
              {fixture ? <p className={styles.demoLabel}><strong>{previewAction ? "LOCAL PREVIEW STATE" : "DEMONSTRATION DATA"}</strong> · Fictional operator and offer fields. {previewAction ? "The CTA is simulated and has no external tracking destination." : "No live promotion or commercial visit."}</p> : null}
              <div className={styles.cardHead}>
                <div className={styles.mark}>{casino.logo ? <img alt={casino.logo.alt || `${casino.name} logo`} height={casino.logo.height ?? 120} src={casino.logo.url} width={casino.logo.width ?? 240} /> : <span aria-hidden="true">{casino.name.slice(0, 1)}</span>}</div>
                <div className={styles.identity}><small>Operator</small><h2>{casino.name}</h2></div>
                <div className={styles.score} aria-label={`Editor score ${casino.rating?.toFixed(1) ?? "not listed"} out of 10`}><small>Editor Score</small><strong>{casino.rating?.toFixed(1) ?? "—"}<span>/10</span></strong></div>
              </div>
              <p className={styles.bestFor}><span>Best for</span><strong>{selector}</strong></p>
              <p className={styles.reason}>{casino.shortDescription || "Read the evidence, material terms and availability before deciding."}</p>
              {strengths.length ? <ul className={styles.strengths}>{strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul> : null}
              <div className={styles.offer}>
                <small>{fixture ? "Fictional offer field" : casino.featuredBonus ? "Current published offer" : "Offer state"}</small>
                <strong>{casino.featuredBonus?.title ?? "No active public bonus"}</strong>
                {casino.featuredBonus ? <dl className={styles.terms}>
                  <div><dt>Wagering</dt><dd>{wagering(casino)}</dd></div>
                  <div><dt>Min deposit</dt><dd>{minimumDeposit(casino)}</dd></div>
                  <div><dt>Key term</dt><dd>{casino.featuredBonus.keyTerms[0] ?? "See review"}</dd></div>
                </dl> : <p>The recommendation remains readable without an offer.</p>}
              </div>
              <div className={styles.actions}><Visit casino={casino} /><Link href={`/casino/${casino.slug}`}>{fixture ? "View demonstration" : "Read review"}</Link>{!fixture ? <ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} /> : null}</div>
              <p className={styles.disclosure}>{previewAction ? "Preview-only UI proof. Redirect-time authority still fails closed; no gambling or affiliate destination exists." : fixture ? "No gambling or affiliate destination is available." : "Any active affiliate action is labelled and may earn B4GAMBLE commission. Compensation does not determine Editor Score or natural ranking."}</p>
            </div>
            <RecommendationMedia casino={casino} />
          </article>;
        })}
      </div>}
      {top.length ? <div className={styles.why}><strong>Why these three?</strong><span>Current evidence and limitations remain visible</span><span>Ranked under this use-case, not by headline size</span><Link href="/methodology">Methodology →</Link></div> : null}
    </div>
  </section>;
}
