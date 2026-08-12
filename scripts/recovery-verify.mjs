import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaClient } from "@prisma/client";

import { ProgrammeSessionRepository } from "../lib/programme/infrastructure/repositories/programme-session.repository.ts";
import { readCanaryManifest } from "./recovery-canary.mjs";
import {
  EXPECTED_PREVIEW_DATABASE_ID,
  EXPECTED_PREVIEW_RESOURCE_ID,
  EXPECTED_PRISMA_PROJECT_ID,
  EXPECTED_PRISMA_WORKSPACE_ID,
  EXPECTED_PRODUCTION_DATABASE_ID,
  EXPECTED_PRODUCTION_RESOURCE_ID,
  RECOVERY_DRILL_ACKNOWLEDGEMENT,
  RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT,
  RecoveryGuardError,
  assertManagedRecoveryPreflight,
  assertRecoveryPreflight,
} from "./recovery-preflight.mjs";

const SNAPSHOT_VERSION = 1;
const EXPECTED_AUTH_TABLES = ["Account", "Session", "User", "Verification"];
const EXPECTED_PROGRAMME_TABLES = [
  "AnonymousProgrammeSession",
  "PendingProgrammeClaim",
  "Program",
  "ProgramEnrollment",
  "ProgrammeMissionProgress",
  "ProgramStep",
  "ProgramVersion",
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new RecoveryGuardError(`${name}_MISSING`);
  return value;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function writeExclusiveJson(path, value) {
  const descriptor = openSync(
    path,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    0o600,
  );
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  } finally {
    closeSync(descriptor);
  }
}

function repositoryMigrationNames(repositoryRoot) {
  const migrationsRoot = join(repositoryRoot, "prisma", "migrations");
  return readdirSync(migrationsRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(migrationsRoot, entry.name, "migration.sql")),
    )
    .map((entry) => entry.name)
    .sort();
}

function numberFromCountRow(row) {
  const value = row?.count;
  const count = typeof value === "bigint" ? Number(value) : Number.parseInt(String(value), 10);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RecoveryGuardError("RECOVERY_COUNT_INVALID");
  }
  return count;
}

async function tableCount(database, tableName) {
  const allowed = new Set([
    "Account",
    "AnonymousProgrammeSession",
    "PendingProgrammeClaim",
    "Program",
    "ProgramEnrollment",
    "ProgrammeMissionProgress",
    "ProgramStep",
    "ProgramVersion",
    "Session",
    "User",
    "Verification",
    "_prisma_migrations",
  ]);
  if (!allowed.has(tableName)) {
    throw new RecoveryGuardError("RECOVERY_TABLE_NOT_ALLOWED");
  }
  const rows = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count FROM "${tableName}"`,
  );
  return numberFromCountRow(rows[0]);
}

async function selectedCounts(database) {
  const tableNames = [
    "_prisma_migrations",
    ...EXPECTED_AUTH_TABLES,
    ...EXPECTED_PROGRAMME_TABLES,
  ];
  return Object.fromEntries(
    await Promise.all(
      tableNames.map(async (tableName) => [tableName, await tableCount(database, tableName)]),
    ),
  );
}

async function appliedMigrationNames(database) {
  const rows = await database.$queryRawUnsafe(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name',
  );
  return rows.map((row) => row.migration_name);
}

async function publicSchemaFingerprint(database) {
  const rows = await database.$queryRawUnsafe(
    `SELECT table_name, column_name, ordinal_position, data_type, udt_name,
            is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`,
  );
  return `sha256:${digest(JSON.stringify(rows))}`;
}

async function publicTableNames(database) {
  const rows = await database.$queryRawUnsafe(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
  );
  return rows.map((row) => row.table_name);
}

async function canaryEvidence(database, canary) {
  const root = await database.anonymousProgrammeSession.findFirst({
    where: { id: canary.rootId, tokenHash: canary.rootTokenHash },
    select: {
      id: true,
      tokenHash: true,
      missionVersion: true,
      evidenceVersion: true,
      pendingClaim: {
        select: {
          id: true,
          anonymousSessionId: true,
          tokenHash: true,
        },
      },
    },
  });
  if (
    !root ||
    root.missionVersion !== canary.missionVersion ||
    root.evidenceVersion !== canary.evidenceVersion ||
    root.pendingClaim?.id !== canary.claimId ||
    root.pendingClaim.anonymousSessionId !== canary.rootId ||
    root.pendingClaim.tokenHash !== canary.claimTokenHash
  ) {
    throw new RecoveryGuardError("RECOVERY_CANARY_PARITY_FAILED");
  }

  const orphanRows = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count
       FROM "PendingProgrammeClaim" claim
       LEFT JOIN "AnonymousProgrammeSession" root
         ON root.id = claim."anonymousSessionId"
      WHERE root.id IS NULL`,
  );
  const orphanCount = numberFromCountRow(orphanRows[0]);
  if (orphanCount !== 0) {
    throw new RecoveryGuardError("RECOVERY_FOREIGN_KEY_INTEGRITY_FAILED");
  }

  return {
    rootId: root.id,
    relationHash: digest(
      `${root.id}:${root.tokenHash}:${root.pendingClaim.id}:${root.pendingClaim.tokenHash}`,
    ),
    orphanCount,
  };
}

