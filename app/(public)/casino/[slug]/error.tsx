"use client";

import Link from "next/link";

import styles from "@/components/casino-profile/CasinoProfile.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function CasinoProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { hrefFor, messages } = usePublicErrorContext();
  return <article className={`${styles.page} ${styles.unavailablePage}`} data-public-commercial-error="casino-profile">
    <div className={styles.unavailableShell} role="alert">
      <p className={styles.tealLabel}>{messages.eyebrow}</p>
      <h1>{messages.title}</h1>
      <p>{messages.copy}</p>
      <div className={styles.unavailableLinks} data-public-error-actions><button className={styles.primaryAction} onClick={() => retryPublicCommercialError(reset)} type="button">{messages.retry}</button><Link className={styles.secondaryAction} href={hrefFor("/casinos")}>{messages.browse}</Link></div>
      <Link className={styles.helpLink} href={hrefFor("/help")}>{messages.protectedHelp}</Link>
    </div>
  </article>;
}
