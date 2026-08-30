"use client";

import Link from "next/link";

import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function CasinoDiscoveryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  const { messages: errorMessages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="casinos"><section className={styles.statePage}><div role="alert"><span>{messages.casinos.directoryTitle}</span><h1>{messages.common.commercialUnavailable}</h1><p>{messages.casinos.noMatchesCopy}</p><div className={styles.statePageActions} data-public-error-actions><button onClick={() => retryPublicCommercialError(reset)} type="button">{errorMessages.retry}</button><Link href={productHref("/methodology")}>{messages.common.reviewMethodology}</Link><Link href={productHref("/help")}>{messages.common.protectedHelp}</Link></div></div></section></div>;
}
