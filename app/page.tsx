import Link from "next/link";
import { ProgramPreview } from "@/components/ProgramPreview";
import {
  AffiliateDisclosure,
  Badge,
  Button,
  Card,
  CTA,
  Container,
  FAQ,
  MethodologyBlock,
  OfferCard,
  Section,
} from "@/components/ui";
import { getStats, getTopCasinos } from "@/lib/data";

export default function HomePage() {
  const stats = getStats();
  const topCasinos = getTopCasinos(4);
  const comparisonCasinos = getTopCasinos(3);
  const lowWagerCasino = [...getTopCasinos(24)].sort((a, b) => a.wagering - b.wagering)[0];
  const lowDepositCasino = [...getTopCasinos(24)].sort((a, b) => a.minDeposit - b.minDeposit)[0];
  const fastPayoutCasino = [...getTopCasinos(24)].sort((a, b) => a.payoutHours - b.payoutHours)[0];
  const matchedBonuses = [
    { label: "Lower wagering", casino: lowWagerCasino, metric: `x${lowWagerCasino.wagering}` },
    { label: "Lower deposit", casino: lowDepositCasino, metric: `$${lowDepositCasino.minDeposit}` },
    { label: "Faster payout", casino: fastPayoutCasino, metric: `~${fastPayoutCasino.payoutHours}h` },
  ];

  return (
    <>
      <section className="heroShell">
        <Container className="heroGrid">
          <div className="heroCopy">
            <Badge tone="green">Verified mindful gambling</Badge>
            <h1>Compare verified casino offers. Start with control.</h1>
            <p className="lead">
              SevenBet helps you set limits, check your risk state and compare welcome offers only after the decision
              has clear boundaries.
            </p>
            <div className="heroActions">
              <Button href="/self-check" variant="primary">
                Start with limit check
              </Button>
              <Button href="/bonuses" variant="ghost">
                Review verified offers
              </Button>
            </div>
            <div className="trustStrip">
              <Badge>5 minutes · no account</Badge>
              <Badge>Limits before deposits</Badge>
              <Badge>18+ · sponsored links disclosed</Badge>
            </div>
          </div>

          <Card className="decisionConsole" tone="soft">
            <div className="consoleHeader">
              <div>
                <p className="eyebrow">SevenBet verification engine</p>
                <h2>Offer readiness check</h2>
              </div>
              <Badge tone="green">Control-first</Badge>
            </div>
            <div className="consoleMain">
              <div className="scoreOrb">
                <strong>72%</strong>
                <span>example control score</span>
              </div>
              <div className="consoleChecks">
                <div>
                  <span>Budget limit</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <span>Stop-loss</span>
                  <strong>Passed</strong>
                </div>
                <div>
                  <span>Bonus terms</span>
                  <strong>Needs check</strong>
                </div>
              </div>
            </div>
            <div className="miniOfferList">
              {topCasinos.slice(0, 2).map((casino) => (
                <article key={casino.slug}>
                  <div>
                    <strong>{casino.name}</strong>
                    <span>
                      {casino.rating}/10 · x{casino.wagering} wagering
                    </span>
                  </div>
                  <Link href={`/casino/${casino.slug}`}>Review</Link>
                </article>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <Section eyebrow="Start here" title="What do you want to do today?">
        <div className="entryGrid">
          {[
            ["Check risk", "If there is any doubt, start with the self-check.", "/self-check", "2 min"],
            ["Calculate limit", "Money, time and stop-loss before deposit.", "/tools/budget-calculator", "Safe cap"],
            ["Review offers", "Compare wagering, min deposit and license.", "/bonuses", "Compare"],
            ["Explore catalog", "Full database of operators and filters.", "/catalog", `${stats.total} sites`],
          ].map(([title, text, href, badge]) => (
            <Link className="entryCard card" href={href} key={href}>
              <Badge tone="green">{badge}</Badge>
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="The principle" title="A large welcome offer is not the same as a good decision.">
        <div className="versusGrid">
          <Card className="versusCard" tone="warning">
            <p className="eyebrow">The risky path</p>
            <h3>Follow the headline</h3>
            <ul>
              <li>See a large bonus number</li>
              <li>Skip wagering and max bet rules</li>
              <li>Deposit more than planned</li>
              <li>Continue after the session turns</li>
            </ul>
          </Card>
          <Card className="versusCard">
            <p className="eyebrow">The SevenBet path</p>
            <h3>Verify the decision</h3>
            <ul>
              <li>Define today&apos;s play limit</li>
              <li>Run the self-check</li>
              <li>Compare terms before the click</li>
              <li>Continue only if the offer fits the plan</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section eyebrow="How it works" title="From impulse to a verified offer review.">
        <div className="stageGrid">
          {[
            ["01", "Define the outcome", "Play less, avoid chasing losses, or compare an offer within a fixed limit."],
            ["02", "Verify control", "Run self-check, set budget, session timer and stop-loss before deposit."],
            ["03", "Compare terms", "Review wagering, min deposit, license and payout before sponsored links."],
            ["04", "Proceed or pause", "Move forward only if the offer still fits the plan."],
          ].map(([number, title, text]) => (
            <Card className="stageCard" key={number}>
              <span className="cardRank">{number}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Independent control check"
        title="We test the decision before any operator transition."
        intro="The score does not predict wins. It checks boundaries: budget, timer, stop-loss, chasing trigger and visible terms."
      >
        <Card className="verificationPanel" tone="soft">
          <div className="verificationScore">
            <strong>94%</strong>
            <span>example readiness after limits</span>
          </div>
          <div className="verificationList">
            {[
              ["Budget fixed before deposit", "Passed"],
              ["Session timer under 45 minutes", "Passed"],
              ["Stop-loss lower than daily cap", "Passed"],
              ["Wagering and max bet visible", "Passed"],
              ["Chasing risk after losses", "Escalated"],
            ].map(([task, status]) => (
              <div key={task}>
                <span>{task}</span>
                <strong>{status}</strong>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section
        eyebrow="10-step program"
        title="Turn “I should stay in control” into concrete actions."
        intro="Every day: checklist, journal, limit and next level."
      >
        <ProgramPreview />
      </Section>

      <Section
        eyebrow="Popular outcomes"
        title="Match the offer to the boundary, not the other way around."
        intro="Most users do not need the biggest headline. They need clearer wagering, lower deposit, faster payout and a visible license."
      >
        <div className="matchGrid">
          {matchedBonuses.map(({ label, casino, metric }) => (
            <Card className="matchCard" key={label}>
              <Badge tone="green">{label}</Badge>
              <h3>{casino.name}</h3>
              <strong>{metric}</strong>
              <p className="muted">{casino.bonusHeadline}</p>
              <Button href={`/casino/${casino.slug}`} variant="ghost">
                Compare terms
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Before you proceed" title="Check 5 things before reviewing an offer.">
        <div className="claimChecklist">
          {[
            ["Wagering", "How many times the bonus must be wagered before withdrawal."],
            ["Max bet", "The maximum allowed bet while wagering."],
            ["Expiry", "The time window should not pressure you into faster play."],
            ["Withdrawal", "KYC, fees, limits and payout speed."],
            ["Your stop-loss", "The offer must not increase your pre-set limit."],
          ].map(([title, text]) => (
            <Card key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Verified marketplace"
        title="Welcome offers with wagering, license and limits visible."
      >
        <div className="bonusGrid">
          {topCasinos.map((casino, index) => (
            <OfferCard casino={casino} key={casino.slug} rank={index + 1} />
          ))}
        </div>
        <AffiliateDisclosure />
      </Section>

      <Section eyebrow="Compare preview" title="Comparison should show terms, not only bonus size.">
        <div className="comparePreview">
          <div className="compareRow compareHead">
            <span>Casino</span>
            <span>Offer</span>
            <span>Wagering</span>
            <span>Min deposit</span>
            <span>License</span>
          </div>
          {comparisonCasinos.map((casino) => (
            <div className="compareRow" key={casino.slug}>
              <strong>{casino.name}</strong>
              <span>{casino.bonusHeadline}</span>
              <span>x{casino.wagering}</span>
              <span>${casino.minDeposit}</span>
              <span>{casino.license}</span>
            </div>
          ))}
        </div>
        <Button className="sectionButton" href="/catalog" variant="primary">
          Open full comparison
        </Button>
      </Section>

      <Section eyebrow="Trust & methodology" title="How SevenBet can earn money and stay honest.">
        <MethodologyBlock />
      </Section>

      <Section eyebrow="Safety net" title="If this sounds like you, do not continue to offers.">
        <CTA
          title="Chasing losses, hiding deposits, borrowing money or playing under stress."
          intro="In this situation, the best next step is self-check, pause, limits, responsible gaming and support."
          primary={{ href: "/self-check", label: "Start with limit check" }}
          secondary={{ href: "/responsible-gaming", label: "Responsible gaming" }}
        />
      </Section>

      <Section eyebrow="Catalog" title="The full database for comparison after the play plan is set.">
        <div className="statsGrid">
          <Card>
            <strong>{stats.total}</strong>
            <span>casino profiles</span>
          </Card>
          <Card>
            <strong>{stats.verified}</strong>
            <span>licensed active</span>
          </Card>
          <Card>
            <strong>{stats.payments}</strong>
            <span>payment filters</span>
          </Card>
          <Card>
            <strong>{stats.licenses}</strong>
            <span>license sources</span>
          </Card>
        </div>
        <Button className="sectionButton" href="/catalog" variant="primary">
          Open catalog
        </Button>
      </Section>

      <Section eyebrow="FAQ" title="The essentials.">
        <FAQ
          items={[
            ["Is SevenBet a casino?", "No. It is a catalog, control program and affiliate comparison site."],
            ["How does the site earn money?", "Some links may be affiliate links. The commercial relationship is disclosed before the click."],
            ["Why self-check first?", "Because offers can amplify impulse if limits and state are not checked."],
            ["Can offers be trusted?", "Final terms must always be verified on the operator website. We show key risks before the transition."],
          ]}
        />
      </Section>
    </>
  );
}
