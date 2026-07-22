import type { Casino } from "@/lib/data";
import { formatMoney } from "@/lib/data";
import { AffiliateDisclosure, Badge, Button, Card, FAQ, OfferCard, RiskBadge, Section, VerificationBadge } from "@/components/ui";

export const REVIEW_DATE = "2026-07-10";
export const REVIEW_DATE_LABEL = "July 10, 2026";

export const responsibleTools = [
  ["Deposit limits", "Set a maximum deposit amount before playing."],
  ["Loss limits", "Define a loss boundary for a session or period."],
  ["Session reminders", "Use time reminders to notice how long play has continued."],
  ["Cooling-off periods", "Take a temporary break when decisions feel rushed or emotional."],
  ["Self-exclusion", "Block access for a longer period when gambling is no longer controlled."],
  ["Reality checks", "Use reminders that show time spent and help interrupt automatic play."],
];

function AffiliateOfferButton({ casino, label = "View Offer" }: { casino: Casino; label?: string }) {
  if (!casino.affiliateUrl) return <span aria-disabled="true" className="button disabled">Offer unavailable</span>;
  return <Button href={casino.affiliateUrl} external rel="nofollow sponsored noopener" variant="primary">{label}</Button>;
}

export function CasinoReviewHero({ casino }: { casino: Casino }) {
  const riskLevel = casino.wagering > 45 || casino.reviewNeeded ? "medium" : "low";
  const officialUrl = `https://${casino.domain}`;
  const reviewDate = casino.publishedAt ? new Date(casino.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : REVIEW_DATE_LABEL;

  return (
    <section className="pageShell">
      <div className="container detailGrid">
        <div>
          <div className="casinoIdentity">
            <div className="casinoLogo">{casino.logo ? <img alt={casino.logo.alt || `${casino.name} logo`} height={casino.logo.height || 96} src={casino.logo.url} width={casino.logo.width || 96} /> : <span aria-hidden="true">{casino.name.slice(0, 2).toUpperCase()}</span>}</div>
            <div className="badgeCluster">
              <Badge tone="dark">Editor&apos;s Score {casino.rating}/10</Badge>
              <VerificationBadge verified={casino.isVerified} />
              <RiskBadge level={riskLevel} />
            </div>
          </div>
          <h1>{casino.name} Review</h1>
          <p className="lead">{casino.tagline || casino.description}</p>
          <div className="heroActions">
            <AffiliateOfferButton casino={casino} />
            <Button href={officialUrl} external rel="noopener" variant="ghost">Visit Official Website</Button>
          </div>
          <div className="trustStrip">
            <Badge tone="green">Licensed</Badge>
            <Badge tone="green">Reviewed</Badge>
            <Badge tone="warning">Updated {reviewDate}</Badge>
            <Badge>Responsible Gambling Tools Available</Badge>
          </div>
        </div>

        <Card className="resultPanel detailSidebar" tone="soft">
          <div className="badgeCluster">
            <Badge tone="dark">{casino.rating}/10</Badge>
            <VerificationBadge verified={casino.isVerified} />
          </div>
          <h2>{casino.license}</h2>
          <div className="resultRows">
            <div><span>Last reviewed</span><strong>{reviewDate}</strong></div>
            <div><span>License status</span><strong>{casino.licenseStatus}</strong></div>
            <div><span>Minimum deposit</span><strong>{formatMoney(casino.minDeposit)}</strong></div>
            <div><span>Withdrawal speed</span><strong>~{casino.payoutHours}h</strong></div>
          </div>
          <p className="muted">Review final operator terms before registering or accepting any offer.</p>
        </Card>
      </div>
    </section>
  );
}

export function QuickOverview({ casino }: { casino: Casino }) {
  const items = [
    ["Editor's Score", `${casino.rating}/10`],
    ["License", casino.license],
    ["Founded", casino.foundedYear ? String(casino.foundedYear) : "Not listed in current dataset"],
    ["Accepted countries", casino.countries.slice(0, 6).join(", ") || casino.country],
    ["Restricted countries", "Check operator terms"],
    ["Game providers", casino.providers.slice(0, 5).join(", ")],
    ["Payment methods", casino.payments.slice(0, 6).join(", ")],
    ["Withdrawal speed", `~${casino.payoutHours}h`],
    ["Minimum deposit", formatMoney(casino.minDeposit)],
    ["Welcome bonus", casino.bonusHeadline],
    ["Responsible tools", "Limits, cool-off, self-exclusion where available"],
  ];

  return (
    <Section eyebrow="Quick overview" title="Key facts before registration.">
      <div className="statsGrid">
        {items.map(([label, value]) => (
          <Card key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function WelcomeBonusSection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="Welcome bonus" title="Current offer and important conditions.">
      <div className="guideGrid twoCards">
        <Card className="guideCard">
          <h3>Bonus summary</h3>
          <p className="muted">{casino.bonusHeadline}</p>
          <div className="resultRows">
            <div><span>Deposit requirement</span><strong>Minimum {formatMoney(casino.minDeposit)}</strong></div>
            <div><span>Maximum amount</span><strong>{formatMoney(casino.bonusAmountUsd)}</strong></div>
            <div><span>Free spins</span><strong>{casino.freeSpins || 0}</strong></div>
            <div><span>Eligibility</span><strong>New players, subject to operator terms</strong></div>
            <div><span>Expiration</span><strong>Check operator terms</strong></div>
          </div>
          {casino.importantConditions?.length ? <div className="miniTasks">{casino.importantConditions.map((condition) => <span key={condition}>{condition}</span>)}</div> : null}
          {casino.termsUrl && <Button href={casino.termsUrl} external rel="nofollow noopener" variant="ghost">Read full bonus terms</Button>}
          <AffiliateOfferButton casino={casino} />
        </Card>
        <Card className="guideCard" tone="warning">
          <h3>Before accepting</h3>
          <p className="muted">
            Review the full bonus terms before claiming any offer. Pay attention to wagering, max bet rules, game
            contribution, withdrawal limits and expiry windows.
          </p>
        </Card>
      </div>
    </Section>
  );
}

export function CasinoMediaSection({ casino }: { casino: Casino }) {
  const gallery = casino.gallery ?? [];
  if (!casino.hero && !gallery.length) return null;
  return (
    <Section eyebrow="Casino media" title={`${casino.name} published media.`}>
      {casino.hero && <figure className="casinoPublicHero"><img alt={casino.hero.alt} fetchPriority="high" height={casino.hero.height || 720} src={casino.hero.url} width={casino.hero.width || 1280} /></figure>}
      {gallery.length > 0 && <div className="casinoPublicGallery">{gallery.map((image) => <figure key={image.id}><img alt={image.alt} height={image.height || 360} loading="lazy" src={image.url} width={image.width || 640} />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div>}
    </Section>
  );
}

export function WageringSection({ casino }: { casino: Casino }) {
  const exampleAmount = casino.bonusAmountUsd || casino.minDeposit;
  const wageringTotal = exampleAmount * casino.wagering;

  return (
    <Section eyebrow="Wagering requirements explained" title={`What x${casino.wagering} wagering means.`}>
      <div className="guideGrid twoCards">
        <Card className="guideCard">
          <h3>Plain-language example</h3>
          <p className="muted">
            If a {formatMoney(exampleAmount)} bonus has x{casino.wagering} wagering, the example wagering volume would
            be {formatMoney(wageringTotal)} before bonus-related withdrawals may be allowed under operator terms.
          </p>
        </Card>
        <Card className="guideCard">
          <h3>Contribution and limits</h3>
          <div className="resultRows">
            <div><span>Games that may contribute</span><strong>{casino.gameTypes.join(", ")}</strong></div>
            <div><span>Games that may not contribute</span><strong>Check restricted games in operator terms</strong></div>
            <div><span>Time limit</span><strong>Check operator terms</strong></div>
            <div><span>Maximum bet rules</span><strong>Check operator terms before playing</strong></div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

export function ProsConsSection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="Pros and cons" title="Factual strengths and limitations.">
      <div className="versusGrid">
        <Card className="versusCard">
          <h3>Pros</h3>
          <div className="miniTasks">{casino.pros.map((item) => <span key={item}>{item}</span>)}</div>
        </Card>
        <Card className="versusCard" tone="warning">
          <h3>Cons</h3>
          <div className="miniTasks">{casino.cons.map((item) => <span key={item}>{item}</span>)}</div>
        </Card>
      </div>
    </Section>
  );
}

export function LicensingSafetySection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="Licensing and safety" title="License, account checks and responsible gambling context.">
      <div className="guideGrid">
        <Card className="guideCard"><h3>License</h3><p className="muted">{casino.license} · {casino.licenseStatus}. Licensing can indicate oversight, but users should verify details with the operator.</p></Card>
        <Card className="guideCard"><h3>Security measures</h3><p className="muted">Look for account security, encrypted payments and clear privacy information on the operator website.</p></Card>
        <Card className="guideCard"><h3>Verification</h3><p className="muted">KYC checks may be required before withdrawal. Prepare identity and payment verification where requested.</p></Card>
        <Card className="guideCard"><h3>Dispute resolution</h3><p className="muted">Review the operator complaints process and any regulator or ADR information before depositing.</p></Card>
      </div>
    </Section>
  );
}

export function PaymentsSection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="Payments" title="Deposits, withdrawals and currencies.">
      <div className="guideGrid twoCards">
        <Card className="guideCard">
          <h3>Methods and timing</h3>
          <div className="resultRows">
            <div><span>Deposit methods</span><strong>{casino.payments.join(", ")}</strong></div>
            <div><span>Withdrawal methods</span><strong>{casino.payments.join(", ")}</strong></div>
            <div><span>Processing time</span><strong>~{casino.payoutHours}h payout signal</strong></div>
            <div><span>Fees</span><strong>Not listed in current dataset</strong></div>
          </div>
        </Card>
        <Card className="guideCard">
          <h3>Currencies and crypto</h3>
          <p className="muted">Currencies: {casino.currencies.join(", ")}</p>
          <p className="muted">Crypto support: {casino.crypto ? "Available" : "Not indicated in current dataset"}</p>
        </Card>
      </div>
    </Section>
  );
}

export function ResponsibleToolsSection() {
  return (
    <Section eyebrow="Responsible gambling features" title="Tools to review before depositing.">
      <div className="guideGrid">
        {responsibleTools.map(([title, text]) => (
          <Card className="guideCard" key={title}><h3>{title}</h3><p className="muted">{text}</p></Card>
        ))}
      </div>
    </Section>
  );
}

export function EditorialReviewSection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="Editorial review" title={`${casino.name}: objective review notes.`}>
      <div className="guideGrid oneCol">
        {[
          ["Overall experience", casino.description],
          ["Registration", "Review registration requirements, account verification and country availability before creating an account."],
          ["Bonuses", `${casino.bonusHeadline}. The main terms to review are wagering x${casino.wagering}, minimum deposit ${formatMoney(casino.minDeposit)} and expiry conditions.`],
          ["Games", `Game categories include ${casino.gameTypes.join(", ")}. Providers listed in the dataset include ${casino.providers.slice(0, 8).join(", ")}.`],
          ["Payments", `Payment options include ${casino.payments.join(", ")} with an estimated payout signal of ~${casino.payoutHours}h.`],
          ["Support", casino.liveChat ? "Live chat is indicated in the dataset. Verify availability and hours on the operator website." : "Support availability should be checked on the operator website."],
          ["Responsible gambling features", "Review deposit limits, cooling-off, session reminders, self-exclusion and support links before depositing."],
          ["Final opinion", "This review is informational. Compare the casino against your limits, local legality and the full operator terms before registering."],
        ].map(([title, text]) => (
          <Card className="guideCard" key={title}><h3>{title}</h3><p className="muted">{text}</p></Card>
        ))}
      </div>
    </Section>
  );
}

