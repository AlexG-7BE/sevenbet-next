"use client";

import Link from "next/link";

import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";

export default function CasinoDiscoveryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, productHref } = useProductPageContext();
  return <div className={styles.page}><section className={styles.statePage}><div><span>{messages.casinos.directoryTitle}</span><h1>{messages.common.commercialUnavailable}</h1><p>{messages.casinos.noMatchesCopy}</p><div className={styles.statePageActions}><button onClick={reset} type="button">{messages.common.current}</button><Link href={productHref("/methodology")}>{messages.common.reviewMethodology}</Link><Link href={productHref("/help")}>{messages.common.protectedHelp}</Link></div></div></section></div>;
}
