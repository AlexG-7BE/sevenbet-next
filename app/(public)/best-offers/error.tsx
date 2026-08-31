"use client";

import Link from "next/link";

import styles from "@/components/best-offers/BestOffers.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function BestOffersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  const { messages: errorMessages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="best-offers"><section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="alert"><p className={styles.kicker}>{messages.common.commercialUnavailable}</p><h1>{messages.bestOffers.unavailableTitleBody}</h1><p>{messages.bestOffers.unavailableCopy}</p><div className={styles.stateActions} data-public-error-actions><button onClick={() => retryPublicCommercialError(reset)} type="button">{errorMessages.retry}</button><Link href={productHref("/casinos")}>{messages.common.browseReviews}</Link></div></div></div></section></div>;
}
