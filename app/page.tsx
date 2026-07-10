import Link from "next/link";
import { BonusCard } from "@/components/CasinoCards";
import { ProgramPreview } from "@/components/ProgramPreview";
import { Section } from "@/components/Section";
import { getStats, getTopCasinos } from "@/lib/data";

export default function HomePage() {
  const stats = getStats();
  const topCasinos = getTopCasinos(4);
  const comparisonCasinos = getTopCasinos(3);
  const lowWagerCasino = [...getTopCasinos(24)].sort((a, b) => a.wagering - b.wagering)[0];
  const lowDepositCasino = [...getTopCasinos(24)].sort((a, b) => a.minDeposit - b.minDeposit)[0];
  const fastPayoutCasino = [...getTopCasinos(24)].sort((a, b) => a.payoutHours - b.payoutHours)[0];
  const matchedBonuses = [
    { label: "Low wagering", casino: lowWagerCasino, metric: `x${lowWagerCasino.wagering}` },
    { label: "Low deposit", casino: lowDepositCasino, metric: `$${lowDepositCasino.minDeposit}` },
    { label: "Fast payout", casino: fastPayoutCasino, metric: `~${fastPayoutCasino.payoutHours}h` },
  ];

  return (
    <>
      <section className="heroShell">
        <div className="container heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Verified mindful gambling</p>
            <h1>Claim verified casino bonuses. Not risky promises.</h1>
            <p className="lead">
              Tell us your goal — play less, stop chasing losses, or compare a welcome bonus.
              SevenBet verifies your control plan first, then shows offers that fit it.
            </p>
            <div className="heroActions">
              <Link className="button gold" href="/self-check">Verify control first</Link>
              <Link className="button ghost" href="/bonuses">See verified offers</Link>
            </div>
            <div className="trustStrip">
              <span>5 minutes · no account</span>
              <span>Limits before deposits</span>
              <span>18+ · sponsored links disclosed</span>
            </div>
          </div>

          <div className="decisionConsole">
            <div className="consoleHeader">
              <div>
                <p className="eyebrow">SevenBet Verification Engine</p>
                <h2>Bonus claim readiness</h2>
              </div>
              <span className="safeBadge">Escrow mindset</span>
            </div>
            <div className="consoleMain">
              <div className="scoreOrb">
                <strong>72%</strong>
                <span>control score example</span>
              </div>
              <div className="consoleChecks">
                <div><span>Budget limit</span><strong>Passed</strong></div>
                <div><span>Stop-loss</span><strong>Passed</strong></div>
                <div><span>Bonus terms</span><strong>Needs check</strong></div>
              </div>
            </div>
            <div className="miniOfferList">
              {topCasinos.slice(0, 2).map((casino) => (
                <article key={casino.slug}>
                  <div>
                    <strong>{casino.name}</strong>
                    <span>{casino.rating}/10 · x{casino.wagering} wagering</span>
                  </div>
                  <a href={casino.affiliateUrl} target="_blank" rel="nofollow sponsored">Offer</a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Start here" title="What do you want to do today?">
        <div className="entryGrid">
          {[
            ["Check risk", "If there is any doubt, start with the self-check.", "/self-check", "2 min"],
            ["Calculate limit", "Money, time and stop-loss before deposit.", "/tools/budget-calculator", "Safe cap"],
            ["Find a bonus", "Offers with wagering, min deposit and license.", "/bonuses", "Compare"],
            ["Compare casinos", "Full database of operators and filters.", "/catalog", `${stats.total} sites`],
          ].map(([title, text, href, badge]) => (
            <Link className="entryCard" href={href} key={href}>
              <span>{badge}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="The problem" title="A big welcome bonus is not the same as a good decision.">
        <div className="versusGrid">
          <article className="versusCard dangerCard">
            <p className="eyebrow">Choosing the usual way</p>
            <h3>Buy the promise</h3>
            <ul>
              <li>See a large bonus number</li>
              <li>Skip wagering and max bet rules</li>
              <li>Deposit more than planned</li>
              <li>Chase losses when the session turns</li>
            </ul>
          </article>
          <article className="versusCard">
            <p className="eyebrow">Choosing through SevenBet</p>
            <h3>Verify the outcome</h3>
            <ul>
              <li>Define today&apos;s play limit</li>
              <li>Run the self-check</li>
              <li>Compare terms before the click</li>
              <li>Claim only if the offer fits the plan</li>
            </ul>
          </article>
        </div>
      </Section>

      <Section eyebrow="How it works" title="From a gambling impulse to a verified bonus claim.">
        <div className="stageGrid">
          {[
            ["01", "Define the outcome", "Play less, stop chasing losses, or find a bonus within a fixed limit."],
            ["02", "Verify control", "Run self-check, set budget, session timer and stop-loss before deposit."],
            ["03", "Compare offers", "See wagering, min deposit, license and payout before affiliate clicks."],
            ["04", "Claim or pause", "Move forward only if the bonus still fits the plan."],
          ].map(([number, title, text]) => (
            <article className="stageCard" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Independent control check"
        title="We test the decision before the bonus gets the click."
        intro="The score is not about predicting wins. It checks whether the session has boundaries: budget, timer, stop-loss, no chasing trigger and clear bonus terms."
      >
        <div className="verificationPanel">
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
        </div>
      </Section>

      <Section
        eyebrow="10-step program"
        title="The program turns “I should stay in control” into concrete actions."
        intro="Every day: checklist, journal, limit and next level."
      >
        <ProgramPreview />
      </Section>

      <Section
        eyebrow="Popular outcomes"
        title="Outcomes players should buy through SevenBet."
        intro="Not every user needs the biggest bonus. Most need a safer match: lower wagering, lower deposit, faster payout, clearer license."
      >
        <div className="matchGrid">
          {matchedBonuses.map(({ label, casino, metric }) => (
            <article className="matchCard" key={label}>
              <span>{label}</span>
              <h3>{casino.name}</h3>
              <strong>{metric}</strong>
              <p className="muted">{casino.bonusHeadline}</p>
              <Link className="button ghost" href={`/casino/${casino.slug}`}>Review</Link>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Before you claim" title="Before claiming a bonus, check 5 things.">
        <div className="claimChecklist">
          {[
            ["Wagering", "How many times the bonus must be wagered before withdrawal."],
            ["Max bet", "The maximum allowed bet while wagering."],
            ["Expiry", "The time window should not pressure you into faster play."],
            ["Withdrawal", "KYC, fees, limits and payout speed."],
            ["Your stop-loss", "The bonus must not increase your pre-set limit."],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Best welcome bonuses"
        title="Best welcome bonuses, with wagering, license and limits visible."
      >
        <div className="bonusGrid">
          {topCasinos.map((casino, index) => (
            <BonusCard casino={casino} key={casino.slug} rank={index + 1} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Compare preview" title="Comparison should show terms, not only bonus size.">
        <div className="comparePreview">
          <div className="compareRow compareHead">
            <span>Casino</span>
            <span>Bonus</span>
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
        <Link className="button gold sectionButton" href="/catalog">Open full comparison</Link>
      </Section>

      <Section eyebrow="Trust & methodology" title="How SevenBet can earn money and stay honest.">
        <div className="methodGrid">
          {[
            ["License first", "License and operator status matter more than bonus size."],
            ["Terms visible", "Wagering, minimum deposit and payout are shown before affiliate clicks."],
            ["Safety labels", "Review-needed records are not hidden or disguised."],
            ["Commercial disclosure", "We may earn commission, but offer terms stay visible."],
          ].map(([title, text]) => (
            <article className="methodCard" key={title}>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Safety net" title="If this sounds like you, do not continue to bonuses.">
        <div className="safetyNet">
          <div>
            <h3>Chasing losses, hidden deposits, borrowed money, playing under stress.</h3>
            <p className="muted">In this situation, the best next step is self-check, pause, limits, responsible gaming and support, not a welcome bonus.</p>
          </div>
          <div className="heroActions">
            <Link className="button gold" href="/self-check">Self-check</Link>
            <Link className="button ghost" href="/responsible-gaming">Responsible gaming</Link>
          </div>
        </div>
      </Section>

      <Section eyebrow="Catalog" title="The full database for comparison after the play plan is set.">
        <div className="statsGrid">
          <div><strong>{stats.total}</strong><span>casino profiles</span></div>
          <div><strong>{stats.verified}</strong><span>licensed active</span></div>
          <div><strong>{stats.payments}</strong><span>payment filters</span></div>
          <div><strong>{stats.licenses}</strong><span>license sources</span></div>
        </div>
        <Link className="button gold sectionButton" href="/catalog">Open catalog</Link>
      </Section>

      <Section eyebrow="FAQ" title="The essentials.">
        <div className="faqGrid">
          {[
            ["Is SevenBet a casino?", "No. It is a catalog, control program and affiliate comparison site."],
            ["How does the site earn money?", "Some links may be affiliate links. The commercial relationship is disclosed before the click."],
            ["Why self-check first?", "Because bonuses can amplify impulse if limits and state are not checked."],
            ["Can bonuses be trusted?", "Final terms must always be verified on the operator website. We show key risks before the transition."],
          ].map(([question, answer]) => (
            <article className="faqItem" key={question}>
              <h3>{question}</h3>
              <p className="muted">{answer}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
