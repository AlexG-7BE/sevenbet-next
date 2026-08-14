import type { ReactNode } from "react";

import {
  ProtectedHelpFooter,
  ProtectedHelpHeader,
} from "@/components/protected-help/ProtectedHelpShell";
import styles from "@/components/protected-help/ProtectedHelp.module.css";

export default function ProtectedHelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell} data-protected-help-shell="true">
      <a className={`${styles.skipLink} skipLink`} href="#main-content">Skip to main content</a>
      <ProtectedHelpHeader />
      <main id="main-content">{children}</main>
      <ProtectedHelpFooter />
    </div>
  );
}
