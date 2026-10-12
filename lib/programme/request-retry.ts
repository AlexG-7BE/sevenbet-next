/**
 * One automatic repeat of a Programme request (Founder, 12 October 2026: "Повтор вместо ошибки").
 *
 * Production, 12 October 2026, 11:03:08 UTC: `POST …/missions/2/actions` answered 500 because the
 * database connection did not open in time. The person saw "The action could not be saved" and
 * pressed again; the second press, nine seconds later, was saved. The browser now makes that
 * second attempt itself: after a network failure or a 5xx answer it waits
 * {@link PROGRAMME_RETRY_DELAY_MS} and sends the same request once more. The screen stays busy
 * meanwhile, and its existing error text shows only when the repeat fails too.
 *
 * Only requests the server answers the same way when they arrive twice are repeated. Each one is
 * listed below with the reason; everything else is sent once, as before.
 */

/**
 * 600 ms: longer than the server's own pause before it reopens a database connection (200 ms,
 * `CONNECT_RETRY_DELAY_MS`) and long enough for a phone to pick its connection up again, short
 * enough that a busy button does not look stuck.
 */
export const PROGRAMME_RETRY_DELAY_MS = 600;

const MISSION = "(?:[2-9]|10)";

/**
 * POST requests that are safe to send twice. A request missing here is not repeated:
 *
 * - `program-ai/session` creates a new anonymous session on every call;
 * - `program-ai/turn` reserves one of the session's three AI calls before the provider is asked;
 * - `program-ai/claim` is refused once a claim exists, and the client already makes a new claim
 *   when redeeming one fails.
 */
const REPEATABLE_POSTS: readonly RegExp[] = [
  // One serializable transaction. An action already recorded is answered with the stored Mission
  // and 0 XP; XP, progress events and active days are written under fixed keys, duplicates skipped
  // (RFC-025: "a request retry cannot award XP again"; tests/program-ai-missions.test.ts).
  new RegExp(`^/api/program/program-ai/missions/${MISSION}/actions$`),
  // The same transaction rules: a Mission already complete is answered as it stands, with 0 XP.
  new RegExp(`^/api/program/program-ai/missions/${MISSION}/complete$`),
  // Guidance and Review texts are built from stored facts and store nothing themselves. A repeat
  // can spend one more call from the person's AI allowance; past it the server answers with its
  // own built-in text, not an error.
  new RegExp(`^/api/program/program-ai/missions/${MISSION}/guidance$`),
  /^\/api\/program\/program-ai\/reviews\/(?:first|mid|full)$/,
  // Consent to process the answers: an active record is returned as it is.
  /^\/api\/program\/program-ai\/authority$/,
  // Marks the anonymous session ready to save; the same body sets the same state.
  /^\/api\/program\/program-ai\/starting-point$/,
  // Returns the anonymous session from the support-first screen to the answers; sets one state.
  /^\/api\/program\/program-ai\/support\/continue$/,
  // The claim is consumed by a conditional write. A second redeem by the same account is answered
  // with that account's plan and changes nothing.
  /^\/api\/program\/program-ai\/claims\/redeem$/,
  // 18+ / Terms / Privacy: an anonymous visitor gets a signed proof and nothing is stored; an
  // account's acceptance is recorded once.
  /^\/api\/programme-access\/authority$/,
];

/** Whether the server answers this request the same way when it arrives a second time. */
export function programmeRequestIsRepeatable(path: string, method = "GET") {
  const pathname = path.split(/[?#]/, 1)[0];
  if (!pathname.startsWith("/api/program/") && !pathname.startsWith("/api/programme-access/")) return false;
  const verb = method.toUpperCase();
  // Programme reads write nothing (Backend Programme Standards: "Dashboard reads do not mutate state").
  if (verb === "GET" || verb === "HEAD") return true;
  return verb === "POST" && REPEATABLE_POSTS.some((pattern) => pattern.test(pathname));
}

type ProgrammeFetch = (input: string, init?: RequestInit) => Promise<Response>;

type RetryRuntime = {
  fetcher?: ProgrammeFetch;
  wait?: (milliseconds: number) => Promise<void>;
};

const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * `fetch` for Programme requests. A repeatable request that fails on the network or is answered
 * 5xx is sent once more after a short pause; the caller gets the second outcome whatever it is.
 * Answers below 500 (a refused, invalid or rate-limited request) are final and are not repeated.
 */
export async function fetchProgrammeWithRetry(path: string, init?: RequestInit, runtime: RetryRuntime = {}): Promise<Response> {
  const fetcher = runtime.fetcher ?? fetch;
  // Only a body that can be sent again as it is: none, or text.
  const repeatable = programmeRequestIsRepeatable(path, init?.method)
    && (init?.body === undefined || init.body === null || typeof init.body === "string");
  if (!repeatable) return fetcher(path, init);
  try {
    const response = await fetcher(path, init);
    if (response.status < 500) return response;
    // The failed answer is not read; let the browser drop it.
    void response.body?.cancel().catch(() => undefined);
  } catch (error) {
    if (init?.signal?.aborted) throw error;
  }
  await (runtime.wait ?? pause)(PROGRAMME_RETRY_DELAY_MS);
  return fetcher(path, init);
}
