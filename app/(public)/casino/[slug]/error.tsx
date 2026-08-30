"use client";

import Link from "next/link";

import styles from "@/components/casino-profile/CasinoProfile.module.css";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";

export default function CasinoProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  return <article className={`${styles.page} ${styles.unavailablePage}`}>
    <div className={styles.unavailableShell}>
      <p className={styles.tealLabel}>{messages.profile.offerUnavailable}</p>
      <h1>{messages.profile.unavailableTitle.replace(/\s*\|\s*B4GAMBLE$/, "")}</h1>
      <p>{messages.profile.unavailableDescription}</p>
      <div className={styles.unavailableMarker}><strong>{messages.common.commercialUnavailable}</strong><span>{messages.common.reviewAvailableNoAction}</span></div>
      <div className={styles.unavailableLinks}><button className={styles.primaryAction} onClick={reset} type="button">{messages.common.current}</button><Link className={styles.secondaryAction} href={productHref("/casinos")}>{messages.common.browseReviews}</Link></div>
      <Link className={styles.helpLink} href={productHref("/help")}>{messages.common.protectedHelp}</Link>
    </div>
  </article>;
}
