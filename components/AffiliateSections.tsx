import { Badge, Button, Card, Container, CTA, FAQ, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/ResponsibleGamblingHub";

export const affiliateFaqItems: Array<[string, string]> = [
  [
    "What is an affiliate link?",
    "An affiliate link is a tracked link that may let SevenBet receive a commission if a reader visits an operator and completes a qualifying action.",
  ],
  [
    "Does using an affiliate link cost me extra?",
    "Affiliate commissions generally come from the operator, not directly from the reader. Users should still review the operator's own terms, fees, and conditions.",
  ],
  [
    "Can SevenBet receive commissions from every casino?",
    "No. Not every casino listed or reviewed on SevenBet has to be an affiliate partner.",
  ],
  [
    "Do affiliate commissions affect rankings?",
    "Affiliate relationships should not automatically determine rankings or review scores. SevenBet's methodology explains the criteria used for editorial evaluation.",
  ],
  [
    "Why does SevenBet use affiliate partnerships?",
    "Affiliate partnerships may help support site operations while keeping educational guides and comparison content available to readers.",
  ],
];

const affiliateFlow = [
  ["Reader visits SevenBet", "A reader lands on an educational guide, casino review, or comparison page."],
  ["Reader compares information", "They review bonus terms, licensing, payments, responsible gambling tools, and editorial context."],
  ["Reader chooses to visit an operator", "The reader may click an outbound link to an operator website."],
  ["Reader may register", "Registration, deposits, or other actions happen on the operator website, not on SevenBet."],
  ["A commission may be paid", "If the visit qualifies under a partner agreement, SevenBet may receive a commission from the operator."],
];

const editorialPrinciples = [
  "Editorial content is created independently.",
  "Commercial relationships do not automatically determine review scores.",
  "Strengths and weaknesses should both be disclosed.",
  "Important limitations should not be hidden.",
  "Comparison criteria are applied consistently.",
];

const misconceptions = [
  "Affiliate links do not mean an operator has no gambling risk.",
  "Affiliate links do not guarantee bonus availability.",
  "Affiliate relationships do not eliminate gambling risk.",
  "A reviewed casino is not automatically appropriate for every reader.",
];

const readerChecks = [
  "Review the latest bonus terms.",
  "Confirm local availability.",
  "Check licensing information.",
  "Read operator terms and conditions.",
  "Use responsible gambling tools where available.",
];

export function AffiliateHero() {
  return (
    <section className="pageShell">
      <Container>
        <p className="eyebrow">Affiliate disclosure</p>
        <h1>Affiliate Disclosure</h1>
        <p className="lead">
          We believe readers should understand how SevenBet is funded and how affiliate relationships fit into our
          editorial process.
        </p>
        <div className="heroActions">
          <Button href="/methodology" variant="primary">Read Our Methodology</Button>
          <Button href="/casinos" variant="ghost">Browse Casino Reviews</Button>
        </div>
        <Breadcrumbs />
        <div className="trustStrip">
          <Badge tone="green">Plain-English disclosure</Badge>
          <Badge>Reader-first explanation</Badge>
          <Badge tone="dark">Editorial criteria remain visible</Badge>
          <Badge tone="warning">18+ only</Badge>
        </div>
      </Container>
    </section>
  );
}

export function AffiliateFlow() {
  return (
    <div className="stepTimeline">
      {affiliateFlow.map(([title, text], index) => (
        <Card className="timelineCard" key={title}>
          <div className="timelineMeta">
            <span className="cardRank">{index + 1}</span>
          </div>
          <div>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function EditorialIndependenceCards() {
  return (
    <div className="guideGrid">
      {editorialPrinciples.map((item) => (
        <Card className="guideCard" key={item}>
          <Badge tone="green">Editorial principle</Badge>
          <h3>{item}</h3>
        </Card>
      ))}
    </div>
  );
}

export function AffiliateMisconceptions() {
  return (
    <div className="guideGrid twoCards">
      {misconceptions.map((item) => (
        <Card className="guideCard" tone="warning" key={item}>
          <h3>{item}</h3>
        </Card>
      ))}
    </div>
  );
}

export function ReaderResponsibilityCards() {
  return (
    <div className="guideGrid">
      {readerChecks.map((item) => (
        <Card className="guideCard" key={item}>
          <h3>{item}</h3>
        </Card>
      ))}
    </div>
  );
}

export function AffiliateFAQ() {
  return <FAQ items={affiliateFaqItems} />;
}

export function AffiliateContent() {
  return (
    <>
      <Section
        eyebrow="Why this page exists"
        title="Some SevenBet links may be affiliate links."
        intro="If a reader follows one of those links and completes a qualifying action, SevenBet may receive a commission from the operator. This disclosure exists so readers understand that relationship."
      />

      <Section
        eyebrow="How affiliate links work"
        title="The relationship is simple: readers compare, operators may pay commissions."
        intro="Commissions generally come from the operator, not directly from the reader."
      >
        <AffiliateFlow />
      </Section>

      <Section
        eyebrow="Editorial independence"
        title="Commercial relationships should not hide important information."
      >
        <EditorialIndependenceCards />
      </Section>

      <Section
        eyebrow="What affiliate relationships do not mean"
        title="An affiliate link is not a guarantee."
        intro="Readers should not treat a commercial relationship as a substitute for reviewing terms, licensing, availability, and personal limits."
      >
        <AffiliateMisconceptions />
      </Section>

      <Section
        eyebrow="Reader responsibility"
        title="What readers should check before registering."
      >
        <ReaderResponsibilityCards />
      </Section>

      <Section eyebrow="FAQ" title="Affiliate disclosure questions.">
        <AffiliateFAQ />
      </Section>

      <Section eyebrow="Next step" title="Want to understand how reviews are created?">
        <CTA
          title="Read the full review methodology or explore casino reviews with disclosure context in mind."
          primary={{ href: "/methodology", label: "Read Our Methodology" }}
          secondary={{ href: "/casinos", label: "Explore Casino Reviews" }}
        />
      </Section>
    </>
  );
}
