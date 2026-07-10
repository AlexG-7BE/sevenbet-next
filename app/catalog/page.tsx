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
          <Badge tone="green">Casino comparison catalog</Badge>
          <h1>Browse verified casino offers with ratings and bonus terms.</h1>
          <p className="lead">
            The first 80 profiles from the database. Each listing keeps rating, wagering, minimum deposit, payout speed
            and license visible before any casino transition.
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

        <div className="catalogFilters" aria-label="Catalog filter preview">
          {["Top rated", "Fast payout", "Low wagering", "Verified", "Crypto", "Live casino"].map((label) => (
            <Badge tone={label === "Top rated" ? "warning" : "dark"} key={label}>
              {label}
            </Badge>
          ))}
        </div>

        <div className="catalogToolbar">
          <div>
            <p className="eyebrow">Marketplace view</p>
            <h2>Compare bonuses, ratings and risk labels in one scan.</h2>
          </div>
          <Badge tone="warning">Last updated today · {casinos.length} profiles</Badge>
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
