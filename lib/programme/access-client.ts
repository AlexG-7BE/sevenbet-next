import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
  type ProgrammeAccessAuthority,
} from "@/lib/programme/access-contract";
import {
  anonymousProgrammeSubject,
  hasProgrammeAccessAuthority,
  loadProgrammeSubjectContent,
  mergeProgrammeSubjectContent,
  writeProgrammeAccessContinuation,
  writeProgrammeOAuthClaimMarker,
  type ProgrammeLocalSubject,
} from "@/lib/programme/local-subject-storage";

type AccessStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type AccessFetcher = (input: string, init: RequestInit) => Promise<Pick<Response, "ok" | "json">>;

/**
 * Founder decision, 11 Oct 2026: continuing under the line "By continuing, you
 * confirm you are 18+ and accept the Terms and Privacy Notice" is the 18+,
 * Terms and Privacy affirmation. The server records the same three facts and
 * versions as the former ticks.
 */
const AFFIRMATION = {
  adultConfirmed: true,
  termsAccepted: true,
  privacyAcknowledged: true,
  termsVersion: PROGRAMME_TERMS_VERSION,
  privacyVersion: PROGRAMME_PRIVACY_VERSION,
} as const;

function affirm(fetcher: AccessFetcher, body: Record<string, unknown>) {
  return fetcher("/api/programme-access/authority", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Affirms access for this tab's anonymous journey and keeps the server-signed
 * proof that account creation requires. An unexpired proof is reused.
 */
export async function affirmAnonymousProgrammeAccess(
  storage: AccessStorage,
  fetcher: AccessFetcher = fetch,
): Promise<ProgrammeLocalSubject> {
  const journey = anonymousProgrammeSubject(storage);
  if (hasProgrammeAccessAuthority(storage, journey)) return journey;
  const response = await affirm(fetcher, { journeyId: journey.id, ...AFFIRMATION });
  const payload = await response.json() as { authority?: ProgrammeAccessAuthority };
  if (!response.ok || !payload.authority) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
  writeProgrammeAccessContinuation(storage, journey, payload.authority);
  return journey;
}

/**
 * A signed-in account that already affirmed access asks for the proof its new
 * journey needs. Nothing is affirmed again.
 */
export async function refreshAccountJourneyAccess(
  storage: AccessStorage,
  journey: ProgrammeLocalSubject,
  fetcher: AccessFetcher = fetch,
) {
  const response = await affirm(fetcher, { journeyId: journey.id });
  const payload = await response.json() as { authority?: ProgrammeAccessAuthority };
  if (!response.ok || !payload.authority) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
  writeProgrammeAccessContinuation(storage, journey, payload.authority);
}

/** Records the same affirmation for the signed-in account, once. */
export async function recordAccountProgrammeAccess(fetcher: AccessFetcher = fetch) {
  const response = await affirm(fetcher, AFFIRMATION);
  if (!response.ok) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
}

/** True while this tab holds a Starting Point that no account has saved yet. */
export function hasUnsavedStartingPoint(storage: AccessStorage, journey: ProgrammeLocalSubject) {
  return Boolean(loadProgrammeSubjectContent<{ programAi?: { candidate?: unknown } }>(storage, journey).programAi?.candidate);
}

/**
 * Log in can start a Google sign-up outside the Programme. The Programme page
 * finishes it on return: it restores this account-first state, records the
 * access affirmation for the account and opens the plan.
 */
export function prepareAccountFirstGoogleReturn(storage: AccessStorage, journey: ProgrammeLocalSubject) {
  mergeProgrammeSubjectContent(storage, journey, { programAi: { phase: "registration", accountFirst: true } });
  writeProgrammeOAuthClaimMarker(storage, journey);
}
