import assert from "node:assert/strict";
import test from "node:test";

import {
  describeDirectSuccessFreshness,
  evaluateAffiliateRouteAlert,
  issueLifecycleAction,
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
    routeKey: "casino:RS:casino-welcome:activation-1",
    casinoSlug: "casino",
    countryCode: "RS",
    marketCode: "RS",
    redirectSlug: "casino-welcome",
    checkedAt,
    actionRequired: true,
    actionReason: "Confirmed material route defect: HTTP_500.",
    lastDirectSuccessAt: "2026-09-15T06:00:00.000Z",
    currentEvidence: {
      verifierStatus: "BROKEN",
      reason: "HTTP_500",
      method: "GET",
      statusCode: 500,
      durationMs: 15,
      redirectCount: 0,
      finalHost: "casino.example",
      verificationSource: "DIRECT",
    },
    evidenceRevision: "market-activation:activation-1:v4",
    ...overrides,
  };
}

function report(results, overrides = {}) {
  const routesRequiringAction = results.filter((result) => result.actionRequired).length;
  return {
    ok: true,
    authorityVersion: "affiliate-route-health-report.v3",
    productionCommitSha,
    checkedAt,
    actionRequired: routesRequiringAction > 0,
    summary: {
      totalRoutes: results.length,
      routesRequiringAction,
      routesNotRequiringAction: results.length - routesRequiringAction,
      diagnostics: {},
    },
    results,
    ...overrides,
  };
}

function contextFor(payload, overrides = {}) {
  return { ...context, httpStatus: payload.actionRequired ? 503 : 200, ...overrides };
}

test("Issue lifecycle is the four-case actionRequired boolean rule", () => {
  assert.equal(issueLifecycleAction(false, true), "open");
  assert.equal(issueLifecycleAction(true, true), "update");
  assert.equal(issueLifecycleAction(true, false), "close");
  assert.equal(issueLifecycleAction(false, false), "none");
});

test("alert consumes actionRequired and never reclassifies verifier diagnostics", () => {
  const diagnosticOnly = report([route({
    actionRequired: false,
    actionReason: null,
    currentEvidence: { ...route().currentEvidence, verifierStatus: "EXTERNAL_CHALLENGE", reason: "HTTP_403", statusCode: 403 },
  })]);
  const quiet = evaluateAffiliateRouteAlert({ report: diagnosticOnly, context: contextFor(diagnosticOnly) });
  assert.equal(quiet.action, "none");
  assert.equal(quiet.actionRequired, false);

  const monitorDecision = report([route({
    currentEvidence: { ...route().currentEvidence, verifierStatus: "HEALTHY", reason: "GET_FALLBACK_OK", statusCode: 200 },
  })]);
  const opened = evaluateAffiliateRouteAlert({ report: monitorDecision, context: contextFor(monitorDecision) });
  assert.equal(opened.action, "open");
  assert.equal(opened.actionRequired, true);
});

test("zero actionRequired routes close an open Issue, including an empty route set", () => {
  const nonActionable = report([route({ actionRequired: false, actionReason: null })]);
  const recovered = evaluateAffiliateRouteAlert({
    report: nonActionable,
    context: contextFor(nonActionable),
    issueOpen: true,
  });
  assert.equal(recovered.action, "close");
  assert.match(recovered.comment, /zero routes with `actionRequired=true`/);

  const empty = report([]);
  const emptyRecovery = evaluateAffiliateRouteAlert({ report: empty, context: contextFor(empty), issueOpen: true });
  assert.equal(emptyRecovery.action, "close");
  assert.equal(emptyRecovery.actionRequired, false);
});

test("at least one actionRequired route opens or keeps the single Issue open", () => {
  const actionable = report([route()]);
  assert.equal(evaluateAffiliateRouteAlert({ report: actionable, context: contextFor(actionable) }).action, "open");
  assert.equal(evaluateAffiliateRouteAlert({ report: actionable, context: contextFor(actionable), issueOpen: true }).action, "update");
});

