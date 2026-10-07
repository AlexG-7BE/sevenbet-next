import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  FLOORS,
  PAGE_CHECKS,
  PRODUCTION_ORIGIN,
  SMOKE_USER_AGENT,
  casinoReviewPaths,
  evaluateCheck,
  evaluateOpsHealth,
  llmsArticleCount,
  renderSmokeSummary,
  runCheck,
  runProductionSmoke,
  sitemapCounts,
} from "../scripts/production-smoke.mjs";
import {
  SMOKE_ALERT_TITLE,
  evaluateSmokeAlert,
  failingChecks,
  issueLifecycleAction,
} from "../scripts/production-smoke-alert.mjs";

const TOKEN = "unit-smoke-token-51c2";

function html({ lang = "en-GB", reviews = 0, heading = true } = {}) {
  const links = Array.from({ length: reviews }, (_, index) => `<a href="/en/casino/casino-${index}">Read review</a>`).join("");
  return `<!DOCTYPE html><html lang="${lang}"><head><title>t</title></head><body>${heading ? "<h1>Heading</h1>" : ""}${links}</body></html>`;
}

function sitemap(total, casino) {
  const casinoLocs = Array.from({ length: casino }, (_, index) => `<url><loc>https://b4gamble.com/en/casino/c-${index}</loc></url>`);
  const other = Array.from({ length: total - casino }, (_, index) => `<url><loc>https://b4gamble.com/en/page-${index}</loc></url>`);
  return `<?xml version="1.0"?><urlset>${[...other, ...casinoLocs].join("")}</urlset>`;
}

function llms(articles) {
  const lines = Array.from({ length: articles }, (_, index) => `- [Article ${index}](https://b4gamble.com/en/learn/a/${index}): excerpt`);
  return `# B4GAMBLE\n\n## Core Pages\n\n- [Home](https://b4gamble.com/)\n\n## Published Learning Center Articles\n\n${lines.join("\n")}\n\n## Casino Data Boundary\n\n- [Casino reviews](https://b4gamble.com/casinos)\n`;
}

const htmlResponse = (body) => ({ status: 200, contentType: "text/html; charset=utf-8", body });

function healthyOpsBody(overrides = {}) {
  return JSON.stringify({
    ok: true,
    authorityVersion: "ops-health.v1",
    failing: [],
    productionCommitSha: "b".repeat(40),
    checks: { database: { ok: true, latencyMs: 12, attempts: 1 }, programmeAi: { ok: true, providerLatencyMs: 140 } },
    ...overrides,
  });
}

/** A fake Production that serves healthy responses; `overrides` maps a path to a response. */
function fakeProduction(overrides = {}, calls = []) {
  return async (url, headers) => {
    const { pathname } = new URL(url);
    calls.push({ url, headers });
    if (overrides[pathname]) return overrides[pathname];
    if (pathname === "/sv") return htmlResponse(html({ lang: "sv-SE" }));
    if (pathname === "/da") return htmlResponse(html({ lang: "da-DK" }));
    if (pathname === "/de") return htmlResponse(html({ lang: "de-DE" }));
    if (pathname === "/uk") return htmlResponse(html({ lang: "uk-UA" }));
    if (pathname === "/ru") return htmlResponse(html({ lang: "ru-RU" }));
    if (pathname === "/en/casinos") return htmlResponse(html({ reviews: 28 }));
    if (pathname === "/en/bonuses") return htmlResponse(html({ reviews: 26 }));
    if (pathname === "/en/best-offers") return htmlResponse(html({ reviews: 3 }));
    if (pathname === "/api/auth/ok") return { status: 200, contentType: "application/json", body: "{\"ok\":true}" };
    if (pathname === "/sitemap.xml") return { status: 200, contentType: "application/xml", body: sitemap(69, 27) };
    if (pathname === "/llms.txt") return { status: 200, contentType: "text/plain; charset=utf-8", body: llms(27) };
    if (pathname === "/api/internal/ops-health") return { status: 200, contentType: "application/json", body: healthyOpsBody() };
    return htmlResponse(html());
  };
}

const noBackoff = async () => undefined;

test("the smoke identifies itself as a monitor so the site records BOT traffic", () => {
  assert.match(SMOKE_USER_AGENT, /monitor/i);
  const botPattern = /bot|crawler|spider|headless|playwright|lighthouse|monitor|globalping/i;
  assert.match(readFileSync("lib/analytics/identity.server.ts", "utf8"), /monitor/);
  assert.match(SMOKE_USER_AGENT, botPattern);
});

