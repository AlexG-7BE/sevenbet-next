"use client";

import Link from "next/link";

import styles from "@/components/comparison/Comparison.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";

export default function ComparisonError({ reset }: { error: Error; reset: () => void }) {
  const { messages, hrefFor } = usePublicErrorContext();
  return <div className={styles.page} data-comparison-page><section className={styles.stateSection}><div className={styles.shell}><p className={styles.kicker}>{messages.compareKicker}</p><h1>{messages.compareTitle}</h1><p>{messages.compareCopy}</p><button onClick={reset} type="button">{messages.retry}</button> <Link href={hrefFor("/casinos")}>{messages.browse}</Link> <Link href="/help">{messages.protectedHelp}</Link></div></section></div>;
}
