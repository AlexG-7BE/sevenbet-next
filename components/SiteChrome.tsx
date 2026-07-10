import Link from "next/link";

const nav = [
  ["Program", "/program"],
  ["Self-check", "/self-check"],
  ["Responsible Gambling", "/responsible-gambling"],
  ["Bonuses", "/bonuses"],
  ["Casino Reviews", "/casinos"],
  ["Methodology", "/methodology"],
];

export function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="SevenBet home">
        <span className="mark">7</span>
        <span>SevenBet</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <Link className="button gold navCta" href="/bonuses">
          Compare offers
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <Link className="brand" href="/" aria-label="SevenBet home">
            <span className="mark">7</span>
            <span>SevenBet</span>
          </Link>
          <p className="muted">
            Premium casino bonus comparison with visible terms, ratings, affiliate disclosure and responsible gambling
            context. 18+ only.
          </p>
          <p className="footerNotice">
            If gambling is affecting money, work or relationships, pause and use responsible gaming support before
            reviewing offers.
          </p>
        </div>
        <div>
          <h3>Program</h3>
          <Link href="/program">10-Step Control Program</Link>
          <Link href="/self-check">Self Assessment</Link>
          <Link href="/tools/budget-calculator">Budget calculator</Link>
          <Link href="/responsible-gambling">Responsible Gambling</Link>
        </div>
        <div>
          <h3>Casino comparison</h3>
          <Link href="/bonuses">Casino Bonuses</Link>
          <Link href="/casinos">Casino Reviews</Link>
          <Link href="/bonus-guide">Bonus guide</Link>
          <Link href="/catalog">Legacy catalog</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/methodology">Methodology</Link>
          <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
          <Link href="/about">About SevenBet</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
