"use client";

import { useEffect, useState } from "react";

import { signOutOfB4gamble } from "@/lib/auth/sign-out-client";
import { noteSignedInUser } from "@/lib/auth/signed-in-signal";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { useSiteNameIn } from "@/components/site/SiteNameProvider";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiAuthenticatedHeader({ userId, totalXp, locale, programmePath, label, dashboard = false }: { userId: string; totalXp: number; locale: ProgrammeLocale; programmePath: string; label?: string; dashboard?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  // §7.2 and Q2: "Log out of B4GAMBLE" names the site that is serving the Programme.
  const inSite = useSiteNameIn();
  // The site menu's Log out line follows the account this screen is shown for: the person may
  // have signed in without a new document, which is when the header read the session cookie.
  useEffect(() => {
    noteSignedInUser(userId);
  }, [userId]);
  async function signOut() {
    setState("busy");
    try {
      await signOutOfB4gamble(userId);
      window.location.assign(programmePath);
    } catch {
      setState("failed");
    }
  }
  // The Programme home carries no label of its own: the site header's "My Programme" already names
  // the page (Founder, 12 October 2026: two "My Programme" pills stood one above the other).
  return (
    <div className={styles.header} data-dashboard-header={dashboard || undefined} data-programme-context-header data-site-classification="STANDARD" data-site-frame="standard">
      {dashboard ? null : <span className={styles.programmeLabel}>{label ?? programmeText(locale, "10-STEP CONTROL PROGRAMME")}</span>}
      <span className={styles.xp}>{totalXp} XP</span>
      <button aria-label={inSite(programmeText(locale, "Log out of B4GAMBLE"))} className={styles.logout} disabled={state === "busy"} onClick={signOut} type="button">
        {dashboard ? state === "busy" ? "…" : state === "failed" ? "!" : "A" : state === "busy" ? programmeText(locale, "Logging out…") : state === "failed" ? programmeText(locale, "Try log out") : programmeText(locale, "Log out")}
      </button>
    </div>
  );
}
