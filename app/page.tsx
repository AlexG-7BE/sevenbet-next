import { ProgramTimeline, ResourceCards } from "@/components/PageTemplates";
import {
  AffiliateDisclosure,
  Badge,
  Button,
  Card,
  CTA,
  FAQ,
  Container,
  MethodologyBlock,
  OfferCard,
  Section,
} from "@/components/ui";
import { getTopCasinos } from "@/lib/data";
import { programSteps } from "@/lib/program";

export default function HomePage() {
  const topCasinos = getTopCasinos(3);

  return (
    <>
      <section className="heroShell">
        <Container className="heroGrid">
          <div className="heroCopy">
            <Badge tone="green">SevenBet 10-Step Control Program · 18+</Badge>
            <h1>Help users make more informed gambling decisions.</h1>
            <p className="lead">
              SevenBet combines a structured 10-Step Program, educational resources and transparent casino comparisons
              to help people understand risks, read terms clearly and make informed choices.
            </p>
            <div className="heroActions">
              <Button href="/program" variant="primary">
                Start the 10-Step Program
              </Button>
              <Button href="#how-it-works" variant="ghost">
                Learn how it works
              </Button>
            </div>
            <div className="trustStrip">
              <Badge>Structured 10-step framework</Badge>
              <Badge>Educational resources</Badge>
              <Badge>Transparent bonus comparisons</Badge>
            </div>
          </div>

          <Card className="decisionConsole" tone="soft">
            <div className="consoleHeader">
              <div>
                <p className="eyebrow">Primary journey</p>
                <h2>Start with a plan</h2>
              </div>
              <Badge tone="warning">10 steps</Badge>
            </div>
            <div className="consoleMain">
              <div className="scoreOrb">
                <strong>10</strong>
                <span>control program steps</span>
              </div>
              <div className="consoleChecks">
                <div><span>Assessment</span><strong>Understand habits</strong></div>
                <div><span>Limits</span><strong>Set boundaries</strong></div>
                <div><span>Comparison</span><strong>Use facts</strong></div>
              </div>
            </div>
            <div className="miniOfferList">
              {programSteps.slice(0, 2).map((step) => (
                <article key={step.day}>
                  <div>
                    <strong>Step {step.day}: {step.title}</strong>
                    <span>{step.estimatedTime} · {step.tasks.join(", ")}</span>
                  </div>
                  <Button href="/program" variant="ghost">Open</Button>
                </article>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <Section eyebrow="Why SevenBet exists" title="A clearer way to approach gambling decisions.">
        <div className="versusGrid">
          <Card className="versusCard">
            <h3>Understand before you act</h3>
            <p className="muted">
              SevenBet helps users understand bonus terms, wagering requirements, withdrawal conditions and the signals
              that can make gambling decisions riskier.
            </p>
          </Card>
          <Card className="versusCard">
            <h3>Compare with context</h3>
            <p className="muted">
              Casino information is presented through transparent criteria: licensing, payment options, responsible
              gambling tools, bonus terms and review links.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="10-step program"
        title="The SevenBet 10-Step Control Program"
        intro="The centerpiece of SevenBet: ten practical steps for building awareness, setting limits and making more deliberate choices."
      >
        <ProgramTimeline steps={programSteps} />
        <Button className="sectionButton" href="/program" variant="primary">
          Start the Program
        </Button>
      </Section>

      <Section
        eyebrow="How it works"
        title="How the SevenBet journey works."
        className="anchoredSection"
      >
        <span id="how-it-works" />
        <div className="stageGrid">
          {[
            ["01", "Understand your habits", "Use the program and self-check to notice patterns, triggers and decision points."],
            ["02", "Learn key concepts", "Read plain-language guides about wagering, bonuses, licensing and withdrawal rules."],
            ["03", "Build a personal plan", "Set limits, write down rules and decide what should happen before a session starts."],
            ["04", "Compare options responsibly", "Use casino comparisons as an informational resource after the plan is clear."],
          ].map(([number, title, text]) => (
            <Card className="stageCard" key={number}>
              <span className="cardRank">{number}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Educational guides" title="Learn the concepts behind safer comparison.">
        <ResourceCards
          items={[
            { title: "Understanding wagering requirements", text: "Learn how wagering, max bet rules and expiry windows affect bonus value.", href: "/bonus-guide", badge: "Guide" },
            { title: "Deposit limits", text: "Use deposit and stop-loss limits as part of a written gambling plan.", href: "/tools/budget-calculator", badge: "Tool" },
            { title: "Withdrawal times", text: "Understand why payout speed, KYC and withdrawal limits matter before choosing a casino.", href: "/casinos", badge: "Review" },
            { title: "Casino licensing", text: "Learn why licensing and operator transparency are part of the review process.", href: "/methodology", badge: "Methodology" },
            { title: "Responsible gambling tools", text: "Review limits, cool-off options, self-exclusion information and external support routes.", href: "/responsible-gambling", badge: "Safety" },
            { title: "How bonus terms work", text: "Compare offers by terms and conditions, not only by headline value.", href: "/bonuses", badge: "Comparison" },
          ]}
        />
      </Section>

      <Section
        eyebrow="Verified casino comparisons"
        title="Casino comparison as an informational resource."
        intro="SevenBet reviews casinos using transparent criteria including licensing, welcome offer terms, wagering requirements, withdrawal methods, payment options and responsible gambling features."
      >
        <div className="bonusGrid">
          {topCasinos.map((casino, index) => (
            <OfferCard casino={casino} key={casino.slug} rank={index + 1} />
          ))}
        </div>
        <Button className="sectionButton" href="/bonuses" variant="ghost">
          Explore Casino Comparisons
        </Button>
      </Section>

      <Section eyebrow="Review methodology" title="How reviews are created.">
        <MethodologyBlock />
        <ResourceCards
          items={[
            { title: "Transparent criteria", text: "Reviews look at licensing, terms, payments, withdrawal speed and responsible gambling tools." },
            { title: "Regular updates", text: "Casino information should be reviewed regularly and checked against operator pages." },
            { title: "Editorial process", text: "Content is written to explain facts and tradeoffs, not to pressure a deposit." },
            { title: "Factual comparisons", text: "Comparison cards prioritize measurable details such as wagering, minimum deposit and payout signals." },
          ]}
        />
      </Section>

      <Section eyebrow="Responsible gambling" title="Practical tools and resources are part of the platform.">
        <ResourceCards
          items={[
            { title: "Deposit limits", text: "Set a maximum before playing and do not increase it during a session.", href: "/tools/budget-calculator" },
            { title: "Time reminders", text: "Use time boundaries to reduce long sessions and automatic repeat play.", href: "/program" },
            { title: "Cooling-off options", text: "A short pause can help when gambling feels emotional or automatic.", href: "/responsible-gambling" },
            { title: "Self-exclusion information", text: "If control is already lost, self-exclusion may be the next safer step.", href: "/responsible-gambling" },
            { title: "External support organizations", text: "SevenBet is not a treatment provider. Seek local professional support when gambling causes harm.", href: "/responsible-gambling" },
          ]}
        />
      </Section>

      <Section eyebrow="FAQ" title="Common questions about SevenBet.">
        <FAQ
          items={[
            ["What is the 10-Step Program?", "It is a structured educational framework for building awareness, setting limits and making gambling decisions more deliberate."],
            ["How are casinos reviewed?", "SevenBet reviews factual information such as licensing, bonus terms, wagering requirements, payments and responsible gambling tools."],
            ["What does verified mean?", "Verified means the listing includes reviewed signals such as license, operator information or clearly visible offer terms where available."],
            ["How often are reviews updated?", "Reviews should be updated regularly. The current site includes placeholders for last-updated information where live editorial workflows can be added."],
            ["What is a wagering requirement?", "It is the amount a bonus or deposit may need to be wagered before withdrawals are allowed under operator terms."],
            ["Does SevenBet receive affiliate commissions?", "SevenBet may receive commissions from some partner links while keeping disclosure, methodology and risk labels visible."],
          ]}
        />
      </Section>

      <Section eyebrow="Affiliate disclosure" title="How SevenBet may earn revenue.">
        <AffiliateDisclosure />
        <p className="muted">
          Some outbound links may be affiliate links. This means SevenBet may receive a commission if a user visits or
          signs up through a partner link. Editorial standards, responsible gambling information and review criteria
          should remain visible regardless of commercial relationships.
        </p>
      </Section>

      <Section eyebrow="Next step" title="Ready to start with a plan?">
        <CTA
          title="Start the 10-Step Program before comparing casino options."
          intro="Begin with a structured plan, then use casino comparisons as an informational resource when appropriate."
          primary={{ href: "/program", label: "Start the 10-Step Program" }}
          secondary={{ href: "/casinos", label: "Explore Casino Comparisons" }}
        />
      </Section>
    </>
  );
}
