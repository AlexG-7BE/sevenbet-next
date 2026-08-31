"use client";

import Link from "next/link";

import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function BonusesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  const { messages: errorMessages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="bonuses"><section className={`${styles.directorySection} ${styles.errorDirectorySection}`}><div className={styles.shell}><div className={styles.empty} role="alert"><p className={styles.eyebrow}>{messages.common.commercialUnavailable}</p><h1 className={styles.display}>{messages.bonuses.unavailableTitleBody}</h1><p>{messages.bonuses.unavailableCopy}</p><div className={styles.emptyActions} data-public-error-actions><button className={styles.offerActionCompact} onClick={() => retryPublicCommercialError(reset)} type="button">{errorMessages.retry}</button><Link href={productHref("/bonus-guide")}>{messages.common.bonusGuide}</Link></div></div></div></section></div>;
}