async function orphanCount(database) {
  const orphanRows = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count
       FROM "PendingProgrammeClaim" claim
       LEFT JOIN "AnonymousProgrammeSession" root
         ON root.id = claim."anonymousSessionId"
      WHERE root.id IS NULL`,
  );
  return numberFromCountRow(orphanRows[0]);
}

async function unvalidatedForeignKeyCount(database) {
  const rows = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count
       FROM pg_constraint
      WHERE contype = 'f'
        AND NOT convalidated`,
  );
  return numberFromCountRow(rows[0]);
}

function assertStructuralTables(tables) {
  for (const tableName of [...EXPECTED_AUTH_TABLES, ...EXPECTED_PROGRAMME_TABLES]) {
    if (!tables.includes(tableName)) {
      throw new RecoveryGuardError("RECOVERY_STRUCTURAL_TABLE_MISSING");
    }
  }
}

function assertProviderFlagsDisabled() {
  for (const name of [
    "PROGRAM_AI_V1_ENABLED",
    "PROGRAM_AI_REAL_PROVIDER_ENABLED",
    "AFFILIATE_REDIRECT_ENGINE_ENABLED",
  ]) {
    if (process.env[name]?.trim() === "true") {
      throw new RecoveryGuardError("EXTERNAL_PROVIDER_FLAG_ENABLED");
    }
  }
}

function assertExactSet(actual, expected, code) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new RecoveryGuardError(code);
  }
}

function readSnapshot(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (
    value?.version !== SNAPSHOT_VERSION ||
    typeof value.schemaFingerprint !== "string" ||
    !Array.isArray(value.repositoryMigrations) ||
    !Array.isArray(value.appliedMigrations) ||
    typeof value.counts !== "object" ||
    typeof value.canary?.rootId !== "string" ||
    typeof value.canary?.relationHash !== "string"
  ) {
    throw new RecoveryGuardError("RECOVERY_SNAPSHOT_MANIFEST_INVALID");
  }
  return Object.freeze(value);
}

function preflightFromEnvironment() {
  return assertRecoveryPreflight({
    sourceUrl: required("RECOVERY_SOURCE_URL"),
    targetUrl: required("RECOVERY_TARGET_URL"),
    previewReferenceUrl: required("RECOVERY_PREVIEW_REFERENCE_URL"),
    productionReferenceUrl: required("RECOVERY_PRODUCTION_REFERENCE_URL"),
    previewResourceId: required("RECOVERY_PREVIEW_RESOURCE_ID"),
    productionResourceId: required("RECOVERY_PRODUCTION_RESOURCE_ID"),
    acknowledgement: required("RECOVERY_DRILL_ACKNOWLEDGEMENT"),
    targetLabel: required("RECOVERY_TARGET_LABEL"),
    runtimeEnvironment:
      process.env.VERCEL_ENV ?? process.env.RECOVERY_RUNTIME_ENVIRONMENT,
  });
}

function managedPreflightFromEnvironment() {
  return assertManagedRecoveryPreflight({
    sourceUrl: required("RECOVERY_SOURCE_URL"),
    targetUrl: required("RECOVERY_TARGET_URL"),
    previewReferenceUrl: required("RECOVERY_PREVIEW_REFERENCE_URL"),
    productionReferenceUrl: required("RECOVERY_PRODUCTION_REFERENCE_URL"),
    previewResourceId: required("RECOVERY_PREVIEW_RESOURCE_ID"),
    productionResourceId: required("RECOVERY_PRODUCTION_RESOURCE_ID"),
    workspaceId: required("RECOVERY_PRISMA_WORKSPACE_ID"),
    projectId: required("RECOVERY_PRISMA_PROJECT_ID"),
    sourceDatabaseId: required("RECOVERY_SOURCE_DATABASE_ID"),
    productionDatabaseId: required("RECOVERY_PRODUCTION_DATABASE_ID"),
    targetDatabaseId: required("RECOVERY_TARGET_DATABASE_ID"),
    expectedTargetDatabaseId: required("RECOVERY_EXPECTED_TARGET_DATABASE_ID"),
    targetProvider: required("RECOVERY_TARGET_PROVIDER"),
    acknowledgement: required("RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT"),
    targetLabel: required("RECOVERY_TARGET_LABEL"),
    runtimeEnvironment:
      process.env.VERCEL_ENV ?? process.env.RECOVERY_RUNTIME_ENVIRONMENT,
  });
}

