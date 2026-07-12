import Link from "next/link";
import { AffiliateDisclosure, Badge, Button, Card, Container, CTA, FAQ, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/ResponsibleGamblingHub";

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
  {
    title: "Operator research",
    text: "Review publicly available information about the operator, ownership, website, terms, supported countries, and available products.",
  },
  {
    title: "Licensing review",
    text: "Identify the licensing authority and explain what information is publicly available, including license details where listed.",
  },
  {
    title: "Bonus terms review",
    text: "Review advertised offers, minimum deposit, wagering, time limits, maximum bet rules, game contribution, and withdrawal restrictions.",
  },
  {
    title: "Payments review",
    text: "Assess deposit and withdrawal methods, stated processing times, fees, currencies, and identity verification requirements.",
  },
  {
    title: "Responsible gambling review",
    text: "Check whether the operator presents deposit limits, session reminders, cooling-off periods, reality checks, or self-exclusion.",
  },
  {
    title: "User experience review",
    text: "Evaluate navigation, clarity of information, access to terms, support options, and general usability.",
  },
  {
    title: "Editorial assessment",
    text: "Apply the scoring framework consistently and document strengths, weaknesses, and limitations.",
  },
  {
    title: "Ongoing updates",
    text: "Review published pages when offers, terms, licensing details, or major operator information changes.",
  },
];

const scoreWeights = [
  ["Licensing and operator transparency", 20],
  ["Bonus clarity and fairness", 20],
  ["Payments and withdrawal conditions", 20],
  ["Responsible gambling tools", 15],
  ["Website usability and information clarity", 10],
  ["Customer support information", 10],
  ["Account rules and restrictions", 5],
];

const scoreRanges = [
  ["9.0-10.0", "Excellent overall information, strong terms, and broad responsible gambling features."],
  ["8.0-8.9", "Very good, with a few limitations users should review."],
  ["7.0-7.9", "Generally acceptable, but some terms or conditions require closer attention."],
  ["6.0-6.9", "Mixed assessment with notable limitations."],
  ["Below 6.0", "Significant concerns, unclear terms, weak tools, or limited transparency."],
];

const bonusCriteria = [
  "Advertised bonus amount",
  "Minimum deposit",
  "Wagering multiplier",
  "Wagering base",
  "Eligible games",
  "Game contribution percentages",
  "Time limits",
  "Maximum bet rules",
  "Maximum conversion or withdrawal restrictions",
  "Excluded payment methods",
  "Country restrictions",
  "Account eligibility",
  "Promotional terms availability",
];

const licensingCriteria = [
  "Licensing authority",
  "License number where publicly available",
  "Operating company",
  "Registered address where available",
  "Restricted jurisdictions",
  "Complaints or dispute procedures",
  "Terms and privacy information",
];

const paymentCriteria = [
  "Payment method availability",
  "Minimum deposit",
  "Minimum withdrawal",
  "Stated processing times",
  "Withdrawal limits",
  "Fees",
  "Supported currencies",
  "Identity verification",
  "Pending periods",
  "Bonus-related withdrawal conditions",
];

const responsibleCriteria = [
  "Deposit limits",
  "Loss limits",
  "Wagering limits",
  "Session reminders",
  "Reality checks",
  "Cooling-off periods",
  "Time-outs",
  "Self-exclusion",
  "Access to gambling history",
  "External support links",
];

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
];

export function MethodologyHero() {
  return (
    <section className="pageShell">
      <Container>
        <p className="eyebrow">Methodology</p>
        <h1>How SevenBet Reviews Casinos and Bonuses</h1>
        <p className="lead">
          Our methodology explains how we evaluate casino operators, compare welcome offers, assess responsible
          gambling tools, and keep our editorial content up to date.
        </p>
        <div className="heroActions">
          <Button href="#rating-criteria" variant="primary">View Our Rating Criteria</Button>
          <Button href="/affiliate-disclosure" variant="ghost">Read Affiliate Disclosure</Button>
        </div>
        <Breadcrumbs />
        <div className="trustStrip">
          <Badge tone="green">Transparent evaluation criteria</Badge>
          <Badge>Clear scoring framework</Badge>
          <Badge tone="dark">Regular content reviews</Badge>
          <Badge tone="dark">Last updated July 12, 2026</Badge>
          <Badge tone="warning">Visible affiliate disclosure</Badge>
        </div>
      </Container>
    </section>
  );
}

