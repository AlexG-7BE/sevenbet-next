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
  const subjectStorage = source("lib/programme/local-subject-storage.ts");
  const legacy = source("components/ProgramExperience.tsx");
  assert.match(active, /window\.sessionStorage/);
  assert.match(active, /userProgrammeSubject\(sessionUserId\)/);
  assert.match(active, /migrateClaimedJourneyToUser/);
  assert.match(active, /subjectMatchesSession/);
  assert.match(active, /claimTransitionPending/);
  assert.match(subjectStorage, /sevenbet\.programme\.local-content\.v2/);
  assert.match(subjectStorage, /sevenbet\.programme\.access-continuation\.v1/);
  assert.match(subjectStorage, /sevenbet\.programme\.access-authority\.v1/);
  assert.match(subjectStorage, /transitionProgrammeAccessToUser/);
  assert.doesNotMatch(subjectStorage, /email/i);
  assert.doesNotMatch(active, /window\.localStorage/);
  assert.doesNotMatch(legacy, /window\.localStorage/);
  assert.match(active, /signalChoice: urgeLearning\.notNow \? "not_now" : "local"/);
  assert.match(active, /sourceMomentMapId: goal\.sourceMomentMapId/);
  assert.match(active, /Personal wording stays only in this browser session/);
  assert.match(active, /<Link href="\/casinos">Compare casinos<\/Link>/);
});

test("the consolidated access screen is unchecked and account creation enforces current signed access authority", () => {
  const active = source("components/programme/ActiveControlProgramme.tsx");
  const middleware = source("middleware.ts");
  const authRoute = source("app/api/auth/[...all]/route.ts");
  const accessPolicy = source("lib/auth/programme-access-policy.ts");
  const accessContract = source("lib/programme/access-contract.ts");
  const accessProof = source("lib/auth/programme-access-proof.ts");
  assert.match(active, /const \[adultConfirmed, setAdultConfirmed\] = useState\(false\)/);
  assert.match(active, /const \[legalAcknowledged, setLegalAcknowledged\] = useState\(false\)/);
  assert.equal(active.match(/I confirm I am 18 or over · required/g)?.length, 1);
  assert.equal(active.match(/I agree to the .*Terms.* and acknowledge the .*Privacy Notice.* · required/g)?.length, 1);
  assert.match(middleware, /x-sevenbet-age-attestation/);
  assert.match(middleware, /pathname\.startsWith\("\/api\/program\/"\)/);
  assert.match(middleware, /matcher: \["\/:path\*"\]/);
  assert.match(authRoute, /sign-up\/email/);
  assert.match(authRoute, /programmeAuthAccessDenial/);
  assert.match(accessPolicy, /CURRENT_ACCESS_AUTHORITY_REQUIRED/);
  assert.match(accessPolicy, /verifyProgrammeAccessProof/);
  assert.match(accessProof, /createHmac/);
  assert.match(accessProof, /PROGRAMME_AUTH_ACCESS_PROOF_PURPOSE/);
  assert.match(accessContract, /x-sevenbet-programme-access-proof/);
  assert.match(accessContract, /x-sevenbet-terms-acceptance/);
  assert.match(accessContract, /x-sevenbet-privacy-acknowledgement/);
  assert.match(accessContract, /privacy:effective-2026-08-19:updated-2026-08-19/);
  assert.match(accessContract, /terms:effective-2026-08-19:updated-2026-08-19/);
  assert.match(source("app/(public)/privacy/page.tsx"), /updated="19 August 2026"/);
  assert.match(source("app/(public)/terms/page.tsx"), /updated="19 August 2026"/);
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
