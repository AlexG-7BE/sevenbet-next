import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EXPECTED_AUTH_TABLES,
  EXPECTED_PROGRAMME_TABLES,
  repositoryMigrationNames,
} from "../scripts/recovery-verify.mjs";

test("recovery verification derives the exact repository migration set", () => {
  const names = repositoryMigrationNames(process.cwd());
  assert.ok(names.length > 0);
  assert.equal(names[0], "0001_cms_foundation");
  assert.equal(names.at(-1), "0018_program_ai_m1_foundation");
  assert.equal(new Set(names).size, names.length);
});

test("recovery verification covers authentication and Programme structure", () => {
  assert.deepEqual(EXPECTED_AUTH_TABLES, [
    "Account",
    "Session",
    "User",
    "Verification",
  ]);
  assert.ok(EXPECTED_PROGRAMME_TABLES.includes("AnonymousProgrammeSession"));
  assert.ok(EXPECTED_PROGRAMME_TABLES.includes("PendingProgrammeClaim"));
  assert.ok(EXPECTED_PROGRAMME_TABLES.includes("ProgrammeMissionProgress"));
  assert.ok(EXPECTED_PROGRAMME_TABLES.includes("ProgramEnrollment"));
});

test("recovery tooling has no one-click Production restore path", () => {
  const preflight = readFileSync("scripts/recovery-preflight.mjs", "utf8");
  const canary = readFileSync("scripts/recovery-canary.mjs", "utf8");
  const verification = readFileSync("scripts/recovery-verify.mjs", "utf8");
  const combined = `${preflight}\n${canary}\n${verification}`;

  assert.doesNotMatch(combined, /pg_restore|prisma migrate reset|prisma db push/);
  assert.doesNotMatch(combined, /vercel env add|vercel env rm|PROGRAM_AI_OPENAI_MODEL/);
  assert.match(preflight, /PRODUCTION_SOURCE_DENIED/);
  assert.match(preflight, /PRODUCTION_TARGET_DENIED/);
  assert.match(preflight, /RECOVERY_DRILL_ACKNOWLEDGEMENT/);
});
