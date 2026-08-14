import Image from "next/image";
import Link from "next/link";

import { CommercialAnalyticsLink, CommercialDecisionLayerView } from "@/components/commercial-decision/CommercialAnalytics";
import styles from "@/components/commercial-decision/BestCasinoGolden.module.css";
import { previewOutboundHref } from "@/lib/cpo-commercial-preview";
import type { PublicOfferDTO, PublicOfferInventoryMode } from "@/lib/public-offer/public-offer.types";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function visibleLimitation(offer: PublicOfferDTO) {
  if (offer.dataClassification === "DEMO_FIXTURE") return "Fictional demonstration record. Not a current operator, partner or claimable offer.";
  return offer.bonus.importantConditions[0]
    || offer.bonus.eligibility
    || "Current availability and operator terms require independent verification.";
}

function reasons(offer: PublicOfferDTO) {
  return [
    offer.casino.licenses[0]?.authority ? `${offer.casino.licenses[0].authority} licence evidence is listed.` : null,
    offer.bonus.wageringMultiplier !== null ? `${offer.bonus.wageringMultiplier}× wagering is recorded.` : "Missing wagering stays visible.",
  ].filter((value): value is string => Boolean(value));
}

function facts(offer: PublicOfferDTO) {
  const payout = offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime)?.withdrawalTime;
  return [
    ["Licence", offer.casino.licenses[0]?.authority || "Not listed"],
    ["Minimum deposit", money(offer.bonus.minimumDeposit, offer.bonus.currency)],
    ["Wagering", offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Not listed" : `${offer.bonus.wageringMultiplier}×`],
    ["Payout evidence", payout || "Not listed"],
  ];
}

function demoAsset(offer: PublicOfferDTO, kind: "hero" | "logo" | "screen") {
  if (offer.dataClassification !== "DEMO_FIXTURE" || !/^demo-[a-z0-9-]+$/.test(offer.casino.slug)) return null;
  return `/demo-casinos/${offer.casino.slug}-${kind}.svg`;
}

function recommendationMedia(offer: PublicOfferDTO, kind: "hero" | "screen") {
  return demoAsset(offer, kind) || "/best-offers/shortlist-art.jpg";
}

function mediaAlt(offer: PublicOfferDTO, kind: "hero" | "screen") {
  if (offer.dataClassification === "DEMO_FIXTURE") {
    return `${offer.casino.name} fictional ${kind === "hero" ? "editorial artwork" : "product presentation"}`;
  }
  return "B4GAMBLE editorial shortlist artwork";
}

function Identity({ offer, compact = false }: { offer: PublicOfferDTO; compact?: boolean }) {
  const logo = demoAsset(offer, "logo") || offer.casino.logo?.url;
  return <div className={compact ? styles.compactIdentity : styles.identity}>
    {logo
      ? <span className={styles.logo}><Image alt={offer.casino.logo?.alt || `${offer.casino.name} identity`} fill sizes={compact ? "96px" : "144px"} src={logo} /></span>
      : <span className={styles.monogram} aria-hidden="true">{offer.casino.name.slice(0, 2).toUpperCase()}</span>}
    <span className={styles.identityCopy}>
      <small>{offer.dataClassification === "DEMO_FIXTURE" ? "Fictional demonstration" : "Published review"}</small>
      <strong>{offer.casino.name}</strong>
    </span>
  </div>;
}

