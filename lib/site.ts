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
  "/methodology",
  "/affiliate-disclosure",
  "/about",
  "/faq",
  "/bonus-guide",
  "/tools/budget-calculator",
];

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function casinoOfficialUrl(domain: string) {
  const hostname = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname || /(?:^|\.)(?:example|invalid|localhost|test)$/.test(hostname)) return null;
  return `https://${hostname}`;
}
