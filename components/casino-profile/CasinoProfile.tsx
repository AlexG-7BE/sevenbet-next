import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import {
  formatProfileDate,
  formatProfileMoney,
  profileAction,
  profileFacts,
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
  return <section aria-labelledby="editorial-review-heading" className={styles.editorialSection}>
    <div className={styles.sectionHeading}>
      <p>{demonstration ? "FICTIONAL EDITORIAL DEMONSTRATION" : "PUBLISHED EDITORIAL REVIEW"}</p>
      <h2 id="editorial-review-heading">{document.title}</h2>
      <span>{document.summary}</span>
      <small>By {document.author}{formatProfileDate(document.factCheckedAt) ? ` · ${demonstration ? "Fixture reviewed" : "Fact checked"} ${formatProfileDate(document.factCheckedAt)}` : ""}</small>
    </div>
    <div className={styles.editorialGrid}>
      {document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <article key={section.id}>
        <span>{section.kind.replaceAll("-", " ")}</span>
        <h3>{section.title}</h3>
        {section.blocks.map((block) => <EditorialBlockView block={block} key={block.id} />)}
      </article>)}
    </div>
  </section>;
}

export function CasinoProfile({ casino, editorial }: { casino: PublicCasinoDTO; editorial: CasinoEditorialDocument | null }) {
  const demo = isTemporaryDemoCasinoId(casino.id);
  const bonus = selectProfileBonus(casino);
  const action = profileAction(casino, bonus);
  const facts = profileFacts(casino);
  const faq = profileFaqItems(casino, bonus, editorial);
  const freshness = profileReviewFreshness(casino);
  const licence = casino.licenses[0] ?? null;
  const licenceChecked = Boolean(licence?.lastVerifiedAt);
  const payments = casino.payments.slice(0, 2).map((payment) => payment.name);
  const withdrawal = casino.payments.find((payment) => payment.withdrawalTime)?.withdrawalTime ?? null;
  const minimumDeposit = bonus ? formatProfileMoney(bonus.minimumDeposit, bonus.currency) : null;
  const maximumBet = bonus ? formatProfileMoney(bonus.maximumBet, bonus.currency) : null;
  const age = Math.max(18, ...casino.countries.flatMap((country) => country.minimumAge ? [country.minimumAge] : []));

  return <article className={styles.page}>
    <div className={styles.shell}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}><Link href="/casinos">Casinos</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name} review</span></nav>
      {demo ? <p className={styles.profileDisclosure} role="note"><strong>DEMONSTRATION DATA.</strong> This fictional operator profile shows the review experience. It is not a current GB operator, licence claim, partner offer or live promotion. No commercial visit is available.</p> : null}

      <section aria-labelledby="casino-profile-title" className={styles.hero}>
        <div className={styles.heroReview}>
          <p className={styles.heroKicker}>B4GAMBLE REVIEW · {formatProfileDate(casino.lastReviewedAt || casino.publishedAt) || "CURRENT"}</p>
          <div className={styles.identityRow}>
            <div className={styles.logo}>
              {casino.media.logo ? <img alt={casino.media.logo.alt || `${casino.name} logo`} height={casino.media.logo.height || 80} src={casino.media.logo.url} width={casino.media.logo.width || 80} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div><strong>{casino.name}</strong>{freshness ? <span>{freshness.label} {freshness.value}</span> : <span>{demo ? "Fictional review demonstration" : "Published review"}</span>}</div>
            <Signal>{demo ? "FICTIONAL 18+ FIELD" : `${age}+ ONLY`}</Signal>
          </div>
          <h1 id="casino-profile-title">{casino.name}</h1>
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
          <p className={styles.profileDisclosure}>{demo ? "All operator, licence, offer and availability fields on this page are fictional product fixtures." : "18+ · Terms apply · We may earn commission — rankings stay independent."}</p>
        </div>

        <aside aria-label={casino.media.hero ? `${casino.name} media` : "Operator media unavailable"} className={styles.heroMedia}>
          {casino.media.hero ? <img alt={casino.media.hero.alt || `${casino.name} media`} src={casino.media.hero.url} /> : <div><span aria-hidden="true">▧</span><small>Operator media</small></div>}
        </aside>
      </section>

      <nav aria-label="Casino review sections" className={styles.decisionBar}>
        <div><a href="#overview">Overview</a><a href="#offer-evidence">Offer &amp; evidence</a><a href="#verdict">Verdict</a><a href="#faq">FAQ</a></div>
        {action ? <CasinoOutboundAction action={action} className={styles.compactAction} /> : <UnavailableAction />}
      </nav>

      <section aria-labelledby="overview-heading" className={styles.section} id="overview">
        <div className={styles.sectionHeading}>
          <p>THE 30-SECOND CHECK</p>
          <h2 id="overview-heading">{demo ? `What does this demonstration show about ${casino.name}?` : `Should you choose ${casino.name}?`}</h2>
        </div>
        <div className={styles.overviewGrid}>
          <div className={styles.prosCons}>
            <p>{casino.reviewContent}</p>
            <div>
              {casino.pros.length ? <section><h3>{demo ? "What the layout highlights" : "Why it stands out"}</h3><ul>{casino.pros.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
              {casino.cons.length ? <section><h3>{demo ? "Demonstration limitations" : "Before you join"}</h3><ul>{casino.cons.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
            </div>
          </div>
          {facts.length ? <dl className={styles.facts}>{facts.map((fact) => <div key={fact.label}>
            <dt>{fact.label}</dt><dd>{fact.value}</dd>{fact.supportingText ? <dd className={`${styles.supportingText} ${fact.verified ? styles.verifiedText : ""}`}>{fact.supportingText}</dd> : null}
          </div>)}</dl> : <div className={styles.neutralState}><strong>{demo ? "Fictional fields are limited." : "Published facts are limited."}</strong><p>No missing operator, licence, country or payment claim has been inferred.</p></div>}
        </div>
      </section>

      <section aria-labelledby="offer-heading" className={styles.section} id="offer-evidence">
        <div className={styles.sectionHeading}>
          <p>OFFER, PAYMENTS &amp; EVIDENCE</p>
          <h2 id="offer-heading">{demo ? "How fictional detail fields are presented." : "Everything that matters before you click."}</h2>
        </div>
        <div className={styles.detailPanel}>
          <div className={styles.detailTabs}><strong>{demo ? "Fictional detail coverage" : "Published detail coverage"}</strong><ul aria-label={demo ? "Fictional detail groups" : "Published detail groups"}><li>Offer</li><li>Payments</li><li>Safety</li><li>Games</li><li>Control tools</li></ul></div>
          <div className={styles.detailColumns}>
            <div>
              <span className={styles.detailLabel}>{demo ? "FICTIONAL DEMONSTRATION TERMS" : "PUBLISHED OFFER TERMS"}</span>
              {bonus ? <>
                <h3>{profileOfferHeadline(bonus)}</h3>
                <p>{bonus.summary}</p>
                <dl className={styles.termRows}>
                  {bonus.wageringMultiplier !== null || bonus.wageringText ? <div><dt>Wagering</dt><dd>{bonus.wageringText || `${bonus.wageringMultiplier}×`}</dd></div> : null}
                  {minimumDeposit ? <div><dt>Minimum deposit</dt><dd>{minimumDeposit}</dd></div> : null}
                  {maximumBet ? <div><dt>Maximum bet</dt><dd>{maximumBet}</dd></div> : null}
                  {bonus.expiresAt ? <div><dt>{demo ? "Fixture expiry" : "Published expiry"}</dt><dd>{formatProfileDate(bonus.expiresAt)}</dd></div> : null}
                  {bonus.eligibility ? <div><dt>Eligibility</dt><dd>{bonus.eligibility}</dd></div> : null}
                </dl>
                {bonus.importantConditions.length ? <div className={styles.conditions}><strong>Material conditions</strong><ul>{bonus.importantConditions.map((condition) => <li key={condition}>{condition}</li>)}</ul></div> : null}
                {action ? <CasinoOutboundAction action={action} /> : <UnavailableAction />}
              </> : <div className={styles.neutralState}><strong>{demo ? "No fictional offer field." : "No active published offer."}</strong><p>No bonus value or terms have been invented for this profile.</p></div>}
            </div>
            <div className={styles.evidenceColumn}>
              <span className={styles.detailLabel}>WHAT WE CHECKED</span>
              <dl className={styles.termRows}>
                {licence ? <div><dt>Licence record</dt><dd>{licence.authority}</dd></div> : null}
                {casino.payments.length ? <div><dt>Payment records</dt><dd>{casino.payments.map((payment) => payment.name).join(", ")}</dd></div> : null}
                {casino.providers.length ? <div><dt>Providers</dt><dd>{casino.providers.map((provider) => provider.name).join(", ")}</dd></div> : null}
                {casino.categories.length ? <div><dt>Categories</dt><dd>{casino.categories.map((category) => category.name).join(", ")}</dd></div> : null}
                <div><dt>{demo ? "Demonstration source" : "Published source"}</dt><dd>{demo ? "Fictional profile" : "Casino profile"} version {casino.version}</dd></div>
              </dl>
              <div className={styles.evidenceNote}>
                <strong>{demo ? "Demonstration fields only" : licenceChecked ? "Evidence date is published" : "Verification date unavailable"}</strong>
                <p>{demo ? "No operator, licence, offer or availability field on this fictional profile is current commercial evidence." : "Availability, licence status and offer terms can change. Review the current terms before acting."}</p>
              </div>
              {casino.responsibleGamblingTools.length ? <div className={styles.controlTools}><strong>{demo ? "Fictional control-tool fields" : "Published control tools"}</strong><ul>{casino.responsibleGamblingTools.map((tool) => <li key={tool}>{tool}</li>)}</ul></div> : null}
              <p className={styles.affiliateCopy}>B4GAMBLE may receive compensation from some eligible outbound links. Editorial review access does not depend on a commercial route.</p>
            </div>
          </div>
        </div>
      </section>

      {editorial ? <EditorialEvidence demonstration={demo} document={editorial} /> : null}

      <section aria-labelledby="verdict-heading" className={styles.verdict} id="verdict">
        <div>
          <p>B4GAMBLE VERDICT</p>
          <h2 id="verdict-heading">{demo ? "Fictional fields, visible limits." : "Published evidence, visible limits."}</h2>
          <span>{editorial?.summary || casino.reviewContent}</span>
          {casino.cons.length ? <div className={styles.verdictLimit}><strong>Keep in view</strong><span>{casino.cons[0]}</span></div> : null}
        </div>
        <div className={styles.scorePanel}>
          <strong>{casino.editorScore.toFixed(1)}</strong><span>Editorial score / 10</span>
          <dl>
            <div><dt>Licence evidence</dt><dd>{demo ? "fictional field" : licenceChecked ? "dated" : licence ? "undated" : "not listed"}</dd></div>
            <div><dt>Offer terms</dt><dd>{demo && bonus ? "illustrative" : bonus ? "published" : "not listed"}</dd></div>
            <div><dt>Payment records</dt><dd>{demo && casino.payments.length ? `${casino.payments.length} fictional` : casino.payments.length || "not listed"}</dd></div>
            <div><dt>Control tools</dt><dd>{demo && casino.responsibleGamblingTools.length ? `${casino.responsibleGamblingTools.length} fictional` : casino.responsibleGamblingTools.length || "not listed"}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className={styles.faqSection} id="faq">
        <div className={styles.sectionHeading}><p>FAQ</p><h2 id="faq-heading">{casino.name} questions, answered.</h2></div>
        <div className={styles.faqGrid}>
          <div>{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
          <aside className={styles.finalOffer}>
            {bonus ? <><span>{demo ? "FICTIONAL DEMONSTRATION FIELDS" : "PUBLISHED OFFER INFORMATION"}</span><h3>{profileOfferHeadline(bonus)}</h3><p>{bonus.title}</p>{action ? <CasinoOutboundAction action={action} /> : <UnavailableAction />}</> : <><span>REVIEW AVAILABLE</span><h3>{demo ? "No fictional offer field." : "No published offer."}</h3><p>Continue comparing the evidence without a commercial action.</p><UnavailableAction /></>}
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