function FactLedger({ offer, compact = false }: { offer: PublicOfferDTO; compact?: boolean }) {
  const rows = compact ? facts(offer).slice(1) : facts(offer);
  return <dl className={compact ? styles.compactFacts : styles.factLedger}>
    {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
  </dl>;
}

function RecommendationActions({ offer, rank, compact = false }: { offer: PublicOfferDTO; rank: 1 | 2 | 3; compact?: boolean }) {
  return <div className={compact ? styles.compactActions : styles.actions}>
    <CommercialAnalyticsLink
      action={{ event: "outbound", operatorSlug: offer.casino.slug, recommendationRank: rank }}
      className={styles.primaryAction}
      href={previewOutboundHref({ slug: offer.casino.slug, sourceRoute: "best_casinos", rank, placement: "shortlist" })}
      sourceRoute="best_casinos"
    >Visit Casino <span aria-hidden="true">↗</span></CommercialAnalyticsLink>
    <CommercialAnalyticsLink action={{ event: "review", operatorSlug: offer.casino.slug }} className={styles.reviewAction} href={`/casino/${offer.casino.slug}`} sourceRoute="best_casinos">Read full review</CommercialAnalyticsLink>
    <CommercialAnalyticsLink action={{ event: "compare", operatorSlug: offer.casino.slug }} className={styles.compareAction} href={`/compare?casino=${encodeURIComponent(offer.casino.slug)}&country=GB`} sourceRoute="best_casinos">Compare</CommercialAnalyticsLink>
  </div>;
}

function PreviewNote({ inventoryMode }: { inventoryMode: PublicOfferInventoryMode }) {
  if (inventoryMode === "PUBLISHED_ONLY") return null;
  return <aside className={styles.previewNote} role="note">
    <span>{inventoryMode === "DEMO_ONLY" ? "DEMONSTRATION DATA" : "MIXED SOURCE STATUS"}</span>
    <p>Fictional fixtures stay labelled. No real operator, licence, offer or partnership is implied.</p>
  </aside>;
}

function Winner({ offer }: { offer: PublicOfferDTO }) {
  return <section className={styles.winnerSection} data-golden-section="number-one" id="number-one" aria-labelledby="winner-title">
    <div className={styles.shell}>
      <header className={styles.winnerIntro}>
        <p className={styles.eyebrow}>01 · BEST OVERALL · EDITORIAL ORDER</p>
        <h2 id="winner-title">If you want one answer,<br /><em>start here.</em></h2>
        <p>This is the first result from the same public ranking method used across B4GAMBLE. The evidence and limitation stay beside the action.</p>
      </header>

      <article className={styles.winnerStage}>
        <div className={styles.winnerMedia}>
          <Image alt={mediaAlt(offer, "hero")} fill sizes="(max-width: 760px) 100vw, 1312px" src={recommendationMedia(offer, "hero")} />
          <span className={styles.winnerRank} aria-hidden="true">01</span>
          <span className={styles.mediaCaption}>B4GAMBLE PICK / PRODUCT VIEW</span>
        </div>

        <div className={styles.winnerDecision}>
          <div className={styles.winnerDecisionTop}>
            <Identity offer={offer} />
            <p className={styles.score}><strong>{offer.casino.editorScore.toFixed(1)}</strong><span>/10<br />EDITOR SCORE</span></p>
          </div>

          <div className={styles.offerMoment}>
            <span>OFFER RECORD</span>
            <h3>{offer.bonus.title}</h3>
            <p>{offer.bonus.summary}</p>
          </div>

          <FactLedger offer={offer} />

          <p className={styles.limitation}><strong>Keep in view:</strong><span>{visibleLimitation(offer)}</span></p>
          <RecommendationActions offer={offer} rank={1} />
          <small className={styles.simulation}>Preview simulation · the action stays inside B4GAMBLE</small>

          <div className={styles.winnerReason}>
            <span>WHY IT MADE THE LIST</span>
            <ul>{reasons(offer).map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>
        </div>
      </article>
    </div>
  </section>;
}

function Alternative({ offer, rank }: { offer: PublicOfferDTO; rank: 2 | 3 }) {
  const isSecond = rank === 2;
  return <li className={isSecond ? styles.secondPlace : styles.thirdPlace}>
    <article>
      <div className={styles.alternativeMedia}>
        <Image alt={mediaAlt(offer, isSecond ? "hero" : "screen")} fill sizes={isSecond ? "(max-width: 760px) 100vw, 760px" : "(max-width: 760px) 100vw, 500px"} src={recommendationMedia(offer, isSecond ? "hero" : "screen")} />
        <span className={styles.alternativeRank}>{String(rank).padStart(2, "0")}</span>
      </div>
      <div className={styles.alternativeCopy}>
        <p className={styles.alternativePosition}>{isSecond ? "STRONG ALTERNATIVE" : "WORTH COMPARING"}</p>
        <div className={styles.alternativeHeading}>
          <Identity compact offer={offer} />
          <p><strong>{offer.casino.editorScore.toFixed(1)}</strong><span>/10</span></p>
        </div>
        <div className={styles.alternativeOffer}><span>OFFER RECORD</span><h3>{offer.bonus.title}</h3><p>{offer.bonus.summary}</p></div>
        <FactLedger compact offer={offer} />
        <p className={styles.alternativeWhy}><strong>Why it is here</strong>{reasons(offer)[0] || "Material evidence remains visible."}</p>
        <p className={styles.alternativeLimit}><strong>Keep in view:</strong>{visibleLimitation(offer)}</p>
        <RecommendationActions compact offer={offer} rank={rank} />
        <small className={styles.simulation}>Preview simulation · no external visit</small>
      </div>
    </article>
  </li>;
}

function Alternatives({ records }: { records: PublicOfferDTO[] }) {
  return <section className={styles.alternatives} data-golden-section="alternatives" aria-labelledby="alternatives-title">
    <div className={styles.shell}>
      <header className={styles.alternativesIntro}>
        <p className={styles.eyebrow}>02–03 · IF THE FIRST PICK ISN&apos;T YOUR FIT</p>
        <h2 id="alternatives-title">Two alternatives.<br /><em>Not two more winners.</em></h2>
        <p>Both remain credible options. Their quieter treatment is intentional: compare only if the first recommendation leaves a question.</p>
      </header>
      <ol className={styles.alternativeList} start={2}>
        {records.slice(0, 2).map((offer, index) => <Alternative key={`${offer.casino.id}:${offer.bonus.id}`} offer={offer} rank={(index + 2) as 2 | 3} />)}
      </ol>
    </div>
  </section>;
}

function EvidenceAndResearch() {
  return <div data-golden-section="evidence-research">
    <section className={styles.evidence} aria-labelledby="evidence-title">
      <div className={styles.shell}>
        <header className={styles.evidenceHeading}>
          <p className={styles.eyebrow}>WHY THESE THREE</p>
          <h2 id="evidence-title">The shortlist is a decision.<br /><em>Not a sponsored slot.</em></h2>
        </header>
        <div className={styles.evidenceEditorial}>
          <blockquote>“We narrow first.<br />You verify only<br />what matters.”</blockquote>
          <ol>
            <li><span>01</span><div><strong>Public evidence in</strong><p>Editor Score, recorded material terms and payout evidence shape the existing deterministic order.</p></div></li>
            <li><span>02</span><div><strong>Missing facts stay visible</strong><p>Uncertainty is not converted into confidence. “Not listed” remains part of the decision.</p></div></li>
            <li><span>03</span><div><strong>Private data stays out</strong><p>Programme answers, limits, Help activity and private wording never influence this list.</p></div></li>
          </ol>
        </div>
        <p className={styles.evidenceBoundary}><strong>EDITORIAL BOUNDARY</strong><span>No sponsored override. No popularity theatre. No personalised commercial targeting.</span></p>
      </div>
    </section>

    <section className={styles.research} aria-labelledby="research-title">
      <div className={styles.shell}>
        <header className={styles.researchIntro}>
          <p className={styles.eyebrow}>EVIDENCE ON DEMAND</p>
          <h2 id="research-title">Research only as far<br /><em>as you need.</em></h2>
        </header>
        <nav className={styles.researchPaths} aria-label="Decision evidence routes">
          <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "casinos" }} className={styles.allCasinosPath} href="/casinos" sourceRoute="best_casinos"><span>01 / EXPLORE</span><strong>All Casinos</strong><small>Search and filter every review</small><b aria-hidden="true">→</b></CommercialAnalyticsLink>
          <Link className={styles.methodPath} href="/methodology"><span>02 / UNDERSTAND</span><strong>Methodology</strong><small>See how the order is built</small><b aria-hidden="true">→</b></Link>
          <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "compare" }} className={styles.comparePath} href="/compare" sourceRoute="best_casinos"><span>03 / VERIFY</span><strong>Compare</strong><small>Check selected differences</small><b aria-hidden="true">→</b></CommercialAnalyticsLink>
        </nav>
      </div>
    </section>
  </div>;
}