test("diagnostic-only variation while actionRequired is false creates no Issue or comment", () => {
  const first = report([route({
    actionRequired: false,
    actionReason: null,
    currentEvidence: { ...route().currentEvidence, verifierStatus: "DEGRADED", reason: "NETWORK_ERROR", statusCode: null },
  })]);
  const second = report([route({
    actionRequired: false,
    actionReason: null,
    currentEvidence: { ...route().currentEvidence, verifierStatus: "DEGRADED", reason: "TIMEOUT", statusCode: null },
  })]);
  const firstResult = evaluateAffiliateRouteAlert({ report: first, context: contextFor(first) });
  const secondResult = evaluateAffiliateRouteAlert({ report: second, context: contextFor(second), existingBody: firstResult.body });
  assert.equal(firstResult.action, "none");
  assert.equal(secondResult.action, "none");
  assert.equal(secondResult.notify, false);
  assert.equal(secondResult.signature, firstResult.signature);
});

test("comments occur only when the actionable set or actionable reason changes", () => {
  const firstPayload = report([route()]);
  const first = evaluateAffiliateRouteAlert({ report: firstPayload, context: contextFor(firstPayload) });

  const diagnosticChange = report([route({
    currentEvidence: { ...route().currentEvidence, durationMs: 99, finalHost: "www.casino.example" },
  })]);
  const unchanged = evaluateAffiliateRouteAlert({
    report: diagnosticChange,
    context: contextFor(diagnosticChange, { runId: "34957701167" }),
    issueOpen: true,
    existingBody: first.body,
  });
  assert.equal(unchanged.action, "update");
  assert.equal(unchanged.notify, false);
  assert.equal(unchanged.bodyChanged, true, "current diagnostic evidence may refresh the body silently");

  const reasonChange = report([route({ actionReason: "Confirmed material route defect: HTTP_410." })]);
  const changed = evaluateAffiliateRouteAlert({
    report: reasonChange,
    context: contextFor(reasonChange),
    issueOpen: true,
    existingBody: first.body,
  });
  assert.equal(changed.notify, true);
  assert.notEqual(changed.signature, first.signature);
});

test("Issue evidence puts actionable routes first and includes required safe facts", () => {
  const payload = report([
    route(),
    route({
      routeKey: "other:SE:other-route:activation-2",
      casinoSlug: "other",
      marketCode: "SE",
      redirectSlug: "other-route",
      actionRequired: false,
      actionReason: null,
      currentEvidence: { ...route().currentEvidence, verifierStatus: "EXTERNAL_CHALLENGE", reason: "HTTP_403", statusCode: 403 },
    }),
  ]);
  const result = evaluateAffiliateRouteAlert({ report: payload, context: contextFor(payload) });
  assert.match(result.body, /## Actionable routes/);
  assert.match(result.body, /Why action is required/);
  assert.match(result.body, new RegExp(productionCommitSha));
  assert.match(result.body, /34957701166/);
  assert.match(result.body, /2026-09-16T06:00:00\.000Z/);
  assert.match(result.body, /within the 7-day threshold/);
  assert.match(result.body, /market-activation:activation-1:v4/);
  assert.match(result.body, /## Compact non-actionable diagnostic summary/);
  assert.match(result.body, /\| EXTERNAL_CHALLENGE \| HTTP_403 \| 1 \|/);
  assert.doesNotMatch(result.body, /other-route/);
  assert.ok(result.body.indexOf("## Actionable routes") < result.body.indexOf("## Compact non-actionable diagnostic summary"));
});

test("freshness display uses one inclusive seven-day threshold without creating a lifecycle state", () => {
  assert.match(describeDirectSuccessFreshness("2026-09-09T06:00:00.000Z", checkedAt), /within the 7-day threshold/);
  assert.match(describeDirectSuccessFreshness("2026-09-09T05:59:59.999Z", checkedAt), /older than the 7-day threshold/);
  assert.equal(describeDirectSuccessFreshness(null, checkedAt), "not recorded");
});

test("an invalid Production report blocks reconciliation instead of inventing a route decision", () => {
  const result = evaluateAffiliateRouteAlert({
    report: null,
    context: { ...context, curlStatus: 6, httpStatus: "000" },
  });
  assert.equal(result.action, "none");
  assert.equal(result.actionRequired, null);
  assert.equal(result.reportValid, false);
  assert.deepEqual(result.rows, []);
});
