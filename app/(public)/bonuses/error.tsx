"use client";

import Link from "next/link";

import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { useProductPageContext } from "@/lib/i18n/use-product-page-context";

export default function BonusesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages } = useProductPageContext();
  return <div className={styles.page}><section className={styles.directorySection}><div className={styles.shell}><div className={styles.empty} role="alert"><p className={styles.eyebrow}>{messages.common.commercialUnavailable}</p><h1 className={styles.display}>{messages.bonuses.unavailableTitleBody}</h1><p>{messages.bonuses.unavailableCopy}</p><button className={styles.offerActionCompact} onClick={reset} type="button">{messages.common.current}</button> <Link href="/bonus-guide">{messages.common.bonusGuide}</Link></div></div></section></div>;
}
