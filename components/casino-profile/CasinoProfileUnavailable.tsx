import Link from "next/link";

import styles from "./CasinoProfile.module.css";

export function CasinoProfileUnavailable({
  eyebrow = "PROFILE UNAVAILABLE",
  title = "This review is not available.",
  description = "This profile is unpublished, archived or otherwise not public. Review content and commercial routes remain hidden.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return <article className={`${styles.page} ${styles.unavailablePage}`}>
    <div className={styles.unavailableShell}>
      <p className={styles.tealLabel}>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className={styles.unavailableMarker}><strong>NO PUBLIC PROFILE</strong><span>Nothing from a draft, archived record or legacy fallback is rendered here.</span></div>
      <div className={styles.unavailableLinks}><Link className={styles.primaryAction} href="/casinos">Browse published reviews</Link><Link className={styles.secondaryAction} href="/methodology">View methodology</Link></div>
      <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
    </div>
  </article>;
}
