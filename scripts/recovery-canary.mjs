import { createHash } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { pathToFileURL } from "node:url";

import { PrismaClient } from "@prisma/client";

import { ProgrammeSessionRepository } from "../lib/programme/infrastructure/repositories/programme-session.repository.ts";
import {
  EXPECTED_PREVIEW_RESOURCE_ID,
  EXPECTED_PRODUCTION_RESOURCE_ID,
  RECOVERY_CANARY_ACKNOWLEDGEMENT,
  RecoveryGuardError,
  assertPreviewCanaryAuthority,
} from "./recovery-preflight.mjs";

const DRILL_ID_PATTERN = /^recovery-drill-[0-9]{8}t[0-9]{6}z-[a-z0-9]{6,16}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const MISSION_VERSION = "recovery-drill:v1";
const EVIDENCE_VERSION = "recovery-structure:v1";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new RecoveryGuardError(`${name}_MISSING`);
  return value;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertCanaryAuthority() {
  return assertPreviewCanaryAuthority({
    sourceUrl: required("RECOVERY_SOURCE_URL"),
    previewReferenceUrl: required("RECOVERY_PREVIEW_REFERENCE_URL"),
    productionReferenceUrl: required("RECOVERY_PRODUCTION_REFERENCE_URL"),
    previewResourceId: required("RECOVERY_PREVIEW_RESOURCE_ID"),
    productionResourceId: required("RECOVERY_PRODUCTION_RESOURCE_ID"),
    acknowledgement: required("RECOVERY_CANARY_ACKNOWLEDGEMENT"),
    runtimeEnvironment:
      process.env.VERCEL_ENV ?? process.env.RECOVERY_RUNTIME_ENVIRONMENT,
  });
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

export function readCanaryManifest(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (
    value?.version !== 1 ||
    !DRILL_ID_PATTERN.test(value.drillId ?? "") ||
    !UUID_PATTERN.test(value.rootId ?? "") ||
    !HASH_PATTERN.test(value.rootTokenHash ?? "") ||
    !HASH_PATTERN.test(value.claimTokenHash ?? "") ||
    value.missionVersion !== MISSION_VERSION ||
    value.evidenceVersion !== EVIDENCE_VERSION
  ) {
    throw new RecoveryGuardError("RECOVERY_CANARY_MANIFEST_INVALID");
  }
  return Object.freeze(value);
}

async function createCanary(database) {
  const drillId = required("RECOVERY_DRILL_ID").toLowerCase();
  if (!DRILL_ID_PATTERN.test(drillId)) {
    throw new RecoveryGuardError("RECOVERY_DRILL_ID_INVALID");
  }
  const manifestPath = required("RECOVERY_CANARY_MANIFEST_PATH");
  const rootTokenHash = digest(`${drillId}:root:v1`);
  const claimTokenHash = digest(`${drillId}:claim:v1`);
  const now = new Date();

  const created = await database.$transaction(async (transaction) => {
    const repository = new ProgrammeSessionRepository(transaction);
    const root = await repository.createAnonymousSession({
      tokenHash: rootTokenHash,
      missionVersion: MISSION_VERSION,
      evidenceVersion: EVIDENCE_VERSION,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    const claim = await repository.upsertPendingClaim({
      anonymousSessionId: root.id,
      tokenHash: claimTokenHash,
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    });
    return { root, claim };
  });

  const manifest = {
    version: 1,
    drillId,
    rootId: created.root.id,
    claimId: created.claim.id,
    rootTokenHash,
    claimTokenHash,
    missionVersion: MISSION_VERSION,
    evidenceVersion: EVIDENCE_VERSION,
    rootCreatedAt: created.root.createdAt.toISOString(),
    claimCreatedAt: created.claim.createdAt.toISOString(),
  };
  writeExclusiveJson(manifestPath, manifest);

  console.log(`CANARY_ID=${manifest.rootId}`);
  console.log(`CANARY_HASH=${digest(`${manifest.rootId}:${rootTokenHash}:${claimTokenHash}`)}`);
  console.log("CANARY_ROOT=PASS");
  console.log("CANARY_RELATED_RECORD=PASS");
}

async function cleanupCanary(database) {
  const manifest = readCanaryManifest(required("RECOVERY_CANARY_MANIFEST_PATH"));
  const existing = await database.anonymousProgrammeSession.findFirst({
    where: { id: manifest.rootId, tokenHash: manifest.rootTokenHash },
    select: {
      id: true,
      pendingClaim: { select: { id: true, tokenHash: true } },
    },
  });
  if (
    !existing ||
    existing.pendingClaim?.id !== manifest.claimId ||
    existing.pendingClaim.tokenHash !== manifest.claimTokenHash
  ) {
    throw new RecoveryGuardError("RECOVERY_CANARY_CLEANUP_IDENTITY_UNKNOWN");
  }

  const removed = await database.anonymousProgrammeSession.deleteMany({
    where: { id: manifest.rootId, tokenHash: manifest.rootTokenHash },
  });
  if (removed.count !== 1) {
    throw new RecoveryGuardError("RECOVERY_CANARY_CLEANUP_FAILED");
  }
  const remaining = await database.anonymousProgrammeSession.count({
    where: { id: manifest.rootId },
  });
  if (remaining !== 0) {
    throw new RecoveryGuardError("RECOVERY_CANARY_CLEANUP_FAILED");
  }

  console.log(`CANARY_ID=${manifest.rootId}`);
  console.log("CANARY_CLEANUP=PASS");
}

export async function runCanaryCommand(command) {
  assertCanaryAuthority();
  const database = new PrismaClient({
    datasourceUrl: required("RECOVERY_SOURCE_URL"),
    log: ["error"],
  });
  try {
    if (command === "create") return await createCanary(database);
    if (command === "cleanup") return await cleanupCanary(database);
    throw new RecoveryGuardError("RECOVERY_CANARY_COMMAND_UNKNOWN");
  } finally {
    await database.$disconnect();
  }
}

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  runCanaryCommand(process.argv[2]).catch((error) => {
    const code = error instanceof RecoveryGuardError ? error.code : "RECOVERY_CANARY_FAILED";
    console.error(`RESULT=DENY\nREASON=${code}`);
    process.exitCode = 1;
  });
}

export {
  EVIDENCE_VERSION,
  EXPECTED_PREVIEW_RESOURCE_ID,
  EXPECTED_PRODUCTION_RESOURCE_ID,
  MISSION_VERSION,
  RECOVERY_CANARY_ACKNOWLEDGEMENT,
};
