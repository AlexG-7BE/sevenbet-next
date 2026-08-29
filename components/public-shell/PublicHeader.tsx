import Link from "next/link";

import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { resolvePresentationContext, type PresentationResolution } from "@/lib/market/presentation-resolver";
import { publicMarketPath } from "@/lib/market/registry";
import type { PublicAccountNavigation } from "@/lib/public-shell";
import { PublicHeaderThemeController } from "./PublicHeaderThemeController";
import { PublicNavigation } from "./PublicNavigation";
import styles from "./PublicShell.module.css";

export function PublicHeader({
  account,
  authenticated,
  presentation = resolvePresentationContext({}),
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
  presentation?: PresentationResolution;
}) {
  const messages = publicShellMessages(presentation.locale);
  const homeHref = presentation.source === "EXPLICIT_ROUTE"
    ? publicMarketPath(presentation.market, presentation.locale)
    : "/";
  return (
    <header className={styles.header} data-public-shell="header" data-shell-theme="dark">
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={homeHref} aria-label={messages.homeLabel} translate="no">
          B4GAMBLE
        </Link>
        <PublicNavigation account={account} authenticated={authenticated} messages={messages} presentation={presentation} />
      </div>
      <PublicHeaderThemeController />
    </header>
  );
}
