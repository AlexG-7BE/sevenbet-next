import { CasinoCard } from "@/components/ui";
import { AffiliateDisclosure, Badge, Card, Container, MethodologyBlock } from "@/components/ui";
import { getCasinos, getStats } from "@/lib/data";

export default function CatalogPage() {
  const casinos = getCasinos().slice(0, 80);
  const stats = getStats();

  return (
    <section className="pageShell">
      <Container>
        <div className="pageIntro">
          <Badge tone="green">Full catalog</Badge>
          <h1>Casino catalog for comparison after limits are set.</h1>
          <p className="lead">
            The first 80 profiles from the database. Each listing keeps rating, wagering, minimum deposit and license
            visible before any operator decision.
          </p>
        </div>

        <div className="statsGrid pageGrid">
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

        <AffiliateDisclosure />

        <div className="catalogToolbar">
          <div>
            <p className="eyebrow">Marketplace view</p>
            <h2>Compare terms before eligibility checks.</h2>
          </div>
          <Badge>{casinos.length} visible profiles</Badge>
        </div>

        <div className="catalogList">
          {casinos.map((casino) => (
            <CasinoCard casino={casino} key={casino.slug} />
          ))}
        </div>

        <div className="catalogMethodology">
          <MethodologyBlock />
        </div>
      </Container>
    </section>
  );
}
