import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DIRECT_SUCCESS_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;
export const ALERT_SIGNATURE_MARKER = "affiliate-route-health-action-signature";

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

export function describeDirectSuccessFreshness(lastDirectSuccessAt, checkedAt) {
  const success = iso(lastDirectSuccessAt);
  const check = iso(checkedAt);
  if (!success) return "not recorded";
  if (!check) return "age unavailable";
  const age = Date.parse(check) - Date.parse(success);
  if (age < 0) return "age unavailable";
  const totalHours = Math.floor(age / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const ageText = days > 0 ? `${days}d ${hours}h ago` : `${hours}h ago`;
  return `${ageText} (${age <= DIRECT_SUCCESS_FRESHNESS_MS ? "within" : "older than"} the 7-day threshold)`;
}

function normalizedResult(result, reportCheckedAt) {
  const item = record(result) ?? {};
  const currentEvidence = record(item.currentEvidence) ?? {};
  const checkedAt = iso(item.checkedAt) ?? reportCheckedAt;
  const lastDirectSuccessAt = iso(item.lastDirectSuccessAt);
  const actionRequired = item.actionRequired === true;
  return {
    routeKey: safe(item.routeKey, `unidentified:${safe(item.casinoSlug)}:${safe(item.marketCode)}`),
    casinoSlug: safe(item.casinoSlug),
    countryCode: safe(item.countryCode),
    marketCode: safe(item.marketCode),
    redirectSlug: typeof item.redirectSlug === "string" && item.redirectSlug ? item.redirectSlug : null,
    checkedAt,
    actionRequired,
    actionReason: actionRequired
      ? safe(item.actionReason, "The Production monitor requires action for this route.")
      : null,
    lastDirectSuccessAt,
    freshness: describeDirectSuccessFreshness(lastDirectSuccessAt, reportCheckedAt),
    currentEvidence: {
      verifierStatus: safe(currentEvidence.verifierStatus, "INCONCLUSIVE"),
      reason: safe(currentEvidence.reason, "VERIFIER_RESPONSE_INCOMPLETE"),
      method: currentEvidence.method === "HEAD" || currentEvidence.method === "GET" ? currentEvidence.method : null,
      statusCode: typeof currentEvidence.statusCode === "number" && Number.isFinite(currentEvidence.statusCode)
        ? currentEvidence.statusCode
        : null,
      finalHost: typeof currentEvidence.finalHost === "string" && currentEvidence.finalHost.trim()
        ? currentEvidence.finalHost.trim()
        : null,
      verificationSource: currentEvidence.verificationSource === "DIRECT" ? "DIRECT" : null,
    },
    evidenceRevision: safe(item.evidenceRevision),
  };
}

function reportValidation(report, context) {
  if (Number(context.curlStatus) !== 0) return { valid: false, reason: "PRODUCTION_ENDPOINT_TRANSPORT_FAILED" };
  const payload = record(report);
  if (!payload) return { valid: false, reason: "REPORT_NOT_JSON_OBJECT" };
  if (![200, 503].includes(Number(context.httpStatus))) return { valid: false, reason: "PRODUCTION_ENDPOINT_HTTP_STATUS_UNEXPECTED" };
  if (payload.ok !== true) return { valid: false, reason: "PRODUCTION_ENDPOINT_DID_NOT_RETURN_OK_REPORT" };
  if (payload.authorityVersion !== "affiliate-route-health-report.v3") return { valid: false, reason: "PRODUCTION_REPORT_CONTRACT_UNEXPECTED" };
  if (!Array.isArray(payload.results)) return { valid: false, reason: "PRODUCTION_REPORT_RESULTS_MISSING" };
  if (!iso(payload.checkedAt)) return { valid: false, reason: "PRODUCTION_REPORT_CHECK_TIME_INVALID" };
  if (typeof payload.actionRequired !== "boolean") return { valid: false, reason: "PRODUCTION_REPORT_DECISION_MISSING" };
  if (payload.results.some((item) => {
    const route = record(item);
    return !route || typeof route.actionRequired !== "boolean" || !record(route.currentEvidence);
  })) return { valid: false, reason: "PRODUCTION_REPORT_ROUTE_DECISION_INVALID" };

  const summary = record(payload.summary);
  const routesRequiringAction = payload.results.filter((item) => record(item)?.actionRequired === true).length;
  if (!summary
    || summary.totalRoutes !== payload.results.length
    || summary.routesRequiringAction !== routesRequiringAction
    || summary.routesNotRequiringAction !== payload.results.length - routesRequiringAction
    || payload.actionRequired !== (routesRequiringAction > 0)) {
    return { valid: false, reason: "PRODUCTION_REPORT_DECISION_CONTRADICTION" };
  }
  if (Number(context.httpStatus) !== (payload.actionRequired ? 503 : 200)) {
    return { valid: false, reason: "PRODUCTION_REPORT_HTTP_DECISION_CONTRADICTION" };
  }
  return { valid: true, reason: null };
}

function actionSignature(rows) {
  const actionable = rows
    .filter((row) => row.actionRequired)
    .map((row) => ({ routeKey: row.routeKey, actionReason: row.actionReason }))
    .sort((left, right) => left.routeKey.localeCompare(right.routeKey));
  return createHash("sha256").update(JSON.stringify(actionable)).digest("hex");
}

export function extractActionSignature(body) {
  if (typeof body !== "string") return null;
  return body.match(/<!-- affiliate-route-health-action-signature: ([0-9a-f]{64}) -->/)?.[1] ?? null;
}

export function issueLifecycleAction(issueOpen, actionRequired) {
  if (actionRequired) return issueOpen ? "update" : "open";
  return issueOpen ? "close" : "none";
}

function workflowLink(context) {
  return safe(context.workflowUrl, "UNKNOWN") === "UNKNOWN"
    ? `run ${code(context.runId)}`
    : `[run ${markdown(context.runId)}](${context.workflowUrl})`;
}

function diagnosticEvidence(row) {
  const evidence = row.currentEvidence;
  return [
    `verifier=${evidence.verifierStatus}`,
    `reason=${evidence.reason}`,
    evidence.statusCode === null ? null : `HTTP=${evidence.statusCode}`,
    evidence.finalHost ? `finalHost=${evidence.finalHost}` : null,
    evidence.method ? `method=${evidence.method}` : null,
  ].filter(Boolean).join("; ");
}

function routeLabel(row) {
  return row.redirectSlug ? `/r/${markdown(row.redirectSlug)}` : "N/A";
}

function diagnosticSummary(rows) {
  const counts = new Map();
  for (const row of rows) {
    const key = `${row.currentEvidence.verifierStatus}\u0000${row.currentEvidence.reason}`;
    const current = counts.get(key) ?? {
      verifierStatus: row.currentEvidence.verifierStatus,
      reason: row.currentEvidence.reason,
      count: 0,
    };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].sort((left, right) => (
    left.verifierStatus.localeCompare(right.verifierStatus) || left.reason.localeCompare(right.reason)
  ));
}

function renderBody({ report, rows, signature, context, checkedAt, validation }) {
  const payload = record(report) ?? {};
  const productionSha = /^[0-9a-f]{40}$/.test(String(payload.productionCommitSha ?? ""))
    ? String(payload.productionCommitSha)
    : "UNKNOWN";
  const workflowSha = /^[0-9a-f]{40}$/.test(String(context.workflowSha ?? ""))
    ? String(context.workflowSha)
    : "UNKNOWN";
  const actionable = rows.filter((row) => row.actionRequired);
  const nonActionable = rows.filter((row) => !row.actionRequired);
  const diagnosticOnly = nonActionable.filter((row) => !(
    row.currentEvidence.verifierStatus === "HEALTHY"
    && row.currentEvidence.verificationSource === "DIRECT"
  ));
  const diagnosticCounts = diagnosticSummary(diagnosticOnly);
  const lines = [
    "# Production affiliate route health",
    "",
    "This issue contains only routes for which the Production monitor reports `actionRequired=true`. MarketActivation remains the sole route authority; monitoring does not change route or commercial data.",
    "",
    `- Check time: \`${code(checkedAt)}\``,
    `- Production SHA: \`${productionSha}\``,
    `- Workflow source SHA: \`${workflowSha}\``,
    `- Workflow run ID: \`${code(context.runId)}\` (${workflowLink(context)})`,
    `- Endpoint HTTP status: \`${code(context.httpStatus)}\``,
    `- Report contract: \`${code(payload.authorityVersion)}\``,
    `- Report validity: \`${validation.valid ? "VALID" : validation.reason}\``,
    `- Routes: \`total=${rows.length}\`, \`actionRequired=${actionable.length}\`, \`noActionRequired=${nonActionable.length}\``,
    "- Direct-success freshness threshold: `7 days`",
    "",
    "## Actionable routes",
    "",
  ];
  if (actionable.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push(
      "| Casino × GEO | Route | Why action is required | Current diagnostic evidence | Last direct success | Age / freshness | Evidence revision |",
      "|---|---|---|---|---|---|---|",
      ...actionable.map((row) => `| ${markdown(row.casinoSlug)} × ${markdown(row.marketCode)} | ${routeLabel(row)} | ${markdown(row.actionReason)} | ${markdown(diagnosticEvidence(row))} | ${markdown(row.lastDirectSuccessAt ?? "not recorded")} | ${markdown(row.freshness)} | ${markdown(row.evidenceRevision)} |`),
      "",
    );
  }
  if (diagnosticCounts.length > 0) {
    lines.push(
      "## Compact non-actionable diagnostic summary",
      "",
      "These observations do not keep the issue open because each route reports `actionRequired=false`.",
      "",
      "| Verifier fact | Diagnostic reason | Route count |",
      "|---|---|---|",
      ...diagnosticCounts.map((item) => `| ${markdown(item.verifierStatus)} | ${markdown(item.reason)} | ${item.count} |`),
      "",
    );
  }
  lines.push(
    "Verifier result codes and evidence details are diagnostic facts only. The Issue lifecycle consumes only each route's `actionRequired` boolean.",
    "",
    "Runbook: `docs/06_Operations/Affiliate-Route-Health-Runbook.md`",
    "",
    `<!-- ${ALERT_SIGNATURE_MARKER}: ${signature} -->`,
    "",
  );
  return lines.join("\n");
}

function renderActionChangeComment(rows, signature, context, checkedAt) {
  const actionable = rows.filter((row) => row.actionRequired);
  return [
    "The actionable route set or an actionable reason changed.",
    "",
    `- Check time: \`${code(checkedAt)}\``,
    `- Workflow run ID: \`${code(context.runId)}\` (${workflowLink(context)})`,
    `- Routes requiring action: \`${actionable.length}\``,
    `- Action signature: \`${signature}\``,
    "",
  ].join("\n");
}

function renderRecoveryComment(rows, context, reportCheckedAt) {
  const payload = record(context.report) ?? {};
  const productionSha = /^[0-9a-f]{40}$/.test(String(payload.productionCommitSha ?? ""))
    ? String(payload.productionCommitSha)
    : "UNKNOWN";
  return [
    "The current Production report contains zero routes with `actionRequired=true`. The monitor is closing this issue automatically.",
    "",
    `- Routes checked: \`${rows.length}\``,
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
  const rows = validation.valid
    ? payload.results.map((result) => normalizedResult(result, checkedAt))
    : [];
  const actionRequired = validation.valid ? rows.some((row) => row.actionRequired) : null;
  const action = validation.valid ? issueLifecycleAction(issueOpen, actionRequired) : "none";
  const signature = actionSignature(rows);
  const previousSignature = extractActionSignature(existingBody);
  const notify = action === "update" && previousSignature !== signature;
  const body = renderBody({ report, rows, signature, context, checkedAt, validation });
  const comment = action === "close"
    ? renderRecoveryComment(rows, { ...context, report }, checkedAt)
    : renderActionChangeComment(rows, signature, context, checkedAt);

  return {
    action,
    actionRequired,
    notify,
    reportValid: validation.valid,
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
    actionRequired: result.actionRequired,
    notify: result.notify,
    reportValid: result.reportValid,
    bodyChanged: result.bodyChanged,
    signature: result.signature,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
