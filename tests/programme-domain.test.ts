import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { programmeErrorResponse } from "../lib/programme/http";
import {
  MissionLockedError,
  ProgrammePermissionError,
  ProgrammeResourceNotFoundError,
} from "../lib/programme/domain/programme-errors";
import {
  implementedMissionDefinition,
  missionDefinition,
  missionRegistry,
} from "../lib/programme/domain/mission-registry";
import {
  assertMissionPrerequisite,
  assertMissionTasksComplete,
  currentMissionNumber,
  mergedMissionTasks,
} from "../lib/programme/domain/programme-state";
import { rewardPolicyForMission } from "../lib/programme/domain/reward-policy";
import { localDateAt } from "../lib/programme/security";
import { parseActiveBoundary } from "../lib/programme/validation";

const now = new Date("2026-08-04T10:00:00.000Z");

test("mission registry is the ordered server source for prerequisites and next missions", () => {
  assert.equal(missionRegistry.length, 10);
  assert.deepEqual(
    missionRegistry.map((mission) => mission.missionNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.equal(missionDefinition(1).prerequisite, null);
  assert.equal(missionDefinition(4).prerequisite, 3);
  assert.equal(missionDefinition(4).nextMission, 5);
  assert.equal(missionDefinition(10).nextMission, null);
  assert.equal(missionDefinition(5).completion, null);
});

test("reward policy is deterministic for implemented Missions 01-04", () => {
  assert.deepEqual(
    [1, 2, 3, 4].map((mission) =>
      rewardPolicyForMission(mission as 1 | 2 | 3 | 4).xp
    ),
    [60, 80, 90, 100],
  );
  assert.equal(rewardPolicyForMission(2).achievement?.slug, "first-plan");
  assert.equal(rewardPolicyForMission(3).achievement, null);
  assert.equal(rewardPolicyForMission(4).achievement?.slug, "boundary-built");
  assert.match(rewardPolicyForMission(4).awardKey, /mission:04:save:v1/);
});

test("mission state rules merge known tasks, enforce prerequisites and derive current mission", () => {
  const required = implementedMissionDefinition(3).completion.taskStates;
  assert.deepEqual(
    mergedMissionTasks([required[0]], [required[1], "unsupported"], required),
    required.slice(0, 2),
  );
  assert.doesNotThrow(() => assertMissionPrerequisite("COMPLETED", 2, 3));
  assert.throws(
    () => assertMissionPrerequisite("IN_PROGRESS", 2, 3),
    MissionLockedError,
  );
  assert.throws(
    () => assertMissionTasksComplete(required.slice(0, -1), required),
    /task states are incomplete/i,
  );
  assert.equal(
    currentMissionNumber([
      { missionNumber: 1, status: "COMPLETED" },
      { missionNumber: 2, status: "COMPLETED" },
      { missionNumber: 3, status: "IN_PROGRESS" },
    ]),
    3,
  );
});

test("boundary completion rule validates structure without judging the chosen amount", () => {
  const valid = parseActiveBoundary({
    evidenceReviewed: true,
    category: "money",
    triggerType: "custom",
    limitValue: 25,
    executionMethod: "bank_gambling_block",
    reviewAt: "2026-08-05T10:00:00.000Z",
    scenarioAnswer: "concrete",
    strengthChecks: [
      "placed_before_pressure",
      "specific",
      "executable",
      "protected_from_in_moment_editing",
    ],
    status: "active",
  }, { complete: true, now });
  assert.equal(valid.limitValue, 25);
  assert.throws(
    () => parseActiveBoundary({
      ...valid,
      reviewAt: valid.reviewAt?.toISOString(),
      ruleText: "Raw narrative must remain local",
    }, { complete: true, now }),
    /unsupported fields/i,
  );
});

test("active-day key uses the enrollment timezone around a UTC day boundary", () => {
  const instant = new Date("2026-08-04T22:30:00.000Z");
  assert.equal(localDateAt(instant, "UTC"), "2026-08-04");
  assert.equal(localDateAt(instant, "Asia/Almaty"), "2026-08-05");
});

test("typed Programme errors preserve normalized HTTP semantics", async () => {
  const cases = [
    [new ProgrammeResourceNotFoundError("Active Boundary"), 404, "NOT_FOUND"],
    [new MissionLockedError(3, 4), 409, "CONFLICT"],
    [new ProgrammePermissionError("SUPER_ADMIN access required"), 403, "STAFF_PERMISSION_REQUIRED"],
  ] as const;
  for (const [error, status, code] of cases) {
    const response = programmeErrorResponse(error);
    assert.equal(response.status, status);
    assert.equal((await response.json()).code, code);
  }
});

test("Programme delivery and domain dependency boundaries remain explicit", () => {
  const routeFiles = [
    "app/api/program/claims/redeem/route.ts",
    "app/api/program/dashboard/route.ts",
    "app/api/program/missions/02/route.ts",
    "app/api/program/missions/03/route.ts",
    "app/api/program/missions/04/route.ts",
  ];
  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /@prisma\/client|lib\/db\/prisma/);
    assert.doesNotMatch(source, /programme-flow\.service/);
  }
  const missionThreeRoute = readFileSync(
    "app/api/program/missions/03/route.ts",
    "utf8",
  );
  assert.match(missionThreeRoute, /export async function PUT/);
  const domainFiles = [
    "lib/programme/domain/mission-registry.ts",
    "lib/programme/domain/programme-state.ts",
    "lib/programme/domain/reward-policy.ts",
  ];
  for (const file of domainFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /next\/|@prisma\/client|infrastructure\//);
  }
});
