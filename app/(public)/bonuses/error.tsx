"use client";

import Link from "next/link";

import styles from "@/components/bonus-directory/BonusDirectory.module.css";

export default function BonusesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.page}><section className={styles.directorySection}><div className={styles.shell}><div className={styles.empty} role="alert"><p className={styles.eyebrow}>Directory load error · fail closed</p><h1 className={styles.display}>Published Offers Could Not Be Loaded.</h1><p>No cached or invented commercial record is substituted. Retry the database-backed directory or continue to a neutral route.</p><button className={styles.offerActionCompact} onClick={reset} type="button">Retry Directory</button> <Link href="/bonus-guide">Read the Bonus Guide</Link></div></div></section></div>;
}
