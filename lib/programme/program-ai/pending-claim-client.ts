/**
 * Founder decision, 11 Oct 2026: the pending claim is made behind the screen
 * that follows the answers, so a press on Google or email does not wait for it.
 * The server keeps a pending claim for 30 minutes (`pendingClaimLifetimeMs`),
 * so a claim made earlier is used only while enough of that time is left;
 * otherwise the press makes it again, as it always did.
 */

/** Email redeems the claim at once, so most of the server's 30 minutes may be used. */
export const PENDING_CLAIM_FRESH_FOR_EMAIL_MS = 20 * 60 * 1000;

/** Google leaves the page first; the person keeps at least 25 minutes to come back. */
export const PENDING_CLAIM_FRESH_FOR_GOOGLE_MS = 5 * 60 * 1000;

export function pendingClaimIsFresh(claimReadyAt: unknown, maxAgeMs: number, now = Date.now()) {
  return typeof claimReadyAt === "number"
    && Number.isFinite(claimReadyAt)
    && claimReadyAt <= now
    && now - claimReadyAt < maxAgeMs;
}
