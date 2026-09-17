"use client";

import Link from "next/link";

import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function BonusesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { hrefFor, messages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="bonuses"><section className={`${styles.directorySection} ${styles.errorDirectorySection}`}><div className={styles.shell}><div className={styles.empty} role="alert"><p className={styles.eyebrow}>{messages.eyebrow}</p><h1 className={styles.display}>{messages.title}</h1><p>{messages.copy}</p><div className={styles.emptyActions} data-public-error-actions><button className={styles.offerActionCompact} onClick={() => retryPublicCommercialError(reset)} type="button">{messages.retry}</button><Link href={hrefFor("/casinos")}>{messages.browse}</Link></div></div></div></section></div>;
}