export function SimilarCasinosSection({ casinos }: { casinos: Casino[] }) {
  return (
    <Section eyebrow="Similar casinos" title="Alternative reviews to compare.">
      <div className="bonusGrid">
        {casinos.map((casino, index) => (
          <OfferCard casino={casino} key={casino.slug} rank={index + 1} />
        ))}
      </div>
    </Section>
  );
}

export function getCasinoFaqItems(casino: Casino): Array<[string, string]> {
  return [
    [`Is ${casino.name} licensed?`, `${casino.name} is listed with ${casino.license}. Users should verify current license details on the operator website.`],
    ["How long do withdrawals take?", `The current payout speed signal is approximately ${casino.payoutHours} hours, subject to KYC and operator rules.`],
    ["Can I use crypto?", casino.crypto ? "Crypto support is indicated in the dataset. Verify current crypto availability with the operator." : "Crypto support is not indicated in the current dataset."],
    ["Are bonuses available worldwide?", "No bonus should be assumed worldwide. Eligibility depends on country, account status and operator terms."],
    ["What payment methods are supported?", `${casino.payments.slice(0, 6).join(", ")} are listed in the current profile.`],
    ["Does the casino provide responsible gambling tools?", "Users should review deposit limits, cooling-off, self-exclusion and support tools on the operator website before depositing."],
  ];
}

