"use client";

import Link from "next/link";

import styles from "@/components/best-offers/BestOffers.module.css";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";

export default function BestOffersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  return <div className={styles.page}><section className={styles.statePage}><div className={styles.shell}><div className={styles.statePanel} role="alert"><p className={styles.kicker}>{messages.common.commercialUnavailable}</p><h1>{messages.bestOffers.unavailableTitleBody}</h1><p>{messages.bestOffers.unavailableCopy}</p><button onClick={reset} type="button">{messages.common.current}</button><Link href={productHref("/casinos")}>{messages.common.browseReviews}</Link></div></div></section></div>;
}
