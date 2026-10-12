import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { programmeMissionProgressCopy, programmeReviewStatusCopy } from "../components/programme/ProgramAiHome.copy";
import { assertProgrammeReleaseRuntime } from "../lib/programme/program-ai/release-runtime";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/0018_program_ai_m1_foundation/migration.sql");
const preflight = read("prisma/preflight/0018_program_ai_m1_foundation.sql");
const service = read("lib/programme/application/programme-ai-mission-one.service.ts");
const repository = read("lib/programme/infrastructure/repositories/programme-ai-mission-one.repository.ts");
const frontend = read("components/programme/ProgramAiExperience.tsx");
const finalPresentation = read("components/programme/ProgramAiFinalPresentation.tsx");
const frontendRuntime = `${frontend}\n${finalPresentation}`;
const authenticatedHome = read("components/programme/ProgramAiHome.tsx");
const missionExperience = read("components/programme/ProgramAiMissionExperience.tsx");
const missionPrimitives = read("components/programme/ProgramAiMissionPrimitives.tsx");
const reviewScreen = read("components/programme/ProgramAiReviewScreen.tsx");
const missionsService = read("lib/programme/application/programme-ai-missions.service.ts");
const progressRepository = read("lib/programme/infrastructure/repositories/programme-progress.repository.ts");
const completionRoute = read("app/api/program/program-ai/missions/[missionNumber]/complete/route.ts");
const programmeObserver = read("lib/analytics/programme-observer.server.ts");
const page = read("app/program/page.tsx");
const layout = read("app/program/layout.tsx");
const vercelBuildPreflight = read("scripts/vercel-build-preflight.ts");
const localSubjectStorage = read("lib/programme/local-subject-storage.ts");

test("PR #106 Preview builds require the exact Programme runtime flag without changing other environments", () => {
  const releaseCandidate = {
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: "feat/programme-internationalisation",
  };
  assert.throws(
    () => assertProgrammeReleaseRuntime(releaseCandidate),
    /PR #106 Preview runtime acceptance failed/,
  );
  assert.throws(
    () => assertProgrammeReleaseRuntime({ ...releaseCandidate, PROGRAM_AI_V1_ENABLED: "TRUE" }),
    /PROGRAM_AI_V1_ENABLED must be exact true/,
  );
  assert.deepEqual(
    assertProgrammeReleaseRuntime({ ...releaseCandidate, PROGRAM_AI_V1_ENABLED: "true" }),
    {
      checked: true,
      branch: "feat/programme-internationalisation",
      programmeAiV1Enabled: true,
    },
  );
  assert.deepEqual(assertProgrammeReleaseRuntime({
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: "another-preview",
  }), { checked: false });
  assert.deepEqual(assertProgrammeReleaseRuntime({
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "feat/programme-internationalisation",
  }), { checked: false });
  assert.match(vercelBuildPreflight, /assertProgrammeReleaseRuntime\(\)/);
});

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

test("the public Programme has one canonical renderer and never swaps to the legacy UI", () => {
  assert.match(page, /data-public-programme-renderer="program-ai"/);
  assert.match(page, /<ProgramAiExperience entryOverview=\{<ProgrammeStepsOverview locale=\{locale\} \/>\} googleAvailable=\{isGoogleAuthAvailable\(\)\} locale=\{locale\} programmePath=\{path\} \/>/);
  assert.doesNotMatch(page, /ActiveControlProgramme/);
  assert.doesNotMatch(page, /isProgramAiV1Enabled|PROGRAM_AI_V1_ENABLED/);
  assert.match(layout, /messages\.skipToMain/);
  assert.match(layout, /<PublicHeader/);
  assert.match(layout, /<PublicFooter/);
  assert.match(page, /10-Step Control Programme \| Personal Control Plan/);
  assert.doesNotMatch(page, /Build a private Moment Map/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_PROGRAM_AI/);
});

