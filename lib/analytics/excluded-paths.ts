/**
 * Pages analytics never records: protected Help and the self-check (the privacy
 * notice promises analytics holds no protected Help activity) and the staff Admin.
 * Up to two language or legacy market/language prefixes are recognised, so
 * `/sv/help` and `/se/sv/help` are excluded like `/help`.
 */
export const ANALYTICS_EXCLUDED_PATH = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/){0,2}(?:help|self-check|admin)(?:\/|$)/i;

export function isAnalyticsExcludedPath(pathname: string | null | undefined) {
  if (!pathname) return false;
  const path = pathname.split(/[?#]/, 1)[0] ?? "";
  return ANALYTICS_EXCLUDED_PATH.test(path);
}
