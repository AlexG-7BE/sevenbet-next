import type { ReactNode } from "react";

import { StartFooter, StartHeader } from "./StartShell";
import styles from "./StartShell.module.css";

/**
 * Landing for paid UK help ads (Founder, 2 October 2026). It lives outside the
 * (public) route group so the public header, navigation and footer, and with
 * them every casino, bonus and offer destination, never render here. The root
 * layout still supplies the cookie choice and the existing first-party analytics.
 */
export default function StartLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell} data-start-shell="true">
      <a className={`skipLink ${styles.skipLink}`} href="#main-content">Skip to main content</a>
      <StartHeader />
      <main id="main-content">{children}</main>
      <StartFooter />
    </div>
  );
}