export function ReviewProcessTimeline() {
  return (
    <div className="stepTimeline">
      {reviewSteps.map((step, index) => (
        <Card className="timelineCard" key={step.title}>
          <div className="timelineMeta">
            <span className="cardRank">Step {index + 1}</span>
          </div>
          <div>
            <h3>{step.title}</h3>
            <p className="muted">{step.text}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ScoreBreakdown() {
  return (
    <div className="guideGrid oneCol">
      {scoreWeights.map(([label, value]) => (
        <Card className="ratingBlock methodologyWeight" key={label}>
          <div>
            <strong>{value}%</strong>
            <span>{label}</span>
          </div>
          <div className="ratingBar" aria-label={`${label}: ${value}%`}>
            <span style={{ width: `${value}%` }} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ScoreRangeCard() {
  return (
    <div className="guideGrid">
      {scoreRanges.map(([range, text]) => (
        <Card className="guideCard" key={range}>
          <Badge tone="dark">{range}</Badge>
          <h3>{range}</h3>
          <p className="muted">{text}</p>
        </Card>
      ))}
    </div>
  );
}

export function EvaluationCriteriaGrid({
  title,
  intro,
  items,
}: {
  title: string;
  intro: string;
  items: string[];
}) {
  return (
    <Card className="guideCard evaluationPanel">
      <h3>{title}</h3>
      <p className="muted">{intro}</p>
      <div className="miniTasks">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </Card>
  );
}

export function SourceList() {
  return (
    <div className="guideGrid">
      {sources.map((source) => (
        <Card className="guideCard" key={source}>
          <h3>{source}</h3>
          <p className="muted">
            Used as available information for editorial review. Third-party sources are treated as supplementary
            context, not final proof.
          </p>
        </Card>
      ))}
    </div>
  );
}

export function UpdatePolicyPanel() {
  return (
    <Card className="ctaBlock" tone="soft">
      <div>
        <Badge tone="green">Update policy</Badge>
        <h2>Information is reviewed, but operator changes can happen between updates.</h2>
        <p className="muted">
          SevenBet pages should show a visible last reviewed date, receive periodic checks, and be prioritized after
          major offer, licensing, payment, or operator changes. Outdated offers may be revised or removed when
          appropriate.
        </p>
      </div>
      <div className="heroActions">
        <Button href="/casinos" variant="ghost">Browse Reviews</Button>
      </div>
    </Card>
  );
}

export function EditorialIndependencePanel() {
  return (
    <Card className="guideCard" tone="soft">
      <Badge tone="green">Editorial independence</Badge>
      <h3>Commercial relationships and editorial assessment are separate.</h3>
      <p className="muted">
        Affiliate status does not automatically produce a higher score. Paid placement should be identified where
        applicable, comparison criteria should be applied consistently, and material limitations should remain visible.
        Commercial partners may be excluded if information is insufficient or concerns are significant.
      </p>
    </Card>
  );
}

export function LimitationsNotice() {
  return (
    <Card className="guideCard" tone="warning">
      <Badge tone="warning">Limitations</Badge>
      <h3>Editorial scores are not guarantees.</h3>
      <p className="muted">
        Offers can change, availability differs by country, operator terms may be updated, and actual user experiences
        vary. SevenBet does not guarantee winnings, withdrawals, operator conduct, or dispute outcomes. Users should
        always review current operator terms before registering or depositing.
      </p>
    </Card>
  );
}

export function CorrectionsProcess() {
  const steps = [
    "Receive correction notice",
    "Review the relevant source",
    "Update the page when appropriate",
    "Refresh the last reviewed date",
    "Document material changes where practical",
  ];

  return (
    <div className="guideGrid">
      {steps.map((step, index) => (
        <Card className="guideCard" key={step}>
          <span className="cardRank">{index + 1}</span>
          <h3>{step}</h3>
        </Card>
      ))}
    </div>
  );
}

export function MethodologyFAQ() {
  return <FAQ items={methodologyFaqItems} />;
}

export function MethodologyContent() {
  return (
    <>
      <Section
        eyebrow="Purpose"
        title="Why this methodology exists."
        intro="SevenBet uses a consistent editorial framework to make casino reviews and bonus comparisons easier to understand."
      >
        <div className="guideGrid twoCards">
          <Card className="guideCard">
            <h3>What users can compare</h3>
            <p className="muted">
              The framework presents licensing, bonus terms, wagering requirements, payments, withdrawal conditions,
              customer support, responsible gambling tools, and account restrictions in a structured format.
            </p>
          </Card>
          <Card className="guideCard" tone="warning">
            <h3>What a positive review does not mean</h3>
            <p className="muted">
              Casino participation always involves financial risk. A positive review is not a guarantee of user
              experience, winnings, withdrawals, or dispute outcomes.
            </p>
          </Card>
        </div>
      </Section>

      <Section eyebrow="Review process" title="How a casino profile is reviewed.">
        <ReviewProcessTimeline />
      </Section>

      <Section
        eyebrow="Rating framework"
        title="10-point Editor's Score."
        intro="The final score is an editorial comparison score, not a prediction of financial outcomes."
      >
        <div id="rating-criteria">
          <ScoreBreakdown />
        </div>
      </Section>

      <Section eyebrow="Score interpretation" title="What each score range means.">
        <ScoreRangeCard />
      </Section>

      <Section
        eyebrow="Evaluation criteria"
        title="What SevenBet checks before presenting casino information."
        intro="The largest advertised bonus is not necessarily the most favorable offer. Terms, restrictions, payment rules, and user protection tools all matter."
      >
        <div className="guideGrid oneCol">
          <EvaluationCriteriaGrid
            title="Bonus evaluation"
            intro="Welcome offers are compared by practical terms, not headline size alone."
            items={bonusCriteria}
          />
          <EvaluationCriteriaGrid
            title="Licensing and operator transparency"
            intro="Licensing can indicate oversight, but it does not remove gambling risk or guarantee a dispute outcome."
            items={licensingCriteria}
          />
          <EvaluationCriteriaGrid
            title="Payments and withdrawals"
            intro="Actual payment times can vary based on verification, provider, jurisdiction, and account review."
            items={paymentCriteria}
          />
          <EvaluationCriteriaGrid
            title="Responsible gambling tools"
            intro="Availability and implementation can differ by country, license, and operator."
            items={responsibleCriteria}
          />
        </div>
      </Section>

      <Section eyebrow="Information sources" title="Sources used for editorial review.">
        <SourceList />
      </Section>

      <Section eyebrow="Update policy" title="How content is maintained.">
        <UpdatePolicyPanel />
      </Section>

      <Section eyebrow="Editorial independence" title="How commercial relationships are handled.">
        <div className="guideGrid twoCards">
          <EditorialIndependencePanel />
          <LimitationsNotice />
        </div>
      </Section>

      <Section eyebrow="Affiliate relationships" title="How affiliate links may appear.">
        <div className="guideGrid twoCards">
          <AffiliateDisclosure />
          <Card className="guideCard">
            <h3>Commissions and reviews</h3>
            <p className="muted">
              SevenBet may receive a commission when a user follows certain links and completes a qualifying action.
              Users do not usually pay SevenBet directly for comparison content. Not every reviewed casino must be an
              affiliate partner, and affiliate relationships should not remove negative findings.
            </p>
            <Button href="/affiliate-disclosure" variant="primary">Read Full Affiliate Disclosure</Button>
          </Card>
        </div>
      </Section>

      <Section eyebrow="Corrections policy" title="How errors and outdated information should be handled.">
        <CorrectionsProcess />
      </Section>

      <Section eyebrow="Internal links" title="Related SevenBet resources.">
        <div className="relatedGrid">
          {[
            ["Casino Reviews", "/casinos"],
            ["Casino Bonuses", "/bonuses"],
            ["Responsible Gambling Hub", "/responsible-gambling"],
            ["10-Step Program", "/program"],
            ["Self-Check", "/self-check"],
            ["About SevenBet", "/about"],
          ].map(([title, href]) => (
            <Link className="relatedArticle" href={href} key={href}>
              <span>SevenBet resource</span>
              <strong>{title}</strong>
              <small>Open resource</small>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Methodology questions.">
        <MethodologyFAQ />
      </Section>

      <Section eyebrow="Compare with context" title="Compare Casinos Using Transparent Criteria">
        <CTA
          title="Use the methodology before relying on any casino score or bonus headline."
          primary={{ href: "/casinos", label: "Browse Casino Reviews" }}
          secondary={{ href: "/bonuses", label: "Compare Welcome Bonuses" }}
        />
        <div className="sectionButton">
          <Button href="/affiliate-disclosure" variant="ghost">Read Affiliate Disclosure</Button>
        </div>
      </Section>
    </>
  );
}
