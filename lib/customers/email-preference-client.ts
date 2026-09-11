"use client";

type PreferenceFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status">>;

// Compliance copy remains an explicit English fallback until approved
// localized versions exist; keep the two signup surfaces byte-identical.
export const PROGRAMME_MARKETING_OPT_IN_LABEL = "Email me occasional B4GAMBLE product and Programme updates. Optional; I can unsubscribe at any time.";

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
