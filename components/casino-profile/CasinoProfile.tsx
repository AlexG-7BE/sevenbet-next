import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CasinoProfileInteractions } from "@/components/casino-profile/CasinoProfileInteractions";
import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import {
  formatProfileDate,
  formatProfileMoney,
  profileAction,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";

import styles from "./CasinoProfile.module.css";

function Signal({ children, verified = false }: { children: React.ReactNode; verified?: boolean }) {
  return <span className={verified ? styles.verifiedSignal : styles.signal}>{children}</span>;
}

function UnavailableAction() {
  return <span aria-disabled="true" className={styles.unavailableAction}>Offer unavailable</span>;
}

function EditorialBlockView({ block }: { block: EditorialBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "heading") return <h4>{block.text}</h4>;
  if (block.type === "quote") return <blockquote><p>{block.text}</p>{block.attribution ? <cite>— {block.attribution}</cite> : null}</blockquote>;
  if (block.type === "divider") return <hr />;
  if (block.type === "faq" || block.type === "image" || block.type === "video") return null;
  if ("items" in block) {
    const List = block.type === "numbered-list" ? "ol" : "ul";
    return <List>{block.items.map((item) => <li key={item}>{item}</li>)}</List>;
  }
  return <aside className={block.type === "warning" || block.type === "responsible-gambling" ? styles.editorialWarning : styles.editorialNote}><strong>{block.title}</strong><p>{block.text}</p></aside>;
}

function EditorialEvidence({ document, demonstration }: { document: CasinoEditorialDocument; demonstration: boolean }) {
  return <section aria-labelledby="editorial-review-heading" className={styles.editorialSection} data-motion-reveal data-nav-theme="light" id="editorial-review">
    <div className={styles.sectionHeading}>
      <p>{demonstration ? "FICTIONAL EDITORIAL DEMONSTRATION" : "PUBLISHED EDITORIAL REVIEW"}</p>
      <h2 id="editorial-review-heading">{document.title}</h2>
      <span>{document.summary}</span>
      <small>By {document.author}{formatProfileDate(document.factCheckedAt) ? ` · ${demonstration ? "Fixture reviewed" : "Fact checked"} ${formatProfileDate(document.factCheckedAt)}` : ""}</small>
    </div>
    <div className={styles.editorialLayout}>
      <nav aria-label="Full review sections">{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <a href={`#editorial-${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <div className={styles.editorialGrid}>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <article id={`editorial-${section.id}`} key={section.id}>
        <span>{section.kind.replaceAll("-", " ")}</span>
        <h3>{section.title}</h3>
        {section.blocks.map((block) => <EditorialBlockView block={block} key={block.id} />)}
      </article>)}</div>
    </div>
  </section>;
}

export function CasinoProfile({ casino, editorial }: { casino: PublicCasinoDTO; editorial: CasinoEditorialDocument | null }) {
  const demo = isTemporaryDemoCasinoId(casino.id);
  const bonus = selectProfileBonus(casino);
  const action = profileAction(casino, bonus);
  const faq = profileFaqItems(casino, bonus, editorial);
  const freshness = profileReviewFreshness(casino);
  const licence = casino.licenses[0] ?? null;
  const licenceChecked = Boolean(licence?.lastVerifiedAt);
  const payments = casino.payments.slice(0, 2).map((payment) => payment.name);
  const withdrawal = casino.payments.find((payment) => payment.withdrawalTime)?.withdrawalTime ?? null;
  const minimumDeposit = bonus ? formatProfileMoney(bonus.minimumDeposit, bonus.currency) : null;
  const maximumBet = bonus ? formatProfileMoney(bonus.maximumBet, bonus.currency) : null;
  const publishedGameCount = Math.max(0, ...casino.categories.map((category) => category.gameCount ?? 0), ...casino.providers.map((provider) => provider.gameCount ?? 0));
  const age = Math.max(18, ...casino.countries.flatMap((country) => country.minimumAge ? [country.minimumAge] : []));
  const scoreCategories = editorial?.trustScore?.categories ?? [];
  const reviewEvidence = editorial?.trustScore?.evidence?.slice(0, 3) ?? casino.pros.slice(0, 3);
  const structuredOfferHeading = bonus && bonus.percentage !== null && bonus.maximumBonus !== null
    ? {
        primary: `${bonus.percentage}% up to ${formatProfileMoney(bonus.maximumBonus, bonus.currency)}`,
        secondary: bonus.freeSpins ? `+ ${bonus.freeSpins} Free Spins` : null,
      }
    : null;

  return <article className={styles.page} data-runtime-renderer="casino-review">
    <div aria-hidden="true" className={styles.readProgress} data-casino-read-progress />
    <CasinoProfileInteractions />
    <div className={styles.shell}>
      <section aria-labelledby="casino-profile-title" className={styles.hero} data-nav-theme={casino.media.hero ? "photo" : "dark"}>
        <div className={styles.heroReview}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/casinos">Casinos</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name} review</span></nav>
          {demo ? <p className={styles.demoDisclosure} role="note"><strong>DEMONSTRATION DATA.</strong> Fictional review fields · no current operator, licence, partner offer or commercial visit.</p> : null}
          <p className={styles.heroKicker}>B4GAMBLE REVIEW · {formatProfileDate(casino.lastReviewedAt || casino.publishedAt) || "CURRENT"}</p>
          <div className={styles.identityRow}>
            <div className={styles.logo}>
              {casino.media.logo ? <img alt={casino.media.logo.alt || `${casino.name} logo`} height={casino.media.logo.height || 80} src={casino.media.logo.url} width={casino.media.logo.width || 80} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div><strong>{casino.name}</strong>{freshness ? <span>{freshness.label} {freshness.value}</span> : <span>{demo ? "Fictional review demonstration" : "Published review"}</span>}</div>
            <Signal>{demo ? "FICTIONAL 18+ FIELD" : `${age}+ ONLY`}</Signal>
          </div>
          <h1 id="casino-profile-title"><span aria-hidden="true" className={styles.titleLogo}>{casino.name.slice(0, 1).toUpperCase()}</span>{casino.name}</h1>
          <div className={styles.scoreVerdict}>
            <div><strong aria-label={`${demo ? "Fictional editorial score" : "Editorial score"} ${casino.editorScore} out of 10`}>{casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span><small>{casino.editorScore >= 9.5 ? "Exceptional" : casino.editorScore >= 9 ? "Excellent" : "Very good"}</small></div>
            <p><em>Our verdict:</em> {editorial?.summary || casino.summary}</p>
          </div>
          <div aria-label={demo ? "Fictional review fields" : "Published review signals"} className={styles.signals}>
            {licence ? <Signal verified={!demo && licenceChecked}>{demo ? "FICTIONAL LICENCE FIELD" : licenceChecked ? "LICENCE EVIDENCE CHECKED" : "LICENCE NOT VERIFIED"}</Signal> : null}
            {payments.length ? <Signal>{demo ? "FICTIONAL PAYMENT FIELDS" : payments.join(" + ").toUpperCase()}</Signal> : null}
            {withdrawal ? <Signal>{demo ? "FICTIONAL WITHDRAWAL FIELD" : `${withdrawal.toUpperCase()} WITHDRAWALS`}</Signal> : null}
          </div>
          {bonus ? <div className={styles.heroOfferSummary}><div><span>WELCOME OFFER</span><strong>{profileOfferHeadline(bonus)}</strong><small>{[bonus.wageringText, minimumDeposit ? `Min ${minimumDeposit}` : null, withdrawal].filter(Boolean).join(" · ")}</small></div>{action ? <CasinoOutboundAction action={action} /> : <UnavailableAction />}</div> : null}
          <p className={styles.profileDisclosure}>{demo ? "All operator, licence, offer and availability fields on this page are fictional product fixtures." : "18+ · Terms apply · We may earn commission. Affiliate compensation does not determine Editor Score or natural editorial ranking."}</p>
        </div>

        <aside aria-label={casino.media.hero ? `${casino.name} media` : "Operator media unavailable"} className={styles.heroMedia}>
          {casino.media.hero ? <img alt={casino.media.hero.alt || `${casino.name} media`} src={casino.media.hero.url} /> : <div><span aria-hidden="true">▧</span><small>Operator media</small></div>}
        </aside>
      </section>

      <nav aria-label="Casino review sections" className={styles.decisionBar} data-casino-decision-bar>
        <span className={styles.decisionIdentity}><b>{casino.name} · {casino.editorScore.toFixed(1)}</b><small>{bonus ? profileOfferHeadline(bonus) : "Published review"}</small></span>
        <div><a href="#overview">Overview</a><a href="#offer-evidence">Offer &amp; evidence</a><a href="#verdict">Verdict</a><a href="#faq">FAQ</a></div>
        {action ? <CasinoOutboundAction action={action} className={styles.compactAction} /> : <UnavailableAction />}
      </nav>

      <section aria-labelledby="overview-heading" className={`${styles.section} ${styles.overviewSection}`} data-motion-reveal data-nav-theme="light" id="overview">
        <div className={`${styles.sectionHeading} ${styles.overviewHeading}`}>
          <p>THE 30-SECOND CHECK</p>
          <h2 id="overview-heading">The 30-second check</h2>
          <span>Key published fields, before the details</span>
        </div>
        <div className={styles.overviewGrid}>
          <section className={styles.checkCard}><h3>Best for</h3><ul>{casino.pros.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section className={styles.checkCard}><h3>Why we like it</h3><ul>{reviewEvidence.map((item) => <li key={item}>✓ {item}</li>)}</ul></section>
          <section className={styles.checkCard}><h3>Things to know</h3><ul>{casino.cons.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></section>
          <dl className={`${styles.facts} ${styles.checkCard}`}>
            <div><dt>Founded</dt><dd>{casino.foundedYear ?? "Not listed"}</dd></div>
            <div><dt>Licence</dt><dd>{licence?.authority ?? "Not listed"}</dd></div>
            <div><dt>Games</dt><dd>{publishedGameCount ? `${new Intl.NumberFormat("en-GB").format(publishedGameCount)}+` : "Not listed"}</dd></div>
            <div><dt>Payout information</dt><dd>{withdrawal ?? "Not listed"}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="offer-heading" className={`${styles.section} ${styles.offerSection}`} data-motion-reveal data-nav-theme="cream" id="offer-evidence">
        <div className={styles.sectionHeading}>
          <p>OFFER, PAYMENTS &amp; EVIDENCE</p>
          <h2 id="offer-heading">Offer &amp; terms</h2>
        </div>
        <div className={styles.offerComposition}>
          <div className={styles.offerCopy}>
            <span>{demo ? "FICTIONAL DEMONSTRATION TERMS" : "OFFER & TERMS"}</span>
            {bonus ? <>
              <h3>{structuredOfferHeading ? <><span>{structuredOfferHeading.primary}</span>{structuredOfferHeading.secondary ? <em>{structuredOfferHeading.secondary}</em> : null}</> : profileOfferHeadline(bonus)}</h3>
              <p>{bonus.summary}</p>
              {action ? <CasinoOutboundAction action={action} /> : <UnavailableAction />}
              <small>18+ · Full terms on the operator&apos;s site</small>
            </> : <div className={styles.neutralState}><strong>{demo ? "No fictional offer field." : "No active published offer."}</strong><p>No bonus value or terms have been invented for this profile.</p></div>}
          </div>
          <div className={styles.offerTermsCard}>
            {bonus ? <dl className={styles.termRows}>
              {bonus.wageringMultiplier !== null || bonus.wageringText ? <div><dt>Wagering</dt><dd>{bonus.wageringText || `${bonus.wageringMultiplier}×`}</dd></div> : null}
              {minimumDeposit ? <div><dt>Minimum deposit</dt><dd>{minimumDeposit}</dd></div> : null}
              {maximumBet ? <div><dt>Maximum bet</dt><dd>{maximumBet}</dd></div> : null}
              {bonus.expiresAt ? <div><dt>{demo ? "Fixture expiry" : "Expiry"}</dt><dd>{formatProfileDate(bonus.expiresAt)}</dd></div> : null}
              {bonus.eligibility ? <div><dt>Eligibility</dt><dd>{bonus.eligibility}</dd></div> : null}
              <div><dt>Payout</dt><dd>{withdrawal ?? "Not listed"}</dd></div>
            </dl> : null}
            <details className={styles.evidenceDisclosure}>
              <summary>Evidence, payments &amp; control tools</summary>
              <dl>
                {licence ? <div><dt>Licence record</dt><dd>{licence.authority}</dd></div> : null}
                {casino.payments.length ? <div><dt>Payment records</dt><dd>{casino.payments.map((payment) => payment.name).join(", ")}</dd></div> : null}
                {casino.providers.length ? <div><dt>Providers</dt><dd>{casino.providers.map((provider) => provider.name).join(", ")}</dd></div> : null}
                {casino.responsibleGamblingTools.length ? <div><dt>Control tools</dt><dd>{casino.responsibleGamblingTools.join(", ")}</dd></div> : null}
              </dl>
            </details>
          </div>
        </div>
      </section>

      {editorial ? <EditorialEvidence demonstration={demo} document={editorial} /> : null}

      <section aria-labelledby="verdict-heading" className={`${styles.verdict} ${scoreCategories.length ? styles.verdictWithBreakdown : ""}`} data-motion-reveal data-nav-theme="cream" id="verdict">
        <div>
          <p>B4GAMBLE VERDICT</p>
          <h2 id="verdict-heading">Why {casino.editorScore.toFixed(1)}</h2>
          <span>{scoreCategories.length ? "Editorial judgement, not a weighted formula" : editorial?.summary || casino.reviewContent}</span>
          {!scoreCategories.length && casino.cons.length ? <div className={styles.verdictLimit}><strong>Keep in view</strong><span>{casino.cons[0]}</span></div> : null}
        </div>
        {scoreCategories.length ? <div className={styles.scoreBreakdown}>
          {scoreCategories.map((category, index) => <div className={styles.scoreRow} data-score-row key={category.key} style={{ "--score-delay": `${index * 90}ms`, "--score-width": `${Math.min(10, Math.max(0, category.score)) * 10}%` } as React.CSSProperties}>
            <div><strong>{category.key.replaceAll("-", " ")}</strong><span>{category.score.toFixed(1)}</span></div>
            <i aria-hidden="true"><b /></i>
          </div>)}
          <p>Scores reflect our published <Link href="/methodology">methodology</Link> and <Link href="/affiliate-disclosure">affiliate disclosure</Link>.</p>
        </div> : <div className={styles.scorePanel}>
          <strong>{casino.editorScore.toFixed(1)}</strong><span>Editorial score / 10</span>
          <dl>
            <div><dt>Licence evidence</dt><dd>{demo ? "fictional field" : licenceChecked ? "dated" : licence ? "undated" : "not listed"}</dd></div>
            <div><dt>Offer terms</dt><dd>{demo && bonus ? "illustrative" : bonus ? "published" : "not listed"}</dd></div>
            <div><dt>Payment records</dt><dd>{demo && casino.payments.length ? `${casino.payments.length} fictional` : casino.payments.length || "not listed"}</dd></div>
            <div><dt>Control tools</dt><dd>{demo && casino.responsibleGamblingTools.length ? `${casino.responsibleGamblingTools.length} fictional` : casino.responsibleGamblingTools.length || "not listed"}</dd></div>
          </dl>
        </div>}
      </section>

      <section aria-labelledby="faq-heading" className={styles.faqSection} data-motion-reveal data-nav-theme="cream" id="faq">
        <div className={styles.sectionHeading}><p>FAQ</p><h2 id="faq-heading">Questions we get about {casino.name.replace(/\s+casino$/i, "")}</h2></div>
        <div className={styles.faqGrid}>
          <div>{faq.slice(0, 3).map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
          <aside className={styles.finalOffer} data-demo-state={demo ? "fictional" : undefined} data-motion-reveal data-nav-theme="dark">
            <div className={styles.finalOfferInner}>
              {bonus ? <><span>{demo ? "FICTIONAL DEMONSTRATION FIELDS" : "THE VERDICT STANDS"}</span><h3>{casino.name} — <em>{casino.editorScore.toFixed(1)}</em></h3><p>{[profileOfferHeadline(bonus), bonus.wageringText, minimumDeposit ? `Min ${minimumDeposit}` : null, withdrawal ? `Payout ${withdrawal}` : null].filter(Boolean).join(" · ")}</p>{action ? <CasinoOutboundAction action={action} /> : <UnavailableAction />}</> : <><span>REVIEW AVAILABLE</span><h3>{demo ? "No fictional offer field." : "No published offer."}</h3><p>Continue comparing the evidence without a commercial action.</p><UnavailableAction /></>}
            </div>
          </aside>
        </div>
      </section>

      <nav aria-label="Related comparison navigation" className={styles.relatedLinks}>
        <div><span>KEEP COMPARING</span><h2>Use the same evidence across every review.</h2></div>
        <div><Link href="/casinos">Browse casino reviews <span aria-hidden="true">→</span></Link><Link href="/bonuses">{demo ? "Explore bonus information" : "Compare published bonus terms"} <span aria-hidden="true">→</span></Link><Link href="/methodology">Read the methodology <span aria-hidden="true">→</span></Link><Link href="/help">Open protected Help <span aria-hidden="true">→</span></Link></div>
      </nav>
    </div>
  </article>;
}
