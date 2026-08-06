import Link from "next/link";

import styles from "./CasinoProfile.module.css";

export function CasinoProfileUnavailable() {
  return <section className={styles.unavailablePage} data-casino-profile-unavailable>
    <div>
      <p>Profile unavailable</p>
      <h1>This review is not available.</h1>
      <span>This profile is unpublished, archived or otherwise not public. Review content and commercial routes remain hidden.</span>
      <aside><strong>No public profile</strong><p>Nothing from a legacy fallback is rendered here.</p></aside>
      <Link className={styles.primaryAction} href="/casinos">Browse published reviews</Link>
      <Link className={styles.unavailableGhost} href="/methodology">View methodology</Link>
      <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
    </div>
  </section>;
}
