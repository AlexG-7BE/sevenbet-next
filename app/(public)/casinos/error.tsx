"use client";

import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";

export default function CasinoDiscoveryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.page}><section className={styles.statePage}><div><span>Casino directory</span><h1>We could not load the catalogue.</h1><p>Try again in a moment. No database, provider or technical details have been exposed.</p><button onClick={reset} type="button">Try again</button></div></section></div>;
}
