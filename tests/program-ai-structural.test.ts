import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/0018_program_ai_m1_foundation/migration.sql");
const preflight = read("prisma/preflight/0018_program_ai_m1_foundation.sql");
const service = read("lib/programme/application/programme-ai-mission-one.service.ts");
const repository = read("lib/programme/infrastructure/repositories/programme-ai-mission-one.repository.ts");
const frontend = read("components/programme/ProgramAiExperience.tsx");
const authenticatedHome = read("components/programme/ProgramAiHome.tsx");
const missionExperience = read("components/programme/ProgramAiMissionExperience.tsx");
const missionPrimitives = read("components/programme/ProgramAiMissionPrimitives.tsx");
const reviewScreen = read("components/programme/ProgramAiReviewScreen.tsx");
const missionsService = read("lib/programme/application/programme-ai-missions.service.ts");
const page = read("app/program/page.tsx");

test("the schema change is limited to the two approved Program AI concepts", () => {
  assert.equal((schema.match(/model ProgrammeSensitiveInputAuthority\s*\{/g) || []).length, 1);
  assert.equal((schema.match(/model ProgrammeStartingPoint\s*\{/g) || []).length, 1);
  assert.equal((migration.match(/CREATE TABLE "ProgrammeSensitiveInputAuthority"/g) || []).length, 1);
  assert.equal((migration.match(/CREATE TABLE "ProgrammeStartingPoint"/g) || []).length, 1);
  assert.match(schema, /@@unique\(\[userId, purposeVersion, statementVersion\]\)/);
  assert.match(migration, /CHECK \(\("anonymousSessionId" IS NOT NULL\) <> \("userId" IS NOT NULL\)\)/);
  assert.match(preflight, /exact-one authority subject constraint is missing/);
  assert.match(preflight, /\("anonymousSessionId" IS NOT NULL\) = \("userId" IS NOT NULL\)/);
  assert.match(migration, /"eventType" = 'STEP_COMPLETION'/);
  assert.match(migration, /"sourceArtifactType" IN \('PROGRAM_AI_M1_PROGRESS', 'PROGRAMME_STARTING_POINT'\)/);
  assert.match(preflight, /exact M1 step-reward source constraint is missing/);
  assert.match(schema, /userId\s+String\s+@unique/);
  assert.match(schema, /enrollmentId\s+String\s+@unique/);
});

test("raw Programme input cannot enter either new durable model", () => {
  const durableModels = schema.slice(
    schema.indexOf("model ProgrammeSensitiveInputAuthority"),
    schema.indexOf("model PendingProgrammeClaim"),
  ) + schema.slice(
    schema.indexOf("model ProgrammeStartingPoint"),
    schema.indexOf("model CommunicationPreference"),
  );
  assert.doesNotMatch(durableModels, /audio|transcript|narrative|clarification|providerPayload|prompt|response/iu);
  assert.doesNotMatch(repository, /affiliate|casino|offer|tracking|marketing/iu);
  assert.match(service, /Provider work runs after the metadata-only reservation and outside every database transaction/);
  assert.match(service, /confirmedContentStorage: "browser_session"/);
});

test("the production path fails closed and the legacy Programme remains the default", () => {
  assert.match(page, /isProgramAiV1Enabled\(\)/);
  assert.match(page, /\? <div id="main-content" tabIndex=\{-1\}><ProgramAiExperience/);
  assert.match(page, /: <main id="main-content"><ActiveControlProgramme/);
  assert.match(page, /Skip to main content/);
  assert.match(page, /10-Step Control Programme \| Personal Control Plan/);
  assert.doesNotMatch(page, /Build a private Moment Map/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_PROGRAM_AI/);
});

test("client keeps private draft content in sessionStorage and never localStorage", () => {
  assert.match(frontend, /window\.sessionStorage/);
  assert.doesNotMatch(frontend, /localStorage/);
  assert.doesNotMatch(frontend, /@prisma\/client|\bprisma\./);
  assert.match(frontend, /Audio stays in short-lived memory/);
  assert.match(frontend, /Editable transcript/);
  assert.match(frontend, /new FormData\(\)/);
  assert.match(frontend, /90_000/);
  assert.match(frontend, /navigator\.permissions\?\.query/);
  assert.match(frontend, /name: "microphone"/);
  assert.match(frontend, /Microphone is blocked for this site/);
  assert.match(frontend, /Voice recording is not supported here/);
});

test("account-not-linked recovery preserves the claim and requires authenticated explicit linking", () => {
  assert.match(frontend, /authError === "account_not_linked"|authError = authQuery\.get\("error"\)/);
  assert.match(frontend, /accountNotLinked/);
  assert.match(frontend, /authClient\.signIn\.email/);
  assert.match(frontend, /authClient\.linkSocial/);
  assert.match(frontend, /GOOGLE_LINK_CALLBACK/);
  assert.match(frontend, /Your confirmed Starting Point stays in this browser/);
  const explicitLink = frontend.slice(frontend.indexOf("async function startGoogleLink"), frontend.indexOf("async function openMission"));
  assert.doesNotMatch(explicitLink, /clearProgrammeOAuthClaimMarker/);
});

test("combined intake includes JIT authority and does not introduce a separate legal phase", () => {
  assert.match(frontend, /Before you share/);
  assert.match(frontend, /I choose to share this for Programme personalisation/);
  assert.match(frontend, /What feels hardest to control right now/);
  assert.doesNotMatch(frontend, /type Phase[\s\S]*"legal"/);
});

test("Program AI reuses the signed access contract and exposes no anonymous clarification, editor or reward phase", () => {
  const sessionRoute = read("app/api/program/program-ai/session/route.ts");
  assert.match(sessionRoute, /verifyProgrammeAccessHeaders\(request\.headers/);
  assert.match(frontend, /Two checks before you begin/);
  assert.match(frontend, /htmlFor="programme-legal-acknowledgement"/);
  assert.match(frontend, /<Link href="\/terms">Read Terms<\/Link>/);
  assert.match(frontend, /<Link href="\/privacy">Read Privacy Notice<\/Link>/);
  assert.doesNotMatch(frontend, /<label[^>]*><input checked=\{legal\}[\s\S]*?<\/label>/);
  assert.equal((frontend.match(/type="checkbox"/g) || []).length >= 3, true);
  assert.doesNotMatch(frontend, /Three checks before you begin|I accept the current|I have read the current/);
  assert.match(frontend, /onSubmit=\{\(\) => submitTurn\(true\)\}/);
  assert.match(frontend, /clarificationAnswers: \[\]/);
  assert.match(frontend, /prepareClaimForRegistration/);
  assert.match(frontend, /Your Starting Point is ready\./);
  assert.match(frontend, /Continue with Google — save your plan/);
  assert.match(frontend, /Use email instead/);
  assert.doesNotMatch(frontend, /function (?:ClarificationScreen|CandidateScreen|RewardScreen)/);
  assert.doesNotMatch(frontend, /phase === "(?:clarification|candidate|reward)"/);
  assert.doesNotMatch(frontend, /What would you like to change\?|What should Mission 02 continue from\?|Confirm my Starting Point|Keep this progress/);
  assert.match(frontend, /emailRedeemStarted\.current = true/);
  assert.match(frontend, /session\?\.user\.id && emailRedeemStarted\.current/);
  assert.match(repository, /if \(current && !current\.withdrawnAt\) return current/);
  assert.match(repository, /data: \{ anonymousSessionId: null, userId: input\.userId \}/);
});

test("Programme phase changes and legacy controls preserve keyboard and assistive-technology state", () => {
  const legacy = read("components/programme/ActiveControlProgramme.tsx");
  assert.match(frontend, /data-programme-phase=\{phase\}/);
  assert.match(frontend, /phaseFocusRef\.current/);
  assert.match(frontend, /name="email"/);
  assert.match(frontend, /name="password"/);
  assert.match(legacy, /aria-pressed=\{active\}/);
  assert.match(legacy, /focusableSelector/);
  assert.match(legacy, /event\.key === "Escape"/);
  assert.match(legacy, /element\.inert = true/);
  assert.match(legacy, /returnFocus\?\.focus\(\)/);
  assert.match(legacy, /htmlFor="legacy-programme-legal-acknowledgement"/);
  assert.doesNotMatch(legacy, /<label[^>]*><input checked=\{legalAcknowledged\}[\s\S]*?<\/label>/);
});

test("commercial firewall excludes Program AI data in both directions", () => {
  const protectedSources = [
    service,
    repository,
    read("lib/programme/program-ai/contracts.ts"),
    read("lib/programme/program-ai/ports.ts"),
  ].join("\n");
  assert.doesNotMatch(protectedSources, /@\/lib\/(?:affiliate|affiliate-commercial|casino|public-casino|public-offer)/);
  const commercialSources = [
    read("lib/affiliate-commercial/gb-commercial-readiness.ts"),
    read("lib/services/gb-commercial-readiness.service.ts"),
    read("lib/services/public-offer.service.ts"),
  ].join("\n");
  assert.doesNotMatch(commercialSources, /program-ai|ProgrammeStartingPoint|ProgrammeSensitiveInputAuthority/);
});

test("exact-once claim storage is backed by unique keys and idempotent ledgers", () => {
  assert.match(schema, /@@unique\(\[userId, awardKey\]\)/);
  assert.match(schema, /@@unique\(\[enrollmentId, eventKey\]\)/);
  assert.match(repository, /programmeStartingPoint\.create/);
  assert.match(service, /consumeClaim/);
  assert.match(service, /claim\.consumedByUserId !== userId/);
  assert.match(service, /recordProgrammeAiXp/);
  assert.match(read("lib/programme/infrastructure/repositories/programme-reward.repository.ts"), /skipDuplicates: true/);
});

test("Home exposes truthful states and only the approved review entitlements", () => {
  assert.match(missionsService, /programAiReviewDefinitions/);
  assert.match(missionsService, /status: byMission\.get\(review\.unlockMission\)\?\.status === "COMPLETED"/);
  assert.doesNotMatch(frontend + authenticatedHome, /% complete|progressPercent|Math\.round\([^)]*100/);
  assert.match(authenticatedHome, /Completion, current position and locks come from your server record/);
  assert.match(authenticatedHome, /Each Review becomes available at a meaningful point/);
});

test("consumer Programme uses distinct interaction primitives and hides provider/debug language", () => {
  for (const primitive of ["ChoiceCards", "SequenceBuilder", "DecisionApplication", "StackBuilder", "AiCandidatePicker", "ProgrammeTimeline"]) {
    assert.match(missionExperience + missionPrimitives, new RegExp(primitive));
  }
  assert.doesNotMatch(missionExperience + reviewScreen + authenticatedHome, /PRIVATE STRUCTURAL REVIEW|BOUNDED AI REVIEW|DETERMINISTIC REVIEW|Provider-off|provider-failure|Generic public navigation|No Programme data is sent|criterion IDs/);
  assert.doesNotMatch(missionPrimitives, /guidance\.generation|deterministic_fallback|provider/);
  assert.match(missionExperience, /Check sequence · \+\$\{current\.xp\} XP when correct/);
  assert.match(missionExperience, /No XP awarded\. Adjust the order and try again/);
});

test("public 10-steps metadata uses Starting Point truth and removes stale Moment Map copy", () => {
  const tenStepsPage = read("app/(public)/10-steps/page.tsx");
  assert.match(tenStepsPage, /build a personal Starting Point/);
  assert.doesNotMatch(tenStepsPage, /Moment Map/);
});
