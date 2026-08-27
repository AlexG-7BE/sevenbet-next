"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialOfferMedia, OperatorLogo } from "@/components/commercial-media/CommercialOfferMedia";
import {
  curatedBonusSelectors as selectors,
  selectCuratedBonuses,
  type CuratedBonusSelector as Selector,
} from "@/lib/public-offer/curated-selector";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import styles from "./CuratedBonusShortlist.module.css";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value); }
  catch { return `${value} ${currency || ""}`.trim(); }
}

function Action({ offer }: { offer: PublicOfferDTO }) {
  const href = offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href) ? offer.action.href : null;
  if (!href) return <span className={styles.unavailable}>Review only</span>;
  return <CasinoOutboundAction action={{ href, label: "View Offer" }} className={styles.action} />;
}

function payout(offer: PublicOfferDTO) {
  return offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime)?.withdrawalTime || "Not listed";
}

export function CuratedBonusShortlist({ offers }: { offers: PublicOfferDTO[] }) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const top = useMemo(() => selectCuratedBonuses(offers, selector), [offers, selector]);
  return <section className={styles.section} aria-labelledby="bonus-shortlist-title" data-motion-reveal data-nav-theme="light"><div className={styles.shell}>
    <div className={styles.tabs} aria-label="Bonus selectors" role="tablist">{selectors.map((label) => <button aria-selected={selector === label} key={label} onClick={() => setSelector(label)} role="tab" type="button">{label}</button>)}</div>
    <p className={styles.label} id="bonus-shortlist-title">Top 3 for “{selector}” — ranked by realistic net value after terms.</p>
    {!top.length ? <div className={styles.empty} role="status"><strong>No eligible matches available</strong><p>No published offer record has sufficient authoritative evidence for this selector.</p></div> : <div className={styles.cards}>{top.map((offer, index) => <article className={index === 0 ? styles.primary : styles.card} key={`${offer.casino.id}:${offer.bonus.id}`}>
      <header><small>Welcome package</small><span className={styles.rank}>0{index + 1}</span></header>
      <strong className={styles.headline}>{offer.bonus.title}</strong>
      <div className={styles.identity}><OperatorLogo offer={offer} prominent={index === 0} /><div><h2>{offer.casino.name}</h2><small>Editor Score {offer.casino.editorScore.toFixed(1)} <span aria-hidden="true">★★★★★</span></small></div></div>
      <dl><div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Not listed" : `${offer.bonus.wageringMultiplier}x`}</dd></div><div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div><div><dt>Max bonus</dt><dd>{money(offer.bonus.maximumBonus, offer.bonus.currency)}</dd></div><div><dt>Payout</dt><dd>{payout(offer)}</dd></div></dl>
      <p>{offer.bonus.importantConditions.slice(0, 2).join(" · ") || offer.bonus.summary}</p>
      <CommercialOfferMedia offer={offer} variant="bonus" />
      {offer.dataClassification === "DEMO_FIXTURE" ? <b className={styles.demo}>DEMONSTRATION DATA — Fictional example for interface testing. Not a real casino, current offer or B4GAMBLE partner. No gambling or affiliate link is available.</b> : null}
      <div className={styles.actions}><Action offer={offer} /><Link href={`/casino/${offer.casino.slug}`}>Read Review</Link></div>
    </article>)}</div>}
    {top.length ? <aside className={styles.method}><strong>How we rank bonuses</strong><span>Net value after wagering, not headline size</span><span>Current evidence, terms and source status disclosed</span><Link href="/bonus-guide">Bonus guide →</Link></aside> : null}
  </div></section>;
}
