import Link from "next/link";

import styles from "./ProtectedHelp.module.css";

export function ProtectedHelpHeader() {
  return (
    <div className={styles.headerWrap}>
      <header className={styles.header} data-protected-help="header">
        <div className={styles.identity}>
          <Link className={styles.brand} href="/help" aria-label="B4GAMBLE Help home" translate="no">
            B4GAMBLE
          </Link>
          <span className={styles.protectedBadge}>Protected Help</span>
        </div>
        <nav className={styles.helpNavigation} aria-label="Protected Help navigation">
          <Link className={styles.desktopHelpLink} href="/help" aria-current="page">
            Help home
          </Link>
          <Link className={styles.desktopHelpLink} href="/program">My Programme</Link>
          <Link className={styles.exitLink} href="/">
            <span className={styles.desktopExit}>Leave Help</span>
            <span className={styles.mobileExit}>Exit</span>
          </Link>
        </nav>
      </header>
    </div>
  );
}

export function ProtectedHelpFooter() {
  return (
    <div className={styles.footerWrap}>
      <footer className={styles.footer} data-protected-help="footer">
        <div className={styles.footerBoundary}>
          <p className={styles.footerEyebrow}>Control &amp; support</p>
          <p className={styles.footerTitle}>Help stays non-commercial.</p>
          <p className={styles.footerCopy}>
            B4GAMBLE provides information, not emergency or clinical care. External support opens on another site and should be checked for your location.
          </p>
        </div>
        <div className={styles.footerUtility}>
          <p className={styles.separationBadge}>No casino · No bonus · No affiliate</p>
          <nav className={styles.footerLinks} aria-label="Protected Help footer">
            <Link href="/help">Help home</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/about">About</Link>
          </nav>
          <p className={styles.copyright}>© 2026 B4GAMBLE</p>
        </div>
      </footer>
    </div>
  );
}
