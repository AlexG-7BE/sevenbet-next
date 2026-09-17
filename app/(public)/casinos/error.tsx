"use client";

import Link from "next/link";

import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";
import { retryPublicCommercialError } from "@/lib/qa/retry-public-commercial-error";

export default function CasinoDiscoveryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { hrefFor, messages } = usePublicErrorContext();
  return <div className={styles.page} data-public-commercial-error="casinos"><section className={styles.statePage}><div role="alert"><span>{messages.eyebrow}</span><h1>{messages.title}</h1><p>{messages.copy}</p><div className={styles.statePageActions} data-public-error-actions><button onClick={() => retryPublicCommercialError(reset)} type="button">{messages.retry}</button><Link href={hrefFor("/")}>{messages.home}</Link><Link href={hrefFor("/help")}>{messages.protectedHelp}</Link></div></div></section></div>;
}
