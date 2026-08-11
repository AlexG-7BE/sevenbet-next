import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_PREVIEW_RESOURCE_ID,
  EXPECTED_PRODUCTION_RESOURCE_ID,
  RECOVERY_CANARY_ACKNOWLEDGEMENT,
  RECOVERY_DRILL_ACKNOWLEDGEMENT,
  RecoveryGuardError,
  assertPreviewCanaryAuthority,
  assertRecoveryPreflight,
  parseConnectionIdentity,
  safePreflightReport,
} from "../scripts/recovery-preflight.mjs";

const PREVIEW_SECRET = "PREVIEW_DATABASE_SECRET_SENTINEL";
const PRODUCTION_SECRET = "PRODUCTION_DATABASE_SECRET_SENTINEL";
const TARGET_SECRET = "TARGET_DATABASE_SECRET_SENTINEL";
const previewUrl = `postgresql://preview-user:${PREVIEW_SECRET}@db.prisma.io:5432/postgres?sslmode=require`;
const productionUrl = `postgresql://production-user:${PRODUCTION_SECRET}@db.prisma.io:5432/postgres?sslmode=require`;
const targetUrl = `postgresql://postgres:${TARGET_SECRET}@127.0.0.1:55432/sevenbet_recovery_20260811_test01`;

function validInput(overrides = {}) {
  return {
    sourceUrl: previewUrl,
    targetUrl,
    previewReferenceUrl: previewUrl,
    productionReferenceUrl: productionUrl,
    previewResourceId: EXPECTED_PREVIEW_RESOURCE_ID,
    productionResourceId: EXPECTED_PRODUCTION_RESOURCE_ID,
    acknowledgement: RECOVERY_DRILL_ACKNOWLEDGEMENT,
    targetLabel: "RECOVERY_TEMP",
    runtimeEnvironment: "local",
    ...overrides,
  };
}

function assertDenied(input, code) {
  assert.throws(
    () => assertRecoveryPreflight(input),
    (error) => error instanceof RecoveryGuardError && error.code === code,
  );
}

test("Preview source plus a distinct isolated recovery target passes", () => {
  const result = assertRecoveryPreflight(validInput());
  assert.equal(result.sourceClass, "PREVIEW");
  assert.equal(result.targetClass, "RECOVERY_TEMP");
  assert.notEqual(result.source.fingerprint, result.target.fingerprint);
});

test("Preview source equal to target is denied", () => {
  assertDenied(
    validInput({ targetUrl: previewUrl }),
    "SOURCE_TARGET_RELATION_MATCH",
  );
});

test("Production source is denied", () => {
  assertDenied(
    validInput({ sourceUrl: productionUrl }),
    "PRODUCTION_SOURCE_DENIED",
  );
});

test("Production target is denied", () => {
  assertDenied(
    validInput({ targetUrl: productionUrl }),
    "PRODUCTION_TARGET_DENIED",
  );
});

test("unknown source identity is denied", () => {
  assertDenied(
    validInput({
      sourceUrl:
        "postgresql://unknown-user:UNKNOWN_SECRET@db.prisma.io:5432/postgres",
    }),
    "SOURCE_IDENTITY_UNKNOWN",
  );
});

test("unknown target identity is denied", () => {
  assertDenied(
    validInput({
      targetUrl:
        "postgresql://postgres:UNKNOWN_TARGET@remote.example:5432/sevenbet_recovery_20260811_test01",
    }),
    "TARGET_IDENTITY_UNKNOWN",
  );
});

test("missing explicit recovery acknowledgement is denied", () => {
  assertDenied(
    validInput({ acknowledgement: undefined }),
    "RECOVERY_DRILL_ACKNOWLEDGEMENT_MISSING",
  );
});

test("malformed connection identities are denied without reflecting input", () => {
  assert.throws(
    () => parseConnectionIdentity("not-a-connection-PASSWORD_SECRET_SENTINEL"),
    (error) =>
      error instanceof RecoveryGuardError &&
      error.code === "CONNECTION_IDENTITY_MALFORMED" &&
      !error.message.includes("PASSWORD_SECRET_SENTINEL"),
  );
});

test("Production runtime is denied", () => {
  assertDenied(
    validInput({ runtimeEnvironment: "production" }),
    "PRODUCTION_RUNTIME_DENIED",
  );
});

test("Preview canary mutation authority requires the exact Preview identity", () => {
  const valid = {
    sourceUrl: previewUrl,
    previewReferenceUrl: previewUrl,
    productionReferenceUrl: productionUrl,
    previewResourceId: EXPECTED_PREVIEW_RESOURCE_ID,
    productionResourceId: EXPECTED_PRODUCTION_RESOURCE_ID,
    acknowledgement: RECOVERY_CANARY_ACKNOWLEDGEMENT,
    runtimeEnvironment: "local",
  };
  assert.equal(assertPreviewCanaryAuthority(valid).sourceClass, "PREVIEW");
  assert.throws(
    () => assertPreviewCanaryAuthority({ ...valid, sourceUrl: productionUrl }),
    (error) =>
      error instanceof RecoveryGuardError && error.code === "PRODUCTION_SOURCE_DENIED",
  );
});

test("safe output contains fingerprints and labels but never secret values", () => {
  const report = safePreflightReport(assertRecoveryPreflight(validInput()));
  assert.match(report, /PREVIEW_DATABASE_URL=CONFIGURED/);
  assert.match(report, /PRODUCTION_DATABASE_URL=CONFIGURED/);
  assert.match(report, /PREVIEW_PRODUCTION_RELATION=DIFFERENT/);
  assert.match(report, /SOURCE_TARGET_RELATION=DIFFERENT/);
  assert.match(report, /SOURCE_CLASS=PREVIEW/);
  assert.match(report, /TARGET_CLASS=RECOVERY_TEMP/);
  assert.match(report, /sha256:[0-9a-f]{64}/);
  assert.match(report, new RegExp(EXPECTED_PREVIEW_RESOURCE_ID));
  assert.match(report, new RegExp(EXPECTED_PRODUCTION_RESOURCE_ID));
  assert.doesNotMatch(
    report,
    new RegExp(`${PREVIEW_SECRET}|${PRODUCTION_SECRET}|${TARGET_SECRET}|postgresql://`),
  );
});

test("credential rotation does not change the authority fingerprint", () => {
  const rotated = previewUrl.replace(PREVIEW_SECRET, "ROTATED_DATABASE_SECRET_SENTINEL");
  assert.equal(
    parseConnectionIdentity(previewUrl).fingerprint,
    parseConnectionIdentity(rotated).fingerprint,
  );
});
