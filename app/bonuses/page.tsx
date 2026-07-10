import Link from "next/link";
import { BonusCard } from "@/components/CasinoCards";
import { getTopCasinos } from "@/lib/data";

export default function BonusesPage() {
  const casinos = getTopCasinos(24);

  return (
    <section className="pageShell">
      <div className="container">
        <p className="eyebrow">Best welcome bonuses</p>
        <h1>Bonuses you can compare without the marketing fog.</h1>
        <p className="lead">See rating, wagering, minimum deposit and license before the click. If your limit is not set, open the calculator first.</p>
        <div className="heroActions">
          <Link className="button gold" href="/tools/budget-calculator">Calculate limit</Link>
          <Link className="button ghost" href="/bonus-guide">Read bonus guide</Link>
        </div>
        <div className="bonusGrid pageGrid">
          {casinos.map((casino, index) => (
            <BonusCard casino={casino} key={casino.slug} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
