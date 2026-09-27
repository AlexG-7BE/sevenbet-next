import "server-only";

import { resolveContactRuntimeConfig } from "@/lib/contact/runtime-config";
import { resolveLifecycleEmailRuntimeConfig } from "@/lib/email/runtime-config.server";
import { resolveProgramAiOpenAiConfig } from "@/lib/programme/program-ai/runtime-config";
import { opsHealthRepository, type OpsHealthDatabaseProbe } from "@/lib/repositories/ops-health.repository";

/**
 * Production operations health: the configuration and dependencies whose
 * failure the site otherwise hides behind a silent fallback. The report holds
 * only booleans and latencies — never a configured value, key or URL.
 */

export const OPS_HEALTH_AUTHORITY_VERSION = "ops-health.v1";
export const OPS_HEALTH_DATABASE_TIMEOUT_MS = 5_000;
export const OPS_HEALTH_DATABASE_RETRY_DELAY_MS = 750;
export const OPS_HEALTH_PROVIDER_TIMEOUT_MS = 5_000;

const OPENAI_MODELS_ENDPOINT = "https://api.openai.com/v1/models";

export type OpsHealthCheckName =
  | "database"
  | "betterAuthSecret"
  | "cronSecret"
  | "siteUrl"
  | "lifecycleEmail"
  | "contactEmail"
  | "programmeAi";

export type OpsHealthReport = {
  ok: boolean;
  authorityVersion: typeof OPS_HEALTH_AUTHORITY_VERSION;
  checkedAt: string;
  failing: OpsHealthCheckName[];
  checks: {
    database: { ok: boolean; latencyMs: number | null; attempts: number };
    betterAuthSecret: { ok: boolean; present: boolean };
    cronSecret: { ok: boolean; present: boolean };
    siteUrl: { ok: boolean; present: boolean };
    lifecycleEmail: { ok: boolean; enabled: boolean; configValid: boolean };
    contactEmail: { ok: boolean; enabled: boolean; configValid: boolean };
    programmeAi: {
      ok: boolean;
      enabled: boolean;
      configValid: boolean;
      /** true = key and pinned model accepted; false = rejected; null = not checked or inconclusive. */
      providerAccess: boolean | null;
      providerLatencyMs: number | null;
    };
  };
};

export type OpsHealthDependencies = {
  environment?: Record<string, string | undefined>;
  database?: OpsHealthDatabaseProbe;
  fetchImpl?: typeof fetch;
  now?: () => number;
  clock?: () => Date;
  sleep?: (milliseconds: number) => Promise<void>;
  databaseTimeoutMs?: number;
  providerTimeoutMs?: number;
};

function present(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("OPS_HEALTH_TIMEOUT")), milliseconds);
  });
  return Promise.race([operation, timeout]).finally(() => clearTimeout(timer));
}

async function checkDatabase(
  database: OpsHealthDatabaseProbe,
  now: () => number,
  sleep: (milliseconds: number) => Promise<void>,
  timeoutMs: number,
): Promise<OpsHealthReport["checks"]["database"]> {
  // One retry absorbs a single dropped pooled connection; a real outage fails both.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const startedAt = now();
    try {
      await withTimeout(database.ping(), timeoutMs);
      return { ok: true, latencyMs: Math.max(0, Math.round(now() - startedAt)), attempts: attempt };
    } catch {
      if (attempt === 1) await sleep(OPS_HEALTH_DATABASE_RETRY_DELAY_MS);
    }
  }
  return { ok: false, latencyMs: null, attempts: 2 };
}

function checkLifecycleEmail(environment: Record<string, string | undefined>) {
  // Mirrors the resolver's own gate: delivery exists only in Production with the exact kill switch on.
  const enabled = environment.VERCEL_ENV === "production" && environment.LIFECYCLE_EMAIL_DELIVERY_ENABLED === "true";
  const configValid = enabled ? resolveLifecycleEmailRuntimeConfig(environment) !== null : false;
  return { ok: !enabled || configValid, enabled, configValid };
}

