"use client";

import Link from "next/link";

import styles from "@/components/casino-profile/CasinoProfile.module.css";

export default function CasinoProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className={styles.unavailablePage} role="alert">
    <div>
      <p>Review could not load</p>
      <h1>This profile is temporarily unavailable.</h1>
      <span>No database or internal error details are exposed. You can retry or return to published reviews.</span>
      <button className={styles.primaryAction} onClick={reset} type="button">Retry profile</button>
      <Link className={styles.unavailableGhost} href="/casinos">Browse published reviews</Link>
      <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
    </div>
  </section>;
}
