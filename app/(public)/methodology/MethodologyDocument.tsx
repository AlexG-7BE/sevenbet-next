import Link from "next/link";

import styles from "./MethodologyPage.module.css";

export const methodologyFaqItems: Array<[string, string]> = [
  [
    "How does SevenBet calculate the Editor's Score?",
    "The Editor's Score is a 10-point editorial comparison score based on licensing, bonus clarity, payments, responsible gambling tools, usability, support information, and account restrictions.",
  ],
  [
    "Does a high score remove gambling risk?",
    "No. A high score means the casino has a stronger editorial assessment against SevenBet criteria. Gambling still involves financial risk and outcomes are not guaranteed.",
  ],
  [
    "Do affiliate commissions affect rankings?",
    "Affiliate relationships do not automatically produce a higher score. Commercial relationships should not remove limitations, risk notes, or negative findings.",
  ],
  [
    "How often are reviews updated?",
    "Pages should be reviewed periodically and prioritized when major offer, licensing, payment, or operator information changes. Not every operator change will appear immediately.",
  ],
  [
    "Does SevenBet test deposits and withdrawals?",
    "The current methodology is based on available information and editorial review. SevenBet does not claim routine account testing, deposits, withdrawals, or support interactions unless stated on a specific review.",
  ],
  [
    "Why can bonus information change?",
    "Operators can update promotions, eligibility, wagering requirements, expiry windows, payment exclusions, and country availability at any time.",
  ],
  [
    "Can a casino's score go down?",
    "Yes. Scores may change when terms become less clear, licensing details change, payment conditions worsen, or new limitations are identified.",
  ],
  [
    "How can users report inaccurate information?",
    "Users can use the contact route listed on SevenBet pages where available. Reported issues should be checked against relevant sources before a page is updated.",
  ],
];

const reviewSteps = [
  ["Operator research", "Review publicly available information about the operator, ownership, website, terms, supported countries, and available products."],
  ["Licensing review", "Identify the licensing authority and explain what information is publicly available, including license details where listed."],
  ["Bonus terms review", "Review advertised offers, minimum deposit, wagering, time limits, maximum bet rules, game contribution, and withdrawal restrictions."],
  ["Payments review", "Assess deposit and withdrawal methods, stated processing times, fees, currencies, and identity verification requirements."],
  ["Responsible gambling review", "Check whether the operator presents deposit limits, session reminders, cooling-off periods, reality checks, or self-exclusion."],
  ["User experience review", "Evaluate navigation, clarity of information, access to terms, support options, and general usability."],
  ["Editorial assessment", "Apply the scoring framework consistently and document strengths, weaknesses, and limitations."],
  ["Ongoing updates", "Review published pages when offers, terms, licensing details, or major operator information changes."],
] as const;

const scoreWeights = [
  ["Licensing and operator transparency", 20],
  ["Bonus clarity and fairness", 20],
  ["Payments and withdrawal conditions", 20],
  ["Responsible gambling tools", 15],
  ["Website usability and information clarity", 10],
  ["Customer support information", 10],
  ["Account rules and restrictions", 5],
] as const;

const scoreRanges = [
  ["9.0–10.0", "Excellent overall information, strong terms, and broad responsible gambling features."],
  ["8.0–8.9", "Very good, with a few limitations users should review."],
  ["7.0–7.9", "Generally acceptable, but some terms or conditions require closer attention."],
  ["6.0–6.9", "Mixed assessment with notable limitations."],
  ["Below 6.0", "Significant concerns, unclear terms, weak tools, or limited transparency."],
] as const;

const criteriaGroups = [
  {
    title: "Bonus evaluation",
    intro: "Welcome offers are compared by practical terms, not headline size alone.",
    items: ["Advertised bonus amount", "Minimum deposit", "Wagering multiplier", "Wagering base", "Eligible games", "Game contribution percentages", "Time limits", "Maximum bet rules", "Maximum conversion or withdrawal restrictions", "Excluded payment methods", "Country restrictions", "Account eligibility", "Promotional terms availability"],
  },
  {
    title: "Licensing and operator transparency",
    intro: "Licensing can indicate oversight, but it does not remove gambling risk or guarantee a dispute outcome.",
    items: ["Licensing authority", "License number where publicly available", "Operating company", "Registered address where available", "Restricted jurisdictions", "Complaints or dispute procedures", "Terms and privacy information"],
  },
  {
    title: "Payments and withdrawals",
    intro: "Actual payment times can vary based on verification, provider, jurisdiction, and account review.",
    items: ["Payment method availability", "Minimum deposit", "Minimum withdrawal", "Stated processing times", "Withdrawal limits", "Fees", "Supported currencies", "Identity verification", "Pending periods", "Bonus-related withdrawal conditions"],
  },
  {
    title: "Responsible gambling tools",
    intro: "Availability and implementation can differ by country, license, and operator.",
    items: ["Deposit limits", "Loss limits", "Wagering limits", "Session reminders", "Reality checks", "Cooling-off periods", "Time-outs", "Self-exclusion", "Access to gambling history", "External support links"],
  },
] as const;