async function captureSourceEvidence() {
  preflightFromEnvironment();
  assertProviderFlagsDisabled();
  const repositoryRoot = resolve(process.env.RECOVERY_REPOSITORY_ROOT ?? process.cwd());
  const canary = readCanaryManifest(required("RECOVERY_CANARY_MANIFEST_PATH"));
  const outputPath = required("RECOVERY_SNAPSHOT_MANIFEST_PATH");
  const source = new PrismaClient({
    datasourceUrl: required("RECOVERY_SOURCE_URL"),
    log: ["error"],
  });
  try {
    await source.$queryRawUnsafe("SELECT 1");
    const repositoryMigrations = repositoryMigrationNames(repositoryRoot);
    const appliedMigrations = await appliedMigrationNames(source);
    assertExactSet(appliedMigrations, repositoryMigrations, "RECOVERY_MIGRATION_PARITY_FAILED");
    const [counts, schemaFingerprint, tables, canaryResult] = await Promise.all([
      selectedCounts(source),
      publicSchemaFingerprint(source),
      publicTableNames(source),
      canaryEvidence(source, canary),
    ]);
    assertStructuralTables(tables);

    writeExclusiveJson(outputPath, {
      version: SNAPSHOT_VERSION,
      capturedAt: new Date().toISOString(),
      repositoryMigrations,
      appliedMigrations,
      counts,
      schemaFingerprint,
      canary: canaryResult,
    });
    console.log(`MIGRATION_COUNT=${repositoryMigrations.length}`);
    console.log(`SCHEMA_FINGERPRINT=${schemaFingerprint}`);
    console.log("SOURCE_EVIDENCE_CAPTURE=PASS");
  } finally {
    await source.$disconnect();
  }
}

export async function verifyRestoredTarget() {
  preflightFromEnvironment();
  assertProviderFlagsDisabled();
  const snapshot = readSnapshot(required("RECOVERY_SNAPSHOT_MANIFEST_PATH"));
  const canary = readCanaryManifest(required("RECOVERY_CANARY_MANIFEST_PATH"));
  const target = new PrismaClient({
    datasourceUrl: required("RECOVERY_TARGET_URL"),
    log: ["error"],
  });
  try {
    await target.$queryRawUnsafe("SELECT 1");
    const [appliedMigrations, counts, schemaFingerprint, tables, canaryResult] =
      await Promise.all([
        appliedMigrationNames(target),
        selectedCounts(target),
        publicSchemaFingerprint(target),
        publicTableNames(target),
        canaryEvidence(target, canary),
      ]);

    assertExactSet(
      appliedMigrations,
      snapshot.repositoryMigrations,
      "RECOVERY_MIGRATION_PARITY_FAILED",
    );
    if (JSON.stringify(counts) !== JSON.stringify(snapshot.counts)) {
      throw new RecoveryGuardError("RECOVERY_TABLE_COUNT_PARITY_FAILED");
    }
    if (schemaFingerprint !== snapshot.schemaFingerprint) {
      throw new RecoveryGuardError("RECOVERY_SCHEMA_DRIFT_DETECTED");
    }
    if (
      canaryResult.rootId !== snapshot.canary.rootId ||
      canaryResult.relationHash !== snapshot.canary.relationHash
    ) {
      throw new RecoveryGuardError("RECOVERY_CANARY_PARITY_FAILED");
    }
    assertStructuralTables(tables);

    const repository = new ProgrammeSessionRepository(target);
    const applicationRead = await repository.findAnonymousSession(canary.rootTokenHash);
    if (
      applicationRead?.id !== canary.rootId ||
      applicationRead.pendingClaim?.id !== canary.claimId
    ) {
      throw new RecoveryGuardError("RECOVERY_APPLICATION_READ_FAILED");
    }

    console.log(`MIGRATION_COUNT=${appliedMigrations.length}`);
    console.log(`SELECTED_TABLE_COUNT=${Object.keys(counts).length}`);
    console.log(`SCHEMA_FINGERPRINT=${schemaFingerprint}`);
    console.log("CONNECTIVITY=PASS");
    console.log("MIGRATION_HISTORY_PARITY=PASS");
    console.log("SELECTED_TABLE_COUNT_PARITY=PASS");
    console.log("CANARY_PARITY=PASS");
    console.log("FOREIGN_KEY_INTEGRITY=PASS");
    console.log("AUTH_SESSION_STRUCTURE=PASS");
    console.log("PROGRAMME_STRUCTURE=PASS");
    console.log("APPLICATION_REPOSITORY_READ=PASS");
    console.log("SCHEMA_DRIFT=ABSENT");
    console.log("EXTERNAL_PROVIDER_CALLS=ABSENT");
    console.log("RESTORE_VERIFICATION=PASS");
  } finally {
    await target.$disconnect();
  }
}

