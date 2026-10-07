// Read-only Production smoke for the conversion path and the silent fallbacks.
// Dependency-free: runs on a bare GitHub runner with `node` only.
//
//   npm run ops:smoke                                   # public checks; ops health skipped without a token
//   OPS_HEALTH_TOKEN=… node scripts/production-smoke.mjs --require-ops-health \
//     --report smoke-report.json --summary smoke-summary.md
//
// Exit code 0 = every check passed, 1 = at least one failed.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PRODUCTION_ORIGIN = "https://b4gamble.com";
// "Monitor" makes the site classify these requests as BOT traffic (lib/analytics/identity.server.ts).
export const SMOKE_USER_AGENT = "B4GAMBLE-Production-Smoke-Monitor/2.0";
export const REQUEST_TIMEOUT_MS = 15_000;
export const ATTEMPTS = 3;
export const CONCURRENCY = 4;
export const FALLBACK_CASINO_REVIEW_PATH = "/en/casino/betsson";

// Floors are about half of what Production served on 27 Sep 2026 from a US vantage
// (the GitHub runner): /en/casinos 28 review links, /en/bonuses 26, /en/best-offers 3 picks,
// sitemap 69 <loc> (27 casino reviews; only 12 core routes survive a database failure),
// llms.txt 27 Learning Center articles. A database outage degrades these pages to empty lists,
// not to errors, so the floors are what catches it.
export const FLOORS = Object.freeze({
  casinosReviewLinks: 14,
  bonusesReviewLinks: 13,
  bestOffersReviewLinks: 2,
  sitemapLocs: 35,
  sitemapCasinoLocs: 14,
  llmsArticles: 14,
});

export const PAGE_CHECKS = Object.freeze([
  { id: "home-root", path: "/", kind: "html" },
  { id: "home-en", path: "/en", kind: "html", lang: "en" },
  { id: "home-sv", path: "/sv", kind: "html", lang: "sv" },
  { id: "home-da", path: "/da", kind: "html", lang: "da" },
  { id: "home-de", path: "/de", kind: "html", lang: "de" },
  { id: "home-uk", path: "/uk", kind: "html", lang: "uk" },
  { id: "best-offers-en", path: "/en/best-offers", kind: "html", lang: "en", minReviewLinks: FLOORS.bestOffersReviewLinks },
  { id: "bonuses-en", path: "/en/bonuses", kind: "html", lang: "en", minReviewLinks: FLOORS.bonusesReviewLinks },
  { id: "casinos-en", path: "/en/casinos", kind: "html", lang: "en", minReviewLinks: FLOORS.casinosReviewLinks },
  { id: "program", path: "/program", kind: "html" },
  { id: "login", path: "/login", kind: "html" },
  { id: "help", path: "/help", kind: "html" },
  { id: "responsible-gambling", path: "/responsible-gambling", kind: "html" },
  { id: "faq", path: "/faq", kind: "html" },
  { id: "privacy", path: "/privacy", kind: "html" },
  { id: "terms", path: "/terms", kind: "html" },
  { id: "auth-ok", path: "/api/auth/ok", kind: "auth-ok" },
  { id: "sitemap", path: "/sitemap.xml", kind: "sitemap" },
  { id: "llms", path: "/llms.txt", kind: "llms" },
]);

const casinoReviewPattern = /href="(?:https:\/\/b4gamble\.com)?(\/[a-z]{2}(?:-[a-z]{2})?\/casino\/([a-z0-9][a-z0-9-]*))\/?"/g;

export function casinoReviewPaths(html) {
  const paths = new Map();
  for (const match of String(html).matchAll(casinoReviewPattern)) {
    if (!paths.has(match[2])) paths.set(match[2], match[1]);
  }
  return [...paths.values()];
}

export function htmlLang(html) {
  return /<html\b[^>]*\slang="([^"]+)"/i.exec(String(html))?.[1] ?? null;
}

