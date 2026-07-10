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
            <Button href="/tools/budget-calculator" variant="primary">
              Start with limit check
            </Button>
            <Button href={casino.affiliateUrl} external variant="ghost">
              Check eligibility
            </Button>
          </div>

          <AffiliateDisclosure />

          <div className="guideGrid twoCards">
            <Card className="guideCard">
              <h3>Offer</h3>
              <p className="muted">{casino.bonusHeadline}</p>
            </Card>
            <Card className="guideCard">
              <h3>Payments</h3>
              <p className="muted">{casino.payments.join(", ")}</p>
            </Card>
            <Card className="guideCard">
              <h3>Providers</h3>
              <p className="muted">{casino.providers.join(", ")}</p>
            </Card>
            <Card className="guideCard">
              <h3>Games</h3>
              <p className="muted">{casino.gameTypes.join(", ")}</p>
            </Card>
          </div>
        </div>

        <Card className="resultPanel detailSidebar" tone="soft">
          <div className="badgeCluster">
            <Badge tone="dark">{casino.rating}/10</Badge>
            <VerificationBadge verified={casino.isVerified} />
          </div>
          <h2>{casino.license}</h2>
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
          <Button href={`/catalog`} variant="ghost">
            Compare terms
          </Button>
        </Card>
      </Container>
    </section>
  );
}
