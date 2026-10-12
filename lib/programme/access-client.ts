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
  readProgrammeAccessContinuation,
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
 * The tab's anonymous journey, when it already holds an unexpired access proof.
 * Nothing is created or affirmed here: work behind a screen may use a proof the
 * person already gave, and never asks for one on their behalf.
 */
export function journeyWithAccessProof(storage: AccessStorage): ProgrammeLocalSubject | null {
  const proof = readProgrammeAccessContinuation(storage);
  return proof ? { kind: "journey", id: proof.journeyId } : null;
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

type TabProgrammeState = {
  programAi?: { phase?: unknown; candidate?: unknown; answers?: unknown; claimReadyAt?: unknown };
};

/**
 * What this tab already holds for the Programme when a person opens Log in:
 * a Starting Point no account has saved yet, picked answers without one, or
 * nothing. Support first holds registration back, so it counts as nothing.
 */
export type TabProgrammeProgress =
  | { kind: "starting-point"; startingPoint: object; claimReadyAt: unknown }
  | { kind: "answers"; answers: unknown[] }
  | { kind: "none" };

export function tabProgrammeProgress(storage: AccessStorage, journey: ProgrammeLocalSubject): TabProgrammeProgress {
  const state = loadProgrammeSubjectContent<TabProgrammeState>(storage, journey).programAi;
  if (!state || state.phase === "support") return { kind: "none" };
  if (state.candidate && typeof state.candidate === "object") {
    return { kind: "starting-point", startingPoint: state.candidate, claimReadyAt: state.claimReadyAt };
  }
  if (Array.isArray(state.answers) && state.answers.length > 0) return { kind: "answers", answers: state.answers };
  return { kind: "none" };
}

/** Remembers when the pending claim was made, for the journey's stored state. */
export function noteClaimMade(storage: AccessStorage, journey: ProgrammeLocalSubject, now = Date.now()) {
  const state = loadProgrammeSubjectContent<TabProgrammeState>(storage, journey).programAi;
  if (state) mergeProgrammeSubjectContent(storage, journey, { programAi: { ...state, claimReadyAt: now } });
}

/**
 * Forgets when the claim was made, right before it is made again. The server
 * drops the earlier claim as soon as a new one is started, so if the new one
 * fails half-way nothing must still count as ready: the next press makes it.
 */
export function forgetClaimMade(storage: AccessStorage, journey: ProgrammeLocalSubject) {
  const state = loadProgrammeSubjectContent<TabProgrammeState>(storage, journey).programAi;
  if (!state || !("claimReadyAt" in state)) return;
  const { claimReadyAt: _earlier, ...rest } = state;
  mergeProgrammeSubjectContent(storage, journey, { programAi: rest });
}

/**
 * Founder decision, 11 Oct 2026: a Starting Point made in this tab goes with
 * the account from Log in. The Programme page redeems its claim on arrival,
 * for Google and for email alike; nobody is sent back to press a button twice.
 */
export function markStartingPointForAccount(storage: AccessStorage, journey: ProgrammeLocalSubject) {
  writeProgrammeOAuthClaimMarker(storage, journey);
}

/**
 * Log in can start a Google sign-up without a Starting Point. The Programme
 * page finishes it on return: it records the access affirmation for the
 * account and opens the answers. Answers already picked in this tab are kept,
 * so they are shown picked.
 */
export function prepareAccountFirstGoogleReturn(storage: AccessStorage, journey: ProgrammeLocalSubject) {
  const progress = tabProgrammeProgress(storage, journey);
  mergeProgrammeSubjectContent(storage, journey, {
    programAi: { phase: "registration", accountFirst: true, ...(progress.kind === "answers" ? { answers: progress.answers } : {}) },
  });
  writeProgrammeOAuthClaimMarker(storage, journey);
}