export function sitemapCounts(xml) {
  const locs = [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
  return { total: locs.length, casino: locs.filter((loc) => /\/casino\/[a-z0-9-]+\/?$/.test(loc)).length };
}

export function llmsArticleCount(text) {
  const section = String(text).split("## Published Learning Center Articles")[1];
  if (section === undefined) return 0;
  return (section.split(/\n## /)[0].match(/^- \[/gm) ?? []).length;
}

/**
 * Judges one fetched response. Pure: `response` is { status, contentType, body }.
 * Returns { ok, detail, facts }; `detail` names what was wrong in plain words.
 */
export function evaluateCheck(check, response) {
  const facts = {};
  if (response.status !== 200) return { ok: false, detail: `HTTP ${response.status}`, facts };
  const contentType = String(response.contentType ?? "").toLowerCase();
  const body = String(response.body ?? "");

  if (check.kind === "html") {
    if (!contentType.includes("text/html")) return { ok: false, detail: `expected HTML, got ${contentType || "no content type"}`, facts };
    if (!/<html[\s>]/i.test(body)) return { ok: false, detail: "HTML document marker missing", facts };
    const lang = htmlLang(body);
    facts.lang = lang;
    if (check.lang && !(lang ?? "").toLowerCase().startsWith(check.lang)) {
      return { ok: false, detail: `page language is ${lang ?? "missing"}, expected ${check.lang} (localised presentation fell back)`, facts };
    }
    if (check.minReviewLinks !== undefined) {
      const reviews = casinoReviewPaths(body);
      facts.reviewLinks = reviews.length;
      facts.firstReviewPath = reviews[0] ?? null;
      if (reviews.length < check.minReviewLinks) {
        return { ok: false, detail: `${reviews.length} casino review links, floor ${check.minReviewLinks} (database-backed list is empty or shrinking)`, facts };
      }
    }
    if (check.requireHeading && !/<h1[\s>]/i.test(body)) return { ok: false, detail: "page heading missing", facts };
    return { ok: true, detail: "OK", facts };
  }

  if (check.kind === "auth-ok") {
    if (!contentType.includes("application/json")) return { ok: false, detail: `expected JSON, got ${contentType || "no content type"}`, facts };
    let payload = null;
    try { payload = JSON.parse(body); } catch { payload = null; }
    return payload?.ok === true ? { ok: true, detail: "OK", facts } : { ok: false, detail: "auth runtime did not answer {\"ok\":true}", facts };
  }

  if (check.kind === "sitemap") {
    const counts = sitemapCounts(body);
    Object.assign(facts, { locs: counts.total, casinoLocs: counts.casino });
    if (counts.total < FLOORS.sitemapLocs || counts.casino < FLOORS.sitemapCasinoLocs) {
      return {
        ok: false,
        detail: `${counts.total} URLs (floor ${FLOORS.sitemapLocs}), ${counts.casino} casino reviews (floor ${FLOORS.sitemapCasinoLocs}); sitemap fell back to core routes`,
        facts,
      };
    }
    return { ok: true, detail: "OK", facts };
  }

  if (check.kind === "llms") {
    const articles = llmsArticleCount(body);
    facts.articles = articles;
    return articles < FLOORS.llmsArticles
      ? { ok: false, detail: `${articles} Learning Center articles, floor ${FLOORS.llmsArticles} (article list fell back to empty)`, facts }
      : { ok: true, detail: "OK", facts };
  }

  return { ok: false, detail: `unknown check kind ${check.kind}`, facts };
}

const opsHealthCheckNames = new Set([
  "database", "betterAuthSecret", "cronSecret", "siteUrl", "lifecycleEmail", "contactEmail", "programmeAi",
]);

const opsHealthExplanations = {
  database: "database unreachable",
  betterAuthSecret: "BETTER_AUTH_SECRET missing (localised pages and sign-in break)",
  cronSecret: "CRON_SECRET missing (scheduled jobs are rejected)",
  siteUrl: "NEXT_PUBLIC_SITE_URL missing",
  lifecycleEmail: "lifecycle email is switched on but its configuration is invalid (cron reports zeros)",
  contactEmail: "contact email is switched on but CONTACT_EMAIL_* configuration is invalid",
  programmeAi: "Programme AI configuration mismatch or the OpenAI key/pinned model was rejected (silent fallback)",
};

/** Judges the ops-health response without ever echoing anything but known check names and numbers. */
export function evaluateOpsHealth(response) {
  const facts = {};
  if (response.status === 404) return { ok: false, detail: "HTTP 404: endpoint not deployed or monitor token not configured in Vercel", facts };
  if (response.status === 401) return { ok: false, detail: "HTTP 401: monitor token rejected (GitHub secret and Vercel value differ)", facts };
  let payload = null;
  try { payload = JSON.parse(String(response.body ?? "")); } catch { payload = null; }
  if (payload && typeof payload === "object" && payload.authorityVersion === "ops-health.v1") {
    const checks = payload.checks && typeof payload.checks === "object" ? payload.checks : {};
    const latency = checks.database?.latencyMs;
    if (typeof latency === "number" && Number.isFinite(latency)) facts.databaseLatencyMs = latency;
    const providerLatency = checks.programmeAi?.providerLatencyMs;
    if (typeof providerLatency === "number" && Number.isFinite(providerLatency)) facts.providerLatencyMs = providerLatency;
    if (typeof payload.productionCommitSha === "string" && /^[0-9a-f]{40}$/.test(payload.productionCommitSha)) {
      facts.productionCommitSha = payload.productionCommitSha;
    }
    const failing = Array.isArray(payload.failing) ? payload.failing.filter((name) => opsHealthCheckNames.has(name)) : [];
    facts.failing = failing;
    if (response.status === 200 && payload.ok === true && failing.length === 0) return { ok: true, detail: "OK", facts };
    if (failing.length > 0) return { ok: false, detail: failing.map((name) => `${name}: ${opsHealthExplanations[name]}`).join("; "), facts };
  }
  return { ok: false, detail: `HTTP ${response.status}: ops health did not return a valid report`, facts };
}

function sleep(milliseconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}

async function fetchOnce(url, headers) {
  const response = await fetch(url, {
    headers: { "user-agent": SMOKE_USER_AGENT, ...headers },
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, contentType: response.headers.get("content-type"), body: await response.text() };
}

/** Runs one check with retries; a check passes as soon as one attempt passes. */
export async function runCheck(check, { baseUrl, evaluate = (response) => evaluateCheck(check, response), headers = {}, fetchResponse = fetchOnce, attempts = ATTEMPTS, backoff = sleep } = {}) {
  const startedAt = Date.now();
  let last = { ok: false, detail: "not run", facts: {} };
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      last = evaluate(await fetchResponse(`${baseUrl}${check.path}`, headers));
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      const code = error instanceof Error ? error.cause?.code : undefined;
      last = {
        ok: false,
        detail: timedOut
          ? `no response within ${REQUEST_TIMEOUT_MS / 1000}s`
          : `network error${typeof code === "string" && /^[A-Z_]+$/.test(code) ? ` (${code})` : ""}`,
        facts: {},
      };
    }
    if (last.ok) return { id: check.id, path: check.path, ...last, attempts: attempt, durationMs: Date.now() - startedAt };
    if (attempt < attempts) await backoff(attempt * 1_000);
  }
  return { id: check.id, path: check.path, ...last, attempts, durationMs: Date.now() - startedAt };
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return results;
}

export function assertSafeBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" && !baseUrl.startsWith("http://127.0.0.1:")) {
    throw new Error("Production smoke accepts only HTTPS or explicit 127.0.0.1 test origins");
  }
}

