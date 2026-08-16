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
import type { PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

import styles from "./CuratedCasinoShortlist.module.css";

function Visit({ casino }: { casino: PublicCasinoCardDto }) {
  if (casino.dataClassification === "DEMO_FIXTURE" || !casino.visitAction.available || !casino.visitAction.redirectSlug) return <span className={styles.reviewOnly}>Review only</span>;
  return <CasinoOutboundAction action={{ href: `/r/${casino.visitAction.redirectSlug}`, label: `Visit ${casino.name}` }} className={styles.visit} />;
}

export function CuratedCasinoShortlist({ casinos }: { casinos: PublicCasinoCardDto[] }) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const top = useMemo(() => selectCuratedCasinos(casinos, selector), [casinos, selector]);
  const featured = top[0] ?? null;

  return <section className={styles.section} aria-labelledby="curated-title">
    <div className={styles.shell}>
      <div className={styles.tabs} aria-label="Casino use-case selectors" role="tablist">
        {selectors.map((label) => <button aria-selected={selector === label} key={label} onClick={() => setSelector(label)} role="tab" type="button">{label}</button>)}
      </div>
      <p className={styles.context} id="curated-title"><strong>{selector}</strong><span>Three casinos maximum. Ranked from current editorial evidence for this use-case.</span></p>
      {!featured ? <div className={styles.empty} role="status"><strong>No verified matches currently</strong><p>{selector === "Best Bonuses" ? "The casino directory does not expose enough authoritative offer-ranking evidence to name a best bonus here." : selector === "Crypto" || selector === "Mobile" ? `No current casino record has verified ${selector.toLowerCase()} support.` : "No eligible current casino records are available for this selector."}</p></div> : <>
      <article className={styles.featured}>
        <div className={styles.number}>01</div>
        <div className={styles.identity}><span aria-hidden="true">{featured.name.slice(0, 1)}</span><div><small>{selector}</small><h2>{featured.name}</h2><b>{featured.rating?.toFixed(1) ?? "—"} / 10</b></div></div>
        <p>{featured.shortDescription}</p>
        {featured.featuredBonus ? <div className={styles.offer}><small>Current offer</small><strong>{featured.featuredBonus.title}</strong><span>{featured.featuredBonus.keyTerms.slice(0, 3).join(" · ")}</span></div> : null}
        <div className={styles.actions}><Visit casino={featured} /><Link href={`/casino/${featured.slug}`}>Read Review</Link><ContextualCompareToggle casinoName={featured.name} casinoSlug={featured.slug} /></div>
      </article>
      <div className={styles.alternatives}>{top.slice(1).map((casino, index) => <article key={casino.id}>
        <div className={styles.altHead}><span>0{index + 2}</span><div><h3>{casino.name}</h3><b>{casino.rating?.toFixed(1) ?? "—"} / 10</b></div></div>
        <p>{casino.shortDescription}</p>
        {casino.featuredBonus ? <strong className={styles.altOffer}>{casino.featuredBonus.title}</strong> : null}
        <div className={styles.actions}><Visit casino={casino} /><Link href={`/casino/${casino.slug}`}>Read Review</Link><ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} /></div>
      </article>)}</div></>}
    </div>
  </section>;
}
