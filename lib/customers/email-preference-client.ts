"use client";

type PreferenceFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status">>;

// The English wording is the source of policy version email-marketing-v1.
// The live registration screen shows the Programme catalogue translation of
// this exact sentence (Founder decision, 27 Sep 2026); the legacy surface
// keeps the English text.
export const PROGRAMME_MARKETING_OPT_IN_LABEL = "Email me occasional B4GAMBLE product and Programme updates. Optional; I can unsubscribe at any time.";

type ChoiceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const GOOGLE_MARKETING_CHOICE_KEY = "sevenbet.programme.google-marketing-choice.v1";
const GOOGLE_MARKETING_CHOICE_TTL_MS = 10 * 60 * 1000;

/**
 * Carries a ticked opt-in across the Google redirect for one Programme
 * journey. An unticked box removes any earlier choice, so nothing is ever
 * recorded that the visitor did not tick just before leaving for Google.
 */
export function rememberGoogleMarketingChoice(
  storage: ChoiceStorage,
  journeyId: string,
  marketingAllowed: boolean,
  now = Date.now(),
) {
  if (!marketingAllowed) {
    storage.removeItem(GOOGLE_MARKETING_CHOICE_KEY);
    return;
  }
  storage.setItem(GOOGLE_MARKETING_CHOICE_KEY, JSON.stringify({
    version: 1,
    journeyId,
    expiresAt: now + GOOGLE_MARKETING_CHOICE_TTL_MS,
  }));
}

export function clearGoogleMarketingChoice(storage: ChoiceStorage) {
  storage.removeItem(GOOGLE_MARKETING_CHOICE_KEY);
}

/**
 * Reads the remembered choice once and clears it. True only for the same
 * journey within ten minutes of leaving for Google.
 */
export function takeGoogleMarketingChoice(storage: ChoiceStorage, journeyId: string, now = Date.now()) {
  let raw: string | null = null;
  try {
    raw = storage.getItem(GOOGLE_MARKETING_CHOICE_KEY);
  } finally {
    storage.removeItem(GOOGLE_MARKETING_CHOICE_KEY);
  }
  if (!raw) return false;
  try {
    const choice = JSON.parse(raw) as { version?: unknown; journeyId?: unknown; expiresAt?: unknown };
    return choice.version === 1
      && typeof choice.journeyId === "string"
      && choice.journeyId === journeyId
      && typeof choice.expiresAt === "number"
      && choice.expiresAt > now
      && choice.expiresAt - now <= GOOGLE_MARKETING_CHOICE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Persists the separate, optional Programme-signup marketing choice. A 503 is
 * safe to retry because the server transaction did not commit. Network
 * failures are ambiguous, so they are never replayed automatically and risk
 * duplicating the append-only consent history.
 */
export async function saveProgrammeMarketingPreference(
  locale: string,
  fetcher: PreferenceFetcher = fetch,
) {
  const request = () => fetcher("/api/customer/email-preference", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ marketingAllowed: true, locale }),
  });
  try {
    const response = await request();
    if (response.ok) return true;
    if (response.status !== 503) return false;
    return (await request()).ok;
  } catch {
    return false;
  }
}
