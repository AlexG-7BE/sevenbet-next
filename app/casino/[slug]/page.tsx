import { notFound } from "next/navigation";
import {
  AffiliateDisclosure,
  Badge,
  Button,
  Card,
  Container,
  RiskBadge,
  VerificationBadge,
} from "@/components/ui";
import { getCasino, getCasinos, formatMoney } from "@/lib/data";

export function generateStaticParams() {
  return getCasinos().slice(0, 80).map((casino) => ({ slug: casino.slug }));
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const casino = getCasino(slug);
  if (!casino) notFound();

  const riskLevel = casino.wagering > 45 || casino.reviewNeeded ? "medium" : "low";
  const ratingPercent = Math.max(0, Math.min(100, casino.rating * 10));

  return (
    <section className="pageShell">
      <Container className="detailGrid">
        <div>
          <div className="badgeCluster">
            <Badge tone="green">{casino.category}</Badge>
            <VerificationBadge verified={casino.isVerified} />
            <RiskBadge level={riskLevel} />
          </div>
          <h1>{casino.name}</h1>
          <p className="lead">{casino.description}</p>
          <div className="heroActions">
            <Button href={casino.affiliateUrl} external variant="primary">
              View offer
            </Button>
            <Button href="/tools/budget-calculator" variant="ghost">
              Start limit check
            </Button>
          </div>

          <AffiliateDisclosure />

          <div className="guideGrid twoCards">
            <Card className="guideCard">
              <h3>Overview</h3>
              <p className="muted">{casino.tagline}</p>
            </Card>
            <Card className="guideCard">
              <h3>Licensing</h3>
              <p className="muted">{casino.license} · {casino.licenseStatus}</p>
            </Card>
            <Card className="guideCard">
              <h3>Bonus</h3>
              <p className="muted">{casino.bonusHeadline}</p>
            </Card>
            <Card className="guideCard">
              <h3>Wagering requirements</h3>
              <p className="muted">x{casino.wagering} wagering · minimum deposit {formatMoney(casino.minDeposit)}</p>
            </Card>
            <Card className="guideCard">
              <h3>Payments</h3>
              <p className="muted">{casino.payments.join(", ")}</p>
            </Card>
            <Card className="guideCard">
              <h3>Withdrawal speed</h3>
              <p className="muted">Estimated payout signal: ~{casino.payoutHours}h. Verify final withdrawal rules on the operator website.</p>
            </Card>
            <Card className="guideCard">
              <h3>Pros</h3>
              <p className="muted">{casino.pros.join(", ")}</p>
            </Card>
            <Card className="guideCard">
              <h3>Cons</h3>
              <p className="muted">{casino.cons.join(", ")}</p>
            </Card>
            <Card className="guideCard">
              <h3>Responsible gambling tools</h3>
              <p className="muted">Check deposit limits, time-outs, self-exclusion and support links before depositing.</p>
            </Card>
            <Card className="guideCard">
              <h3>Review methodology</h3>
              <p className="muted">SevenBet reviews license, terms, wagering, payment signals, withdrawal speed and responsible gambling context.</p>
            </Card>
          </div>
        </div>

        <Card className="resultPanel detailSidebar" tone="soft">
          <div className="badgeCluster">
            <Badge tone="dark">{casino.rating}/10</Badge>
            <VerificationBadge verified={casino.isVerified} />
          </div>
          <h2>{casino.license}</h2>
          <div className="ratingBlock">
            <div>
              <strong>{casino.rating}/10</strong>
              <span>SevenBet rating</span>
            </div>
            <div className="ratingBar" aria-label={`SevenBet rating ${casino.rating} out of 10`}>
              <span style={{ width: `${ratingPercent}%` }} />
            </div>
          </div>
          <div className="resultRows">
            <div>
              <span>Domain</span>
              <strong>{casino.domain}</strong>
            </div>
            <div>
              <span>Wagering</span>
              <strong>x{casino.wagering}</strong>
            </div>
            <div>
              <span>Min deposit</span>
              <strong>{formatMoney(casino.minDeposit)}</strong>
            </div>
            <div>
              <span>Payout</span>
              <strong>~{casino.payoutHours}h</strong>
            </div>
          </div>
          <p className="muted">Before depositing, verify final terms on the operator website and keep your limit unchanged.</p>
          <Button href="/casinos" variant="ghost">
            Compare terms
          </Button>
        </Card>
      </Container>
    </section>
  );
}
