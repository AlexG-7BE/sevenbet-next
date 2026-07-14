export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4173"
).replace(/\/$/, "");

export const coreRoutes = [
  "",
  "/program",
  "/self-check",
  "/learn",
  "/responsible-gambling",
  "/bonuses",
  "/casinos",
  "/catalog",
  "/methodology",
  "/affiliate-disclosure",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/bonus-guide",
  "/tools/budget-calculator",
  "/responsible-gaming",
];

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
