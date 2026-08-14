import Link from "next/link";

import type { PublicAccountNavigation } from "@/lib/public-shell";
import { PublicNavigation } from "./PublicNavigation";
import styles from "./PublicShell.module.css";

export function PublicHeader({
  account,
  authenticated,
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
}) {
  return (
    <header className={styles.header} data-public-shell="header">
      <div className={styles.headerInner} data-shell-section="header-inner">
        <Link className={styles.brand} data-shell-element="brand" href="/" aria-label="B4GAMBLE home" translate="no">
          B4GAMBLE
        </Link>
        <PublicNavigation account={account} authenticated={authenticated} />
      </div>
    </header>
  );
}