test("the check list covers the conversion path, every launch language and the silent fallbacks", () => {
  const paths = PAGE_CHECKS.map((check) => check.path);
  for (const path of ["/", "/en", "/sv", "/da", "/de", "/uk", "/ru", "/en/best-offers", "/en/bonuses", "/en/casinos", "/program", "/login", "/api/auth/ok", "/sitemap.xml", "/llms.txt"]) {
    assert.ok(paths.includes(path), `${path} is checked`);
  }
  assert.deepEqual(PAGE_CHECKS.filter((check) => check.lang).map((check) => check.lang).slice(0, 4), ["en", "sv", "da", "de"]);
});

test("casino review links are counted once per casino, relative or absolute", () => {
  const body = [
    '<a href="/en/casino/betsson">', '<a href="/en/casino/betsson/">', '<a href="https://b4gamble.com/en/casino/rizk">',
    '<a href="/sv-se/casino/nordicbet">', '<a href="/en/casinos">', '<a href="https://other.example/en/casino/x">',
  ].join("");
  assert.deepEqual(casinoReviewPaths(body), ["/en/casino/betsson", "/en/casino/rizk", "/sv-se/casino/nordicbet"]);
});

test("sitemap and llms.txt counters", () => {
  assert.deepEqual(sitemapCounts(sitemap(69, 27)), { total: 69, casino: 27 });
  assert.deepEqual(sitemapCounts("<urlset></urlset>"), { total: 0, casino: 0 });
  assert.equal(llmsArticleCount(llms(27)), 27);
  assert.equal(llmsArticleCount(llms(0)), 0);
  assert.equal(llmsArticleCount("# no section"), 0);
});

test("HTML checks fail on status, content type, language fallback and shrinking lists", () => {
  const home = PAGE_CHECKS.find((check) => check.id === "home-sv");
  assert.equal(evaluateCheck(home, htmlResponse(html({ lang: "sv-SE" }))).ok, true);
  assert.match(evaluateCheck(home, htmlResponse(html({ lang: "en-GB" }))).detail, /page language is en-GB, expected sv/);
  assert.equal(evaluateCheck(home, { status: 500, contentType: "text/html", body: html() }).detail, "HTTP 500");
  assert.match(evaluateCheck(home, { status: 200, contentType: "application/json", body: "{}" }).detail, /expected HTML/);

  const directory = PAGE_CHECKS.find((check) => check.id === "casinos-en");
  const healthy = evaluateCheck(directory, htmlResponse(html({ reviews: 28 })));
  assert.equal(healthy.ok, true);
  assert.equal(healthy.facts.reviewLinks, 28);
  assert.equal(healthy.facts.firstReviewPath, "/en/casino/casino-0");
  const empty = evaluateCheck(directory, htmlResponse(html({ reviews: 0 })));
  assert.equal(empty.ok, false);
  assert.match(empty.detail, new RegExp(`0 casino review links, floor ${FLOORS.casinosReviewLinks}`));
  assert.equal(evaluateCheck(directory, htmlResponse(html({ reviews: FLOORS.casinosReviewLinks }))).ok, true);
  assert.equal(evaluateCheck(directory, htmlResponse(html({ reviews: FLOORS.casinosReviewLinks - 1 }))).ok, false);

  const review = { id: "casino-review", path: "/en/casino/x", kind: "html", lang: "en", requireHeading: true };
  assert.match(evaluateCheck(review, htmlResponse(html({ heading: false }))).detail, /heading missing/);
});

test("sitemap, llms.txt and auth checks catch their silent fallbacks", () => {
  const sitemapCheck = PAGE_CHECKS.find((check) => check.id === "sitemap");
  assert.equal(evaluateCheck(sitemapCheck, { status: 200, contentType: "application/xml", body: sitemap(69, 27) }).ok, true);
  const coreOnly = evaluateCheck(sitemapCheck, { status: 200, contentType: "application/xml", body: sitemap(12, 0) });
  assert.equal(coreOnly.ok, false);
  assert.match(coreOnly.detail, /fell back to core routes/);
  assert.equal(evaluateCheck(sitemapCheck, { status: 200, contentType: "application/xml", body: sitemap(60, 5) }).ok, false);

  const llmsCheck = PAGE_CHECKS.find((check) => check.id === "llms");
  assert.equal(evaluateCheck(llmsCheck, { status: 200, contentType: "text/plain", body: llms(27) }).ok, true);
  assert.match(evaluateCheck(llmsCheck, { status: 200, contentType: "text/plain", body: llms(0) }).detail, /fell back to empty/);

  const auth = PAGE_CHECKS.find((check) => check.id === "auth-ok");
  assert.equal(evaluateCheck(auth, { status: 200, contentType: "application/json", body: "{\"ok\":true}" }).ok, true);
  assert.equal(evaluateCheck(auth, { status: 200, contentType: "application/json", body: "{\"ok\":false}" }).ok, false);
  assert.equal(evaluateCheck(auth, { status: 200, contentType: "text/html", body: "<html>" }).ok, false);
});

