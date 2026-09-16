import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DIRECT_SUCCESS_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;
export const ALERT_STATE_MARKER = "affiliate-route-health-state";

const routeFailureStates = new Set([
  "BROKEN",
  "EXPIRED",
  "CROSS_GEO",
  "ATTRIBUTION_FAILURE",
]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function iso(value) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function safe(value, fallback = "UNKNOWN") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function markdown(value) {
  return safe(value).replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

function code(value) {
  return safe(value).replaceAll("`", "'");
}

export function classifyRouteResult(result) {
  const item = record(result);
  if (!item) return "VERIFIER_INCONCLUSIVE";
  if (item.status === "HEALTHY") {
    return item.verificationSource === "DIRECT" ? "HEALTHY" : "VERIFIER_INCONCLUSIVE";
  }
  if (item.status === "EXTERNAL_CHALLENGE") return "EXTERNAL_CHALLENGE";
  if (item.status === "DEGRADED") return "VERIFIER_INCONCLUSIVE";
  if (routeFailureStates.has(item.status)) return "ROUTE_BROKEN";
  return "VERIFIER_INCONCLUSIVE";
}

export function directSuccessFreshness(lastDirectSuccessAt, checkedAt) {
  const success = iso(lastDirectSuccessAt);
  const check = iso(checkedAt);
  if (!success || !check) return "UNKNOWN";
  const age = Date.parse(check) - Date.parse(success);
  if (age < 0) return "UNKNOWN";
  return age <= DIRECT_SUCCESS_FRESHNESS_MS ? "CURRENT" : "STALE";
}

function normalizedResult(result, reportCheckedAt) {
  const item = record(result) ?? {};
  const alertState = classifyRouteResult(item);
  const checkedAt = iso(item.checkedAt) ?? reportCheckedAt;
  const lastDirectSuccessAt = alertState === "HEALTHY"
    ? checkedAt
    : iso(item.lastDirectSuccessAt);
  return {
    routeKey: safe(item.routeKey, `unidentified:${safe(item.casinoSlug)}:${safe(item.marketCode)}`),
    casinoSlug: safe(item.casinoSlug),
    countryCode: safe(item.countryCode),
    marketCode: safe(item.marketCode),
    redirectSlug: typeof item.redirectSlug === "string" && item.redirectSlug ? item.redirectSlug : null,
    verifierStatus: safe(item.status),
    reason: safe(item.reason, "VERIFIER_RESPONSE_INCOMPLETE"),
    alertState,
    verificationSource: item.verificationSource === "DIRECT" ? "DIRECT" : null,
    checkedAt,
    lastDirectSuccessAt,
    freshness: directSuccessFreshness(lastDirectSuccessAt, reportCheckedAt),
    evidenceRevision: safe(item.evidenceRevision),
  };
}

function syntheticRow(reason, checkedAt) {
  return {
    routeKey: "monitor:production-endpoint",
    casinoSlug: "MONITOR",
    countryCode: "GLOBAL",
    marketCode: "GLOBAL",
    redirectSlug: null,
    verifierStatus: "INCONCLUSIVE",
    reason,
    alertState: "VERIFIER_INCONCLUSIVE",
    verificationSource: null,
    checkedAt,
    lastDirectSuccessAt: null,
    freshness: "UNKNOWN",
    evidenceRevision: "UNKNOWN",
  };
}

function reportValidation(report, context) {
  if (Number(context.curlStatus) !== 0) return { valid: false, reason: "PRODUCTION_ENDPOINT_TRANSPORT_FAILED" };
  const payload = record(report);
  if (!payload) return { valid: false, reason: "REPORT_NOT_JSON_OBJECT" };
  if (![200, 503].includes(Number(context.httpStatus))) return { valid: false, reason: "PRODUCTION_ENDPOINT_HTTP_STATUS_UNEXPECTED" };
  if (payload.ok !== true) return { valid: false, reason: "PRODUCTION_ENDPOINT_DID_NOT_RETURN_OK_REPORT" };
  if (!Array.isArray(payload.results)) return { valid: false, reason: "PRODUCTION_REPORT_RESULTS_MISSING" };
  if (!iso(payload.checkedAt)) return { valid: false, reason: "PRODUCTION_REPORT_CHECK_TIME_INVALID" };
  return { valid: true, reason: null };
}

function stateSignature(rows) {
  const state = rows
    .map((row) => ({
      routeKey: row.routeKey,
      alertState: row.alertState,
      freshness: row.freshness,
    }))
    .sort((left, right) => left.routeKey.localeCompare(right.routeKey));
  return createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

export function extractStateSignature(body) {
  if (typeof body !== "string") return null;
  return body.match(/<!-- affiliate-route-health-state: ([0-9a-f]{64}) -->/)?.[1] ?? null;
}

function stateCounts(rows) {
  const counts = { ROUTE_BROKEN: 0, EXTERNAL_CHALLENGE: 0, VERIFIER_INCONCLUSIVE: 0, HEALTHY: 0 };
  for (const row of rows) counts[row.alertState] += 1;
  return counts;
}

function workflowLink(context) {
  return safe(context.workflowUrl, "UNKNOWN") === "UNKNOWN"
    ? `run ${code(context.runId)}`
    : `[run ${markdown(context.runId)}](${context.workflowUrl})`;
}

function renderBody({ report, rows, signature, context, checkedAt, validation }) {
  const payload = record(report) ?? {};
  const counts = stateCounts(rows);
  const productionSha = /^[0-9a-f]{40}$/.test(String(payload.productionCommitSha ?? ""))
    ? String(payload.productionCommitSha)
    : "UNKNOWN";
  const workflowSha = /^[0-9a-f]{40}$/.test(String(context.workflowSha ?? ""))
    ? String(context.workflowSha)
    : "UNKNOWN";
  const lines = [
    "# Production affiliate route health",
    "",
    "The first-party Production check requires attention. This issue is operational evidence only and does not change commercial authority or route data.",
    "",
    `- Check time: \`${code(checkedAt)}\``,
    `- Production SHA: \`${productionSha}\``,
    `- Workflow source SHA: \`${workflowSha}\``,
    `- Workflow run ID: \`${code(context.runId)}\` (${workflowLink(context)})`,
    `- Endpoint HTTP status: \`${code(context.httpStatus)}\``,
    `- Report authority: \`${code(payload.authorityVersion)}\``,
    `- Report validity: \`${validation.valid ? "VALID" : validation.reason}\``,
    `- State counts: \`ROUTE_BROKEN=${counts.ROUTE_BROKEN}\`, \`EXTERNAL_CHALLENGE=${counts.EXTERNAL_CHALLENGE}\`, \`VERIFIER_INCONCLUSIVE=${counts.VERIFIER_INCONCLUSIVE}\`, \`HEALTHY=${counts.HEALTHY}\``,
    "- Direct-success freshness threshold: `7 days`",
    "",
    "| Monitor state | Casino × market | Route | Verifier result | Reason | Last direct success | Freshness | Evidence revision |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.alertState} | ${markdown(row.casinoSlug)} × ${markdown(row.marketCode)} | ${row.redirectSlug ? `/r/${markdown(row.redirectSlug)}` : "N/A"} | ${markdown(row.verifierStatus)} | ${markdown(row.reason)} | ${markdown(row.lastDirectSuccessAt ?? "UNKNOWN")} | ${row.freshness} | ${markdown(row.evidenceRevision)} |`),
    "",
    "Interpretation:",
    "",
    "- `ROUTE_BROKEN`: direct evidence identifies a material route failure.",
    "- `EXTERNAL_CHALLENGE`: the upstream returned an identified bot/CDN challenge; this does not prove the route is broken.",
    "- `VERIFIER_INCONCLUSIVE`: the verifier cannot establish route state from current evidence.",
    "- `HEALTHY`: the current route completed a direct check successfully.",
    "",
    "The workflow may close this issue only after every reported material route is `HEALTHY` with `verificationSource=DIRECT`. A stored or Founder override cannot satisfy that recovery gate by itself.",
    "",
    "Runbook: `docs/06_Operations/Affiliate-Route-Health-Runbook.md`",
    "",
    `<!-- ${ALERT_STATE_MARKER}: ${signature} -->`,
    "",
  ];
  return lines.join("\n");
}

function renderComment(rows, signature, context, checkedAt) {
  const counts = stateCounts(rows);
  return [
    "Affiliate route monitor state, affected set, or freshness threshold changed.",
    "",
    `- Check time: \`${code(checkedAt)}\``,
    `- Workflow run ID: \`${code(context.runId)}\` (${workflowLink(context)})`,
    `- States: \`ROUTE_BROKEN=${counts.ROUTE_BROKEN}\`, \`EXTERNAL_CHALLENGE=${counts.EXTERNAL_CHALLENGE}\`, \`VERIFIER_INCONCLUSIVE=${counts.VERIFIER_INCONCLUSIVE}\`, \`HEALTHY=${counts.HEALTHY}\``,
    `- State signature: \`${signature}\``,
    "",
  ].join("\n");
}

function renderRecoveryComment(rows, context, reportCheckedAt) {
  const payload = record(context.report) ?? {};
  const productionSha = /^[0-9a-f]{40}$/.test(String(payload.productionCommitSha ?? ""))
    ? String(payload.productionCommitSha)
    : "UNKNOWN";
  return [
    "Every material route in the current Production report completed a direct health check. The monitor is closing this alert.",
    "",
    `- Directly healthy routes: \`${rows.length}\``,
    `- Check time: \`${code(reportCheckedAt)}\``,
    `- Production SHA: \`${productionSha}\``,
    `- Workflow run ID: \`${code(context.runId)}\` (${workflowLink(context)})`,
    "",
  ].join("\n");
}

export function evaluateAffiliateRouteAlert({ report, context, issueOpen = false, existingBody = "" }) {
  const validation = reportValidation(report, context);
  const payload = record(report) ?? {};
  const checkedAt = validation.valid ? iso(payload.checkedAt) : iso(context.checkedAt) ?? new Date().toISOString();
  let rows = validation.valid
    ? payload.results.map((result) => normalizedResult(result, checkedAt))
    : [syntheticRow(validation.reason, checkedAt)];

  const emptyHealthy = validation.valid
    && payload.results.length === 0
    && payload.healthy === true
    && payload.noActiveRoutes === true;
  const reportContradiction = validation.valid && (
    (payload.results.length === 0) !== (payload.noActiveRoutes === true)
    || (payload.results.length > 0 && rows.every((row) => row.alertState === "HEALTHY") && payload.healthy !== true)
    || rows.some((row) => row.alertState !== "HEALTHY") && payload.healthy === true
  );
  if (reportContradiction) rows = [...rows, syntheticRow("PRODUCTION_REPORT_CONTRADICTION", checkedAt)];
  if (issueOpen && emptyHealthy) rows = [syntheticRow("NO_ACTIVE_ROUTES_CANNOT_PROVE_INCIDENT_RECOVERY", checkedAt)];

  const directlyHealthy = validation.valid
    && !reportContradiction
    && payload.results.length > 0
    && rows.every((row) => row.alertState === "HEALTHY" && row.verificationSource === "DIRECT");
  const workflowHealthy = directlyHealthy || (emptyHealthy && !issueOpen && !reportContradiction);
  const action = issueOpen
    ? directlyHealthy ? "close" : "update"
    : workflowHealthy ? "none" : "open";
  const signature = stateSignature(rows);
  const previousSignature = extractStateSignature(existingBody);
  const notify = action === "update" && previousSignature !== signature;
  const body = renderBody({ report, rows, signature, context, checkedAt, validation });
  const comment = action === "close"
    ? renderRecoveryComment(rows, { ...context, report }, checkedAt)
    : renderComment(rows, signature, context, checkedAt);

  return {
    action,
    notify,
    workflowHealthy,
    directlyHealthy,
    bodyChanged: existingBody.replaceAll("\r\n", "\n") !== body,
    signature,
    previousSignature,
    checkedAt,
    rows,
    body,
    comment,
  };
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runCli() {
  const reportPath = resolve(argument("report") ?? "route-health.json");
  const existingBodyPath = resolve(argument("existing-body") ?? "existing-issue.md");
  const bodyPath = resolve(argument("body") ?? "route-health.md");
  const commentPath = resolve(argument("comment") ?? "route-health-comment.md");
  const statePath = resolve(argument("state") ?? "route-health-state.json");
  let report = null;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    report = null;
  }
  const existingBody = existsSync(existingBodyPath) ? readFileSync(existingBodyPath, "utf8") : "";
  const result = evaluateAffiliateRouteAlert({
    report,
    issueOpen: argument("issue-open") === "true",
    existingBody,
    context: {
      curlStatus: Number(argument("curl-status") ?? 1),
      httpStatus: argument("http-status") ?? "000",
      checkedAt: process.env.MONITOR_CHECKED_AT,
      runId: process.env.GITHUB_RUN_ID ?? "UNKNOWN",
      workflowUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : "UNKNOWN",
      workflowSha: process.env.GITHUB_SHA ?? "UNKNOWN",
    },
  });
  writeFileSync(bodyPath, result.body);
  writeFileSync(commentPath, result.comment);
  writeFileSync(statePath, `${JSON.stringify({
    action: result.action,
    notify: result.notify,
    workflowHealthy: result.workflowHealthy,
    directlyHealthy: result.directlyHealthy,
    bodyChanged: result.bodyChanged,
    signature: result.signature,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