export async function verifyManagedRestoredTarget() {
  managedPreflightFromEnvironment();
  assertProviderFlagsDisabled();
  const repositoryRoot = resolve(process.env.RECOVERY_REPOSITORY_ROOT ?? process.cwd());
  const repositoryMigrations = repositoryMigrationNames(repositoryRoot);
  const canary = readCanaryManifest(required("RECOVERY_CANARY_MANIFEST_PATH"));
  const snapshotAt = new Date(required("RECOVERY_SELECTED_SNAPSHOT_AT"));
  const canaryCreatedAt = new Date(canary.rootCreatedAt);
  if (Number.isNaN(snapshotAt.valueOf()) || Number.isNaN(canaryCreatedAt.valueOf())) {
    throw new RecoveryGuardError("RECOVERY_MANAGED_SNAPSHOT_CANARY_RELATION_INVALID");
  }
  const snapshotContainsCanary = snapshotAt >= canaryCreatedAt;

  const source = new PrismaClient({
    datasourceUrl: required("RECOVERY_SOURCE_URL"),
    log: ["error"],
  });
  const target = new PrismaClient({
    datasourceUrl: required("RECOVERY_TARGET_URL"),
    log: ["error"],
  });
  try {
    await Promise.all([source.$queryRawUnsafe("SELECT 1"), target.$queryRawUnsafe("SELECT 1")]);
    const [
      sourceMigrations,
      targetMigrations,
      sourceSchemaFingerprint,
      targetSchemaFingerprint,
      sourceCounts,
      targetCounts,
      targetTables,
      sourceCanary,
      targetCanary,
      targetOrphans,
      targetUnvalidatedForeignKeys,
      restoredPendingCanaryCount,
      restoredPendingClaimCount,
    ] = await Promise.all([
      appliedMigrationNames(source),
      appliedMigrationNames(target),
      publicSchemaFingerprint(source),
      publicSchemaFingerprint(target),
      selectedCounts(source),
      selectedCounts(target),
      publicTableNames(target),
      canaryEvidence(source, canary),
      snapshotContainsCanary ? canaryEvidence(target, canary) : Promise.resolve(null),
      orphanCount(target),
      unvalidatedForeignKeyCount(target),
      target.anonymousProgrammeSession.count({
        where: { OR: [{ id: canary.rootId }, { tokenHash: canary.rootTokenHash }] },
      }),
      target.pendingProgrammeClaim.count({
        where: { OR: [{ id: canary.claimId }, { tokenHash: canary.claimTokenHash }] },
      }),
    ]);

    assertExactSet(sourceMigrations, repositoryMigrations, "RECOVERY_MIGRATION_PARITY_FAILED");
    assertExactSet(targetMigrations, repositoryMigrations, "RECOVERY_MIGRATION_PARITY_FAILED");
    if (sourceSchemaFingerprint !== targetSchemaFingerprint) {
      throw new RecoveryGuardError("RECOVERY_SCHEMA_DRIFT_DETECTED");
    }
    assertStructuralTables(targetTables);
    if (
      sourceCanary.orphanCount !== 0 ||
      targetOrphans !== 0 ||
      targetUnvalidatedForeignKeys !== 0
    ) {
      throw new RecoveryGuardError("RECOVERY_FOREIGN_KEY_INTEGRITY_FAILED");
    }
    if (!snapshotContainsCanary && restoredPendingCanaryCount !== 0) {
      throw new RecoveryGuardError("RECOVERY_MANAGED_CANARY_TIMING_FAILED");
    }
    if (
      snapshotContainsCanary &&
      (restoredPendingCanaryCount !== 1 ||
        restoredPendingClaimCount !== 1 ||
        targetCanary?.rootId !== sourceCanary.rootId ||
        targetCanary?.relationHash !== sourceCanary.relationHash)
    ) {
      throw new RecoveryGuardError("RECOVERY_CANARY_PARITY_FAILED");
    }
    if (
      snapshotContainsCanary &&
      JSON.stringify(sourceCounts) !== JSON.stringify(targetCounts)
    ) {
      throw new RecoveryGuardError("RECOVERY_TABLE_COUNT_PARITY_FAILED");
    }

    const repository = new ProgrammeSessionRepository(target);
    const representativeRead = await repository.findAnonymousSession(
      snapshotContainsCanary
        ? canary.rootTokenHash
        : digest("recovery-managed-representative-absent:v1"),
    );
    if (
      snapshotContainsCanary
        ? representativeRead?.id !== canary.rootId ||
          representativeRead.pendingClaim?.id !== canary.claimId
        : representativeRead !== null
    ) {
      throw new RecoveryGuardError("RECOVERY_APPLICATION_READ_FAILED");
    }

    console.log(`MIGRATION_COUNT=${targetMigrations.length}`);
    console.log(`SELECTED_TABLE_COUNT=${Object.keys(targetCounts).length}`);
    console.log(`SOURCE_SELECTED_TABLE_COUNT=${Object.keys(sourceCounts).length}`);
    console.log(`SCHEMA_FINGERPRINT=${targetSchemaFingerprint}`);
    console.log("CONNECTIVITY=PASS");
    console.log("MIGRATION_HISTORY_PARITY=PASS");
    console.log("SCHEMA_PARITY=PASS");
    console.log(
      snapshotContainsCanary
        ? "SELECTED_TABLE_COUNT_PARITY=PASS"
        : "SELECTED_TABLE_COUNT_PARITY=NOT_APPLICABLE_POINT_IN_TIME_GAP",
    );
    console.log(
      snapshotContainsCanary
        ? "MANAGED_CANARY_PARITY=PASS"
        : "MANAGED_CANARY_PARITY=NOT_APPLICABLE_SNAPSHOT_PREDATES_CANARY",
    );
    console.log(
      snapshotContainsCanary
        ? "PENDING_MANAGED_SNAPSHOT_CANARY=CLOSED"
        : "PENDING_MANAGED_SNAPSHOT_CANARY=PASS",
    );
    console.log("FOREIGN_KEY_INTEGRITY=PASS");
    console.log("AUTH_SESSION_STRUCTURE=PASS");
    console.log("PROGRAMME_STRUCTURE=PASS");
    console.log("PROGRAMME_REPOSITORY_READ=PASS");
    console.log("OPENAI_CALLS=ABSENT");
    console.log("GOOGLE_CALLS=ABSENT");
    console.log("EMAIL_CALLS=ABSENT");
    console.log("AFFILIATE_CALLS=ABSENT");
    console.log("EXTERNAL_PROVIDER_CALLS=ABSENT");
    console.log("MANAGED_RESTORE_VERIFICATION=PASS");
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

export async function runVerificationCommand(command) {
  if (command === "capture") return captureSourceEvidence();
  if (command === "verify") return verifyRestoredTarget();
  if (command === "verify-managed") return verifyManagedRestoredTarget();
  throw new RecoveryGuardError("RECOVERY_VERIFY_COMMAND_UNKNOWN");
}

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  runVerificationCommand(process.argv[2]).catch((error) => {
    const code = error instanceof RecoveryGuardError ? error.code : "RECOVERY_VERIFY_FAILED";
    console.error(`RESULT=DENY\nREASON=${code}`);
    process.exitCode = 1;
  });
}

export {
  EXPECTED_AUTH_TABLES,
  EXPECTED_PREVIEW_DATABASE_ID,
  EXPECTED_PREVIEW_RESOURCE_ID,
  EXPECTED_PRISMA_PROJECT_ID,
  EXPECTED_PRISMA_WORKSPACE_ID,
  EXPECTED_PRODUCTION_DATABASE_ID,
  EXPECTED_PRODUCTION_RESOURCE_ID,
  EXPECTED_PROGRAMME_TABLES,
  RECOVERY_DRILL_ACKNOWLEDGEMENT,
  RECOVERY_MANAGED_RESTORE_ACKNOWLEDGEMENT,
  repositoryMigrationNames,
};
