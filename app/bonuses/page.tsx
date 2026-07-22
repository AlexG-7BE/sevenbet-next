import { ResourceCards } from "@/components/PageTemplates";
import {
  AffiliateDisclosure,
  Badge,
  Button,
  Card,
  Container,
  CTA,
  FAQ,
  MethodologyBlock,
  OfferCard,
  Section,
  SectionHeader,
} from "@/components/ui";
import { formatMoney } from "@/lib/data";
import { publicCasinoService } from "@/lib/services/public-casino.service";

const filters = [
  "Country",
  "Bonus Type",
  "Minimum Deposit",
  "Wagering Requirement",
  "Payment Method",
  "License",
  "Game Types",
  "Crypto Support",
  "Withdrawal Speed",
];

const sortOptions = ["Editor's Score", "Newest", "Highest Bonus", "Lowest Wagering", "Fastest Withdrawals"];

export const dynamic = "force-dynamic";

export default async function BonusesPage() {
  const casinos = (await publicCasinoService.listCasinoViews()).slice(0, 24);
  const featured = casinos.slice(0, 3);
  const comparison = casinos.slice(0, 12);

  return (
    <>
      <section className="pageShell">
        <Container>
          <SectionHeader
            eyebrow="Casino bonus directory"
            title="Compare Verified Casino Welcome Bonuses"
            intro="Compare welcome offers, wagering requirements, payment methods, licensing information, and responsible gambling tools before choosing a casino."
          />
          <div className="heroActions">
            <Button href="#comparison-table" variant="primary">
              Compare Bonuses
            </Button>
            <Button href="/methodology" variant="ghost">
              How We Review Casinos
            </Button>
          </div>
          <div className="trustStrip">
            <Badge tone="green">Editorial Reviews</Badge>
            <Badge tone="green">Regular Updates</Badge>
            <Badge tone="green">Transparent Comparison Criteria</Badge>
            <Badge tone="green">Responsible Gambling Information</Badge>
          </div>
        </Container>
      </section>

      <Section eyebrow="Filter and sort" title="Compare offers by the details that matter.">
        <div className="catalogToolbar">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Refine by country, terms, license, payments and speed.</h2>
          </div>
          <Badge tone="warning">Last updated today</Badge>
        </div>
        <div className="catalogFilters" aria-label="Bonus directory filters">
          {filters.map((label) => (
            <Badge tone="dark" key={label}>{label}</Badge>
          ))}
        </div>
        <div className="catalogFilters" aria-label="Bonus directory sorting">
          {sortOptions.map((label) => (
            <Badge tone={label === "Editor's Score" ? "warning" : "dark"} key={label}>Sort: {label}</Badge>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Featured bonuses"
        title="Featured offers with terms, license and responsible gambling context."
        intro="Affiliate links may appear, but factual comparison details and review links remain visible before the offer button."
      >
        <div className="bonusGrid">
          {featured.map((casino, index) => (
            <OfferCard casino={casino} key={casino.slug} rank={index + 1} />
          ))}
        </div>
        <AffiliateDisclosure />
      </Section>

      <Section
        eyebrow="Comparison table"
        title="Full welcome bonus comparison"
        intro="This table is sorted by editor's score by default. Future versions can add live sorting controls."
      >
        <div className="comparePreview bonusCompareTable" id="comparison-table">
          <div className="compareRow compareHead">
            <span>Casino</span>
            <span>Editor&apos;s Score</span>
            <span>Welcome Bonus</span>
            <span>Min Deposit</span>
            <span>Wagering</span>
            <span>Withdrawal Speed</span>
            <span>License</span>
            <span>Payment Methods</span>
            <span>Responsible Tools</span>
            <span>Review</span>
            <span>Offer</span>
          </div>
          {comparison.map((casino) => (
            <div className="compareRow" key={casino.slug}>
              <strong>{casino.name}</strong>
              <span>{casino.rating}/10</span>
              <span>{casino.bonusHeadline}</span>
              <span>{formatMoney(casino.minDeposit)}</span>
              <span>x{casino.wagering}</span>
              <span>~{casino.payoutHours}h</span>
              <span>{casino.license}</span>
              <span>{casino.payments.slice(0, 3).join(", ")}</span>
              <span>Limits, cool-off, self-exclusion where available</span>
              <Button href={`/casino/${casino.slug}`} variant="ghost">Review</Button>
              {casino.affiliateUrl ? <Button href={casino.affiliateUrl} external rel="nofollow sponsored noopener" variant="primary">View Offer</Button> : <span aria-disabled="true" className="button disabled">Offer unavailable</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Editorial guide" title="Learn how to compare welcome bonuses.">
        <ResourceCards
          items={[
            { title: "What is a welcome bonus?", text: "A welcome bonus is an introductory offer with terms that should be reviewed before use.", href: "/bonus-guide", badge: "Guide" },
            { title: "How wagering requirements work", text: "Wagering requirements explain how much must be wagered before withdrawals may be allowed.", href: "/bonus-guide", badge: "Terms" },
            { title: "How to compare bonuses", text: "Compare minimum deposit, wagering, expiry, max bet and withdrawal rules, not only headline value.", href: "/bonuses", badge: "Directory" },
            { title: "How licensing affects trust", text: "License information helps users understand oversight and operator transparency.", href: "/methodology", badge: "Trust" },
            { title: "Why withdrawal speed matters", text: "Payout timing, KYC checks and withdrawal limits can affect the overall experience.", href: "/casinos", badge: "Review" },
            { title: "How payment methods differ", text: "Payment methods can vary by country, fees, processing time and availability.", href: "/casinos", badge: "Payments" },
          ]}
        />
      </Section>

      <Section eyebrow="Responsible gambling reminder" title="A bonus should never override your limits.">
        <Card className="ctaBlock" tone="warning">
          <div>
            <h2>Compare offers only within a clear budget.</h2>
            <p className="muted">
              Understand the terms before accepting any bonus. Consider using deposit limits, time reminders and
              cooling-off tools where available.
            </p>
          </div>
          <div className="heroActions">
            <Button href="/self-check" variant="primary">Start Self-Assessment</Button>
            <Button href="/responsible-gambling" variant="ghost">Responsible Gambling Tools</Button>
          </div>
        </Card>
      </Section>

      <Section eyebrow="How we rank casinos" title="Transparent criteria behind the comparison.">
        <MethodologyBlock />
        <ResourceCards
          items={[
            { title: "Licensing", text: "License and operator status are reviewed where available." },
            { title: "Bonus transparency", text: "Terms, wagering, minimum deposit, expiry and max bet rules are prioritized." },
            { title: "Withdrawal speed", text: "Payout speed and withdrawal conditions are included as comparison signals." },
            { title: "Payment options", text: "Payment methods, crypto support and availability can affect usability." },
            { title: "Customer support", text: "Support availability is considered as part of the broader review context." },
            { title: "Responsible gambling features", text: "Deposit limits, cooling-off and self-exclusion information are part of the review framework." },
            { title: "Editorial review process", text: "Reviews should explain criteria and avoid pressure-based language." },
            { title: "Update frequency", text: "Offer details can change, so users should verify terms on the casino website." },
          ]}
        />
      </Section>

      <Section eyebrow="FAQ" title="Casino bonus comparison questions.">
        <FAQ
          items={[
            ["How are bonuses compared?", "SevenBet compares factual criteria such as bonus terms, wagering, minimum deposit, license, payments and withdrawal speed."],
            ["What is a wagering requirement?", "It is the amount that may need to be wagered before bonus-related withdrawals are allowed under casino terms."],
            ["Does SevenBet review every casino?", "No. The directory uses available profile data and should be expanded through regular editorial review."],
            ["What does the Editor's Score mean?", "It is a comparison score based on available signals such as rating, terms, license and payout information."],
            ["How often are offers updated?", "Offer details should be reviewed regularly. Always verify final terms on the casino website."],
            ["What happens if an offer changes?", "Casino offers can change without notice. The operator website is the final source for current terms."],
          ]}
        />
      </Section>

      <Section eyebrow="Affiliate disclosure" title="How SevenBet may earn commissions.">
        <AffiliateDisclosure />
        <p className="muted">
          Some links may be affiliate links. Commissions do not remove risk labels, responsible gambling information or
          the editorial criteria used to structure comparisons.
        </p>
      </Section>

      <Section eyebrow="Next step" title="Looking for more detailed comparisons?">
        <CTA
          title="Read full casino reviews or review the methodology behind the directory."
          primary={{ href: "/casinos", label: "Browse Casino Reviews" }}
          secondary={{ href: "/methodology", label: "Read Review Methodology" }}
        />
      </Section>
    </>
  );
}
