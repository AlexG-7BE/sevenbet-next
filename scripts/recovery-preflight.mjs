import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const EXPECTED_PREVIEW_RESOURCE_ID = "store_hLPkkgamL7rJNmCe";
export const EXPECTED_PRODUCTION_RESOURCE_ID = "store_1I4F54ETrwSKS42o";
export const EXPECTED_PRISMA_WORKSPACE_ID = "cmrixpep23o54wfdvy6ikjzc1";
export const EXPECTED_PRISMA_PROJECT_ID = "cmrixqbwl21xsyif8kj8xl01s";
export const EXPECTED_PREVIEW_DATABASE_ID = "cn8xojfxs6i5z82riihkfjfy";
export const EXPECTED_PRODUCTION_DATABASE_ID = "cmrixqbwl21xqyif8ab2vr2xw";
export const RECOVERY_DRILL_ACKNOWLEDGEMENT =
  "RECOVERY_DRILL_ACKNOWLEDGED_PREVIEW_TO_ISOLATED_TEMP";
export const RECOVERY_CANARY_ACKNOWLEDGEMENT =
  "RECOVERY_CANARY_ACKNOWLEDGED_PREVIEW_ONLY";
export const RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT =
  "RECOVERY_MANAGED_RESTORE_ACKNOWLEDGED_PREVIEW_TO_EXACT_TEMP";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const RECOVERY_DATABASE_PATTERN = /^sevenbet_recovery_[a-z0-9_]{6,80}$/;
const PRISMA_DATABASE_ID_PATTERN = /^[a-z0-9]{20,40}$/;

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

export function assertManagedRecoveryPreflight(input) {
  assertNotProductionRuntime(input.runtimeEnvironment);
  assertResourceIds(input.previewResourceId, input.productionResourceId);
  if (input.acknowledgement !== RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT) {
    deny("RECOVERY_MANAGED_ACKNOWLEDGEMENT_MISSING");
  }
  if (input.workspaceId !== EXPECTED_PRISMA_WORKSPACE_ID) {
    deny("PRISMA_WORKSPACE_ID_UNKNOWN");
  }
  if (input.projectId !== EXPECTED_PRISMA_PROJECT_ID) {
    deny("PRISMA_PROJECT_ID_UNKNOWN");
  }
  if (input.sourceDatabaseId !== EXPECTED_PREVIEW_DATABASE_ID) {
    deny("MANAGED_SOURCE_DATABASE_ID_UNKNOWN");
  }
  if (input.productionDatabaseId !== EXPECTED_PRODUCTION_DATABASE_ID) {
    deny("MANAGED_PRODUCTION_DATABASE_ID_UNKNOWN");
  }
  if (
    !configured(input.targetDatabaseId) ||
    !PRISMA_DATABASE_ID_PATTERN.test(input.targetDatabaseId) ||
    input.targetDatabaseId === EXPECTED_PREVIEW_DATABASE_ID ||
    input.targetDatabaseId === EXPECTED_PRODUCTION_DATABASE_ID
  ) {
    deny("MANAGED_TARGET_DATABASE_ID_UNKNOWN");
  }
  if (input.targetDatabaseId !== input.expectedTargetDatabaseId) {
    deny("MANAGED_TARGET_DATABASE_ID_MISMATCH");
  }
  if (input.targetProvider !== "PRISMA_POSTGRES") {
    deny("MANAGED_TARGET_PROVIDER_UNKNOWN");
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
    target.isLoopback ||
    target.hostname !== "db.prisma.io"
  ) {
    deny("MANAGED_TARGET_IDENTITY_UNKNOWN");
  }

  return Object.freeze({
    source,
    target,
    preview,
    production,
    sourceClass,
    targetClass: "RECOVERY_TEMP",
    sourceDatabaseId: input.sourceDatabaseId,
    targetDatabaseId: input.targetDatabaseId,
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

export function safeManagedPreflightReport(result) {
  return [
    safePreflightReport(result),
    `PRISMA_WORKSPACE_ID=${EXPECTED_PRISMA_WORKSPACE_ID}`,
    `PRISMA_PROJECT_ID=${EXPECTED_PRISMA_PROJECT_ID}`,
    `SOURCE_DATABASE_ID=${result.sourceDatabaseId}`,
    `TARGET_DATABASE_ID=${result.targetDatabaseId}`,
    "TARGET_PROVIDER=PRISMA_POSTGRES",
    "MANAGED_TARGET_AUTHORITY=EXACT",
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

function managedInputFromEnvironment(environment) {
  return {
    sourceUrl: environment.RECOVERY_SOURCE_URL,
    targetUrl: environment.RECOVERY_TARGET_URL,
    previewReferenceUrl: environment.RECOVERY_PREVIEW_REFERENCE_URL,
    productionReferenceUrl: environment.RECOVERY_PRODUCTION_REFERENCE_URL,
    previewResourceId: environment.RECOVERY_PREVIEW_RESOURCE_ID,
    productionResourceId: environment.RECOVERY_PRODUCTION_RESOURCE_ID,
    workspaceId: environment.RECOVERY_PRISMA_WORKSPACE_ID,
    projectId: environment.RECOVERY_PRISMA_PROJECT_ID,
    sourceDatabaseId: environment.RECOVERY_SOURCE_DATABASE_ID,
    productionDatabaseId: environment.RECOVERY_PRODUCTION_DATABASE_ID,
    targetDatabaseId: environment.RECOVERY_TARGET_DATABASE_ID,
    expectedTargetDatabaseId: environment.RECOVERY_EXPECTED_TARGET_DATABASE_ID,
    targetProvider: environment.RECOVERY_TARGET_PROVIDER,
    acknowledgement: environment.RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT,
    targetLabel: environment.RECOVERY_TARGET_LABEL,
    runtimeEnvironment: environment.VERCEL_ENV ?? environment.RECOVERY_RUNTIME_ENVIRONMENT,
  };
}

function isDirectExecution() {
  return configured(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  try {
    if (process.env.RECOVERY_TARGET_MODE === "MANAGED_PROVIDER") {
      console.log(
        safeManagedPreflightReport(
          assertManagedRecoveryPreflight(managedInputFromEnvironment(process.env)),
        ),
      );
    } else {
      console.log(safePreflightReport(assertRecoveryPreflight(inputFromEnvironment(process.env))));
    }
  } catch (error) {
    const code = error instanceof RecoveryGuardError ? error.code : "RECOVERY_PREFLIGHT_FAILED";
    console.error(`RESULT=DENY\nREASON=${code}`);
    process.exitCode = 1;
  }
}
