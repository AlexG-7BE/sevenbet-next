import Link from "next/link";
import { Badge, Button, Card, Container, CTA, FAQ, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/ResponsibleGamblingHub";

export const aboutFaqItems: Array<[string, string]> = [
  [
    "What is SevenBet?",
    "SevenBet is an educational platform that explains online casino terms, welcome bonuses, responsible gambling concepts, and casino comparison criteria.",
  ],
  [
    "Who writes the reviews?",
    "SevenBet reviews are written as editorial content using the site's published methodology and available casino information.",
  ],
  [
    "How are casinos compared?",
    "Casinos are compared by licensing information, bonus terms, wagering, payments, withdrawal conditions, responsible gambling tools, and clarity of information.",
  ],
  [
    "How does SevenBet make money?",
    "Some links may generate affiliate commissions if a user follows a link and completes a qualifying action. The Affiliate Disclosure explains this in more detail.",
  ],
  [
    "Does SevenBet operate casinos?",
    "No. SevenBet does not operate online casinos, accept deposits, process withdrawals, or issue gambling licenses.",
  ],
  [
    "Can I trust the ratings?",
    "Ratings are editorial comparison scores, not guarantees. Users should read the methodology and review current operator terms before making decisions.",
  ],
  [
    "Is the 10-Step Program free?",
    "The current SevenBet 10-Step Program is presented as a free educational framework on the website.",
  ],
];

const whatWeDo = [
  {
    title: "Educational Guides",
    text: "Provide explanations of casino terminology, bonus mechanics, licensing, and responsible gambling concepts.",
    href: "/responsible-gambling",
  },
  {
    title: "Casino Reviews",
    text: "Publish structured editorial reviews using transparent evaluation criteria.",
    href: "/casinos",
  },
  {
    title: "Bonus Comparisons",
    text: "Compare welcome offers using consistent criteria such as wagering, payments, licensing, and restrictions.",
    href: "/bonuses",
  },
  {
    title: "10-Step Program",
    text: "Provide a structured educational framework to encourage planning and informed decision-making.",
    href: "/program",
  },
];

const boundaries = [
  "We do not provide financial advice.",
  "We do not provide psychological or medical treatment.",
  "We do not guarantee outcomes.",
  "We do not operate online casinos.",
  "We do not issue gambling licenses.",
  "We do not resolve disputes between players and operators.",
];

const principles = [
  "Transparency",
  "Consistency",
  "Clear comparisons",
  "Regular updates",
  "Responsible communication",
  "Visible affiliate disclosure",
  "Educational focus",
];

const journey = [
  ["Learn", "Start with guides that explain terms, tools, and common comparison criteria."],
  ["Reflect", "Use the self-check or 10-Step Program before comparing casino options."],
  ["Understand", "Review bonus mechanics, licensing, payments, and responsible gambling tools."],
  ["Compare", "Use structured casino reviews and bonus comparisons as informational resources."],
  ["Decide", "Make decisions against your own limits, local rules, and current operator terms."],
  ["Review Again", "Return to guides and methodology when offers or circumstances change."],
];

const platformAreas = [
  ["Editorial content", "Clear pages explaining how casino information is reviewed and organized."],
  ["Educational resources", "Learning guides for bonus terms, payments, licensing, and gambling tools."],
  ["Review methodology", "A public framework for ratings, scoring weights, limitations, and corrections."],
  ["Comparison tools", "Directories that compare casinos and welcome offers using structured fields."],
  ["Learning center", "A responsible gambling hub with guides for money, time, tools, and industry basics."],
  ["10-Step Program", "A planning-first educational path before casino comparison."],
];

export function AboutHero() {
  return (
    <section className="pageShell">
      <Container>
        <p className="eyebrow">About SevenBet</p>
        <h1>About SevenBet</h1>
        <p className="lead">
          SevenBet is an educational platform that helps people better understand online casinos, welcome bonuses, and
          responsible gambling practices through structured guides, transparent comparisons, and editorial reviews.
        </p>
        <div className="heroActions">
          <Button href="/program" variant="primary">Explore the 10-Step Program</Button>
          <Button href="/methodology" variant="ghost">Learn Our Methodology</Button>
        </div>
        <Breadcrumbs />
        <div className="trustStrip">
          <Badge tone="green">Educational platform</Badge>
          <Badge>Transparent comparisons</Badge>
          <Badge tone="dark">Editorial reviews</Badge>
          <Badge tone="warning">18+ responsible gambling context</Badge>
        </div>
      </Container>
    </section>
  );
}

export function WhatWeDoCards() {
  return (
    <div className="guideGrid">
      {whatWeDo.map((item) => (
        <Card className="guideCard" key={item.title}>
          <Badge tone="green">SevenBet resource</Badge>
          <h3>{item.title}</h3>
          <p className="muted">{item.text}</p>
          <Button href={item.href} variant="ghost">Open resource</Button>
        </Card>
      ))}
    </div>
  );
}

export function BoundaryList() {
  return (
    <div className="guideGrid twoCards">
      {boundaries.map((item) => (
        <Card className="guideCard" tone="warning" key={item}>
          <h3>{item}</h3>
        </Card>
      ))}
    </div>
  );
}

export function EditorialPrinciples() {
  return (
    <div className="miniTasks articleTips">
      {principles.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function PlatformJourney() {
  return (
    <div className="stepTimeline">
      {journey.map(([title, text], index) => (
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

export function PlatformAreas() {
  return (
    <div className="guideGrid">
      {platformAreas.map(([title, text]) => (
        <Card className="guideCard" key={title}>
          <h3>{title}</h3>
          <p className="muted">{text}</p>
        </Card>
      ))}
    </div>
  );
}

export function AboutFAQ() {
  return <FAQ items={aboutFaqItems} />;
}

export function AboutContent() {
  return (
    <>
      <Section
        eyebrow="Our mission"
        title="Organize casino information into clearer educational resources."
        intro="Online casino information is often fragmented, overly promotional, or difficult to compare. SevenBet aims to organize this information into educational guides, structured comparisons, and transparent reviews so users can make more informed decisions."
      />

      <Section eyebrow="What we do" title="Four ways SevenBet helps users understand the landscape.">
        <WhatWeDoCards />
      </Section>

      <Section
        eyebrow="What we do not do"
        title="Clear boundaries matter."
        intro="SevenBet is not a healthcare provider, regulator, casino operator, or dispute resolution service."
      >
        <BoundaryList />
      </Section>

      <Section eyebrow="Editorial principles" title="The standards behind the platform.">
        <EditorialPrinciples />
      </Section>

      <Section
        eyebrow="How SevenBet works"
        title="Learn, reflect, understand, compare, decide, and review again."
        intro="The platform combines educational content with structured comparison resources. Casino comparisons are useful only when users understand the terms, risks, and their own limits."
      >
        <PlatformJourney />
      </Section>

      <Section eyebrow="How the site is funded" title="Affiliate relationships are disclosed.">
        <div className="guideGrid twoCards">
          <Card className="guideCard" tone="soft">
            <Badge tone="warning">Affiliate disclosure</Badge>
            <h3>Some links may generate commissions.</h3>
            <p className="muted">
              These partnerships may help support site operations. They should not determine editorial conclusions,
              remove limitations, or hide responsible gambling context.
            </p>
            <Button href="/affiliate-disclosure" variant="primary">Read Affiliate Disclosure</Button>
          </Card>
          <Card className="guideCard">
            <h3>Readers stay in control.</h3>
            <p className="muted">
              SevenBet does not usually charge users directly for comparison content. Users should still review current
              operator terms, local rules, and personal limits before registering or depositing.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="Responsible gambling commitment"
        title="Education before comparison."
        intro="SevenBet encourages users to understand gambling risks, review bonus terms, set limits where available, use responsible gambling tools, take breaks when needed, and seek independent support resources if gambling becomes difficult to control."
      />

      <Section eyebrow="Meet the platform" title="SevenBet is built around connected educational resources.">
        <PlatformAreas />
      </Section>

      <Section eyebrow="Useful links" title="Explore the core SevenBet resources.">
        <div className="relatedGrid">
          {[
            ["Methodology", "/methodology"],
            ["Responsible Gambling Hub", "/responsible-gambling"],
            ["10-Step Program", "/program"],
            ["Casino Reviews", "/casinos"],
            ["Casino Bonuses", "/bonuses"],
            ["Affiliate Disclosure", "/affiliate-disclosure"],
          ].map(([title, href]) => (
            <Link className="relatedArticle" href={href} key={href}>
              <span>SevenBet resource</span>
              <strong>{title}</strong>
              <small>Open resource</small>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="About SevenBet: common questions.">
        <AboutFAQ />
      </Section>

      <Section eyebrow="Next step" title="Ready to Explore SevenBet?">
        <CTA
          title="Start with the program or browse reviews with the methodology in mind."
          primary={{ href: "/program", label: "Start the 10-Step Program" }}
          secondary={{ href: "/casinos", label: "Browse Casino Reviews" }}
        />
      </Section>
    </>
  );
}
