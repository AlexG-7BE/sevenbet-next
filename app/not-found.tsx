import { ActionLink } from "@/components/design-system/Action";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import styles from "@/components/public-shell/PublicStatus.module.css";
import { accountNavigationFor } from "@/lib/public-shell";

export default function NotFound() {
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <PublicHeader account={accountNavigationFor({ authenticated: false })} authenticated={false} />
      <main id="main-content">
        <section className={styles.page}>
          <div className={styles.panel}>
            <p className={styles.eyebrow}>404 · Page not found</p>
            <h1>This page isn&apos;t here.</h1>
            <p className={styles.copy}>The link may be outdated, moved or no longer published.</p>
            <div className={styles.actions}>
              <ActionLink href="/">Go home</ActionLink>
              <ActionLink href="/help" variant="ghost-paper">Open Help</ActionLink>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
