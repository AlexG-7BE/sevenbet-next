const baseUrl = (process.env.LAUNCH_POLISH_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const origin = new URL(baseUrl).origin;
const seeds = [
  "/",
  "/10-steps",
  "/contact",
  "/about",
  "/privacy",
  "/terms",
  "/methodology",
  "/affiliate-disclosure",
  "/responsible-gambling",
  "/learn",
  "/casinos",
  "/bonuses",
  "/best-offers",
  "/compare",
];
const ignoredPrefixes = ["/api/", "/go/", "/r/", "/outbound/", "/casino/"];

function internalHref(raw, pageUrl) {
  const decoded = raw.replaceAll("&amp;", "&");
  if (!decoded || decoded.startsWith("mailto:") || decoded.startsWith("tel:") || decoded.startsWith("javascript:")) return null;
  const url = new URL(decoded, pageUrl);
  if (url.origin !== origin || ignoredPrefixes.some((prefix) => url.pathname.startsWith(prefix))) return null;
  return { route: `${url.pathname}${url.search}`, fragment: url.hash.slice(1) || null };
}

const routes = new Map(seeds.map((route) => [route, new Set()]));
const seedBodies = new Map();
for (const seed of seeds) {
  const url = `${baseUrl}${seed}`;
  const response = await fetch(url, { redirect: "manual" });
  const html = await response.text();
  seedBodies.set(seed, html);
  for (const match of html.matchAll(/\bhref=(?:"([^"]*)"|'([^']*)')/gi)) {
    const target = internalHref(match[1] ?? match[2] ?? "", url);
    if (!target) continue;
    if (!routes.has(target.route)) routes.set(target.route, new Set());
    if (target.fragment) routes.get(target.route).add(target.fragment);
  }
}

const broken = [];
let checked = 0;
for (const [route, fragments] of routes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
  checked += 1;
  if (response.status >= 400) {
    broken.push({ route, status: response.status });
    continue;
  }
  if (fragments.size > 0) {
    const html = await response.text();
    for (const fragment of fragments) {
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\bid=(?:"${escaped}"|'${escaped}')`).test(html)) broken.push({ route: `${route}#${fragment}`, status: "missing-fragment" });
    }
  }
}

const unknown = await fetch(`${baseUrl}/launch-polish-deliberately-missing`, { redirect: "manual" });
if (unknown.status !== 404) broken.push({ route: "/launch-polish-deliberately-missing", status: unknown.status });

const report = { routesChecked: checked + 1, internalLinksDiscovered: routes.size, brokenLinks: broken };
console.info(JSON.stringify(report));
if (broken.length > 0) process.exitCode = 1;
