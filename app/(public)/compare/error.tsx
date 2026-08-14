"use client";

import Link from "next/link";

import styles from "@/components/comparison/Comparison.module.css";

export default function ComparisonError({ reset }: { error: Error; reset: () => void }) {
  return <div className={styles.page} data-comparison-page><section className={styles.stateSection}><div className={styles.shell}><p className={styles.kicker}>Comparison unavailable · fail closed</p><h1>The published comparison could not load.</h1><p>No cached, legacy or invented commercial record is substituted. The public reviews and protected Help remain available.</p><button onClick={reset} type="button">Try again</button> <Link href="/casinos">Browse reviews</Link> <Link href="/help">Open protected Help</Link></div></section></div>;
}
