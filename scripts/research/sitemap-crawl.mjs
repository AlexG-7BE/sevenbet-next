// Crawls the Production sitemap from a GitHub-hosted runner (Production answers the Founder's
// machine with 451) to see why search engines leave pages unindexed. For every sitemap URL:
// status, redirect target, canonical, robots meta and header, hreflang set, word count of the
// main text and internal links out. The crawl also follows internal links from each language
// home, so it reports internal links IN and the click depth from that home. Only ordinary page
// loads leave the runner, under a user agent the site treats as a crawler (full page, no frame).
// Output: <out>/pages.csv, <out>/pages.json and <out>/REPORT.md.
//
//   node scripts/research/sitemap-crawl.mjs --base=https://b4gamble.com --out=crawl
//
import { mkdirSync, writeFileSync } from "node:fs";

const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const base = (options.base || "https://b4gamble.com").replace(/\/$/, "");
const out = options.out || "crawl";
const homes = (options.homes || "sv,da,de,en").split(/[\s,]+/).filter(Boolean);
const limit = Number(options.limit || 1500);
const concurrency = Number(options.concurrency || 4);
const USER_AGENT = "Mozilla/5.0 (compatible; B4GAMBLE-audit-bot/1.0; +https://b4gamble.com)";
mkdirSync(out, { recursive: true });

const origin = new URL(base).origin;
const SKIP_PATH = /^\/(?:_next|api|r|outbound|login|register|account|admin|media)(?:\/|$)|\.(?:xml|txt|png|jpe?g|webp|svg|ico|css|js|json|pdf)$/i;

function normalize(href, from) {
  try {
    const url = new URL(href, from);
    if (url.origin !== origin) return null;
    url.hash = "";
    url.search = "";
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
    return path;
  } catch {
    return null;
  }
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[2] ?? match[3] ?? match[4] ?? "") : null;
}