export async function runProductionSmoke({ baseUrl = PRODUCTION_ORIGIN, opsHealthToken = "", requireOpsHealth = false, fetchResponse = fetchOnce, backoff = sleep } = {}) {
  const origin = baseUrl.replace(/\/$/, "");
  assertSafeBaseUrl(origin);
  const results = await runPool(PAGE_CHECKS, (check) => runCheck(check, { baseUrl: origin, fetchResponse, backoff }), CONCURRENCY);

  const directory = results.find((result) => result.id === "casinos-en");
  const reviewPath = directory?.facts?.firstReviewPath ?? FALLBACK_CASINO_REVIEW_PATH;
  results.push(await runCheck(
    { id: "casino-review", path: reviewPath, kind: "html", lang: "en", requireHeading: true },
    { baseUrl: origin, fetchResponse, backoff },
  ));

  const opsHealthCheck = { id: "ops-health", path: "/api/internal/ops-health" };
  // The bearer token only ever goes to the canonical origin or an explicit loopback test server.
  const tokenAllowed = origin === PRODUCTION_ORIGIN || origin.startsWith("http://127.0.0.1:");
  if (opsHealthToken && tokenAllowed) {
    results.push(await runCheck(opsHealthCheck, {
      baseUrl: origin,
      evaluate: evaluateOpsHealth,
      headers: { authorization: `Bearer ${opsHealthToken}`, accept: "application/json" },
      fetchResponse,
      backoff,
    }));
  } else if (requireOpsHealth) {
    results.push({ ...opsHealthCheck, ok: false, detail: "OPS_HEALTH_TOKEN is not available to the workflow", facts: {}, attempts: 0, durationMs: 0 });
  } else {
    results.push({ ...opsHealthCheck, ok: true, skipped: true, detail: "skipped (no OPS_HEALTH_TOKEN)", facts: {}, attempts: 0, durationMs: 0 });
  }

  return {
    authorityVersion: "production-smoke.v2",
    ok: results.every((result) => result.ok),
    checkedAt: new Date().toISOString(),
    baseUrl: origin,
    results,
  };
}

function markdownCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

const summaryFacts = ["reviewLinks", "locs", "casinoLocs", "articles", "databaseLatencyMs", "providerLatencyMs"];

export function describeFacts(facts = {}) {
  return summaryFacts
    .filter((name) => typeof facts[name] === "number")
    .map((name) => `${name}=${facts[name]}`)
    .join(" ");
}

export function renderSmokeSummary(report) {
  const failing = report.results.filter((result) => !result.ok);
  return [
    `## Production smoke: ${report.ok ? "all checks passed" : `${failing.length} failing`}`,
    "",
    `Checked \`${report.checkedAt}\` against \`${report.baseUrl}\`.`,
    "",
    "| Check | Path | Result | Facts | Attempts | ms |",
    "|---|---|---|---|---|---|",
    ...report.results.map((result) => `| ${markdownCell(result.id)} | \`${markdownCell(result.path)}\` | ${result.ok ? "pass" : "**FAIL**"}: ${markdownCell(result.detail)} | ${markdownCell(describeFacts(result.facts))} | ${result.attempts} | ${result.durationMs} |`),
    "",
  ].join("\n");
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function runCli() {
  const report = await runProductionSmoke({
    baseUrl: process.env.PRODUCTION_SMOKE_BASE_URL || PRODUCTION_ORIGIN,
    opsHealthToken: process.env.OPS_HEALTH_TOKEN?.trim() ?? "",
    requireOpsHealth: process.argv.includes("--require-ops-health"),
  });
  const reportPath = argument("report");
  const summaryPath = argument("summary");
  if (reportPath) writeFileSync(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);
  if (summaryPath) writeFileSync(resolve(summaryPath), renderSmokeSummary(report));
  for (const result of report.results) {
    console.info(`${result.ok ? "pass" : "FAIL"} ${result.id} ${result.path} — ${result.detail}`);
  }
  console.info(report.ok
    ? `Production smoke passed ${report.results.length} checks`
    : `Production smoke failed ${report.results.filter((result) => !result.ok).length} of ${report.results.length} checks`);
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli();
