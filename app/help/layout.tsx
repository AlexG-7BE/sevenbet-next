import type { ReactNode } from "react";

import {
  ProtectedHelpFooter,
  ProtectedHelpHeader,
  protectedHelpShellCopy,
} from "@/components/protected-help/ProtectedHelpShell";
import styles from "@/components/protected-help/ProtectedHelp.module.css";
import { firstWaveSafetyProfile } from "@/lib/market/first-wave-evidence";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { resolveServerSite } from "@/lib/site/server-site";

export default async function ProtectedHelpLayout({ children }: { children: ReactNode }) {
  const [presentation, site] = await Promise.all([resolveServerPresentationContext(), resolveServerSite()]);
  const profile = presentation.source === "EXPLICIT_ROUTE" ? firstWaveSafetyProfile(presentation) : null;
  const copy = protectedHelpShellCopy(profile);
  return (
    <div className={styles.shell} data-protected-help-shell="true">
      <a className={`${styles.skipLink} skipLink`} href="#main-content">{copy?.skip ?? "Skip to main content"}</a>
      <ProtectedHelpHeader presentation={presentation} profile={profile} site={site} />
      <main id="main-content">{children}</main>
      <ProtectedHelpFooter presentation={presentation} profile={profile} site={site} />
    </div>
  );
}