function decode(text) {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

function mainText(html) {
  const body = (html.match(/<main\b[\s\S]*<\/main>/i) || html.match(/<body\b[\s\S]*<\/body>/i) || [html])[0];
  return decode(body
    .replace(/<(script|style|noscript|template|svg|nav|header|footer)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parse(html, url) {
  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [""])[0];
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const canonicalTag = links.find((tag) => /rel\s*=\s*["']?canonical/i.test(tag));
  const hreflang = links.filter((tag) => /hreflang\s*=/i.test(tag) && /rel\s*=\s*["']?alternate/i.test(tag))
    .map((tag) => `${attribute(tag, "hreflang")}=${normalize(decode(attribute(tag, "href") || ""), url) ?? attribute(tag, "href")}`);
  const robotsTag = [...head.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0])
    .find((tag) => /name\s*=\s*["']?(?:robots|googlebot)["'\s>]/i.test(tag));
  const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ["", ""])[1]).trim();
  const lang = attribute((html.match(/<html\b[^>]*>/i) || [""])[0], "lang") || "";
  const scope = (html.match(/<main\b[\s\S]*<\/main>/i) || [html])[0];
  const mainLinks = new Set();
  for (const match of scope.matchAll(/<a\b[^>]*>/gi)) {
    const path = normalize(decode(attribute(match[0], "href") || ""), url);
    if (path) mainLinks.add(path);
  }
  const allLinks = new Set();
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const path = normalize(decode(attribute(match[0], "href") || ""), url);
    if (path) allLinks.add(path);
  }
  const words = mainText(html).split(" ").filter((word) => /\p{L}/u.test(word)).length;
  return {
    title,
    lang,
    canonical: canonicalTag ? normalize(decode(attribute(canonicalTag, "href") || ""), url) ?? attribute(canonicalTag, "href") : "",
    robots: robotsTag ? attribute(robotsTag, "content") || "" : "",
    hreflang,
    words,
    mainLinks: [...mainLinks],
    allLinks: [...allLinks],
  };
}

async function fetchPage(path) {
  let current = `${base}${path}`;
  const hops = [];
  for (let hop = 0; hop < 5; hop += 1) {
    let response;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(current, { redirect: "manual", headers: { "user-agent": USER_AGENT, "accept-language": "en" } });
        if (response.status !== 429 && response.status < 500) break;
      } catch (error) {
        response = { status: 0, headers: new Headers(), text: async () => String(error) };
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      const next = new URL(response.headers.get("location"), current);
      hops.push(`${response.status}>${next.origin === origin ? next.pathname + next.search : next.href}`);
      if (next.origin !== origin) return { status: response.status, hops, final: next.href, html: "", xRobots: "" };
      current = next.href;
      continue;
    }
    const type = response.headers.get("content-type") || "";
    const html = type.includes("html") ? await response.text() : "";
    return { status: response.status, hops, final: new URL(current).pathname, html, xRobots: response.headers.get("x-robots-tag") || "" };
  }
  return { status: 310, hops, final: current, html: "", xRobots: "" };
}

async function sitemapPaths() {
  const queue = [`${base}/sitemap.xml`];
  const paths = new Set();
  while (queue.length) {
    const response = await fetch(queue.shift(), { headers: { "user-agent": USER_AGENT } });
    const xml = await response.text();
    for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      const loc = decode(match[1]);
      if (/sitemap[^/]*\.xml$/i.test(loc) && /<sitemapindex/i.test(xml)) queue.push(loc);
      else paths.add(new URL(loc).pathname.replace(/(.)\/$/, "$1") + new URL(loc).search);
    }
  }
  return [...paths];
}

const inSitemap = new Set(await sitemapPaths());
const pages = new Map();
const depth = new Map();
const linksIn = new Map();
const homeOf = new Map();
const queue = [];
for (const home of homes) {
  const path = `/${home}`;
  depth.set(path, 0);
  homeOf.set(path, home);
  queue.push(path);
}
for (const path of inSitemap) if (!depth.has(path)) queue.push(path);

// Breadth first from the homes; sitemap URLs nobody links to are fetched last, at no depth.
while (queue.length && pages.size < limit) {
  const batch = queue.splice(0, concurrency).filter((path) => !pages.has(path));
  await Promise.all(batch.map(async (path) => {
    pages.set(path, null);
    const result = await fetchPage(path);
    const parsed = result.html ? parse(result.html, `${base}${result.final}`) : null;
    pages.set(path, { path, ...result, html: undefined, parsed });
    if (!parsed || result.hops.length) return;
    for (const target of parsed.allLinks) {
      if (target === path) continue;
      if (!linksIn.has(target)) linksIn.set(target, new Set());
      linksIn.get(target).add(path);
      if (depth.has(path) && !depth.has(target) && !SKIP_PATH.test(target)) {
        depth.set(target, depth.get(path) + 1);
        homeOf.set(target, homeOf.get(path));
        const index = queue.findIndex((queued) => !depth.has(queued));
        if (index === -1) queue.push(target);
        else queue.splice(index, 0, target);
      }
    }
  }));
  await new Promise((resolve) => setTimeout(resolve, 150));
}

const rows = [...pages.values()].filter(Boolean).map((page) => {
  const parsed = page.parsed ?? {};
  const inbound = [...(linksIn.get(page.path) ?? [])];
  return {
    path: page.path,
    inSitemap: inSitemap.has(page.path),
    status: page.status,
    redirect: page.hops.join(" "),
    finalPath: page.final,
    lang: parsed.lang ?? "",
    title: parsed.title ?? "",
    canonical: parsed.canonical ?? "",
    canonicalSelf: parsed.canonical ? parsed.canonical === page.final : "",
    robots: [parsed.robots, page.xRobots].filter(Boolean).join(" | "),
    hreflangCount: parsed.hreflang?.length ?? 0,
    hreflang: (parsed.hreflang ?? []).join(" "),
    words: parsed.words ?? 0,
    linksOut: parsed.allLinks?.length ?? 0,
    mainLinksOut: parsed.mainLinks?.length ?? 0,
    linksIn: inbound.length,
    linksInFromMain: inbound.filter((from) => pages.get(from)?.parsed?.mainLinks?.includes(page.path)).length,
    depth: depth.has(page.path) ? depth.get(page.path) : "",
    home: homeOf.get(page.path) ?? "",
  };
});

const columns = Object.keys(rows[0] ?? { path: "" });
const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => {
  const value = String(row[column] ?? "");
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}).join(","))].join("\n");
writeFileSync(`${out}/pages.csv`, `${csv}\n`);
writeFileSync(`${out}/pages.json`, JSON.stringify(rows, null, 2));

const sitemapRows = rows.filter((row) => row.inSitemap);
const count = (predicate) => sitemapRows.filter(predicate).length;
const report = [
  `# Sitemap crawl of ${base}`,
  "",
  `Pages fetched: ${rows.length}; in the sitemap: ${sitemapRows.length} (sitemap lists ${inSitemap.size}).`,
  "",
  "| Sitemap check | Pages |",
  "|---|---|",
  `| Status not 200 | ${count((row) => row.status !== 200)} |`,
  `| Redirects | ${count((row) => row.redirect)} |`,
  `| noindex | ${count((row) => /noindex/i.test(row.robots))} |`,
  `| Canonical points elsewhere | ${count((row) => row.canonicalSelf === false)} |`,
  `| No canonical | ${count((row) => row.status === 200 && !row.canonical)} |`,
  `| No internal link in | ${count((row) => row.linksIn === 0)} |`,
  `| Not reachable from a language home | ${count((row) => row.depth === "")} |`,
  `| Depth 4 or more | ${count((row) => row.depth !== "" && row.depth >= 4)} |`,
  `| Under 300 words | ${count((row) => row.status === 200 && row.words < 300)} |`,
  "",
].join("\n");
writeFileSync(`${out}/REPORT.md`, report);
console.log(report);
