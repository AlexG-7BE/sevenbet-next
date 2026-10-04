/**
 * Which clicks start the public shell's navigation progress bar (4 Oct 2026): a tap that changed
 * nothing for seconds read as a dead link, so every link that leaves this page answers at once.
 */

/** The path a clicked link leaves for, or null when the click stays on this page or leaves the site. */
export function navigationClickTarget(href: string, current: string) {
  try {
    const here = new URL(current);
    const destination = new URL(href, here);
    if (destination.origin !== here.origin) return null;
    if (destination.pathname === here.pathname && destination.search === here.search) return null;
    return `${destination.pathname}${destination.search}`;
  } catch {
    return null;
  }
}
