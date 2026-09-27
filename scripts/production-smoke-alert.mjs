// Turns one Production smoke report into the lifecycle of a single GitHub issue:
// open on the first failure, keep one issue while anything fails (comment only when the
// failing set changes), close with a comment once every check passes again.
// Same pattern as scripts/affiliate-route-health-alert.mjs; the workflow runs `gh`.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SMOKE_ALERT_TITLE = "[Production] Smoke alert";
const FAILING_MARKER = "production-smoke-failing";
const SIGNATURE_MARKER = "production-smoke-failing-signature";

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function cell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("`", "'").replace(/[\r\n]+/g, " ");
}

function safeId(value) {
  return typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value) ? value : "unidentified-check";
}

/** A missing or malformed report is itself an alert: the monitor must never fail silent. */
export function failingChecks(report) {
  const payload = record(report);
  if (!payload || payload.authorityVersion !== "production-smoke.v2" || !Array.isArray(payload.results)) {
    return [{
      id: "smoke-runner",
      path: "-",
      detail: "The smoke script crashed or wrote no report. Open the workflow run log.",
    }];
  }
  return payload.results
    .map((result) => record(result) ?? { ok: false, detail: "malformed check result" })
    .filter((result) => result.ok !== true)
    .map((result) => ({ id: safeId(result.id), path: typeof result.path === "string" ? result.path : "-", detail: result.detail ?? "failed" }));
}

export function failingSignature(ids) {
  return createHash("sha256").update(JSON.stringify([...new Set(ids)].sort())).digest("hex");
}

export function previousFailingIds(body) {
  const match = typeof body === "string" ? new RegExp(`<!-- ${FAILING_MARKER}: ([a-z0-9,-]*) -->`).exec(body) : null;
  return match ? match[1].split(",").filter(Boolean) : [];
}

export function previousSignature(body) {
  return typeof body === "string" ? new RegExp(`<!-- ${SIGNATURE_MARKER}: ([0-9a-f]{64}) -->`).exec(body)?.[1] ?? null : null;
}

export function issueLifecycleAction(issueOpen, failing) {
  if (failing) return issueOpen ? "update" : "open";
  return issueOpen ? "close" : "none";
}

function runLink(context) {
  return context.workflowUrl ? `[run ${cell(context.runId)}](${context.workflowUrl})` : `run ${cell(context.runId ?? "UNKNOWN")}`;
}

function productionSha(report) {
  const opsHealth = record(report)?.results?.find?.((result) => result?.id === "ops-health");
  const sha = opsHealth?.facts?.productionCommitSha;
  return typeof sha === "string" && /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function renderBody({ report, failing, signature, context }) {
  const payload = record(report) ?? {};
  const total = Array.isArray(payload.results) ? payload.results.length : 0;
  const ids = failing.map((item) => item.id);
  const sha = productionSha(report);
  return [
    "# Production smoke is failing",
    "",
    `Something on the path from a visitor to a partner casino, or a setting the site hides behind a silent fallback, is broken on ${typeof payload.baseUrl === "string" && /^https?:\/\/[\w.:-]+$/.test(payload.baseUrl) ? payload.baseUrl : "Production"}. This issue updates itself on every run and closes automatically when all checks pass again.`,
    "",
    `- Failing: **${failing.length}**${total ? ` of ${total} checks` : ""}`,
    `- Last checked: \`${cell(payload.checkedAt ?? context.checkedAt ?? "UNKNOWN")}\` (${runLink(context)})`,
    `- Production commit: \`${sha ?? "UNKNOWN"}\``,
    "",
    "| Check | Path | What is wrong |",
    "|---|---|---|",
    ...failing.map((item) => `| ${cell(item.id)} | \`${cell(item.path)}\` | ${cell(item.detail)} |`),
    "",
    "## What to do",
    "",
    "1. Open the run above: the step summary lists every check with its counts and timings.",
    "2. `HTTP 5xx`, timeouts, empty lists or a shrunken sitemap usually mean the database or a deployment: check Vercel → Deployments (roll back the last one if it just shipped) and Vercel runtime logs for `Can't reach database server`.",
    "3. An `ops-health` line names the setting at fault (never its value): fix it in Vercel → Settings → Environment Variables (Production), then redeploy.",
    "4. Re-run the `Production Smoke` workflow manually to confirm; this issue closes itself on a green run.",
    "",
    "Runbook: `docs/06_Operations/Monitoring-and-Incident-Response.md`",
    "",
    `<!-- ${FAILING_MARKER}: ${ids.join(",")} -->`,
    `<!-- ${SIGNATURE_MARKER}: ${signature} -->`,
    "",
  ].join("\n");
}

function renderChangeComment({ failing, previousIds, context }) {
  const current = failing.map((item) => item.id);
  const added = failing.filter((item) => !previousIds.includes(item.id));
  const recovered = previousIds.filter((id) => !current.includes(id));
  return [
    `The set of failing checks changed (${runLink(context)}). Now failing: **${current.length}**.`,
    "",
    ...(added.length ? ["Newly failing:", "", ...added.map((item) => `- \`${cell(item.id)}\` \`${cell(item.path)}\`: ${cell(item.detail)}`), ""] : []),
    ...(recovered.length ? [`Recovered: ${recovered.map((id) => `\`${cell(id)}\``).join(", ")}`, ""] : []),
  ].join("\n");
}

function renderRecoveryComment({ report, context }) {
  const payload = record(report) ?? {};
  const total = Array.isArray(payload.results) ? payload.results.length : 0;
  return [
    `All ${total} Production smoke checks pass again at \`${cell(payload.checkedAt ?? "UNKNOWN")}\` (${runLink(context)}). Closing automatically.`,
    "",
  ].join("\n");
}

export function evaluateSmokeAlert({ report, issueOpen = false, existingBody = "", context = {} }) {
  const failing = failingChecks(report);
  const action = issueLifecycleAction(issueOpen, failing.length > 0);
  const signature = failingSignature(failing.map((item) => item.id));
  const previousIds = previousFailingIds(existingBody);
  const notify = action === "update" && previousSignature(existingBody) !== signature;
  const body = renderBody({ report, failing, signature, context });
  const comment = action === "close"
    ? renderRecoveryComment({ report, context })
    : renderChangeComment({ failing, previousIds, context });
  return {
    action,
    failing,
    notify,
    signature,
    body,
    bodyChanged: existingBody.replaceAll("\r\n", "\n").trim() !== body.trim(),
    comment,
  };
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runCli() {
  let report = null;
  try {
    report = JSON.parse(readFileSync(resolve(argument("report") ?? "smoke-report.json"), "utf8"));
  } catch {
    report = null;
  }
  const existingPath = resolve(argument("existing-body") ?? "existing-issue.md");
  const runId = process.env.GITHUB_RUN_ID ?? "UNKNOWN";
  const result = evaluateSmokeAlert({
    report,
    issueOpen: argument("issue-open") === "true",
    existingBody: existsSync(existingPath) ? readFileSync(existingPath, "utf8") : "",
    context: {
      runId,
      checkedAt: new Date().toISOString(),
      workflowUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    },
  });
  writeFileSync(resolve(argument("body") ?? "smoke-alert.md"), result.body);
  writeFileSync(resolve(argument("comment") ?? "smoke-alert-comment.md"), result.comment);
  writeFileSync(resolve(argument("state") ?? "smoke-alert-state.json"), `${JSON.stringify({
    action: result.action,
    notify: result.notify,
    bodyChanged: result.bodyChanged,
    failing: result.failing.length,
    signature: result.signature,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
