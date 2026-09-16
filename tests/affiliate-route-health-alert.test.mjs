import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyRouteResult,
  directSuccessFreshness,
  evaluateAffiliateRouteAlert,
} from "../scripts/affiliate-route-health-alert.mjs";

const checkedAt = "2026-09-16T06:00:00.000Z";
const productionCommitSha = "1e502fb36b5d9c4256f5425b518e7c124af901dd";
const context = {
  curlStatus: 0,
  httpStatus: 503,
  checkedAt,
  runId: "34957701166",
  workflowUrl: "https://github.com/B4GAMBLE/b4gamble/actions/runs/34957701166",
  workflowSha: "1111111111111111111111111111111111111111",
};

function route(overrides = {}) {
  return {
    routeKey: "rizk:RS:rizk-welcome:activation-1",
    casinoSlug: "rizk",
    countryCode: "RS",
    marketCode: "RS",
    redirectSlug: "rizk-welcome",
    status: "BROKEN",
    reason: "HTTP_503",
    verificationSource: "DIRECT",
    checkedAt,
    lastDirectSuccessAt: "2026-09-15T06:00:00.000Z",
    evidenceRevision: "market-activation:activation-1:v4",
    ...overrides,
  };
}

function report(results, overrides = {}) {
  return {
    ok: true,
    authorityVersion: "affiliate-route-health-report.v2",
    productionCommitSha,
    checkedAt,
    healthy: results.every((result) => result.status === "HEALTHY"),
    noActiveRoutes: results.length === 0,
    results,
    ...overrides,
  };
}

test("public alert taxonomy distinguishes broken, challenge, inconclusive, and directly healthy routes", () => {
  assert.equal(classifyRouteResult(route()), "ROUTE_BROKEN");
  assert.equal(classifyRouteResult(route({ status: "EXTERNAL_CHALLENGE" })), "EXTERNAL_CHALLENGE");
  assert.equal(classifyRouteResult(route({ status: "DEGRADED", reason: "ROUTE_VERIFICATION_INCONCLUSIVE", verificationSource: null })), "VERIFIER_INCONCLUSIVE");
  assert.equal(classifyRouteResult(route({ status: "HEALTHY", reason: "OK" })), "HEALTHY");
  assert.equal(classifyRouteResult(route({ status: "HEALTHY", reason: "FOUNDER_OVERRIDE", verificationSource: null })), "VERIFIER_INCONCLUSIVE");
});

test("malformed or unreachable endpoint evidence is verifier-inconclusive rather than a broken route", () => {
  const result = evaluateAffiliateRouteAlert({
    report: null,
    context: { ...context, curlStatus: 6, httpStatus: "000" },
    issueOpen: false,
  });
  assert.equal(result.action, "open");
  assert.equal(result.workflowHealthy, false);
  assert.equal(result.rows[0].alertState, "VERIFIER_INCONCLUSIVE");
  assert.equal(result.rows[0].reason, "PRODUCTION_ENDPOINT_TRANSPORT_FAILED");
});

test("unchanged state signature updates evidence without posting another comment", () => {
  const first = evaluateAffiliateRouteAlert({ report: report([route()]), context, issueOpen: false });
  const existingBody = `${first.body}\n`;
  const unchanged = evaluateAffiliateRouteAlert({
    report: report([route()]),
    context: { ...context, runId: "34957701167" },
    issueOpen: true,
    existingBody,
  });
  assert.equal(unchanged.action, "update");
  assert.equal(unchanged.notify, false);
  assert.equal(unchanged.bodyChanged, true, "run evidence in the issue body remains current");

  const evidenceOnly = evaluateAffiliateRouteAlert({
    report: report([route({ reason: "HTTP_500", evidenceRevision: "market-activation:activation-1:v5" })]),
    context,
    issueOpen: true,
    existingBody,
  });
  assert.equal(evidenceOnly.notify, false, "detail and revision refresh the body without comment noise");
  assert.equal(evidenceOnly.signature, first.signature);

  const changed = evaluateAffiliateRouteAlert({
    report: report([route({ status: "EXTERNAL_CHALLENGE", reason: "HTTP_403" })]),
    context,
    issueOpen: true,
    existingBody,
  });
  assert.equal(changed.notify, true);
  assert.notEqual(changed.signature, first.signature);
});

test("crossing the seven-day direct-success threshold changes the deduplication signature", () => {
  assert.equal(directSuccessFreshness("2026-09-09T06:00:00.000Z", checkedAt), "CURRENT");
  assert.equal(directSuccessFreshness("2026-09-09T05:59:59.999Z", checkedAt), "STALE");

  const current = evaluateAffiliateRouteAlert({
    report: report([route({ lastDirectSuccessAt: "2026-09-09T06:00:00.000Z" })]),
    context,
  });
  const stale = evaluateAffiliateRouteAlert({
    report: report([route({ lastDirectSuccessAt: "2026-09-09T05:59:59.999Z" })]),
    context,
    issueOpen: true,
    existingBody: current.body,
  });
  assert.equal(current.rows[0].freshness, "CURRENT");
  assert.equal(stale.rows[0].freshness, "STALE");
  assert.equal(stale.notify, true);
  assert.notEqual(stale.signature, current.signature);
});

test("only a non-empty set of directly healthy material routes can close an open issue", () => {
  const direct = evaluateAffiliateRouteAlert({
    report: report([route({ status: "HEALTHY", reason: "OK" })]),
    context: { ...context, httpStatus: 200 },
    issueOpen: true,
  });
  assert.equal(direct.action, "close");
  assert.equal(direct.directlyHealthy, true);

  const overrideOnly = evaluateAffiliateRouteAlert({
    report: report([route({ status: "HEALTHY", reason: "FOUNDER_OVERRIDE", verificationSource: null })]),
    context: { ...context, httpStatus: 200 },
    issueOpen: true,
  });
  assert.equal(overrideOnly.action, "update");
  assert.equal(overrideOnly.directlyHealthy, false);
  assert.equal(overrideOnly.rows[0].alertState, "VERIFIER_INCONCLUSIVE");
});

test("an empty canonical set is quiet normally but cannot erase an existing incident", () => {
  const empty = report([], { healthy: true, noActiveRoutes: true });
  const normal = evaluateAffiliateRouteAlert({
    report: empty,
    context: { ...context, httpStatus: 200 },
    issueOpen: false,
  });
  assert.equal(normal.action, "none");
  assert.equal(normal.workflowHealthy, true);

  const incident = evaluateAffiliateRouteAlert({
    report: empty,
    context: { ...context, httpStatus: 200 },
    issueOpen: true,
  });
  assert.equal(incident.action, "update");
  assert.equal(incident.workflowHealthy, false);
  assert.equal(incident.rows[0].reason, "NO_ACTIVE_ROUTES_CANNOT_PROVE_INCIDENT_RECOVERY");
});

test("issue evidence contains the Production SHA, run, check time, freshness, and revision", () => {
  const result = evaluateAffiliateRouteAlert({ report: report([route()]), context });
  assert.match(result.body, new RegExp(productionCommitSha));
  assert.match(result.body, /34957701166/);
  assert.match(result.body, /2026-09-16T06:00:00\.000Z/);
  assert.match(result.body, /CURRENT/);
  assert.match(result.body, /market-activation:activation-1:v4/);
});
