import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const EXPECTED_PREVIEW_RESOURCE_ID = "store_hLPkkgamL7rJNmCe";
export const EXPECTED_PRODUCTION_RESOURCE_ID = "store_1I4F54ETrwSKS42o";
export const RECOVERY_DRILL_ACKNOWLEDGEMENT =
  "RECOVERY_DRILL_ACKNOWLEDGED_PREVIEW_TO_ISOLATED_TEMP";
export const RECOVERY_CANARY_ACKNOWLEDGEMENT =
  "RECOVERY_CANARY_ACKNOWLEDGED_PREVIEW_ONLY";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const RECOVERY_DATABASE_PATTERN = /^sevenbet_recovery_[a-z0-9_]{6,80}$/;

export class RecoveryGuardError extends Error {
  constructor(code) {
    super(code);
    this.name = "RecoveryGuardError";
    this.code = code;
  }
}

function deny(code) {
  throw new RecoveryGuardError(code);
}

function configured(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalHost(hostname) {
  const normalized = hostname.toLowerCase();
  return normalized === "pooled.db.prisma.io" ? "db.prisma.io" : normalized;
}

export function parseConnectionIdentity(value) {
  if (!configured(value)) deny("CONNECTION_IDENTITY_MISSING");

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    deny("CONNECTION_IDENTITY_MALFORMED");
  }

  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) {
    deny("CONNECTION_IDENTITY_MALFORMED");
  }
  if (!parsed.hostname || !parsed.username || parsed.hash) {
    deny("CONNECTION_IDENTITY_MALFORMED");
  }

  let username;
  let database;
  try {
    username = decodeURIComponent(parsed.username);
    database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "postgres";
  } catch {
    deny("CONNECTION_IDENTITY_MALFORMED");
  }
  if (!username || !database || database.includes("/")) {
    deny("CONNECTION_IDENTITY_MALFORMED");
  }

  const hostname = canonicalHost(parsed.hostname);
  const port = parsed.port || "5432";
  const authority = [hostname, port, username, database].join("\u0000");
  const fingerprint = createHash("sha256").update(authority).digest("hex");

  return Object.freeze({
    fingerprint: `sha256:${fingerprint}`,
    hostname,
    database,
    isLoopback: LOOPBACK_HOSTS.has(hostname),
  });
}

function relation(left, right) {
  return left.fingerprint === right.fingerprint ? "MATCH" : "DIFFERENT";
}

function assertResourceIds(previewResourceId, productionResourceId) {
  if (previewResourceId !== EXPECTED_PREVIEW_RESOURCE_ID) {
    deny("PREVIEW_RESOURCE_ID_UNKNOWN");
  }
  if (productionResourceId !== EXPECTED_PRODUCTION_RESOURCE_ID) {
    deny("PRODUCTION_RESOURCE_ID_UNKNOWN");
  }
  if (previewResourceId === productionResourceId) {
    deny("RESOURCE_ID_RELATION_MATCH");
  }
}

function assertNotProductionRuntime(runtimeEnvironment) {
  if (runtimeEnvironment?.trim().toLowerCase() === "production") {
    deny("PRODUCTION_RUNTIME_DENIED");
  }
}

function classifyAgainstReferences(identity, preview, production) {
  const previewRelation = relation(identity, preview);
  const productionRelation = relation(identity, production);
  if (previewRelation === "MATCH" && productionRelation === "DIFFERENT") {
    return "PREVIEW";
  }
  if (productionRelation === "MATCH") return "PRODUCTION";
  return "UNKNOWN";
}

export function assertPreviewCanaryAuthority(input) {
  assertNotProductionRuntime(input.runtimeEnvironment);
  assertResourceIds(input.previewResourceId, input.productionResourceId);
  if (input.acknowledgement !== RECOVERY_CANARY_ACKNOWLEDGEMENT) {
    deny("RECOVERY_CANARY_ACKNOWLEDGEMENT_MISSING");
  }

  const source = parseConnectionIdentity(input.sourceUrl);
  const preview = parseConnectionIdentity(input.previewReferenceUrl);
  const production = parseConnectionIdentity(input.productionReferenceUrl);
  if (relation(preview, production) !== "DIFFERENT") {
    deny("PREVIEW_PRODUCTION_RELATION_MATCH");
  }

  const sourceClass = classifyAgainstReferences(source, preview, production);
  if (sourceClass === "PRODUCTION") deny("PRODUCTION_SOURCE_DENIED");
  if (sourceClass !== "PREVIEW") deny("SOURCE_IDENTITY_UNKNOWN");

  return Object.freeze({ source, preview, production, sourceClass });
}

