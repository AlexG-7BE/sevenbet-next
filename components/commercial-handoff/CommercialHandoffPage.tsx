import Link from "next/link";

import styles from "./CommercialHandoffPage.module.css";

export function CommercialHandoffConfirmation({ slug }: { slug: string }) {
  return (
    <section className={styles.page} data-commercial-handoff="confirmation" data-figma-desktop="679:5319" data-figma-mobile="679:8489">
      <div className={styles.confirmationCard}>
        <p className={styles.eyebrow}>02 / Outbound confirmation</p>
        <h1>You are leaving B4GAMBLE.</h1>
        <p className={styles.copy}>B4GAMBLE may receive a commission. Eligibility and destination are checked again before the internal redirect continues.</p>
        <aside className={styles.handoffContract}>
          <strong>Handoff contract</strong>
          <span>No raw destination URL · no browser-supplied authority · a neutral cancel path remains available.</span>
        </aside>
        <div className={styles.actions}>
          <a href={`/r/${slug}`} rel="nofollow sponsored noopener" target="_blank">Continue to eligible partner</a>
          <Link href="/">Cancel and stay on B4GAMBLE</Link>
        </div>
      </div>
      <p className={styles.footnote}>18+ · Internal managed redirect only</p>
    </section>
  );
}

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
