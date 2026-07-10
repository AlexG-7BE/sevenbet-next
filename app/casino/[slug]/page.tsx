import { notFound } from "next/navigation";
import { getCasino, getCasinos, formatMoney } from "@/lib/data";

export function generateStaticParams() {
  return getCasinos().slice(0, 80).map((casino) => ({ slug: casino.slug }));
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const casino = getCasino(slug);
  if (!casino) notFound();

  return (
    <section className="pageShell">
      <div className="container detailGrid">
        <div>
          <p className="eyebrow">{casino.category}</p>
          <h1>{casino.name}</h1>
          <p className="lead">{casino.description}</p>
          <div className="heroActions">
            <a className="button gold" href={casino.affiliateUrl} target="_blank" rel="nofollow sponsored">Get bonus</a>
            <a className="button ghost" href="/tools/budget-calculator">Calculate limit first</a>
          </div>
          <div className="guideGrid twoCards">
            <article className="guideCard"><h3>Bonus</h3><p className="muted">{casino.bonusHeadline}</p></article>
            <article className="guideCard"><h3>Payments</h3><p className="muted">{casino.payments.join(", ")}</p></article>
            <article className="guideCard"><h3>Providers</h3><p className="muted">{casino.providers.join(", ")}</p></article>
            <article className="guideCard"><h3>Games</h3><p className="muted">{casino.gameTypes.join(", ")}</p></article>
          </div>
        </div>
        <aside className="resultPanel">
          <span className="safeBadge">{casino.rating}/10</span>
          <h2>{casino.license}</h2>
          <div className="resultRows">
            <div><span>Domain</span><strong>{casino.domain}</strong></div>
            <div><span>Wagering</span><strong>x{casino.wagering}</strong></div>
            <div><span>Min deposit</span><strong>{formatMoney(casino.minDeposit)}</strong></div>
            <div><span>Payout</span><strong>~{casino.payoutHours}h</strong></div>
          </div>
          <p className="muted">Before depositing, verify final terms on the operator&apos;s website.</p>
        </aside>
      </div>
    </section>
  );
}
