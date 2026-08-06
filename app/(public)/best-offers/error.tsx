"use client";

import Link from "next/link";

import styles from "@/components/best-offers/BestOffers.module.css";

export default function BestOffersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.page}><section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="alert"><p className={styles.kicker}>Load error · fail closed</p><h1>We couldn’t load the shortlist.</h1><p>No cached, legacy or invented offer is substituted. Retry the database-backed projection without changing the methodology.</p><button onClick={reset} type="button">Retry shortlist</button><Link href="/casinos">Browse casino reviews</Link></div></div></section></div>;
}
