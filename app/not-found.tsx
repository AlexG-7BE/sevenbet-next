import { ActionLink } from "@/components/design-system/Action";
import Link from "next/link";
import { PublicFooter } from "@/components/public-shell/PublicFooter";
import { PublicHeader } from "@/components/public-shell/PublicHeader";
import styles from "@/components/public-shell/PublicStatus.module.css";

export default function NotFound() {
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <PublicHeader account={{ accountLabel: "Log in", accountHref: "/login", primaryLabel: "Start Programme", primaryHref: "/program", xpLabel: null }} authenticated={false} />
      <main id="main-content">
        <section className={styles.page}>
          <div className={styles.panel}>
            <p className={styles.errorCode}>404</p>
            <h1>This route is lost.<br /><em>Let&apos;s get you back on course.</em></h1>
            <div className={styles.actions}>
              <ActionLink href="/">Go to homepage</ActionLink>
              <Link href="/10-steps">About the Programme →</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
