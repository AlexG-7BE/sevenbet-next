/**
 * The pause date a person gave the tool on /pause-plan, carried to the account they create
 * (Founder decision, 13 October 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md).
 *
 * When the person presses the Programme button on that page, the browser keeps the register and
 * the last day of the pause in a first-party cookie for one hour. The sign-up that follows reads
 * it once and saves both on the account. It is used for one thing: the timing of two letters, the
 * evening before the pause ends and the morning it is over. Nothing that selects, ranks or
 * routes an offer reads it. This module imports nothing, so the page and the server share it.
 */
export const PAUSE_DATE_COOKIE = "b4g_pause_end";
export const PAUSE_DATE_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export const PAUSE_REGISTERS = ["spelpaus", "rofus"] as const;
export type CarriedPauseRegister = (typeof PAUSE_REGISTERS)[number];
export type CarriedPauseDate = Readonly<{ register: CarriedPauseRegister; endsOn: string }>;

/** A pause longer than this is not a dated pause the tool offers (its longest is six months). */
const LONGEST_PAUSE_DAYS = 200;
const DAY_MS = 86_400_000;

function isoDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

/** `spelpaus.2026-10-23`: the register and the last day the pause covers. */
export function encodeCarriedPauseDate(value: CarriedPauseDate) {
  return `${value.register}.${value.endsOn}`;
}

/**
 * Reads a carried value. A date more than two days in the past or further ahead than the longest
 * pause is refused, so a stale or edited cookie cannot schedule a letter. `today` is a UTC day.
 */
export function parseCarriedPauseDate(raw: string | null | undefined, today: Date): CarriedPauseDate | null {
  const match = /^(spelpaus|rofus)\.(\d{4}-\d{2}-\d{2})$/.exec(raw?.trim() ?? "");
  if (!match) return null;
  const endsOn = isoDay(match[2]);
  if (endsOn === null) return null;
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (endsOn < now - 2 * DAY_MS || endsOn > now + LONGEST_PAUSE_DAYS * DAY_MS) return null;
  return { register: match[1] as CarriedPauseRegister, endsOn: match[2] };
}

export function carriedPauseDateFromCookieHeader(cookieHeader: string | null | undefined, today: Date) {
  for (const part of cookieHeader?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== PAUSE_DATE_COOKIE) continue;
    let value = part.slice(separator + 1).trim();
    try { value = decodeURIComponent(value); } catch { return null; }
    return parseCarriedPauseDate(value, today);
  }
  return null;
}

/** The `document.cookie` assignment that keeps the value for an hour, or clears it. */
export function carriedPauseDateCookie(value: CarriedPauseDate | null, secure: boolean) {
  const attributes = `Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
  return value
    ? `${PAUSE_DATE_COOKIE}=${encodeCarriedPauseDate(value)}; Max-Age=${PAUSE_DATE_COOKIE_MAX_AGE_SECONDS}; ${attributes}`
    : `${PAUSE_DATE_COOKIE}=; Max-Age=0; ${attributes}`;
}
