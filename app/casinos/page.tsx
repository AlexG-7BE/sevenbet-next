import { CasinoCard } from "@/components/ui";
import { AffiliateDisclosure, Badge, Card, Container, MethodologyBlock, SectionHeader } from "@/components/ui";
import { getCasinos, getStats } from "@/lib/data";

export default function CasinosPage() {
  const casinos = getCasinos().slice(0, 80);
  const stats = getStats();

  return (
    <section className="pageShell">
      <Container>
        <SectionHeader
          eyebrow="Casino reviews"
          title="Casino reviews inside a responsible gambling framework."
          intro="SevenBet reviews casino information by licensing, bonus terms, wagering, payments, withdrawal speed and responsible gambling tools."
        />

        <div className="statsGrid pageGrid">
          <Card><strong>{stats.total}</strong><span>casino profiles</span></Card>
          <Card><strong>{stats.verified}</strong><span>verified/license signals</span></Card>
          <Card><strong>{stats.payments}</strong><span>payment filters</span></Card>
          <Card><strong>Today</strong><span>last updated placeholder</span></Card>
        </div>

        <AffiliateDisclosure />

        <div className="catalogFilters" aria-label="Casino review filters">
          {["Verified", "Fast payout", "Low wagering", "Responsible tools", "Payment methods", "Licensing"].map((label) => (
            <Badge tone={label === "Verified" ? "warning" : "dark"} key={label}>
              {label}
            </Badge>
          ))}
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
