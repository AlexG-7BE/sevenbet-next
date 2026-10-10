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
