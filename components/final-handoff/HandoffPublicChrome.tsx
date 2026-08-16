import Link from "next/link";

import styles from "./HandoffPublicChrome.module.css";

export function HandoffPublicNav() {
  return (
    <div className={styles.nav}>
      <Link className={styles.brand} href="/">B4GAMBLE</Link>
      <nav aria-label="Primary">
        <div className={styles.links}>
          <Link href="/best-offers">Best Offers</Link>
          <Link href="/casinos">Casinos</Link>
          <Link href="/bonuses">Bonuses</Link>
          <Link href="/learn">Learn</Link>
        </div>
      </nav>
      <div className={styles.actions}>
        <Link className={styles.login} href="/login">Log in</Link>
        <Link className={styles.programme} href="/program?entry=start">Start Programme</Link>
      </div>
    </div>
  );
}

export function HandoffFooterStrip({ contact = true }: { contact?: boolean }) {
  return (
    <div className={styles.footer}>
      <span className={styles.age}>18+</span>
      <span>BeGambleAware.org</span>
      <span>Gamble responsibly.</span>
      <span className={styles.legal}>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        {contact ? <Link href="/contact">Contact</Link> : null}
      </span>
    </div>
  );
}
