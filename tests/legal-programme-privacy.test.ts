import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  parseActiveBoundary,
  parseCurrentGoal,
  parseMissionOneDraft,
  parseUrgeLearningDraft,
} from "../lib/programme/validation";

const now = new Date("2026-08-09T10:00:00.000Z");

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("Programme validators reject raw narrative fields at every active Mission boundary", () => {
  assert.throws(() => parseMissionOneDraft({ taskStates: ["brief"], momentMap: { situation: "sentinel" } }), /unsupported fields/i);
  assert.throws(() => parseCurrentGoal({ action: "sentinel" }, { now }), /unsupported fields/i);
  assert.throws(() => parseUrgeLearningDraft({ earlySignalText: "sentinel" }), /unsupported fields/i);
  assert.throws(() => parseActiveBoundary({ ruleText: "sentinel" }, { now }), /unsupported fields/i);
});

test("Programme client uses tab-scoped storage and sends bounded server payloads", () => {
  const active = source("components/programme/ActiveControlProgramme.tsx");
  const legacy = source("components/ProgramExperience.tsx");
  assert.match(active, /window\.sessionStorage/);
  assert.match(active, /PROGRAMME_LOCAL_CONTENT_KEY/);
  assert.doesNotMatch(active, /window\.localStorage/);
  assert.doesNotMatch(legacy, /window\.localStorage/);
  assert.match(active, /signalChoice: urgeLearning\.notNow \? "not_now" : "local"/);
  assert.match(active, /sourceMomentMapId: goal\.sourceMomentMapId/);
  assert.match(active, /Personal wording stays only in this browser session/);
});

test("age self-attestation is unchecked in UI and enforced at server boundaries", () => {
  const active = source("components/programme/ActiveControlProgramme.tsx");
  const middleware = source("middleware.ts");
  const authRoute = source("app/api/auth/[...all]/route.ts");
  assert.match(active, /const \[adultConfirmed, setAdultConfirmed\] = useState\(false\)/);
  assert.match(active, /I confirm I am 18 or over · required/);
  assert.match(middleware, /x-sevenbet-age-attestation/);
  assert.match(middleware, /\/api\/program\/:path\*/);
  assert.match(authRoute, /sign-up\/email/);
  assert.match(authRoute, /AGE_ATTESTATION_REQUIRED/);
});

test("legacy reflection creation is retired before request body parsing", () => {
  const route = source("app/api/program/reflections/route.ts");
  const post = route.slice(route.indexOf("export async function POST"), route.indexOf("export async function DELETE"));
  assert.match(post, /LOCAL_ONLY_CONTENT/);
  assert.doesNotMatch(post, /request\.json|programReflectionService\.save/);
});

test("commercial runtime modules do not import protected Programme or control data", () => {
  const roots = [
    "lib/affiliate",
    "lib/affiliate-routing",
    "lib/public-offer",
    "lib/public-casino-discovery",
    "lib/jurisdiction",
  ];
  for (const path of roots.flatMap(filesBelow).filter((path) => /\.(ts|tsx)$/.test(path))) {
    const text = source(path);
    assert.doesNotMatch(text, /from ["'][^"']*(programme|responsible-gambling|self-check|limit-tracker|progress)[^"']*["']/i, path);
  }
});
