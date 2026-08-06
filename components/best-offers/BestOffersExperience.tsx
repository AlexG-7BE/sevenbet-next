"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import {
  criterionExplanations,
  offerWithdrawalBucket,
  shortlistReason,
  type BestFitCriterion,
} from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import styles from "./BestOffers.module.css";

const criterionLabels: Record<BestFitCriterion, string> = {
  overall: "Best overall balance",
  wagering: "Lower wagering",
  payout: "Faster payout signal",
};

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function payoutSignal(offer: PublicOfferDTO) {
  return offer.casino.payments.find((item) => item.supportsWithdrawals && item.withdrawalTime)?.withdrawalTime ?? "Not published";
}

function OfferAction({ offer }: { offer: PublicOfferDTO }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  if (!offer.action.available || !offer.action.href) {
    return <span aria-disabled="true" className={styles.unavailableAction}>Demo action unavailable</span>;
  }

  function close() {
    dialogRef.current?.close();
  }

  return <>
    <button className={styles.primaryAction} onClick={() => {
      dialogRef.current?.showModal();
      requestAnimationFrame(() => stayRef.current?.focus());
    }} ref={triggerRef} type="button">Review demo handoff <span aria-hidden="true">→</span></button>
    <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className={styles.outboundDialog} onClose={() => triggerRef.current?.focus()} ref={dialogRef}>
      <div className={styles.outboundSheet}>
        <p className={styles.kicker}>Governed action · affiliate disclosure</p>
        <h2 id={titleId}>Before you continue.</h2>
        <p id={descriptionId}>This fictional demonstration uses an internal SevenBet route. Eligibility and action availability are checked again. Rankings cannot be purchased and no raw destination URL is exposed.</p>
        <div className={styles.destination}><span>DEMO DESTINATION CONTEXT</span><strong>{offer.casino.name}</strong><small>18+ · Synthetic terms · No real operator account or offer</small></div>
        <Link className={styles.primaryAction} href={offer.action.href} rel="nofollow sponsored">Continue to governed route <span aria-hidden="true">→</span></Link>
        <button className={styles.secondaryAction} onClick={close} ref={stayRef} type="button">Keep comparing</button>
      </div>
    </dialog>
  </>;
}

