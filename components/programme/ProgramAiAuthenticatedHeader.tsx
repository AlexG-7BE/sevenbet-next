"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { PROGRAMME_ACCESS_HEADERS, PROGRAMME_ACCESS_HEADER_VALUES } from "@/lib/programme/access-contract";
import {
  clearProgrammeAccessAuthority,
  clearProgrammeAccessContinuation,
  clearProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  userProgrammeSubject,
} from "@/lib/programme/local-subject-storage";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiAuthenticatedHeader({ userId, totalXp, locale, programmePath, label, dashboard = false }: { userId: string; totalXp: number; locale: ProgrammeLocale; programmePath: string; label?: string; dashboard?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  async function signOut() {
    setState("busy");
    try {
      const transition = await fetch("/api/program/session", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
        headers: { [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age },
      });
      if (!transition.ok) throw new Error("Subject transition failed");
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      clearProgrammeAccessAuthority(window.sessionStorage, userProgrammeSubject(userId));
      clearProgrammeAccessContinuation(window.sessionStorage);
      clearProgrammeOAuthClaimMarker(window.sessionStorage);
      rotateAnonymousProgrammeSubject(window.sessionStorage);
      window.location.assign(programmePath);
    } catch {
      setState("failed");
    }
  }
  return (
    <div className={styles.header} data-dashboard-header={dashboard || undefined} data-programme-context-header data-site-classification="STANDARD" data-site-frame="standard">
      <span className={dashboard ? styles.myProgramme : styles.programmeLabel}>{dashboard ? publicShellMessages(locale).myProgramme : label ?? programmeText(locale, "10-STEP CONTROL PROGRAMME")}</span>
      <span className={styles.xp}>{totalXp} XP</span>
      <button aria-label={programmeText(locale, "Log out of B4GAMBLE")} className={styles.logout} disabled={state === "busy"} onClick={signOut} type="button">
        {dashboard ? state === "busy" ? "…" : state === "failed" ? "!" : "A" : state === "busy" ? programmeText(locale, "Logging out…") : state === "failed" ? programmeText(locale, "Try log out") : programmeText(locale, "Log out")}
      </button>
    </div>
  );
}
