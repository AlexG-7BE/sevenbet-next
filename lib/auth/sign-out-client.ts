import { authClient } from "@/lib/auth/client";
import {
  clearProgrammeAccessAuthority,
  clearProgrammeAccessContinuation,
  clearProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  userProgrammeSubject,
} from "@/lib/programme/local-subject-storage";

/**
 * Logs the person out of B4GAMBLE in this browser: the Programme's server session first (that
 * answer also withdraws the research menu flag), then the account session, then this tab's
 * Programme access notes, so the next visit starts as a new anonymous journey.
 *
 * The Programme knows whose account is open and passes it. The site menu does not, so it asks
 * the session once; a cookie whose session has already ended is simply cleared.
 * Throws when a step fails: the caller says so and the person can press again.
 */
export async function signOutOfB4gamble(knownUserId: string | null = null) {
  const userId = knownUserId ?? (await authClient.getSession()).data?.user.id ?? null;
  if (userId) {
    const transition = await fetch("/api/program/session", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!transition.ok) throw new Error("Subject transition failed");
  }
  const result = await authClient.signOut();
  if (result.error) throw new Error("Sign out failed");
  if (userId) clearProgrammeAccessAuthority(window.sessionStorage, userProgrammeSubject(userId));
  clearProgrammeAccessContinuation(window.sessionStorage);
  clearProgrammeOAuthClaimMarker(window.sessionStorage);
  rotateAnonymousProgrammeSubject(window.sessionStorage);
}
