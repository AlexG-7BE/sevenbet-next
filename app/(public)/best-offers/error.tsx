"use client";

import Link from "next/link";

import styles from "@/components/best-offers/BestOffers.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function BestOffersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { hrefFor, messages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="best-offers"><section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="alert"><p className={styles.kicker}>{messages.eyebrow}</p><h1>{messages.title}</h1><p>{messages.copy}</p><div className={styles.stateActions} data-public-error-actions><button onClick={() => retryPublicCommercialError(reset)} type="button">{messages.retry}</button><Link href={hrefFor("/casinos")}>{messages.browse}</Link></div></div></div></section></div>;
}