export function assertRecoveryPreflight(input) {
  assertNotProductionRuntime(input.runtimeEnvironment);
  assertResourceIds(input.previewResourceId, input.productionResourceId);
  if (input.acknowledgement !== RECOVERY_DRILL_ACKNOWLEDGEMENT) {
    deny("RECOVERY_DRILL_ACKNOWLEDGEMENT_MISSING");
  }

  const source = parseConnectionIdentity(input.sourceUrl);
  const target = parseConnectionIdentity(input.targetUrl);
  const preview = parseConnectionIdentity(input.previewReferenceUrl);
  const production = parseConnectionIdentity(input.productionReferenceUrl);

  if (relation(preview, production) !== "DIFFERENT") {
    deny("PREVIEW_PRODUCTION_RELATION_MATCH");
  }

  const sourceClass = classifyAgainstReferences(source, preview, production);
  if (sourceClass === "PRODUCTION") deny("PRODUCTION_SOURCE_DENIED");
  if (sourceClass !== "PREVIEW") deny("SOURCE_IDENTITY_UNKNOWN");

  const targetClass = classifyAgainstReferences(target, preview, production);
  if (targetClass === "PRODUCTION") deny("PRODUCTION_TARGET_DENIED");
  if (targetClass === "PREVIEW" || relation(source, target) === "MATCH") {
    deny("SOURCE_TARGET_RELATION_MATCH");
  }
  if (
    input.targetLabel !== "RECOVERY_TEMP" ||
    !target.isLoopback ||
    !RECOVERY_DATABASE_PATTERN.test(target.database)
  ) {
    deny("TARGET_IDENTITY_UNKNOWN");
  }

  return Object.freeze({
    source,
    target,
    preview,
    production,
    sourceClass,
    targetClass: "RECOVERY_TEMP",
  });
}

export function safePreflightReport(result) {
  return [
    "PREVIEW_DATABASE_URL=CONFIGURED",
    "PRODUCTION_DATABASE_URL=CONFIGURED",
    "SOURCE_DATABASE_URL=CONFIGURED",
    "TARGET_DATABASE_URL=CONFIGURED",
    `PREVIEW_RESOURCE_ID=${EXPECTED_PREVIEW_RESOURCE_ID}`,
    `PRODUCTION_RESOURCE_ID=${EXPECTED_PRODUCTION_RESOURCE_ID}`,
    `PREVIEW_FINGERPRINT=${result.preview.fingerprint}`,
    `PRODUCTION_FINGERPRINT=${result.production.fingerprint}`,
    `SOURCE_FINGERPRINT=${result.source.fingerprint}`,
    `TARGET_FINGERPRINT=${result.target.fingerprint}`,
    `SOURCE_CLASS=${result.sourceClass}`,
    `TARGET_CLASS=${result.targetClass}`,
    "PREVIEW_PRODUCTION_RELATION=DIFFERENT",
    "SOURCE_TARGET_RELATION=DIFFERENT",
    "ACKNOWLEDGEMENT=CONFIGURED",
    "RESULT=PASS",
  ].join("\n");
}

function inputFromEnvironment(environment) {
  return {
    sourceUrl: environment.RECOVERY_SOURCE_URL,
    targetUrl: environment.RECOVERY_TARGET_URL,
    previewReferenceUrl: environment.RECOVERY_PREVIEW_REFERENCE_URL,
    productionReferenceUrl: environment.RECOVERY_PRODUCTION_REFERENCE_URL,
    previewResourceId: environment.RECOVERY_PREVIEW_RESOURCE_ID,
    productionResourceId: environment.RECOVERY_PRODUCTION_RESOURCE_ID,
    acknowledgement: environment.RECOVERY_DRILL_ACKNOWLEDGEMENT,
    targetLabel: environment.RECOVERY_TARGET_LABEL,
    runtimeEnvironment: environment.VERCEL_ENV ?? environment.RECOVERY_RUNTIME_ENVIRONMENT,
  };
}

function isDirectExecution() {
  return configured(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  try {
    console.log(safePreflightReport(assertRecoveryPreflight(inputFromEnvironment(process.env))));
  } catch (error) {
    const code = error instanceof RecoveryGuardError ? error.code : "RECOVERY_PREFLIGHT_FAILED";
    console.error(`RESULT=DENY\nREASON=${code}`);
    process.exitCode = 1;
  }
}
