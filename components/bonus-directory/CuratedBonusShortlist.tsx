"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
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

export function CuratedBonusShortlist({ offers }: { offers: PublicOfferDTO[] }) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const top = useMemo(() => selectCuratedBonuses(offers, selector), [offers, selector]);
  return <section className={styles.section} aria-labelledby="bonus-shortlist-title"><div className={styles.shell}>
    <div className={styles.tabs} aria-label="Bonus selectors" role="tablist">{selectors.map((label) => <button aria-selected={selector === label} key={label} onClick={() => setSelector(label)} role="tab" type="button">{label}</button>)}</div>
    <p className={styles.label} id="bonus-shortlist-title">Top three · {selector}</p>
    {!top.length ? <div className={styles.empty} role="status"><strong>No verified matches currently</strong><p>No current offer record has authoritative evidence for this selector.</p></div> : <div className={styles.cards}>{top.map((offer, index) => <article className={index === 0 ? styles.primary : styles.card} key={`${offer.casino.id}:${offer.bonus.id}`}>
      <span className={styles.rank}>0{index + 1}</span><small>{index === 0 ? selector : "Alternative"}</small>
      <h2>{offer.casino.name}</h2><strong className={styles.headline}>{offer.bonus.title}</strong>
      <dl><div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}x`}</dd></div><div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div><div><dt>Expiry</dt><dd>{offer.bonus.expiresAt ? new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"short", year:"numeric" }).format(new Date(offer.bonus.expiresAt)) : "Not listed"}</dd></div></dl>
      <p>{offer.bonus.importantConditions.slice(0, 2).join(" · ") || offer.bonus.summary}</p>
      {offer.dataClassification === "DEMO_FIXTURE" ? <b className={styles.demo}>DEMONSTRATION DATA · FICTIONAL RECORD</b> : null}
      <div className={styles.actions}><Action offer={offer} /><Link href={`/casino/${offer.casino.slug}`}>Read Review</Link></div>
    </article>)}</div>}
  </div></section>;
}
