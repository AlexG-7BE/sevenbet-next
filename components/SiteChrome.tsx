import Link from "next/link";

const nav = [
  ["Self-check", "/self-check"],
  ["10 Steps", "/program"],
  ["Bonuses", "/bonuses"],
  ["Catalog", "/catalog"],
];

export function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="mark">7</span>
        <span>SevenBet</span>
      </Link>
      <nav className="nav">
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <Link className="brand" href="/">
            <span className="mark">7</span>
            <span>SevenBet</span>
          </Link>
          <p className="muted">
            Control-first casino comparison. Affiliate links are commercial, but limits come before deposits. 18+ only.
          </p>
        </div>
        <div>
          <h3>Control</h3>
          <Link href="/self-check">Self-check</Link>
          <Link href="/program">10-step program</Link>
          <Link href="/tools/budget-calculator">Budget calculator</Link>
          <Link href="/responsible-gaming">Responsible gaming</Link>
        </div>
        <div>
          <h3>Offers</h3>
          <Link href="/bonuses">Best bonuses</Link>
          <Link href="/bonus-guide">Bonus guide</Link>
          <Link href="/catalog">Catalog</Link>
        </div>
        <div>
          <h3>Legal</h3>
          <Link href="/responsible-gaming">Help resources</Link>
          <Link href="/bonus-guide">Terms explained</Link>
        </div>
      </div>
    </footer>
  );
}
