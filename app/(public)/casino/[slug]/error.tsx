"use client";

import Link from "next/link";

import styles from "@/components/casino-profile/CasinoProfile.module.css";

export default function CasinoProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <article className={`${styles.page} ${styles.unavailablePage}`}>
    <div className={styles.unavailableShell}>
      <p className={styles.tealLabel}>PROFILE COULD NOT LOAD</p>
      <h1>We could not load this review.</h1>
      <p>No draft data or substitute operator has been shown. Retry the published profile or return to the public directory.</p>
      <div className={styles.unavailableMarker}><strong>FAIL-CLOSED STATE</strong><span>The review and commercial action remain unavailable until the published source can be read.</span></div>
      <div className={styles.unavailableLinks}><button className={styles.primaryAction} onClick={reset} type="button">Retry published review</button><Link className={styles.secondaryAction} href="/casinos">Browse casino reviews</Link></div>
      <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
    </div>
  </article>;
}
