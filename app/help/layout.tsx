import type { ReactNode } from "react";

import {
  ProtectedHelpFooter,
  ProtectedHelpHeader,
  protectedHelpShellCopy,
} from "@/components/protected-help/ProtectedHelpShell";
import styles from "@/components/protected-help/ProtectedHelp.module.css";
import { firstWaveMarketEvidence } from "@/lib/market/first-wave-evidence";
import { resolveServerPresentationContext } from "@/lib/market/server";

export default async function ProtectedHelpLayout({ children }: { children: ReactNode }) {
  const presentation = await resolveServerPresentationContext();
  const profile = presentation.source === "EXPLICIT_ROUTE" ? firstWaveMarketEvidence(presentation.market.countryCode) : null;
  const copy = protectedHelpShellCopy(profile);
  return (
    <div className={styles.shell} data-protected-help-shell="true">
      <a className={`${styles.skipLink} skipLink`} href="#main-content">{copy?.skip ?? "Skip to main content"}</a>
      <ProtectedHelpHeader presentation={presentation} profile={profile} />
      <main id="main-content">{children}</main>
      <ProtectedHelpFooter presentation={presentation} profile={profile} />
    </div>
  );
}
