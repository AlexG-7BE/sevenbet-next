import Link from "next/link";
import type { Casino } from "@/lib/data";
import { formatMoney } from "@/lib/data";

export function BonusCard({ casino, rank }: { casino: Casino; rank: number }) {
  return (
    <article className="bonusCard">
      <div className="cardRank">{rank}</div>
      <div>
        <h3>{casino.name}</h3>
        <p className="muted">{casino.bonusHeadline}</p>
      </div>
      <div className="chips">
        <span className="chip gold">{casino.rating}/10</span>
        <span className="chip">{casino.license}</span>
        <span className="chip">x{casino.wagering}</span>
        <span className="chip">Min {formatMoney(casino.minDeposit)}</span>
      </div>
      <div className="cardActions">
        <a className="button gold" href={casino.affiliateUrl} rel="nofollow sponsored" target="_blank">
          Get bonus
        </a>
        <Link className="button ghost" href={`/casino/${casino.slug}`}>
          Review
        </Link>
      </div>
    </article>
  );
}

export function CasinoRow({ casino }: { casino: Casino }) {
  return (
    <article className="casinoRow">
      <div className="casinoLogo">{casino.name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{casino.name}</h3>
        <p className="muted">{casino.tagline}</p>
        <div className="chips">
          <span className="chip gold">{casino.rating}/10</span>
          <span className="chip">{casino.category}</span>
          <span className="chip">{casino.license}</span>
          {casino.crypto && <span className="chip">Crypto</span>}
        </div>
      </div>
      <div className="rowBonus">
        <strong>{casino.bonusHeadline}</strong>
        <span>Wagering x{casino.wagering}</span>
      </div>
      <Link className="button" href={`/casino/${casino.slug}`}>
        Details
      </Link>
    </article>
  );
}
