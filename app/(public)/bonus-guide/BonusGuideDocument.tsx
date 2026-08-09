import Link from "next/link";

import { getArticleBySlug, getArticlePath, type LearningArticle } from "@/lib/learning-center";

import styles from "./BonusGuidePage.module.css";

export const bonusGuideFigmaAuthority = {
  desktopFamily: "694:5455",
  desktopFull: "694:5461",
  desktopEvidence: "694:5531",
  desktopLaptop: "694:5542",
  desktopUnderReview: "694:5551",
  mobileFamily: "694:8724",
  mobileFull: "694:8730",
  mobileUnderReview: "694:8787",
  mobileFirstFold: "694:8800",
  mobileEvidence: "694:8809",
} as const;

const evidenceSources = [
  {
    authority: "UK Gambling Commission",
    title: "LCCP 5.1.1 — Rewards and bonuses",
    url: "https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/5-1-1-sr-code",
    checked: "07 Aug 2026",
    description: "Current Social Responsibility Code: bonus-fund wagering requirements must not exceed 10 times, and incentive terms must be clear, transparent, fair and readily accessible.",
  },
  {
    authority: "ASA / CAP",
    title: "Gambling, betting and gaming: Free bets and bonuses",
    url: "https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html",
    checked: "07 Aug 2026",
    description: "Current guidance on clear, prominent significant conditions, including eligibility, deposits, wagering and time limits, with full terms readily accessible.",
  },
] as const;

export const bonusGuideFaq = [
  [
    "Does the 10× ceiling mean every GB bonus uses 10×?",
    "No. Ten times bonus funds is the current Great Britain regulatory ceiling for wagering requirements, not a default or recommendation. An operator may set a lower requirement or no wagering requirement.",
  ],
  [
    "Is a smaller multiplier enough to judge an offer?",
    "No. Check what balance the multiplier applies to, eligible play, expiry, withdrawal and verification conditions, and every material eligibility restriction before deciding whether the terms fit your limits.",
  ],
  [
    "Where should I check the current conditions?",
    "Read the current operator promotion page and full terms before acting. Significant conditions should be clear and prominent, but the full terms can contain additional eligibility, game-contribution, verification and withdrawal details.",
  ],
] as const;

const tocItems = [
  ["multiplier", "Multiplier"],
  ["eligible-play", "Eligible play"],
  ["worked-example", "Worked example"],
  ["expiry-withdrawal", "Expiry + withdrawal"],
  ["evidence-sources", "Evidence & sources"],
  ["faq", "FAQ"],
  ["related-reading", "Related reading"],
] as const;

const relatedArticles = [
  "welcome-bonus-terms",
  "casino-licenses-explained",
  "responsible-gambling-tools",
]
  .map((slug) => getArticleBySlug(slug))
  .filter((article): article is LearningArticle => Boolean(article));

