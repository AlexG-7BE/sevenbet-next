"use client";

import Link from "next/link";

import styles from "@/components/casino-profile/CasinoProfile.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function CasinoProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  const { messages: errorMessages } = usePublicErrorContext();
  return <article className={`${styles.page} ${styles.unavailablePage}`} data-public-commercial-error="casino-profile">
    <div className={styles.unavailableShell} role="alert">
      <p className={styles.tealLabel}>{messages.profile.offerUnavailable}</p>
      <h1>{messages.profile.unavailableTitle.replace(/\s*\|\s*B4GAMBLE$/, "")}</h1>
      <p>{messages.profile.unavailableDescription}</p>
      <div className={styles.unavailableMarker}><strong>{messages.common.commercialUnavailable}</strong><span>{messages.common.reviewAvailableNoAction}</span></div>
      <div className={styles.unavailableLinks} data-public-error-actions><button className={styles.primaryAction} onClick={() => retryPublicCommercialError(reset)} type="button">{errorMessages.retry}</button><Link className={styles.secondaryAction} href={productHref("/casinos")}>{messages.common.browseReviews}</Link></div>
      <Link className={styles.helpLink} href={productHref("/help")}>{messages.common.protectedHelp}</Link>
    </div>
  </article>;
}
