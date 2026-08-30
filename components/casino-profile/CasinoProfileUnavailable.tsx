import Link from "next/link";

import styles from "./CasinoProfile.module.css";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

export function CasinoProfileUnavailable({
  eyebrow = "PROFILE UNAVAILABLE",
  title = "This review is not available.",
  description = "This profile is unpublished, archived or otherwise not public. Review content and commercial routes remain hidden.",
  messages,
  presentation,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  messages?: ProductPageMessages;
  presentation?: PresentationResolution;
}) {
  return <article className={`${styles.page} ${styles.unavailablePage}`}>
    <div className={styles.unavailableShell}>
      <p className={styles.tealLabel}>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className={styles.unavailableMarker}><strong>{messages?.profile.offerUnavailable ?? "NO PUBLIC PROFILE"}</strong><span>{messages?.common.reviewAvailableNoAction ?? "Nothing from a draft, archived record or legacy fallback is rendered here."}</span></div>
      <div className={styles.unavailableLinks}><Link className={styles.primaryAction} href={presentation ? productHref(presentation, "/casinos") : "/casinos"}>{messages?.common.browseReviews ?? "Browse published reviews"}</Link><Link className={styles.secondaryAction} href={presentation ? productHref(presentation, "/methodology") : "/methodology"}>{messages?.common.reviewMethodology ?? "View methodology"}</Link></div>
      <Link className={styles.helpLink} href="/help">{messages?.common.protectedHelp ?? "Open protected Help"}</Link>
    </div>
  </article>;
}
