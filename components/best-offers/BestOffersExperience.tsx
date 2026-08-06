"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { offerWithdrawalBucket, shortlistReason, type BestFitCriterion } from "@/lib/public-offer/best-offer-ranking";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";

import styles from "./BestOffers.module.css";

const criteria: BestFitCriterion[] = ["overall", "wagering", "payout"];
const criterionLabels: Record<BestFitCriterion, string> = {
  overall: "Best overall balance",
  wagering: "Lower wagering",
  payout: "Faster payout signal",
};

const cardReasons: Record<BestFitCriterion, string> = {
  overall: "Strong balance of terms, usability and withdrawal visibility.",
  wagering: "A smaller headline with a lighter play-through requirement.",
  payout: "A clearer, faster published withdrawal signal beside the bonus terms.",
};

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function payoutSignal(offer: PublicOfferDTO) {
  return offer.casino.payments.find((item) => item.supportsWithdrawals && item.withdrawalTime)?.withdrawalTime ?? "Not published";
}

function expirySignal(offer: PublicOfferDTO) {
  if (!offer.bonus.expiresAt) return "No fixed expiry listed";
  const date = new Date(offer.bonus.expiresAt);
  return Number.isNaN(date.getTime()) ? "Check full terms" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ProductCard({ criterion, offer }: { criterion: BestFitCriterion; offer: PublicOfferDTO }) {
  return <article className={styles.productCard} data-testid="best-offer-product-card">
    <div className={styles.productTop}>
      <span>{criterionLabels[criterion]}</span>
      <strong aria-label={`Editorial score ${offer.casino.editorScore.toFixed(1)} out of 10`}>{offer.casino.editorScore.toFixed(1)}</strong>
    </div>
    <p className={styles.operatorName}>{offer.casino.name}</p>
    <h3>{offer.bonus.title}</h3>
    <dl className={styles.productTerms}>
      <div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}× bonus`}</dd></div>
      <div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div>
      <div><dt>{criterion === "wagering" ? "Expiry" : "Payout signal"}</dt><dd>{criterion === "wagering" ? expirySignal(offer) : payoutSignal(offer)}</dd></div>
    </dl>
    <div className={styles.whyCard}>
      <span>Why it made the shortlist</span>
      <p>{cardReasons[criterion]}</p>
    </div>
    <Link className={styles.cardCta} href={`/casino/${offer.casino.slug}`}>View full terms</Link>
    <p className={styles.cardDisclosure}>18+ · Illustrative operator · Affiliate disclosure</p>
  </article>;
}

function RankedOfferCard({ index, offer, winners }: {
  index: number;
  offer: PublicOfferDTO;
  winners: Record<BestFitCriterion, PublicOfferDTO | null>;
}) {
  const badges = criteria.filter((key) => winners[key]?.casino.id === offer.casino.id && winners[key]?.bonus.id === offer.bonus.id);
  const licence = offer.casino.licenses.find((item) => item.status === "ACTIVE") ?? offer.casino.licenses[0];

  return <article className={styles.rankedCard} data-testid="ranked-offer-card">
    <div className={styles.rankedCardTop}>
      <span className={styles.rankNumber}>{String(index + 1).padStart(2, "0")}</span>
      <strong aria-label={`Editorial score ${offer.casino.editorScore.toFixed(1)} out of 10`}>{offer.casino.editorScore.toFixed(1)}<small>/10</small></strong>
    </div>
    <div className={styles.rankedBadges}>{badges.map((key) => <span key={key}>{criterionLabels[key]}</span>)}</div>
    <p className={styles.rankedOperator}>{offer.casino.name}</p>
    <h3>{offer.bonus.title}</h3>
    <dl className={styles.rankedTerms}>
      <div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? "Not listed" : `${offer.bonus.wageringMultiplier}× bonus`}</dd></div>
      <div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div>
      <div><dt>Max bonus</dt><dd>{money(offer.bonus.maximumBonus, offer.bonus.currency)}</dd></div>
      <div><dt>Payout signal</dt><dd>{payoutSignal(offer)}</dd></div>
      <div><dt>Licence context</dt><dd>{licence?.authority ?? "Not published"}</dd></div>
    </dl>
    <div className={styles.rankedReason}>
      <span>Why it ranks</span>
      <p>{shortlistReason(offer)}</p>
    </div>
    <div className={styles.rankedConditions}>
      <p><strong>Eligibility:</strong> {offer.bonus.eligibility || "Check full terms"}</p>
      <p><strong>Material condition:</strong> {offer.bonus.importantConditions[0] || "Check full terms"}</p>
    </div>
    <Link className={styles.rankedCta} href={`/casino/${offer.casino.slug}`}>View full terms <span aria-hidden="true">→</span></Link>
    <p className={styles.rankedDisclosure}>Editorial rank · Commission is not a ranking input</p>
  </article>;
}

export function BestOffersExperience({ shortlist, winners }: {
  shortlist: PublicOfferDTO[];
  winners: Record<BestFitCriterion, PublicOfferDTO | null>;
}) {
  const slides = criteria.flatMap((criterion) => winners[criterion] ? [{ criterion, offer: winners[criterion] as PublicOfferDTO }] : []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [criterion, setCriterion] = useState<BestFitCriterion>("overall");
  const pointerStart = useRef<number | null>(null);
  const winner = winners[criterion];
  const featured = winners.overall ?? shortlist[0] ?? null;
  const move = (next: number) => setActiveSlide((next + slides.length) % slides.length);

  return <>
    <section className={styles.shortlistSection} id="shortlist" aria-labelledby="shortlist-title">
      <div className={styles.shell}>
        <div className={styles.shortlistIntro}>
          <h2 id="shortlist-title">One headline. The full decision.</h2>
          <p>Swipe the shortlist by what matters to you — then see the material terms before you leave SevenBet.</p>
        </div>
        {slides.length ? <div
          aria-label="Best offer selectors"
          aria-roledescription="carousel"
          className={styles.productStage}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") move(activeSlide - 1);
            if (event.key === "ArrowRight") move(activeSlide + 1);
            if (event.key === "Home") setActiveSlide(0);
            if (event.key === "End") setActiveSlide(slides.length - 1);
          }}
          onPointerDown={(event) => { pointerStart.current = event.clientX; }}
          onPointerUp={(event) => {
            if (pointerStart.current === null) return;
            const distance = event.clientX - pointerStart.current;
            if (Math.abs(distance) > 48) move(activeSlide + (distance < 0 ? 1 : -1));
            pointerStart.current = null;
          }}
          role="region"
          tabIndex={0}
        >
          <Image alt="" className={styles.stageArtwork} fill priority sizes="(max-width: 900px) 100vw, 1264px" src="/best-offers/shortlist-art.jpg" />
          <div className={styles.artWash} />
          <button aria-label="Previous offer" className={`${styles.stageArrow} ${styles.stageArrowPrevious}`} onClick={() => move(activeSlide - 1)} type="button">←</button>
          <div className={styles.productViewport}>
            <div className={styles.productTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {slides.map((slide, index) => <div aria-hidden={index !== activeSlide} className={styles.productSlide} inert={index !== activeSlide} key={`${slide.criterion}:${slide.offer.casino.id}:${slide.offer.bonus.id}`}>
                <ProductCard criterion={slide.criterion} offer={slide.offer} />
              </div>)}
            </div>
          </div>
          <button aria-label="Next offer" className={`${styles.stageArrow} ${styles.stageArrowNext}`} onClick={() => move(activeSlide + 1)} type="button">→</button>
          <div aria-label="Choose a shortlist position" className={styles.stageDots}>
            {slides.map((slide, index) => <button aria-current={index === activeSlide ? "true" : undefined} aria-label={`Show ${criterionLabels[slide.criterion]}`} key={slide.criterion} onClick={() => setActiveSlide(index)} type="button" />)}
          </div>
        </div> : null}
        <div className={styles.metrics}>
          <div><strong>GB-FIRST</strong><span>Declared comparison context</span></div>
          <div><strong>9</strong><span>Material fields</span></div>
          <div><strong>TERMS FIRST</strong><span>Before the outbound click</span></div>
        </div>
        <p className={styles.dataNote}>{shortlist.length} complete records checked · Illustrative pre-launch offer data · Verify operator, terms and market eligibility before release.</p>
      </div>
    </section>

    <section className={styles.methodSection} aria-labelledby="method-title">
      <div className={styles.shell}>
        <p className={styles.kicker}>Published ranking method</p>
        <h2 id="method-title">Every offer earns its place.</h2>
        <p className={styles.methodSupport}>Eligibility and complete terms are the gate. Editorial evidence decides the order. Commercial value never buys a position.</p>
        <Link className={styles.lightCta} href="#shortlist">View best offers</Link>
        <ol className={styles.methodCards}>
          <li><span>01</span><h3>Market and publication first.</h3><p>Only active, current records explicitly available in the selected market can enter.</p></li>
          <li><span>02</span><h3>Comparable terms, in one place.</h3><p>Deposit, wagering, eligibility and important conditions must all be published.</p></li>
          <li><span>03</span><h3>Editorial, not commercial.</h3><p>Score and evidence determine order. Affiliate economics are not ranking inputs.</p></li>
        </ol>
        <aside className={styles.editorialBoundary}>
          <span>Editorial boundary</span>
          <strong>Commission never changes who ranks first.</strong>
          <p>Programme, Help, pause and vulnerability data are never used for offer targeting.</p>
        </aside>
      </div>
    </section>

    <section className={styles.fitSection} aria-labelledby="fit-title">
      <div className={styles.shell}>
        <p className={styles.kicker}>Three questions · three selectors</p>
        <h2 id="fit-title">Find your best fit.</h2>
        <p className={styles.fitSupport}>“Best” changes with the question. Choose one lens and see the exact published signal behind the result.</p>
        <div aria-label="Best fit criterion" className={styles.fitTabs} role="tablist">
          {criteria.map((key, index) => <button aria-controls={`best-fit-${key}`} aria-selected={criterion === key} id={`best-fit-tab-${key}`} key={key} onClick={() => setCriterion(key)} role="tab" type="button"><span>{index + 1}</span>{criterionLabels[key]}</button>)}
        </div>
        {winner ? <div aria-labelledby={`best-fit-tab-${criterion}`} className={styles.fitStage} id={`best-fit-${criterion}`} role="tabpanel">
          <div className={styles.stageDisc} />
          <div className={styles.fitNoteLeft}><span>Compare the real cost</span><p>A smaller headline can be the stronger offer when the play-through is lighter.</p></div>
          <ProductCard criterion={criterion} offer={winner} />
          <div className={styles.fitNoteRight}><span>Keep the exit visible</span><p>Withdrawal and cash-out conditions stay beside the bonus terms.</p></div>
          {criterion === "payout" ? <small className={styles.fitBucket}>Signal bucket: {offerWithdrawalBucket(winner).replaceAll("-", " ")}</small> : null}
        </div> : <div className={styles.statePanel} role="status"><h3>No winner is available.</h3><p>The current eligible shortlist has no published value for this criterion.</p></div>}
        <div className={styles.decisionStrip}>
          <div><span>01</span><strong>Balance</strong><p>Strong across terms, usability and payout visibility.</p></div>
          <div><span>02</span><strong>Wagering</strong><p>Prioritises a lower play-through requirement.</p></div>
          <div><span>03</span><strong>Payout</strong><p>Prioritises a clearer, faster withdrawal signal.</p></div>
        </div>
      </div>
    </section>

    <section className={styles.fullRankSection} aria-labelledby="full-rank-title">
      <div className={styles.shell}>
        <div className={styles.fullRankIntro}>
          <div>
            <p className={styles.kicker}>All eligible records · one published order</p>
            <h2 id="full-rank-title">The full ranked field.</h2>
          </div>
          <p>The three selectors above answer the quickest questions. Open the full field when you want to compare every eligible record, material term and editorial signal.</p>
        </div>
        <details className={styles.fullShortlist}>
          <summary>
            <span><strong>Compare all {shortlist.length}</strong><small>Every eligible offer, ranked and explained</small></span>
            <b aria-hidden="true">+</b>
          </summary>
          <div className={styles.rankedGrid}>
            {shortlist.map((offer, index) => <RankedOfferCard index={index} key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} winners={winners} />)}
          </div>
        </details>
        <p className={styles.fullRankFootnote}>Ranking uses market eligibility, material-term completeness and editorial evidence. Withdrawal timing is a published signal, not a guarantee.</p>
      </div>
    </section>

    <section className={styles.evidenceSection} aria-labelledby="evidence-title">
      <div className={styles.shell}>
        <p className={styles.kicker}>The evidence behind the headline</p>
        <h2 id="evidence-title">What makes an offer worth the shortlist.</h2>
        <p className={styles.evidenceSupport}>A persuasive offer is not just a large number. It is a set of facts a user can compare before making a decision.</p>
        <div className={styles.evidenceCards}>
          <article><span>01 · Terms</span><h3>Terms you can compare.</h3><p>Minimum deposit, wagering and important conditions follow the same structure every time.</p></article>
          <article><span>02 · Licence</span><h3>Context you can verify.</h3><p>Market availability and licensing context stay visible instead of being buried behind a CTA.</p></article>
          <article><span>03 · Withdrawal</span><h3>Signals you can plan around.</h3><p>Published withdrawal timing is shown as a signal, never dressed up as a guarantee.</p></article>
        </div>
        {featured ? <div className={styles.editorialDesk}>
          <div>
            <p className={styles.kicker}>SevenBet editorial desk</p>
            <blockquote>“A worthwhile offer makes the real cost easy to see.”</blockquote>
            <p>We compare the terms that affect the decision, explain the ranking, and keep commercial disclosure visible before any handoff.</p>
          </div>
          <aside className={styles.rankSnapshot}>
            <span>Why it ranks</span>
            <h3>Overall balance</h3>
            <dl>
              <div><dt>Terms</dt><dd>Complete</dd></div>
              <div><dt>Wagering</dt><dd>{featured.bonus.wageringMultiplier}×</dd></div>
              <div><dt>Payout signal</dt><dd>{payoutSignal(featured)}</dd></div>
              <div><dt>Editor score</dt><dd>{featured.casino.editorScore.toFixed(1)}/10</dd></div>
            </dl>
            <Link href={`/casino/${featured.casino.slug}`}>Read the evidence →</Link>
          </aside>
        </div> : null}
      </div>
    </section>
  </>;
}
