"use client";

import { ActionButton, ActionLink } from "@/components/design-system/Action";
import styles from "@/components/public-shell/PublicStatus.module.css";
import { usePublicErrorContext } from "@/lib/i18n/use-public-error-context";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages, hrefFor } = usePublicErrorContext();
  return (
    <section className={styles.page} aria-labelledby="public-error-title" role="alert">
      <div className={styles.panel}>
        <p className={styles.eyebrow}>{messages.eyebrow}</p>
        <h1 id="public-error-title">{messages.title}</h1>
        <p className={styles.copy}>{messages.copy}</p>
        <div className={styles.actions}>
          <ActionButton onClick={reset}>{messages.retry}</ActionButton>
          <ActionLink href={hrefFor("/")} variant="ghost-paper">{messages.home}</ActionLink>
          <ActionLink href="/help" variant="ghost-paper">{messages.help}</ActionLink>
        </div>
      </div>
    </section>
  );
}
