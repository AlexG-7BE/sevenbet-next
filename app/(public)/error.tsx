"use client";

import { ActionButton, ActionLink } from "@/components/design-system/Action";
import styles from "@/components/public-shell/PublicStatus.module.css";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className={styles.page} aria-labelledby="public-error-title" role="alert">
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Something went wrong</p>
        <h1 id="public-error-title">We couldn&apos;t load this page.</h1>
        <p className={styles.copy}>Try again, or return to a safe starting point.</p>
        <div className={styles.actions}>
          <ActionButton onClick={reset}>Try again</ActionButton>
          <ActionLink href="/" variant="ghost-paper">Go home</ActionLink>
          <ActionLink href="/responsible-gambling" variant="ghost-paper">Open Help</ActionLink>
        </div>
      </div>
    </section>
  );
}