test("ops health is judged from check names only and never echoes the response body", () => {
  const healthy = evaluateOpsHealth({ status: 200, body: healthyOpsBody() });
  assert.equal(healthy.ok, true);
  assert.equal(healthy.facts.databaseLatencyMs, 12);
  assert.equal(healthy.facts.productionCommitSha, "b".repeat(40));

  const failing = evaluateOpsHealth({ status: 503, body: healthyOpsBody({ ok: false, failing: ["database", "programmeAi", "<script>injected</script>"] }) });
  assert.equal(failing.ok, false);
  assert.match(failing.detail, /^database: database unreachable; programmeAi: /);
  assert.doesNotMatch(failing.detail, /script|injected/);

  assert.match(evaluateOpsHealth({ status: 401, body: "{}" }).detail, /token rejected/);
  assert.match(evaluateOpsHealth({ status: 404, body: "" }).detail, /not deployed or monitor token not configured/);
  const opaque = evaluateOpsHealth({ status: 500, body: "secret-looking-body" });
  assert.equal(opaque.ok, false);
  assert.doesNotMatch(opaque.detail, /secret-looking-body/);
});

test("a check passes on a retry and reports timeouts in plain words", async () => {
  let calls = 0;
  const check = PAGE_CHECKS.find((item) => item.id === "program");
  const flaky = await runCheck(check, {
    baseUrl: PRODUCTION_ORIGIN,
    backoff: noBackoff,
    fetchResponse: async () => { calls += 1; return calls < 2 ? { status: 502, contentType: "text/html", body: "" } : htmlResponse(html()); },
  });
  assert.equal(flaky.ok, true);
  assert.equal(flaky.attempts, 2);

  const timeout = await runCheck(check, {
    baseUrl: PRODUCTION_ORIGIN,
    backoff: noBackoff,
    fetchResponse: async () => { throw new DOMException("timed out", "TimeoutError"); },
  });
  assert.equal(timeout.ok, false);
  assert.equal(timeout.attempts, 3);
  assert.match(timeout.detail, /no response within 15s/);
});

test("a healthy Production passes every check and reviews the first directory casino", async () => {
  const calls = [];
  const report = await runProductionSmoke({ opsHealthToken: TOKEN, requireOpsHealth: true, fetchResponse: fakeProduction({}, calls), backoff: noBackoff });
  assert.equal(report.ok, true, JSON.stringify(report.results.filter((result) => !result.ok)));
  assert.equal(report.authorityVersion, "production-smoke.v2");
  assert.ok(report.results.some((result) => result.id === "casino-review" && result.path === "/en/casino/casino-0"));
  const opsCall = calls.find((call) => call.url.endsWith("/api/internal/ops-health"));
  assert.equal(opsCall.headers.authorization, `Bearer ${TOKEN}`);
  for (const call of calls.filter((item) => !item.url.endsWith("/api/internal/ops-health"))) {
    assert.equal(call.headers.authorization, undefined, "public checks never carry the token");
  }
  assert.doesNotMatch(renderSmokeSummary(report), new RegExp(TOKEN));
  assert.doesNotMatch(JSON.stringify(report), new RegExp(TOKEN));
});

test("a database outage shows up as empty lists, a shrunken sitemap and a failing ops check", async () => {
  const report = await runProductionSmoke({
    opsHealthToken: TOKEN,
    requireOpsHealth: true,
    backoff: noBackoff,
    fetchResponse: fakeProduction({
      "/en/casinos": htmlResponse(html({ reviews: 0 })),
      "/sitemap.xml": { status: 200, contentType: "application/xml", body: sitemap(12, 0) },
      "/api/internal/ops-health": { status: 503, contentType: "application/json", body: healthyOpsBody({ ok: false, failing: ["database"] }) },
    }),
  });
  assert.equal(report.ok, false);
  assert.deepEqual(report.results.filter((result) => !result.ok).map((result) => result.id), ["casinos-en", "sitemap", "ops-health"]);
  // With an empty directory the review check falls back to a fixed published review.
  assert.ok(report.results.some((result) => result.id === "casino-review" && result.path === "/en/casino/betsson"));
});

test("the monitor token never leaves the canonical origin, and the workflow cannot skip ops health", async () => {
  const calls = [];
  const elsewhere = await runProductionSmoke({ baseUrl: "https://staging.example.invalid", opsHealthToken: TOKEN, requireOpsHealth: true, fetchResponse: fakeProduction({}, calls), backoff: noBackoff });
  assert.equal(calls.some((call) => call.headers.authorization), false);
  assert.match(elsewhere.results.find((result) => result.id === "ops-health").detail, /OPS_HEALTH_TOKEN is not available/);

  const manual = await runProductionSmoke({ fetchResponse: fakeProduction(), backoff: noBackoff });
  assert.equal(manual.ok, true);
  assert.equal(manual.results.find((result) => result.id === "ops-health").skipped, true);

  await assert.rejects(runProductionSmoke({ baseUrl: "http://b4gamble.com", fetchResponse: fakeProduction() }), /HTTPS/);
});