function Closing({ offer }: { offer: PublicOfferDTO }) {
  return <section className={styles.closing} aria-labelledby="closing-title">
    <div className={styles.shell}>
      <div className={styles.closingNumber} aria-hidden="true">01</div>
      <div className={styles.closingCopy}>
        <p>THE SHORTLIST CAN STOP HERE.</p>
        <h2 id="closing-title">Our first pick is still<br /><em>{offer.casino.name}.</em></h2>
      </div>
      <div className={styles.closingActions}>
        <CommercialAnalyticsLink
          action={{ event: "outbound", operatorSlug: offer.casino.slug, recommendationRank: 1 }}
          href={previewOutboundHref({ slug: offer.casino.slug, sourceRoute: "best_casinos", rank: 1, placement: "shortlist" })}
          sourceRoute="best_casinos"
        >Visit Casino <span aria-hidden="true">↗</span></CommercialAnalyticsLink>
        <CommercialAnalyticsLink action={{ event: "review", operatorSlug: offer.casino.slug }} href={`/casino/${offer.casino.slug}`} sourceRoute="best_casinos">Or read the full review</CommercialAnalyticsLink>
        <small>Preview simulation · no external visit</small>
      </div>
    </div>
  </section>;
}

export function BestCasinoDecisionLayer({ records, inventoryMode }: { records: PublicOfferDTO[]; inventoryMode: PublicOfferInventoryMode }) {
  const shortlist = records.slice(0, 3);
  const winner = shortlist[0];
  if (!winner) return null;

  return <div className={styles.page}>
    <CommercialDecisionLayerView placement="shortlist" sourceRoute="best_casinos" />
    <section className={styles.hero} data-golden-section="hero" aria-labelledby="golden-title">
      <div className={styles.heroFrame}>
        <div className={styles.heroUtility}>
          <p>B4GAMBLE PICKS · EDITORIAL DECISION THEATRE · 18+</p>
          <PreviewNote inventoryMode={inventoryMode} />
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <Image alt="" fill priority sizes="(max-width: 760px) 100vw, 760px" src="/best-offers/shortlist-art.jpg" />
          <span>03</span>
        </div>
        <h1 id="golden-title"><span>Three picks.</span><em>Not thirty.</em></h1>
        <div className={styles.heroPromise}>
          <p>B4GAMBLE has already reduced the market to three public editorial picks.</p>
          <a href="#number-one">Start with number one <span aria-hidden="true">↓</span></a>
        </div>
        <p className={styles.heroIndex} aria-hidden="true">01 / THE ANSWER&nbsp;&nbsp;&nbsp; 02 / ALTERNATIVE&nbsp;&nbsp;&nbsp; 03 / COMPARE</p>
      </div>
    </section>

    <Winner offer={winner} />
    {shortlist.length > 1 ? <Alternatives records={shortlist.slice(1)} /> : null}
    <EvidenceAndResearch />
    <Closing offer={winner} />
  </div>;
}
