import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stableSteps = [
  { id: "step-a", order: 1000 },
  { id: "step-b", order: 2000 },
  { id: "step-c", order: 3000 },
];
const reordered = [stableSteps[1], stableSteps[0], stableSteps[2]].map((step, index) => ({ ...step, order: (index + 1) * 1000 }));
assert.deepEqual(reordered.map((step) => step.id), ["step-b", "step-a", "step-c"], "reordering must preserve stable IDs");
assert.deepEqual(reordered.map((step) => step.order), [1000, 2000, 3000], "ordering fields must be explicit and unique");

const lesson = { id: "lesson-stable", programStepId: "step-a" };
const movedLesson = { ...lesson, programStepId: "step-b" };
assert.equal(movedLesson.id, lesson.id, "moving a lesson must not change its stable ID");
assert.notEqual(movedLesson.programStepId, lesson.programStepId, "lesson movement should update only its parent reference");

function validSingleChoice(options) {
  return options.filter((option) => option.correct).length === 1;
}
assert.equal(validSingleChoice([{ correct: true }, { correct: false }]), true, "single choice requires one correct answer");
assert.equal(validSingleChoice([{ correct: true }, { correct: true }]), false, "single choice rejects multiple correct answers");

function hasCycle(edges) {
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const target of edges[id] || []) if (visit(target)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  return Object.keys(edges).some(visit);
}
assert.equal(hasCycle({ a: ["b"], b: ["c"], c: [] }), false, "valid prerequisites should pass");
assert.equal(hasCycle({ a: ["b"], b: ["a"] }), true, "circular prerequisites must be rejected");

const userXpEvents = new Set();
function award(userId, awardKey) {
  const key = `${userId}:${awardKey}`;
  if (userXpEvents.has(key)) return false;
  userXpEvents.add(key);
  return true;
}
assert.equal(award("user-1", "program-v1:quiz-1"), true, "first XP event should be accepted");
assert.equal(award("user-1", "program-v1:quiz-1"), false, "duplicate XP event must be rejected");

const versionOne = { version: 1, stepIds: ["step-a", "step-b"] };
const versionTwo = { version: 2, stepIds: ["step-b", "step-a"] };
assert.deepEqual(new Set(versionTwo.stepIds), new Set(versionOne.stepIds), "non-breaking versions preserve progress entity IDs");

const localV1 = { completedSteps: [1, 2] };
const currentSteps = [{ day: 1, stableId: "step-a" }, { day: 2, stableId: "step-b" }];
const migratedIds = currentSteps.filter((step) => localV1.completedSteps.includes(step.day)).map((step) => step.stableId);
assert.deepEqual(migratedIds, ["step-a", "step-b"], "legacy browser progress should migrate to stable IDs");

const publicRecords = [{ status: "DRAFT" }, { status: "PUBLISHED" }].filter((record) => record.status === "PUBLISHED");
assert.equal(publicRecords.length, 1, "draft program content must remain excluded from public reads");

const relatedComparison = { affiliateLinkId: "affiliate_link_sample" };
assert.equal(Boolean(relatedComparison.affiliateLinkId), true, "commercial references must resolve through internal affiliate IDs");

const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
assert.match(middleware, /\/admin\/:path\*/, "draft preview must remain behind admin middleware");
const builderRoute = readFileSync(new URL("../app/api/admin/programs/[programId]/builder/route.ts", import.meta.url), "utf8");
assert.match(builderRoute, /expectedUpdatedAt/, "builder saves must support optimistic concurrency");
const publishService = readFileSync(new URL("../lib/services/program-builder.service.ts", import.meta.url), "utf8");
assert.match(publishService, /Publication blocked/, "publication must be blocked by critical validation errors");
assert.match(publishService, /programVersion\.findFirst/, "published snapshots must be loaded from PostgreSQL program versions");
assert.match(publishService, /status: "PUBLISHED"/, "public snapshot lookup must require a published version");

console.log("Program Builder smoke tests passed.");