test("issue lifecycle: open, update, close, none", () => {
  assert.equal(issueLifecycleAction(false, true), "open");
  assert.equal(issueLifecycleAction(true, true), "update");
  assert.equal(issueLifecycleAction(true, false), "close");
  assert.equal(issueLifecycleAction(false, false), "none");
});

function report(failingIds = [], checkedAt = "2026-09-28T08:00:00.000Z") {
  const ids = ["home-en", "casinos-en", "sitemap", "ops-health"];
  return {
    authorityVersion: "production-smoke.v2",
    ok: failingIds.length === 0,
    checkedAt,
    baseUrl: PRODUCTION_ORIGIN,
    results: ids.map((id) => ({
      id,
      path: `/${id}`,
      ok: !failingIds.includes(id),
      detail: failingIds.includes(id) ? `${id} broke` : "OK",
      facts: id === "ops-health" ? { productionCommitSha: "c".repeat(40) } : {},
    })),
  };
}

const context = { runId: "42", workflowUrl: "https://github.com/AlexG-7BE/sevenbet-next/actions/runs/42" };

test("first failure opens one issue that names the failing checks", () => {
  const result = evaluateSmokeAlert({ report: report(["casinos-en", "sitemap"]), issueOpen: false, context });
  assert.equal(result.action, "open");
  assert.match(result.body, /\| casinos-en \| `\/casinos-en` \| casinos-en broke \|/);
  assert.match(result.body, /Failing: \*\*2\*\* of 4 checks/);
  assert.match(result.body, /Production commit: `c{40}`/);
  assert.match(result.body, /actions\/runs\/42/);
  assert.match(result.body, /<!-- production-smoke-failing: casinos-en,sitemap -->/);
});

test("a still-failing run edits the body but only comments when the failing set changes", () => {
  const opened = evaluateSmokeAlert({ report: report(["casinos-en"]), issueOpen: false, context });
  const same = evaluateSmokeAlert({ report: report(["casinos-en"], "2026-09-28T08:10:00.000Z"), issueOpen: true, existingBody: opened.body, context });
  assert.equal(same.action, "update");
  assert.equal(same.notify, false);
  assert.equal(same.bodyChanged, true);

  const changed = evaluateSmokeAlert({ report: report(["sitemap", "ops-health"]), issueOpen: true, existingBody: opened.body, context });
  assert.equal(changed.notify, true);
  assert.match(changed.comment, /Newly failing:/);
  assert.match(changed.comment, /`sitemap`/);
  assert.match(changed.comment, /Recovered: `casinos-en`/);
});

test("a green run closes the open issue with a recovery comment; nothing happens when nothing is open", () => {
  const opened = evaluateSmokeAlert({ report: report(["casinos-en"]), issueOpen: false, context });
  const recovered = evaluateSmokeAlert({ report: report([]), issueOpen: true, existingBody: opened.body, context });
  assert.equal(recovered.action, "close");
  assert.match(recovered.comment, /All 4 Production smoke checks pass again/);
  assert.equal(evaluateSmokeAlert({ report: report([]), issueOpen: false, context }).action, "none");
});

test("a missing or malformed report is itself an alert", () => {
  for (const broken of [null, {}, { authorityVersion: "production-smoke.v1", results: [] }, { authorityVersion: "production-smoke.v2" }]) {
    const failing = failingChecks(broken);
    assert.deepEqual(failing.map((item) => item.id), ["smoke-runner"]);
    assert.equal(evaluateSmokeAlert({ report: broken, issueOpen: false, context }).action, "open");
  }
});

test("the workflow runs often, can write issues, and keeps the token inside the smoke step", () => {
  const workflow = readFileSync(".github/workflows/production-smoke.yml", "utf8");
  assert.match(workflow, /cron: "4,14,24,34,44,54 \* \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /ALERT_TITLE: "\[Production\] Smoke alert"/);
  assert.equal(SMOKE_ALERT_TITLE, "[Production] Smoke alert");
  assert.match(workflow, /--require-ops-health/);
  assert.match(workflow, /production-smoke-alert\.mjs/);
  assert.match(workflow, /--assignee "\$\{GITHUB_REPOSITORY_OWNER\}"/);
  assert.equal((workflow.match(/secrets\.AFFILIATE_HEALTH_MONITOR_TOKEN/g) ?? []).length, 1);
  assert.doesNotMatch(workflow, /npm ci|npm install/, "the smoke stays dependency-free");
  assert.doesNotMatch(workflow, /--search/, "the open issue is found by listing, not through the lagging search index");
});
