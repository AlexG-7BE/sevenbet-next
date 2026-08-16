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

  return <section className={styles.section} aria-labelledby="curated-title">
    <div className={styles.shell}>
      <div className={styles.tabs} aria-label="Casino use-case selectors" role="tablist">
        {selectors.map((label) => <button aria-selected={selector === label} key={label} onClick={() => setSelector(label)} role="tab" type="button">{label}</button>)}
      </div>
      <p className={styles.context} id="curated-title"><strong>{selector}</strong><span>Top 3 for “{selector}” — three equal picks, ranked by results in this use-case.</span></p>
      {!top.length ? <div className={styles.empty} role="status"><strong>No verified matches currently</strong><p>{selector === "Best Bonuses" ? "The casino directory does not expose enough authoritative offer-ranking evidence to name a best bonus here." : selector === "Crypto" || selector === "Mobile" ? `No current casino record has verified ${selector.toLowerCase()} support.` : "No eligible current casino records are available for this selector."}</p></div> : <div className={styles.cards}>
        {top.map((casino, index) => <article className={styles.card} key={casino.id}>
          <div className={styles.cardHead}>
            <span className={styles.mark} aria-hidden="true">{casino.name.slice(0, 1)}</span>
            <div className={styles.identity}><h2>{casino.name}</h2><small>{casino.shortDescription || "Independent review"}</small></div>
            <b className={styles.number}>{String(index + 1).padStart(2, "0")}</b>
          </div>
          <div className={styles.score}><small>Editor score</small><strong>{casino.rating?.toFixed(1) ?? "—"}</strong><span aria-hidden="true">★★★★★</span></div>
          <div className={styles.offer}><small>Current offer</small><strong>{casino.featuredBonus?.title ?? "No active public bonus"}</strong></div>
          <dl className={styles.terms}>
            <div><dt>Payout</dt><dd>{casino.featuredBonus?.keyTerms[0] ?? "See review"}</dd></div>
            <div><dt>Wagering</dt><dd>{casino.featuredBonus?.wageringRequirement === null || casino.featuredBonus?.wageringRequirement === undefined ? "Not listed" : `${casino.featuredBonus.wageringRequirement}x`}</dd></div>
            <div><dt>Min deposit</dt><dd>{casino.featuredBonus?.minimumDeposit === null || casino.featuredBonus?.minimumDeposit === undefined ? "Not listed" : `${casino.featuredBonus.currency || "GBP"} ${casino.featuredBonus.minimumDeposit}`}</dd></div>
          </dl>
          <p className={styles.reason}>{casino.shortDescription || "Read the evidence, material terms and availability before deciding."}</p>
          <div className={styles.actions}><Visit casino={casino} /><Link href={`/casino/${casino.slug}`}>Review</Link><ContextualCompareToggle casinoName={casino.name} casinoSlug={casino.slug} /></div>
        </article>)}
      </div>}
      {top.length ? <div className={styles.why}><strong>Why these three?</strong><span>Same real-money test cycle for every casino</span><span>Ranked by results in this use-case, not headline size</span><Link href="/methodology">Methodology →</Link></div> : null}
    </div>
  </section>;
}
