import Link from "next/link";

import styles from "./CommercialHandoffPage.module.css";

export function CommercialHandoffUnavailable() {
  return (
    <section className={styles.page} data-commercial-handoff="unavailable" data-figma-desktop="930:3111" data-figma-mobile="930:3123">
      <div className={styles.unavailableCard}>
        <p className={styles.eyebrow}>Outbound status · Fail closed</p>
        <h1>Destination unavailable.</h1>
        <p className={styles.copy}>B4GAMBLE could not confirm an eligible outbound destination for this action. No redirect was completed, and no alternative offer has been substituted.</p>
        <p className={styles.failureBoundary}>No destination · No redirect · No substitute offer</p>
        <div className={styles.recoveryAction}>
          <Link href="/">Return to B4GAMBLE</Link>
          <span>Use your browser Back action to return to the page you came from.</span>
        </div>
      </div>
      <p className={styles.footnote}>Affiliate relationships never permit B4GAMBLE to invent availability or expose an unverified destination.</p>
    </section>
  );
}