export function CasinoFaqSection({ casino }: { casino: Casino }) {
  return (
    <Section eyebrow="FAQ" title={`${casino.name} review questions.`}>
      <FAQ items={getCasinoFaqItems(casino)} />
    </Section>
  );
}

export function MethodologyDisclosureSection() {
  return (
    <>
      <Section eyebrow="Further reading" title="Useful context before making a decision.">
        <div className="guideGrid">
          {[
            { title: "Compare welcome bonuses", text: "Review bonus terms, wagering and withdrawal signals side by side.", href: "/bonuses" },
            { title: "Start the 10-Step Program", text: "Build a personal plan before comparing gambling options.", href: "/program" },
            { title: "Responsible gambling tools", text: "Learn how deposit limits, cooling-off and self-exclusion options work.", href: "/responsible-gambling" },
          ].map((item) => (
            <Card className="guideCard" key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
              <Button href={item.href} variant="ghost">Read More</Button>
            </Card>
          ))}
        </div>
      </Section>
      <Section eyebrow="Methodology" title="How SevenBet reviews casinos.">
        <Card className="ctaBlock" tone="soft">
          <div>
            <h2>Reviews use transparent criteria.</h2>
            <p className="muted">
              SevenBet reviews casino profiles using available data for licensing, bonus terms, wagering, payments,
              withdrawal speed, support and responsible gambling features.
            </p>
          </div>
          <div className="heroActions">
            <Button href="/methodology" variant="primary">Read Full Methodology</Button>
            <Button href="/responsible-gambling" variant="ghost">Responsible Gambling</Button>
          </div>
        </Card>
      </Section>
      <Section eyebrow="Affiliate disclosure" title="Some links may be affiliate links.">
        <AffiliateDisclosure />
        <p className="muted">Editorial evaluations are structured independently from commissions and should keep criteria, risk labels and responsible gambling context visible.</p>
      </Section>
    </>
  );
}