const sources = [
  "Operator websites",
  "Published bonus terms",
  "Casino terms and conditions",
  "Licensing authority databases",
  "Payment information pages",
  "Responsible gambling pages",
  "Publicly available company information",
  "Official announcements",
  "Supplementary third-party context where useful",
] as const;

const correctionSteps = [
  "Receive correction notice",
  "Review the relevant source",
  "Update the page when appropriate",
  "Refresh the last reviewed date",
  "Document material changes where practical",
] as const;

function DocumentSection({
  number,
  id,
  title,
  intro,
  children,
}: {
  number: string;
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.documentSection} id={id} aria-labelledby={`${id}-title`}>
      <p className={styles.sectionNumber}>{number}</p>
      <h2 id={`${id}-title`}>{title}</h2>
      {intro ? <p className={styles.sectionIntro}>{intro}</p> : null}
      {children}
    </section>
  );
}

export function MethodologyDocument() {
  return (
    <article className={styles.page} data-methodology-document>
      <header className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Ranking methodology</p>
          <h1>THE SCORE<br />{" "}SHOWS ITS WORK.</h1>
          <div className={styles.highlight} aria-hidden="true" />
          <p className={styles.heroLead}>
            SevenBet evaluates casino operators, welcome offers, responsible gambling tools, and editorial limitations through a structured comparison framework.
          </p>
          <p className={styles.heroCaveat}>
            The Editor&apos;s Score is an editorial comparison score—not a promise of winnings, availability, suitability, withdrawals, or dispute outcomes.
          </p>
          <dl className={styles.metadata} aria-label="Document metadata">
            <div><dt>Document</dt><dd>Editorial methodology</dd></div>
            <div><dt>Framework</dt><dd>10-point Editor&apos;s Score</dd></div>
            <div><dt>Last updated</dt><dd>July 12, 2026</dd></div>
          </dl>
        </div>
      </header>

      <div className={`${styles.shell} ${styles.documentGrid}`}>
        <nav className={styles.toc} aria-label="On this page">
          <p>On this page</p>
          <ol>
            <li><a href="#review-process"><span>01</span> Fields</a></li>
            <li><a href="#editors-score"><span>02</span> Score</a></li>
            <li><a href="#evaluation-criteria"><span>03</span> Evidence</a></li>
            <li><a href="#updates-corrections"><span>04</span> Updates</a></li>
          </ol>
        </nav>

        <div className={styles.documentColumn}>
          <DocumentSection
            number="01"
            id="purpose"
            title="WHY THIS METHODOLOGY EXISTS"
            intro="SevenBet uses a consistent editorial framework to make casino reviews and bonus comparisons easier to understand."
          >
            <div className={styles.twoColumnNotes}>
              <div>
                <h3>What users can compare</h3>
                <p>Licensing, bonus terms, wagering requirements, payments, withdrawal conditions, customer support, responsible gambling tools, and account restrictions.</p>
              </div>
              <div>
                <h3>What a positive review does not mean</h3>
                <p>Casino participation always involves financial risk. A positive review is not a guarantee of user experience, winnings, withdrawals, or dispute outcomes.</p>
              </div>
            </div>
          </DocumentSection>

          <DocumentSection
            number="02"
            id="review-process"
            title="EIGHT REVIEW STAGES"
            intro="The review separates evidence gathering from the final editorial assessment."
          >
            <ol className={styles.processLedger}>
              {reviewSteps.map(([title, text], index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </li>
              ))}
            </ol>
          </DocumentSection>

          <DocumentSection
            number="03"
            id="editors-score"
            title="10-POINT EDITOR'S SCORE"
            intro="The final score is an editorial comparison score, not a prediction of financial outcomes. The current numeric weights remain:"
          >
            <dl className={styles.weightLedger} aria-label="Editor's Score weights">
              {scoreWeights.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}%</dd>
                </div>
              ))}
            </dl>
            <div className={styles.rangeLedger} aria-label="Editor's Score interpretation">
              <h3>Score interpretation</h3>
              <dl>
                {scoreRanges.map(([range, text]) => (
                  <div key={range}><dt>{range}</dt><dd>{text}</dd></div>
                ))}
              </dl>
            </div>
          </DocumentSection>

          <DocumentSection
            number="04"
            id="evaluation-criteria"
            title="EVIDENCE BEFORE OPINION"
            intro="The largest advertised bonus is not necessarily the most favorable offer. Terms, restrictions, payment rules, and user-protection tools all matter."
          >
            <div className={styles.criteriaGroups}>
              {criteriaGroups.map((group) => (
                <section key={group.title} aria-labelledby={`criteria-${group.title.toLowerCase().replaceAll(" ", "-")}`}>
                  <h3 id={`criteria-${group.title.toLowerCase().replaceAll(" ", "-")}`}>{group.title}</h3>
                  <p>{group.intro}</p>
                  <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ))}
            </div>
          </DocumentSection>

          <DocumentSection
            number="05"
            id="information-sources"
            title="SOURCES USED FOR REVIEW"
            intro="Available primary information leads the assessment. Supplementary third-party material provides context, not final proof."
          >
            <ol className={styles.sourceLedger}>
              {sources.map((source, index) => <li key={source}><span>{String(index + 1).padStart(2, "0")}</span>{source}</li>)}
            </ol>
          </DocumentSection>

          <DocumentSection
            number="06"
            id="updates-corrections"
            title="UPDATES & CORRECTIONS"
            intro="Information is reviewed, but operator changes can happen between updates."
          >
            <p className={styles.bodyCopy}>
              SevenBet pages should show a visible last reviewed date, receive periodic checks, and be prioritized after major offer, licensing, payment, or operator changes. Outdated offers may be revised or removed when appropriate.
            </p>
            <ol className={styles.correctionLedger}>
              {correctionSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}
            </ol>
          </DocumentSection>

          <DocumentSection
            number="07"
            id="independence"
            title="EDITORIAL & COMMERCIAL SEPARATION"
            intro="Commercial relationships and editorial assessment are separate."
          >
            <div className={styles.boundaryLedger}>
              <div>
                <h3>Editorial independence</h3>
                <p>Affiliate status does not automatically produce a higher score. Paid placement should be identified where applicable, comparison criteria should be applied consistently, and material limitations should remain visible. Commercial partners may be excluded if information is insufficient or concerns are significant.</p>
              </div>
              <div>
                <h3>Affiliate relationships</h3>
                <p>SevenBet may receive a commission when a user follows certain links and completes a qualifying action. Users do not usually pay SevenBet directly for comparison content. Not every reviewed casino must be an affiliate partner, and affiliate relationships should not remove negative findings.</p>
                <Link href="/affiliate-disclosure">Read the full affiliate disclosure <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </DocumentSection>

          <DocumentSection
            number="08"
            id="limitations"
            title="WEIGHTS DO NOT ERASE RED FLAGS"
            intro="Editorial scores are not guarantees."
          >
            <div className={styles.limitations}>
              <strong>Limitations remain visible.</strong>
              <p>Offers can change, availability differs by country, operator terms may be updated, and actual user experiences vary. SevenBet does not guarantee winnings, withdrawals, operator conduct, or dispute outcomes. Users should always review current operator terms before registering or depositing.</p>
              <p>SevenBet does not claim routine account testing, deposits, withdrawals, or support interactions unless stated on a specific review.</p>
            </div>
          </DocumentSection>

          <DocumentSection number="09" id="related-resources" title="RELATED SEVENBET RESOURCES">
            <nav className={styles.relatedLinks} aria-label="Related methodology resources">
              {[
                ["Casino reviews", "/casinos"],
                ["Casino bonuses", "/bonuses"],
                ["Responsible gambling hub", "/responsible-gambling"],
                ["10-Step Program", "/program"],
                ["Self-Check", "/self-check"],
                ["About SevenBet", "/about"],
              ].map(([label, href], index) => (
                <Link href={href} key={href}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><small>Open resource</small></Link>
              ))}
            </nav>
          </DocumentSection>

          <DocumentSection number="10" id="methodology-faq" title="METHODOLOGY QUESTIONS">
            <div className={styles.faqList}>
              {methodologyFaqItems.map(([question, answer], index) => (
                <details key={question}>
                  <summary><span>{String(index + 1).padStart(2, "0")}</span>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </DocumentSection>

          <p className={styles.documentNote}>
            CURRENT EDITORIAL FRAMEWORK · WEIGHTS, LIMITATIONS, AFFILIATE SEPARATION AND CORRECTION RULES PRESERVED.
          </p>
        </div>
      </div>
    </article>
  );
}
