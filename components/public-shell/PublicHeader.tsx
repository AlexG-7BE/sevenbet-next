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
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="SevenBet home" translate="no">
          SEVENBET
        </Link>
        <PublicNavigation account={account} authenticated={authenticated} />
      </div>
    </header>
  );
}