function checkContactEmail(environment: Record<string, string | undefined>) {
  const enabled = environment.CONTACT_EMAIL_DELIVERY_ENABLED === "true";
  const configValid = enabled ? resolveContactRuntimeConfig(environment) !== null : false;
  return { ok: !enabled || configValid, enabled, configValid };
}

async function probeProviderAccess(
  apiKey: string,
  model: string,
  fetchImpl: typeof fetch,
  now: () => number,
  timeoutMs: number,
) {
  const startedAt = now();
  try {
    // Model retrieval is free: it proves the key is live and can use the pinned model without generating tokens.
    const response = await fetchImpl(`${OPENAI_MODELS_ENDPOINT}/${encodeURIComponent(model)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Math.max(0, Math.round(now() - startedAt));
    await response.body?.cancel().catch(() => undefined);
    if (response.ok) return { providerAccess: true, providerLatencyMs: latencyMs };
    // A rejected key or an inaccessible model is definitive; provider outages and rate limits are not ours to page on.
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      return { providerAccess: false, providerLatencyMs: latencyMs };
    }
    return { providerAccess: null, providerLatencyMs: latencyMs };
  } catch {
    return { providerAccess: null, providerLatencyMs: null };
  }
}

async function checkProgrammeAi(
  environment: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
  now: () => number,
  timeoutMs: number,
): Promise<OpsHealthReport["checks"]["programmeAi"]> {
  let config: ReturnType<typeof resolveProgramAiOpenAiConfig>;
  try {
    config = resolveProgramAiOpenAiConfig(environment);
  } catch {
    // The feature is switched on but the provider/model settings do not match the pinned contract.
    return { ok: false, enabled: true, configValid: false, providerAccess: null, providerLatencyMs: null };
  }
  if (!config) {
    return { ok: true, enabled: false, configValid: false, providerAccess: null, providerLatencyMs: null };
  }
  const provider = await probeProviderAccess(config.apiKey, config.programmeModel, fetchImpl, now, timeoutMs);
  return {
    ok: provider.providerAccess !== false,
    enabled: true,
    configValid: true,
    ...provider,
  };
}

export async function runOpsHealthChecks({
  environment = process.env,
  database = opsHealthRepository,
  fetchImpl = fetch,
  now = () => performance.now(),
  clock = () => new Date(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  databaseTimeoutMs = OPS_HEALTH_DATABASE_TIMEOUT_MS,
  providerTimeoutMs = OPS_HEALTH_PROVIDER_TIMEOUT_MS,
}: OpsHealthDependencies = {}): Promise<OpsHealthReport> {
  const [databaseCheck, programmeAi] = await Promise.all([
    checkDatabase(database, now, sleep, databaseTimeoutMs),
    checkProgrammeAi(environment, fetchImpl, now, providerTimeoutMs),
  ]);
  const betterAuthPresent = present(environment.BETTER_AUTH_SECRET);
  const cronPresent = present(environment.CRON_SECRET);
  const sitePresent = present(environment.NEXT_PUBLIC_SITE_URL);
  const checks: OpsHealthReport["checks"] = {
    database: databaseCheck,
    betterAuthSecret: { ok: betterAuthPresent, present: betterAuthPresent },
    cronSecret: { ok: cronPresent, present: cronPresent },
    siteUrl: { ok: sitePresent, present: sitePresent },
    lifecycleEmail: checkLifecycleEmail(environment),
    contactEmail: checkContactEmail(environment),
    programmeAi,
  };
  const failing = (Object.keys(checks) as OpsHealthCheckName[]).filter((name) => !checks[name].ok);
  return {
    ok: failing.length === 0,
    authorityVersion: OPS_HEALTH_AUTHORITY_VERSION,
    checkedAt: clock().toISOString(),
    failing,
    checks,
  };
}
