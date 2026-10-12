/**
 * Casino research in the menu (Founder decision, 10 October 2026;
 * docs/07_Decisions/RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md).
 *
 * A reader meets Best Offers, Casinos and Bonuses in navigation through one of two doors: they
 * are already inside the research section, having arrived on one of its pages, or they have
 * finished the Programme lesson "Research responsibly". The pages stay public either way.
 *
 * The lesson leaves one plain flag in a cookie. It names nobody and holds no Programme answer,
 * and nothing that selects, ranks or routes an offer reads it: only the menu does. This module
 * imports nothing so the Programme and the public shell can both use it.
 */
export const RESEARCH_ACCESS_COOKIE = "b4g_research_access";
export const RESEARCH_ACCESS_OPEN = "open";

// Browsers keep a cookie for at most 400 days; the Programme renews the flag whenever it answers.
const RESEARCH_ACCESS_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/** The menu reads the flag in the browser on every page change, so it cannot be HttpOnly. */
export function researchAccessCookieOptions(open: boolean) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: open ? RESEARCH_ACCESS_MAX_AGE_SECONDS : 0,
  };
}

export function researchAccessOpen(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return false;
  const flag = `${RESEARCH_ACCESS_COOKIE}=${RESEARCH_ACCESS_OPEN}`;
  return cookieHeader.split(";").some((part) => part.trim() === flag);
}

const researchSectionRoots = [
  "/best-offers",
  "/casinos",
  "/casino",
  "/bonuses",
  "/compare",
  "/bonus-guide",
  "/wagering-calculator",
  "/outbound",
] as const;

/** `pathname` is the language-neutral public path, without a market prefix. */
export function isResearchSectionRoute(pathname: string) {
  const cleanPath = pathname.split(/[?#]/, 1)[0] || "/";
  return researchSectionRoots.some((root) => cleanPath === root || cleanPath.startsWith(`${root}/`));
}

export function researchNavigationShown(pathname: string, researchAccess: boolean) {
  return researchAccess || isResearchSectionRoute(pathname);
}

/**
 * When this browser saw the lesson finished, so the menu can mark its new links for a few days.
 * It stays in the browser's own storage and is never sent anywhere.
 */
export const RESEARCH_OPENED_AT_STORAGE_KEY = "b4g_research_opened_at";
/** Fired in the page when the lesson finishes, so the menu on that same page changes at once. */
export const RESEARCH_ACCESS_CHANGED_EVENT = "b4g:research-access";
export const RESEARCH_NEW_MARK_DAYS = 7;

export function researchLinksAreNew(openedAt: string | null | undefined, now: number) {
  const opened = Number(openedAt);
  if (!openedAt || !Number.isFinite(opened) || opened > now) return false;
  return now - opened < RESEARCH_NEW_MARK_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * A declared pause keeps the door shut (Founder decision, 12 October 2026). The page
 * /pause-plan writes the last day of a Spelpaus or ROFUS break into a plain cookie; while that
 * day has not passed, the menu shows no research links even when the lesson flag is set, and it
 * opens by itself the day after. Only the menu door reads it: nothing that selects, ranks or
 * routes an offer does, and the research pages stay public.
 */
export const PAUSE_UNTIL_COOKIE = "b4g_pause_until";

/** The pause's last day as YYYY-MM-DD, or null when the cookie is absent or malformed. */
export function pauseUntil(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== PAUSE_UNTIL_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }
  return null;
}

function localIsoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True through the pause's last day; calendar days compare as YYYY-MM-DD strings. */
export function pauseActive(cookieHeader: string | null | undefined, today: string = localIsoDate(new Date())) {
  const until = pauseUntil(cookieHeader);
  return until !== null && today <= until;
}

/** What the menu door reads: the lesson is finished and no declared pause is running. */
export function researchDoorOpen(cookieHeader: string | null | undefined, today?: string) {
  return researchAccessOpen(cookieHeader) && !pauseActive(cookieHeader, today);
}
