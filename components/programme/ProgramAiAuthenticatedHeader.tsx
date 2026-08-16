"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { PROGRAMME_ACCESS_HEADERS, PROGRAMME_ACCESS_HEADER_VALUES } from "@/lib/programme/access-contract";
import {
  clearProgrammeAccessAuthority,
  clearProgrammeAccessContinuation,
  clearProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  userProgrammeSubject,
} from "@/lib/programme/local-subject-storage";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiAuthenticatedHeader({ userId, totalXp, label = "10-STEP CONTROL PROGRAMME", dashboard = false }: { userId: string; totalXp: number; label?: string; dashboard?: boolean }) {
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
      window.location.assign("/program");
    } catch {
      setState("failed");
    }
  }
  return (
    <header className={styles.header} data-dashboard-header={dashboard || undefined}>
      <Link className={styles.wordmark} href="/">B4GAMBLE</Link>
      {dashboard ? <nav aria-label="Programme navigation" className={styles.dashboardNav}><Link href="/best-offers">Best Offers</Link><Link href="/casinos">Casinos</Link><Link href="/bonuses">Bonuses</Link><Link href="/learn">Learn</Link><Link href="/help">Help</Link></nav> : <span className={styles.programmeLabel}>{label}</span>}
      {dashboard ? <span className={styles.myProgramme}>My Programme</span> : <span className={styles.xp}>{totalXp} XP</span>}
      <button aria-label="Log out of B4GAMBLE" className={styles.logout} disabled={state === "busy"} onClick={signOut} type="button">
        {dashboard ? state === "busy" ? "…" : state === "failed" ? "!" : "A" : state === "busy" ? "Logging out…" : state === "failed" ? "Try log out" : "Log out"}
      </button>
    </header>
  );
}