function OfferCard({ offer, rank, reason }: { offer: PublicOfferDTO; rank?: number; reason: string }) {
  const licence = offer.casino.licenses[0];
  return <article className={styles.offerCard}>
    <div className={styles.cardTop}><span>{rank ? `0${rank}`.slice(-2) : "SELECTED"}</span><span>{offer.commercialAvailability === "AVAILABLE" ? "Controlled demo route" : "Editorial review only"}</span></div>
    <div className={styles.identity}>
      {offer.casino.logo ? <Image alt={offer.casino.logo.alt} height={72} src={offer.casino.logo.url} width={144} /> : <span aria-hidden="true">{offer.casino.name.slice(0, 2)}</span>}
      <div><p>{offer.bonus.type.replaceAll("_", " ")}</p><h3>{offer.casino.name}</h3></div>
    </div>
    <div className={styles.headlineOffer}><span>Illustrative published snapshot</span><strong>{offer.bonus.title}</strong><p>{offer.bonus.summary}</p></div>
    <dl className={styles.termGrid}>
      <div><dt>Minimum deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div>
      <div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}×`}</dd></div>
      <div><dt>Maximum bonus</dt><dd>{money(offer.bonus.maximumBonus, offer.bonus.currency)}</dd></div>
      <div><dt>Withdrawal signal</dt><dd>{payoutSignal(offer)}</dd></div>
    </dl>
    <div className={styles.eligibility}><strong>Eligibility</strong><p>{offer.bonus.eligibility || "Not published"}</p><strong>Important conditions</strong><p>{offer.bonus.importantConditions.join(" · ")}</p></div>
    <div className={styles.evidence}><span>EDITOR SCORE <b>{offer.casino.editorScore.toFixed(1)}/10</b></span><span>LICENCE CONTEXT <b>{licence?.authority || "Not published"}</b></span><span>CONTROL TOOLS <b>{offer.casino.responsibleGamblingTools.length || "Not published"}</b></span></div>
    <p className={styles.reason}><strong>Why it made the shortlist</strong>{reason}</p>
    <p className={styles.affiliateNote}>SevenBet may receive compensation from eligible governed links. Editorial order does not depend on commission.</p>
    <div className={styles.actions}><Link className={styles.secondaryAction} href={`/casino/${offer.casino.slug}`}>Read full review</Link><OfferAction offer={offer} /></div>
  </article>;
}

export function BestOffersExperience({ shortlist, winners }: {
  shortlist: PublicOfferDTO[];
  winners: Record<BestFitCriterion, PublicOfferDTO | null>;
}) {
  const slides = shortlist.slice(0, 3);
  const [activeSlide, setActiveSlide] = useState(0);
  const [criterion, setCriterion] = useState<BestFitCriterion>("overall");
  const pointerStart = useRef<number | null>(null);
  const winner = winners[criterion];
  const move = (next: number) => setActiveSlide((next + slides.length) % slides.length);

  return <>
    <section className={styles.shortlistSection} aria-labelledby="shortlist-title">
      <div className={styles.shell}>
        <div className={styles.sectionHead}><div><p className={styles.kicker}>Database shortlist · GB available</p><h2 id="shortlist-title">One headline. The full decision.</h2></div><p>Every selected record has complete material terms in its latest published snapshot. The first three are shown as a focused product carousel; all twelve remain listed below.</p></div>
        <div aria-label="Top three eligible offers" aria-roledescription="carousel" className={styles.carousel} onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(activeSlide - 1);
          if (event.key === "ArrowRight") move(activeSlide + 1);
          if (event.key === "Home") setActiveSlide(0);
          if (event.key === "End") setActiveSlide(slides.length - 1);
        }} onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const distance = event.clientX - pointerStart.current;
          if (Math.abs(distance) > 48) move(activeSlide + (distance < 0 ? 1 : -1));
          pointerStart.current = null;
        }} role="region" tabIndex={0}>
          <div className={styles.carouselStage} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {slides.map((offer, index) => <div aria-hidden={index !== activeSlide} className={styles.slide} inert={index !== activeSlide} key={`${offer.casino.id}:${offer.bonus.id}`}><OfferCard offer={offer} rank={index + 1} reason={shortlistReason(offer)} /></div>)}
          </div>
          <div className={styles.carouselControls}><button aria-label="Previous offer" onClick={() => move(activeSlide - 1)} type="button">←</button><p aria-live="polite">{String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</p><button aria-label="Next offer" onClick={() => move(activeSlide + 1)} type="button">→</button></div>
          <div aria-label="Choose an offer slide" className={styles.dots}>{slides.map((offer, index) => <button aria-current={index === activeSlide ? "true" : undefined} aria-label={`Show offer ${index + 1}: ${offer.casino.name}`} key={offer.casino.id} onClick={() => setActiveSlide(index)} type="button" />)}</div>
        </div>
        <div className={styles.metrics}><div><strong>{shortlist.length}</strong><span>complete eligible records</span></div><div><strong>GB</strong><span>declared comparison context</span></div><div><strong>0</strong><span>commission inputs in ranking</span></div></div>
        <ol className={styles.rankLedger}>{shortlist.map((offer, index) => <li key={`${offer.casino.id}:${offer.bonus.id}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{offer.casino.name}</strong><small>{offer.bonus.wageringMultiplier}× wagering · {payoutSignal(offer)}</small><Link href={`/casino/${offer.casino.slug}`}>Review</Link></li>)}</ol>
      </div>
    </section>

    <section className={styles.methodSection}><div className={styles.shell}><div className={styles.methodGrid}><div><p className={styles.kicker}>Published ranking method</p><h2>Every offer earns its place.</h2><p>Eligibility and complete terms are gates. Order then considers editorial score, featured and recommended flags, lower wagering, lower minimum deposit, payout evidence and stable slug tie-breakers.</p></div><ol><li><span>01</span><strong>Market and publication first</strong><p>Only active, current, GB-available offers from latest published non-archived snapshots.</p></li><li><span>02</span><strong>Comparable terms</strong><p>Minimum deposit, non-null wagering, eligibility and important conditions are all required.</p></li><li><span>03</span><strong>Editorial, not commercial</strong><p>Editor score and published signals determine order. Affiliate economics are not ranking inputs.</p></li></ol></div><aside className={styles.commercialBoundary}><strong>Commercial boundary</strong><p>An available action never raises an offer. An unavailable action never removes its editorial evidence. Programme, Help, pause and vulnerability data are not used.</p></aside></div></section>

    <section className={styles.fitSection}><div className={styles.shell}><div className={styles.sectionHead}><div><p className={styles.kicker}>Three questions · three selectors</p><h2>Find your best fit.</h2></div><p>“Best” changes with the question. Choose one criterion to see the database-selected winner and the exact published signal behind it.</p></div>
      <div aria-label="Best fit criterion" className={styles.tabs} role="tablist">{(Object.keys(criterionLabels) as BestFitCriterion[]).map((key) => <button aria-controls={`best-fit-${key}`} aria-selected={criterion === key} id={`best-fit-tab-${key}`} key={key} onClick={() => setCriterion(key)} role="tab" type="button">{criterionLabels[key]}</button>)}</div>
      {winner ? <div aria-labelledby={`best-fit-tab-${criterion}`} id={`best-fit-${criterion}`} role="tabpanel"><div className={styles.winnerIntro}><span>{criterionLabels[criterion]}</span><p>{criterionExplanations[criterion]}</p>{criterion === "payout" ? <small>Normalized bucket: {offerWithdrawalBucket(winner).replaceAll("-", " ")}</small> : null}</div><OfferCard offer={winner} reason={criterionExplanations[criterion]} /></div> : <div className={styles.statePanel} role="status"><h3>No winner is available.</h3><p>The current eligible shortlist has no published value for this criterion.</p></div>}
    </div></section>
  </>;
}
