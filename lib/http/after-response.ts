import { after } from "next/server";

/**
 * Runs work once the response has been sent. Inside a Next request scope,
 * `after()` keeps the Vercel function alive until the work settles. Outside a
 * request scope (tests, scripts) the work starts at once and is not awaited.
 * A failure is contained to `onError`; it never reaches the caller.
 */
export function runAfterResponse(work: () => Promise<unknown>, onError: () => void) {
  const contained = () => work().catch(onError);
  try { after(contained); } catch { void contained(); }
}