test("the canonical Programme presentation exposes the shared standard outer frame", () => {
  assert.match(finalPresentation, /data-site-frame="standard"/);
  assert.match(finalPresentation, /data-site-classification="STANDARD"/);
  assert.match(read("components\/programme\/ProgramAiFinalPresentation.module.css"), /\.standardFrame\s*\{[\s\S]*width:\s*var\(--site-content-width\)/);
  assert.match(authenticatedHome, /data-site-frame="standard"/);
});

test("client keeps private draft content in sessionStorage and never localStorage", () => {
  assert.match(frontend, /window\.sessionStorage/);
  assert.doesNotMatch(frontend, /localStorage/);
  assert.doesNotMatch(frontend, /@prisma\/client|\bprisma\./);
  assert.match(frontendRuntime, /<Link href="\/privacy">\{t\("Read Privacy Notice"\)\}<\/Link>/);
});

test("Mission 01 takes picked ready answers, one short note for Something else, and no voice", () => {
  // Founder decisions, 11 Oct 2026: ready answers; "Something else" opens one short optional
  // note; no voice.
  assert.match(finalPresentation, /PROGRAMME_READY_ANSWERS\.map\(\(answer\) =>/);
  assert.match(frontend, /situation: readyAnswersSituation\(locale, choice\.answers, choice\.note\)/);
  assert.match(frontend, /body: JSON\.stringify\(\{ locale, inputMode: "text", situation: state\.situation, clarificationAnswers: \[\] \}\)/);
  // The note exists only while "Something else" is picked, and is sent only then.
  assert.equal((frontendRuntime.match(/<textarea/g) || []).length, 1);
  assert.match(finalPresentation, /\{answers\.includes\("Something else"\) \? <textarea [^\n]*maxLength=\{PROGRAMME_ANSWER_NOTE_MAX_LENGTH\}/);
  assert.match(finalPresentation, /onAgree\(\{ answers, note: answers\.includes\("Something else"\) \? note : "" \}\)/);
  assert.doesNotMatch(frontendRuntime, /getUserMedia|MediaRecorder|navigator\.permissions|microphone|transcription|new FormData\(\)|In my own words/i);
  assert.doesNotMatch(frontendRuntime, /Mission01IntakeScreen|Mission01Composer|realtime-transcription-client|voice-draft/);
});

test("the screen after the answers opens at once and registration waits for the server, not the screen", () => {
  // Founder decision, 11 Oct 2026 (a screen change takes 0.1–0.3 s). The press shows the next
  // screen before any request; the session, the consent record and the answers go behind it.
  const agree = frontend.slice(frontend.indexOf("function agreeAndContinue"), frontend.indexOf("async function prepareStartingPoint"));
  assert.doesNotMatch(agree, /await /, "the press awaits nothing");
  assert.ok(agree.indexOf("persist(shown, journey)") < agree.indexOf("prepareStartingPoint(journey, shown)"));
  assert.match(agree, /phase: "registration", situation: readyAnswersSituation\(locale, choice\.answers, choice\.note\), answers: pickedReadyAnswers\(choice\.answers\)/);
  // The lines on that screen are ours, one per picked answer, so it needs no server answer.
  assert.match(finalPresentation, /const lines = answers\.length \? answers\.map\(\(answer\) => t\(PROGRAMME_ANSWER_FOCUS\[answer\]\)\) : fallbackFocus \? \[fallbackFocus\] : \[\];/);
  assert.match(finalPresentation, /<ul>\{lines\.map\(\(line\) => <li key=\{line\}>\{line\}<\/li>\)\}<\/ul>/);
  // The consent is recorded before the answers are sent, in that order, behind the screen.
  const prepare = frontend.slice(frontend.indexOf("async function prepareStartingPoint"), frontend.indexOf("async function readyForRegistration"));
  assert.ok(prepare.indexOf("/api/program/program-ai/authority") < prepare.indexOf("/api/program/program-ai/turn"));
  assert.match(prepare, /statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION/);
  // Every registration action waits for the Starting Point, and support first suppresses it.
  const ready = frontend.slice(frontend.indexOf("async function readyForRegistration"), frontend.indexOf("async function continueAfterSupport"));
  assert.match(ready, /return ready\?\.phase === "registration" \? ready : null;/);
  for (const handler of ["async function handleEmail", "async function handleGoogle"]) {
    const body = frontend.slice(frontend.indexOf(handler), frontend.indexOf(handler) + 900);
    assert.match(body, /await readyForRegistration\(\)/, handler);
    assert.ok(body.indexOf("readyForRegistration()") < body.indexOf("ensureClaim("), handler);
  }
  assert.match(frontend, /if \(ready\?\.phase !== "registration"\) return;\s+if \(newClaim\) await prepareClaimForRegistration\(journey, ready\);\s+else await ensureClaim\(journey, ready, PENDING_CLAIM_FRESH_FOR_EMAIL_MS\);\s+await redeemClaim\(userId, journey, ready\);/);
});

test("the pending claim is made behind the screen, reused only while fresh, and made again if it lapsed", () => {
  // Founder decision, 11 Oct 2026: a press on Google or email does not wait for the claim.
  const prepare = frontend.slice(frontend.indexOf("async function prepareStartingPoint"), frontend.indexOf("async function readyForRegistration"));
  // After the answers, and only when the server said "continue"; a failure is left to the press.
  assert.ok(prepare.indexOf("/api/program/program-ai/turn") < prepare.indexOf("await prepareClaimForRegistration(journey, ready);"));
  assert.match(prepare, /if \(ready\.phase === "registration"\) \{[\s\S]*await prepareClaimForRegistration\(journey, ready\);\s+const claimed: ProgramAiLocalState = \{ \.\.\.ready, claimReadyAt: Date\.now\(\) \};[\s\S]*\} catch \{\s+return ready;\s+\}/);
  // New answers reset the server's state, so an older claim is never carried over.
  assert.match(prepare, /delete ready\.claimReadyAt;/);
  // A press reuses the claim only while it is fresh; Google gets the shorter window.
  assert.match(frontend, /if \(!pendingClaimIsFresh\(state\.claimReadyAt, freshForMs\)\) await prepareClaimForRegistration\(journey, state\);/);
  assert.match(frontend, /await ensureClaim\(subject, ready, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS\);/);
  assert.match(frontend, /await ensureClaim\(subject, ready, PENDING_CLAIM_FRESH_FOR_EMAIL_MS\);/);
  // A lapsed or reset claim is made again and redeemed once more; a manual retry always makes a new one.
  assert.match(frontend, /\} catch \(cause\) \{\s+if \(typeof state\.claimReadyAt !== "number"\) throw cause;\s+await prepareClaimForRegistration\(journey, state\);\s+await redeem\(userId, journey, state\);/);
  assert.match(frontend, /await saveForAccount\(userId, journey, readyForRegistration\(\), true\);/);
  // The claim stores nothing personal: the server keeps the confirmed content in the browser session.
  assert.match(service, /confirmedContentStorage: "browser_session"/);
});

test("an account that has not answered opens on the answers, and may open its plan instead", () => {
  // Founder decision, 11 Oct 2026: after sign-up on Log in a person sees the answers, not an
  // empty plan with a Start button. The answers are saved to the plan without another press.
  assert.match(frontend, /if \(nextHome\.primaryAction === "start-mission-one" && !planChosen\.current\) startMissionOneForAccount\(\);\s+else setPhase\("home"\);/);
  assert.equal((frontend.match(/showPlanOrAnswers\((?:payload|homePayload)\.home\)/g) || []).length, 3);
  assert.match(frontend, /if \(session\?\.user\.id\) void saveForAccount\(session\.user\.id, journey, pending\);/);
  assert.match(frontend, /onOpenPlan=\{signedIn && home \? openPlanInstead : undefined\}/);
  assert.match(frontend, /accessLine=\{!signedIn\}/);
  // An account that already affirmed access asks only for its journey's proof.
  assert.match(frontend, /if \(session\?\.user\.id\) await refreshAccountJourneyAccess\(window\.sessionStorage, journey\);\s+else await affirmAnonymousProgrammeAccess\(window\.sessionStorage\);/);
});

test("voice input is gone from the server: no route, adapter, bucket, permission or config remains", () => {
  // Founder decision, 11 Oct 2026. The last commit where voice worked end to end is tagged
  // archive/programme-voice-2026-10-11; docs/07_Decisions/ONE-SIGN-IN-FORM-2026-10-11.md (Part 3)
  // says how to bring it back.
  for (const removed of [
    "app/api/program/program-ai/transcription/route.ts",
    "app/api/program/program-ai/transcription/realtime/route.ts",
    "lib/programme/application/programme-ai-transcription.service.ts",
    "lib/programme/program-ai/openai-realtime-transcription.ts",
    "lib/programme/program-ai/realtime-transcription-client.ts",
    "lib/programme/program-ai/transcription-limits.ts",
    "lib/programme/program-ai/transcription-request.ts",
    "lib/programme/program-ai/voice-draft.ts",
  ]) assert.equal(existsSync(removed), false, removed);
  assert.doesNotMatch(read("lib/programme/mutation-access.ts"), /transcription/);
  assert.doesNotMatch(read("lib/programme/rate-limit.ts"), /TRANSCRIPTION/);
  assert.doesNotMatch(read("lib/programme/program-ai/runtime-config.ts"), /transcri/i);
  assert.doesNotMatch(read("lib/programme/program-ai/openai-adapters.ts"), /transcri|audio|realtime/i);
  assert.doesNotMatch(read("lib/programme/program-ai/ports.ts"), /transcri/i);
  assert.doesNotMatch(read("lib/programme/program-ai/provider-errors.ts"), /TRANSCRIPTION_FAILED|INPUT_TOO_LARGE/);
  assert.doesNotMatch(read("lib/programme/presentation.ts"), /transcri/i);
  assert.doesNotMatch(read("next.config.mjs"), /microphone=\(self\)|PROGRAMME_MICROPHONE_ROUTES/);
  assert.doesNotMatch(read(".env.example"), /TRANSCRIPTION/);
  // The picked answers travel as text through the turn route, which stays.
  assert.match(read("lib/programme/program-ai/validation.ts"), /const inputModes = \["text"\] as const;/);
  assert.equal(existsSync("app/api/program/program-ai/turn/route.ts"), true);
  // Access evidence is still derived per request from the current subject's own authority.
  assert.match(localSubjectStorage, /if \(!hasProgrammeAccessAuthority\(storage, subject, now\)\) return \{\}/);
});

test("account-not-linked recovery preserves the claim and requires authenticated explicit linking", () => {
  assert.match(frontend, /authError === "account_not_linked"|authError = authQuery\.get\("error"\)/);
  assert.match(frontend, /accountNotLinked/);
  assert.match(frontend, /authClient\.signIn\.email/);
  assert.match(frontend, /authClient\.linkSocial/);
  assert.match(frontend, /programmeGoogleCallbacks\(locale, "link"\)/);
  assert.match(frontendRuntime, /Your confirmed Starting Point stays in this browser/);
  const explicitLink = frontend.slice(frontend.indexOf("async function startGoogleLink"), frontend.indexOf("async function openMission"));
  assert.doesNotMatch(explicitLink, /clearProgrammeOAuthClaimMarker/);
});

test("the start screen owns the explicit consent: one statement above one button, and no tick", () => {
  const statement = /I agree that B4GAMBLE and its AI provider use my answers, which may reveal my health, to personalise my plan\./g;
  assert.equal((frontendRuntime.match(statement) || []).length, 1);
  const start = finalPresentation.slice(finalPresentation.indexOf("export function ProgrammeStartScreen"), finalPresentation.indexOf("export function ProgrammeAccessScreen"));
  assert.ok(start.search(statement) < start.indexOf("data-programme-agree"), "the statement stands above the button");
  assert.match(start, /disabled=\{answers\.length === 0\}/);
  assert.match(start, /t\("Agree and continue"\)/);
  // The only checkboxes on the start screen are the answers themselves.
  assert.equal((start.match(/type="checkbox"/g) || []).length, 1);
  assert.doesNotMatch(frontendRuntime, /Before you share\.|Withdrawal stops future processing|I confirm I am 18 or over|what I type or say/);
  assert.doesNotMatch(frontend, /type Phase[\s\S]*"legal"/);
});

test("Program AI reuses the signed access contract and exposes no anonymous clarification, editor or reward phase", () => {
  const sessionRoute = read("app/api/program/program-ai/session/route.ts");
  assert.match(sessionRoute, /verifyProgrammeAccessHeaders\(request\.headers/);
  // Founder decisions, 11 Oct 2026: continuing under the line is the 18+, Terms and Privacy
  // affirmation, on the start screen and for an account that has not affirmed yet.
  assert.equal((finalPresentation.match(/By continuing, you confirm you are 18\+ and accept the Terms and Privacy Notice\./g) || []).length, 2);
  assert.match(frontend, /await affirmAnonymousProgrammeAccess\(window\.sessionStorage\);/);
  assert.match(frontend, /await recordAccountProgrammeAccess\(\);/);
  assert.match(frontendRuntime, /<Link href="\/terms">\{t\("Read Terms"\)\}<\/Link>/);
  assert.match(frontendRuntime, /<Link href="\/privacy">\{t\("Read Privacy Notice"\)\}<\/Link>/);
  assert.doesNotMatch(frontendRuntime, /checks? before you begin|I accept the current|I have read the current/);
  assert.match(frontend, /clarificationAnswers: \[\]/);
  assert.match(frontend, /prepareClaimForRegistration/);
  // Founder decision, 11 Oct 2026: the save screen shows what the Programme will work on first
  // and does not repeat the picked answers back.
  assert.match(finalPresentation, /Here's what we can do together\./);
  assert.match(finalPresentation, /data-programme-understanding="">\s*<ul>/);
  assert.doesNotMatch(finalPresentation, /candidate\.|Your Starting Point is ready|Your Starting Point, in your words|save my Starting Point/);
  // Email, then password, then the button, all visible at once.
  assert.doesNotMatch(finalPresentation, /passwordShown/);
  // Founder decision, 11 Oct 2026: one email step creates the account or signs in.
  assert.match(frontendRuntime, /Continue with email/);
  assert.match(frontend, /continueWithEmail\(\{ email: input\.email, password: input\.password, expect: googleLinkRecovery \? "existing-only" : "new" \}/);
  assert.doesNotMatch(frontendRuntime, /Use email instead|Already have an account\? Sign in|Need an account\? Create one/);
  assert.match(frontend, /async function handleGoogle\(input: \{ marketingAllowed: boolean \}\)[\s\S]*requestSignUp: true/);
  assert.doesNotMatch(frontendRuntime, /function (?:ClarificationScreen|CandidateScreen|RewardScreen)/);
  assert.doesNotMatch(frontendRuntime, /phase === "(?:clarification|candidate|reward)"/);
  assert.doesNotMatch(frontendRuntime, /What would you like to change\?|What should Mission 02 continue from\?|Confirm my Starting Point|Keep this progress/);
  assert.match(frontend, /emailRedeemStarted\.current = true/);
  assert.match(frontend, /session\?\.user\.id && emailRedeemStarted\.current/);
  assert.match(repository, /if \(current && !current\.withdrawnAt\) return current/);
  assert.match(repository, /data: \{ anonymousSessionId: null, userId: input\.userId \}/);
});

test("Programme phase changes and legacy controls preserve keyboard and assistive-technology state", () => {
  const legacy = read("components/programme/ActiveControlProgramme.tsx");
  assert.match(frontend, /data-programme-phase=\{phase\}/);
  assert.match(frontend, /phaseFocusRef\.current/);
  assert.match(frontendRuntime, /name="email"/);
  assert.match(frontendRuntime, /name="password"/);
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
    read("lib/affiliate-commercial/gb-commercial-route-readiness.ts"),
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

test("Mission 10 enrollment completion commits before contained best-effort analytics", () => {
  assert.match(missionsService, /this\.unitOfWork\.serializable/);
  assert.match(missionsService, /missionNumber === 10[\s\S]*ensureProgrammeCompletion/);
  assert.match(progressRepository, /where: \{ id: enrollmentId, completedAt: null \}/);
  assert.ok(completionRoute.indexOf("const result = await programmeAiMissionsService.complete")
    < completionRoute.indexOf("scheduleProgrammeStateObservation(user.id"));
  assert.match(programmeObserver, /work\(\)\.catch/);
});

test("Home exposes truthful states and only the approved review entitlements", () => {
  assert.match(missionsService, /programAiReviewDefinitions/);
  assert.match(missionsService, /status: byMission\.get\(review\.unlockMission\)\?\.status === "COMPLETED"/);
  assert.doesNotMatch(frontend + authenticatedHome, /% complete|progressPercent|Math\.round\([^)]*100/);
  assert.match(authenticatedHome, /Completion, current position and locks come from your server record/);
  assert.match(authenticatedHome, /Each Review becomes available at a meaningful point/);
  assert.doesNotMatch(authenticatedHome + missionsService, /completionPercent|Programme completion|home\.currentMission \* 10/);
  assert.doesNotMatch(authenticatedHome, /home\.currentMission \+ 1|\.filter\(\(mission\) => mission\.status === "completed"\)|Up next/);
  assert.doesNotMatch(authenticatedHome, /actionsCompleted \+ 1/);
  assert.doesNotMatch(authenticatedHome, /home\.currentMission >= 2/);
  assert.match(missionsService, /primaryAction: "start-mission-one" as const/);
  assert.match(missionsService, /currentMission === 1[\s\S]*missionOne\.actionsCompleted > 0[\s\S]*"finish-mission-one" as const[\s\S]*"start-mission-one" as const[\s\S]*currentProgress\?\.status === "COMPLETED"[\s\S]*"review-mission" as const[\s\S]*currentProgress\?\.taskStates\.length[\s\S]*"resume-mission" as const[\s\S]*"start-mission" as const/);
  assert.doesNotMatch(authenticatedHome, /~6 min left|Week 2 review unlocks after Mission 05/);
  assert.doesNotMatch(authenticatedHome, /once your plan is built, not before/);
  assert.doesNotMatch(authenticatedHome, /Research links are temporarily unavailable/);
  assert.ok(!authenticatedHome.includes("Use the main navigation for public casino information"), "the research card is not shown before research opens");
  // Founder decision 25 Sep 2026: the same generic research links lead the dashboard once the research Mission is
  // complete. The server says so (`researchAccess`); the dashboard no longer reads a Mission number for it.
  assert.ok(authenticatedHome.includes('const researchFeatured = home.discoveryLinks.length > 0 && home.researchAccess === "open";'));
  assert.ok(!authenticatedHome.includes("mission.missionNumber === 8"));
  // A person sees a Mission's step, its place in the journey; the number stays its identity.
  assert.ok(authenticatedHome.includes('number: String(home.currentStep).padStart(2, "0")'));
  assert.ok(authenticatedHome.includes('<b>{String(mission.step).padStart(2, "0")}</b>'));
  assert.ok(!authenticatedHome.includes("String(home.currentMission)") && !authenticatedHome.includes("String(mission.missionNumber)"));
  assert.ok(authenticatedHome.includes('data-programme-research="featured"'));
  assert.ok(authenticatedHome.includes("{researchFeatured ? research : null}"));
  assert.ok(!authenticatedHome.includes("{researchFeatured ? null : research}"), "no research card before the lesson (Founder, 10 October 2026)");
  assert.doesNotMatch(authenticatedHome, /Review or update/);
  assert.match(authenticatedHome, /Saved Starting Point/);
  assert.match(authenticatedHome, /home\.primaryAction === "review-mission" \? "Mission complete" : "Current mission"/);
  assert.match(authenticatedHome, /programmePrimaryActionLabel\(home\.primaryAction, locale\)/);
  assert.match(authenticatedHome, /home\.primaryAction === "finish-mission-one"/);
  assert.match(authenticatedHome, /For privacy, the situation itself was not retained/);
  assert.match(frontend, /onMissionOneEntry=\{startMissionOneForAccount\}/);
  assert.doesNotMatch(authenticatedHome + frontend, /continue-mission-one|Continue Mission 01|startFromHome/);
});

test("Home presentation copy uses total Mission guidance and projected Review distance", () => {
  assert.equal(programmeMissionProgressCopy({
    missionNumber: 1,
    step: 1,
    title: "Map the moment",
    status: "current",
    actionsCompleted: 1,
    actionsTotal: 2,
    xpEarnedHere: 20,
    completionBonus: 0,
  }, "en-GB"), "1 of 2 actions complete · Short Starting Point");
  assert.equal(programmeMissionProgressCopy({
    missionNumber: 4,
    step: 5,
    title: "Build one boundary",
    status: "current",
    actionsCompleted: 2,
    actionsTotal: 3,
    xpEarnedHere: 35,
    completionBonus: 25,
  }, "en-GB"), "2 of 3 actions complete · About 5–8 min total");

  const firstReview = {
    milestone: "first" as const,
    unlockMission: 3 as const,
    unlockStep: 4,
    title: "First Personal Review",
    maxWords: 250,
    status: "locked" as const,
  };
  assert.equal(programmeReviewStatusCopy({
    reviews: [firstReview],
    nextReview: { ...firstReview, xpRemaining: 265, missionsRemaining: 4 },
  }, "en-GB"), "First Personal Review unlocks after Mission 04 · 4 Missions and 265 XP remaining.");
  assert.equal(programmeReviewStatusCopy({
    reviews: [{ ...firstReview, status: "available" }],
    nextReview: {
      milestone: "mid",
      unlockMission: 6,
      unlockStep: 7,
      title: "Mid-Programme Personal Review",
      xpRemaining: 225,
      missionsRemaining: 3,
    },
  }, "en-GB"), "A personal review is ready when you are. Next: Mid-Programme Personal Review unlocks after Mission 07 · 3 Missions and 225 XP remaining.");
});

test("mounted Mission presentation consumes server-owned action, reward and Review projections", () => {
  assert.match(missionsService, /actionsTotal: actions\.length/);
  assert.match(missionsService, /currentActionPosition: currentActionIndex >= 0 \? currentActionIndex \+ 1 : null/);
  assert.match(missionExperience, /completed: mission\.actionsCompleted, total: mission\.actionsTotal/);
  assert.match(missionExperience, /mission\.currentActionPosition/);
  assert.match(missionExperience, /home\.reviews\.find\(\(review\) => review\.unlockMission === mission\.missionNumber && review\.status === "available"\)/);
  assert.match(missionExperience, /completionReceipt\?\.xpAwarded/);
  assert.match(missionExperience, /mission\.completionBonus/);
  assert.doesNotMatch(missionExperience, /actionsCompleted \+ 1|\/3 ACTIONS|\[3, 6, 10\]\.includes/);
  assert.doesNotMatch(missionExperience, /Mission complete\. 25 XP earned|Complete Mission · \+25 XP|adds the 25 XP/);
});

test("support-first presents the Mission 01 XP projection returned by the server", () => {
  assert.match(frontend, /progress: \{ taskStates: string\[\]; xpPreview: number \}/);
  assert.match(frontend, /xpPreview: payload\.progress\?\.xpPreview \?\? 0/);
  assert.match(frontend, /xpPreview=\{local\.xpPreview\}/);
  assert.match(finalPresentation, /Your \{xp\} XP for describing the situation is preserved/);
  assert.doesNotMatch(finalPresentation, /Your 20 XP for describing the situation is preserved/);
});

test("consumer Programme uses distinct interaction primitives and hides provider/debug language", () => {
  for (const primitive of ["ChoiceCards", "SequenceBuilder", "DecisionApplication", "StackBuilder", "AiCandidatePicker", "ProgrammeTimeline"]) {
    assert.match(missionExperience + missionPrimitives, new RegExp(primitive));
  }
  assert.doesNotMatch(missionExperience + reviewScreen + authenticatedHome, /PRIVATE STRUCTURAL REVIEW|BOUNDED AI REVIEW|DETERMINISTIC REVIEW|Provider-off|provider-failure|Generic public navigation|No Programme data is sent|criterion IDs/);
  assert.doesNotMatch(missionPrimitives, /guidance\.generation|deterministic_fallback|provider/);
  assert.match(missionExperience, /t\("Check sequence · \+\{xp\} XP when correct", \{ xp: current\.xp \}\)/);
  assert.match(missionExperience, /No XP awarded\. Adjust the order and try again/);
});

test("public 10-steps metadata uses Starting Point truth and removes stale Moment Map copy", () => {
  const tenStepsPage = read("app/(public)/10-steps/page.tsx");
  const tenStepsCatalog = read("lib/i18n/static-pages/ten-steps.ts");
  assert.match(tenStepsPage, /tenStepsTranslation\(presentation\.locale\)/);
  assert.match(tenStepsCatalog, /build a personal Starting Point/);
  assert.doesNotMatch(tenStepsPage + tenStepsCatalog, /Moment Map/);
});

test("the research Mission's completion marks the moment casino research opens (Founder, 10 October 2026)", () => {
  const experience = readFileSync("components/programme/ProgramAiMissionExperience.tsx", "utf8");
  const stylesheet = readFileSync("components/programme/ProgramAiAuthenticated.module.css", "utf8");
  const catalogue = readFileSync("lib/i18n/programme-catalog.ts", "utf8");

  // Shown only by the Mission that opens research, and only when the server says research is open.
  assert.ok(experience.includes('const researchOpened = mission.missionNumber === researchAccessMission && home.researchAccess === "open";'));
  assert.ok(experience.includes("{researchOpened ? <ResearchOpened locale={locale} fresh={newlyCompleted} /> : null}"));
  assert.ok(experience.includes("{researchOpened ? <ResearchChecklist artifact={mission.artifact} locale={locale} /> : null}"));
  assert.ok(experience.includes("{mission.missionNumber === 10 ? <CommercialNext locale={locale} /> : null}"));

  // The links are the fixed public routes. Nothing the person entered reaches a URL or picks a link.
  const opened = experience.slice(experience.indexOf("function ResearchOpened("), experience.indexOf("function ResearchChecklist("));
  assert.deepEqual([...opened.matchAll(/programmePublicHref\(locale, "([^"]+)"\)/g)].map((match) => match[1]), ["/casinos", "/bonuses", "/best-offers"]);
  assert.ok(!/artifact|startingPoint|localWording|[?&]\w+=/.test(opened), "no Programme content in the opening block");
  assert.ok(opened.includes("window.localStorage.setItem(RESEARCH_OPENED_AT_STORAGE_KEY, String(Date.now()));"), "the menu's new-link mark starts from this moment, in this browser only");
  assert.ok(opened.includes("window.dispatchEvent(new Event(RESEARCH_ACCESS_CHANGED_EVENT));"), "the menu on the same page changes with the screen");
  assert.ok(!/fetch\(|sendBeacon|document\.cookie/.test(opened));

  // The checklist block shows what the person built and the Programme's stance; its only link is the guide.
  const checklist = experience.slice(experience.indexOf("function ResearchChecklist("), experience.indexOf("function CommercialNext("));
  assert.ok(checklist.includes('humanValue(criterion, locale, "researchCriteria")'));
  assert.deepEqual([...checklist.matchAll(/programmePublicHref\(locale, "([^"]+)"\)/g)].map((match) => match[1]), ["/bonus-guide"]);

  // Every new line is translated in every Programme language: thirteen cells per row.
  for (const key of [
    "NEW IN YOUR MENU",
    "Casinos, bonuses and offers are now open to you",
    "You completed this Mission, so these sections are now in your menu on every page.",
    "The Programme does not ask you to give play up. It helps you keep it inside limits you choose. Check every offer against your checklist first.",
    "Your checklist",
  ]) {
    const row = catalogue.split("\n").find((line) => line.startsWith(`  [${JSON.stringify(key)}, `));
    assert.ok(row, key);
    const cells = JSON.parse(row!.trim().replace(/,$/, "")) as string[];
    assert.equal(cells.length, 13, key);
    assert.equal(new Set(cells).size, 13, `${key}: every language has its own wording`);
  }

  // Readable and reachable: 16px links with a 48px target, and no motion for readers who ask for none.
  assert.ok(stylesheet.includes(".researchReveal nav a { min-height: 48px;"));
  assert.match(stylesheet, /\.researchReveal nav a \{[^}]*font-size: 16px;/);
  assert.ok(stylesheet.includes('@media (prefers-reduced-motion: reduce) { .researchReveal[data-programme-research-opened="fresh"] { animation: none; } }'));
});

// Founder walk in Swedish on a phone, 12 October 2026.
test("Programme home research links open in the Programme's language and the home carries no second My Programme pill", async () => {
  // The links keep their fixed targets and order; each is written past the unprefixed address's redirect.
  const { programmePublicHref, PROGRAMME_ROUTES } = await import("../lib/programme/presentation");
  const { commercialDiscoveryLinks } = await import("../lib/programme/program-ai/mission-registry");
  assert.deepEqual(commercialDiscoveryLinks.map((link) => link.href), ["/casinos", "/bonuses", "/best-offers"]);
  assert.ok(authenticatedHome.includes("{home.discoveryLinks.map((item) => <a href={programmePublicHref(locale, item.href)} key={item.href}"));
  assert.ok(!authenticatedHome.includes("<a href={item.href}"), "no research link goes through the redirect");
  assert.deepEqual(commercialDiscoveryLinks.map((link) => programmePublicHref("sv-SE", link.href)), ["/sv/casinos", "/sv/bonuses", "/sv/best-offers"]);
  for (const route of PROGRAMME_ROUTES) {
    for (const link of commercialDiscoveryLinks) assert.equal(programmePublicHref(route.locale, link.href), `/${route.language}${link.href}`, `${route.locale} ${link.href}`);
  }
  // Labels and the analytics destination still read the fixed target, not the localized address.
  assert.ok(authenticatedHome.includes("const destinationRoute = discoveryDestination(item.href);"));
  assert.ok(authenticatedHome.includes("{discoveryLabel(item.href, locale)}"));

  // One "My Programme" on the Programme home: the site header's. The yellow label under it is gone.
  const contextHeader = read("components/programme/ProgramAiAuthenticatedHeader.tsx");
  assert.ok(!contextHeader.includes("myProgramme"));
  assert.ok(!contextHeader.includes("public-shell-catalog"));
  assert.ok(contextHeader.includes('{dashboard ? null : <span className={styles.programmeLabel}>{label ?? programmeText(locale, "10-STEP CONTROL PROGRAMME")}</span>}'));
  const stylesheet = read("components/programme/ProgramAiAuthenticated.module.css");
  assert.ok(!stylesheet.includes(".myProgramme"));
  assert.ok(stylesheet.includes(".dashboardShell .header[data-dashboard-header] { padding: 14px 0; gap: 24px; grid-template-columns: 1fr auto; }"), "XP and Log out keep their places on a wide screen");
});
