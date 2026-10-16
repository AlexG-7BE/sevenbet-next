/**
 * Casino research in the menu (Founder decisions, 10 and 16 October 2026;
 * docs/07_Decisions/RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md and
 * docs/07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md).
 *
 * Best Offers, Casinos and Bonuses appear in navigation only to a reader who is already inside the
 * research section, having arrived on one of its pages. Everyone else sees the guide links. The
 * Programme opens nothing: no lesson, step, account or cookie changes the menu, so the Programme
 * ends in help. The pages stay public either way. This module imports nothing.
 */
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