export function BonusGuideDocument() {
  return (
    <article
      className={styles.page}
      data-bonus-guide
      data-figma-authority={bonusGuideFigmaAuthority.desktopFamily}
      data-figma-desktop={`${bonusGuideFigmaAuthority.desktopFull} ${bonusGuideFigmaAuthority.desktopEvidence} ${bonusGuideFigmaAuthority.desktopLaptop} ${bonusGuideFigmaAuthority.desktopUnderReview}`}
      data-figma-mobile={`${bonusGuideFigmaAuthority.mobileFull} ${bonusGuideFigmaAuthority.mobileUnderReview} ${bonusGuideFigmaAuthority.mobileFirstFold} ${bonusGuideFigmaAuthority.mobileEvidence}`}
    >
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Neutral commercial education</p>
          <h1>BONUS TERMS,<br />WITHOUT THE SPIN.</h1>
          <p className={styles.heroIntro}>
            <span className={styles.desktopIntro}>A practical guide to wagering, expiry and withdrawal rules — before you compare an offer.</span>
            <span className={styles.mobileIntro}>Direct answer and source state before any comparison link.</span>
          </p>
          <p className={styles.heroMeta}>By B4GAMBLE Editorial <span aria-hidden="true">·</span> Sources checked 07 Aug 2026</p>
        </div>
      </header>

      <div className={styles.readingLayout}>
        <div className={styles.readingColumn}>
          <section className={styles.shortAnswer} aria-labelledby="short-answer-title">
            <p className={styles.sectionLabel}>The short answer</p>
            <h2 id="short-answer-title">
              <span className={styles.fullAnswer}>The headline number is not the value. The restrictions determine how much choice you keep.</span>
              <span className={styles.compactAnswer}>Restrictions determine how much choice you keep.</span>
            </h2>
          </section>

          <section id="multiplier" className={styles.proseSection}>
            <h2>Start with the multiplier</h2>
            <p>A wagering requirement tells you how much qualifying play is required before funds can become withdrawable. First identify the exact balance it applies to: bonus funds, deposited funds, or another amount defined in the terms.</p>
            <aside className={styles.regulatoryNote}>
              <strong>Current GB rule</strong>
              <p>For Great Britain licensees, the current ceiling is 10× bonus funds. It is a maximum, not a standard, target or recommendation. An operator may use a lower requirement or no wagering requirement.</p>
            </aside>
          </section>

          <section id="eligible-play" className={styles.proseSection}>
            <h2>Then check what counts</h2>
            <p>Game contribution can change the practical total. Some play may count in full, contribute only a percentage, or be excluded. Check eligible games, maximum-bet rules, excluded payment methods and whether any bonus and cash balances are treated differently.</p>
            <p>Eligibility conditions also matter. Age, location, account status, deposit method, claim window and previous account history can determine whether an offer applies at all.</p>
          </section>

          <section id="worked-example" className={styles.exampleSection} aria-labelledby="worked-example-title">
            <div className={styles.exampleHeading}>
              <p className={styles.sectionLabel}>Worked example — illustrative</p>
              <h2 id="worked-example-title">One calculation, without an offer attached.</h2>
            </div>
            <dl className={styles.exampleRows}>
              <div><dt>Deposit</dt><dd>£20</dd></div>
              <div><dt>Bonus</dt><dd>£20</dd></div>
              <div><dt>Requirement</dt><dd>10× bonus</dd></div>
              <div><dt>Qualifying play</dt><dd>£200</dd></div>
            </dl>
            <p><strong>Arithmetic:</strong> £20 bonus × 10 = £200 qualifying play.</p>
            <p>This educational arithmetic is not a current operator offer, an available B4GAMBLE bonus or a recommendation. It does not mean every GB bonus uses 10×. Check the operator&apos;s current terms because lower or zero wagering requirements and other significant conditions may apply.</p>
          </section>

          <section id="expiry-withdrawal" className={styles.proseSection}>
            <h2>Expiry and withdrawal rules</h2>
            <p>Check when the offer must be claimed, when bonus funds or related winnings expire, and whether unfinished qualifying play affects them. A short window should not be treated as a reason to increase a deposit, wager size or session length.</p>
            <p>Before accepting any terms, check identity and payment verification, withdrawal restrictions, limits, fees, pending periods, excluded payment methods and what happens to the cash balance if the bonus is cancelled.</p>
          </section>
        </div>

        <nav className={styles.toc} aria-label="On this page">
          <p className={styles.sectionLabel}>On this page</p>
          <ol>
            {tocItems.map(([id, label], index) => <li key={id}><a href={`#${id}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a></li>)}
          </ol>
          <p>Terms and source state appear before the optional offer comparison.</p>
        </nav>
      </div>

      <section id="evidence-sources" className={styles.evidenceSection} aria-labelledby="evidence-title">
        <div className={styles.sectionInner}>
          <p className={styles.sectionLabel}>Evidence &amp; sources</p>
          <h2 id="evidence-title">Claims stay attached to their source state.</h2>
          <div className={styles.evidenceList}>
            {evidenceSources.map((source) => (
              <article className={styles.evidenceCard} key={source.url}>
                <div className={styles.evidenceStatus}>
                  <span>Official source</span>
                  <strong><span aria-hidden="true">●</span> Source checked</strong>
                </div>
                <p className={styles.evidenceAuthority}>{source.authority}</p>
                <h3>{source.title}</h3>
                <p>{source.description}</p>
                <p className={styles.checkedDate}>Checked {source.checked}</p>
                <a href={source.url} target="_blank" rel="noreferrer">Open official source <span aria-hidden="true">↗</span><span className={styles.srOnly}> (opens in a new tab)</span></a>
              </article>
            ))}
          </div>
          <p className={styles.failClosedNote}>If a required official source becomes unavailable or cannot be rechecked, the affected claim should be removed or the guide held from publication — never replaced with an offer or invented summary.</p>
        </div>
      </section>

      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.sectionInner}>
          <p className={styles.sectionLabel}>Common questions</p>
          <h2 id="faq-title">Read the conditions around the number.</h2>
          <div className={styles.faqList}>
            {bonusGuideFaq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="related-reading" className={styles.relatedSection} aria-labelledby="related-title">
        <div className={styles.sectionInner}>
          <p className={styles.sectionLabel}>Related reading</p>
          <h2 id="related-title">Keep the next question educational.</h2>
          <ol>
            {relatedArticles.map((article, index) => (
              <li key={article.slug}>
                <Link href={getArticlePath(article)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{article.title}</strong>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className={styles.commercialTransition} aria-label="Optional offer comparison">
        <div className={styles.commercialInner}>
          <p className={styles.eyebrow}>After the guide</p>
          <h2>Ready to compare published offers?</h2>
          <p>Commercial disclosure: B4GAMBLE may receive compensation from some outbound links reached later. Published terms and editorial context remain separate from compensation.</p>
          <Link href="/bonuses">Compare published offers</Link>
        </div>
      </aside>
    </article>
  );
}
