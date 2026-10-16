// Founder decision, 16 October 2026: the lesson of step 3 (Mission 08, "Research responsibly", a
// casino comparison and a bonus-terms checklist) is replaced by a help lesson, "Know who to turn
// to": one person or one help service, and where to turn when the urge comes. The Mission number,
// its place in the journey, its rewards and its prerequisites stay. Answers stored under the old
// lesson must not break any screen. Decision record: docs/07_Decisions/STEP3-HELP-LESSON-2026-10-16.md.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ProgramAiHome, ProgramAiMission } from "../components/programme/ProgramAiAuthenticated.types";
import { programmeMissionCopy, programmeText, type ProgrammeMessageKey } from "../lib/i18n/programme-catalog";
import { currentProgrammeJourney, tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { controlProgrammePath } from "../lib/programme/contract";
import { PROGRAMME_LOCALES, PROGRAMME_ROUTES, programmePath, type ProgrammeLocale } from "../lib/programme/presentation";
import {
  HELP_SERVICE_SOURCES,
  keepNumbersTogether,
  PROGRAMME_HELP_SERVICE_TYPES,
  programmeHelpMarket,
} from "../lib/programme/program-ai/help-services";
import {
  deterministicFinalPlanText,
  presentMissionArtifact,
  programmeMissionKeepsake,
} from "../lib/programme/program-ai/mission-presentation";
import { parseGeneratedResult } from "../lib/programme/program-ai/mission-guidance";
import {
  actionAwardKey,
  actionTaskState,
  completionAwardKey,
  missionStep,
  missionsBefore,
  programAiMissionDefinition,
  programmeJourney,
  programmeMissionTitles,
} from "../lib/programme/program-ai/mission-registry";
import { parseProgramAiMissionAction } from "../lib/programme/program-ai/mission-validation";
import { questionOptionLineEntries, questionWhyLine } from "../lib/programme/program-ai/question-screen";
import { ProgrammeAiGuidanceService } from "../lib/programme/application/programme-ai-guidance.service";
import { ProgrammeAiMissionsService } from "../lib/programme/application/programme-ai-missions.service";
import { fakeUnitOfWork, readyMissionTen } from "./fixtures/programme-ai-fake-unit-of-work";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const STEP_THREE = 8;
type Artifact = Record<string, string | number | boolean | string[]>;
const NEW_ANSWERS: Readonly<Record<"learn_comparison_signals" | "decode_offer_terms" | "build_research_checklist", Artifact>> = {
  learn_comparison_signals: { trustedPerson: "friend", openingLine: "one_word" },
  decode_offer_terms: { helpService: "phone" },
  build_research_checklist: { firstTenMinutes: ["phone_away", "send_line", "contact_service"] },
};
const OLD_ARTIFACT = {
  comparisonSignals: ["licensing_status", "material_terms"],
  offerTermSignal: "wagering_requirement",
  researchCriteria: ["licensing_status", "terms", "withdrawals"],
};
const LESSON_KEYS: readonly ProgrammeMessageKey[] = [
  "Who is one person you could tell?",
  "Choose who they are to you, not their name. Nobody is contacted and nothing is sent.",
  "Your person", "My partner", "Someone in my family", "A friend", "Someone at work", "Someone who has been there", "A doctor or counsellor", "Nobody yet: a help service first",
  "What you would say",
  "Can you call me? I'm having a hard moment.", "I want to tell you something about my gambling.", "If I text you one word, can you call me?", "Can you ask me how it is going this week?", "I would like to talk about my gambling.",
  "Or write the line in your own words…",
  "Which kind of help would you try first?",
  "Choose the one you would really use. You will see who answers and when.",
  "Your help service", "Talk on the phone", "Write in a chat", "Join a group or see a counsellor", "Get help with money and debt", "Help for the people close to me",
  "YOUR HELP SERVICE", "Call {number}", "Open the website", "When the urge comes", "When it is closed", "If you have thoughts of suicide",
  "The Help page lists help services.", "Call your local emergency number now.", "See the Help page",
  "What will you do in the first 10 minutes of an urge?",
  "Choose two or three moves, in the order you will make them.",
  "Your first 10 minutes", "Put the phone away", "Send my line to my person", "Call or write to my help service", "Wait for 10 minutes", "Go outside or move", "Read my support card",
  "MY SUPPORT CARD", "My person", "What I will say", "My help service", "First 10 minutes",
  "Your person, your help service and your first 10 minutes.",
];

function withProgrammeAi<T>(run: () => Promise<T>) {
  const previous = process.env.PROGRAM_AI_V1_ENABLED;
  process.env.PROGRAM_AI_V1_ENABLED = "true";
  return run().finally(() => {
    if (previous === undefined) delete process.env.PROGRAM_AI_V1_ENABLED;
    else process.env.PROGRAM_AI_V1_ENABLED = previous;
  });
}

/** A person who finished steps 1 and 2 and holds a Mission 08 record from the earlier lesson. */
function personWithOldStepThree(status: "COMPLETED" | "IN_PROGRESS", actions = 3) {
  const fake = fakeUnitOfWork();
  const now = new Date("2026-09-13T22:59:14.000Z");
  const definition = programAiMissionDefinition(STEP_THREE)!;
  fake.progress.set(2, { ...fake.progress.get(2)!, status: "COMPLETED", taskStates: programAiMissionDefinition(2)!.actions.map((action) => actionTaskState(2, action.id)), completedAt: now });
  fake.progress.set(STEP_THREE, {
    id: "00000000-0000-4000-8000-000000000008",
    enrollmentId: fake.enrollment.id,
    missionNumber: STEP_THREE,
    status,
    taskStates: definition.actions.slice(0, actions).map((action) => actionTaskState(STEP_THREE, action.id)),
    draft: { programAiV1: { version: definition.artifactVersion, artifact: OLD_ARTIFACT } },
    completedAt: status === "COMPLETED" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  for (const action of definition.actions.slice(0, actions)) fake.xpEvents.set(actionAwardKey(STEP_THREE, action.id), action.xp);
  if (status === "COMPLETED") fake.xpEvents.set(completionAwardKey(STEP_THREE), 25);
  return fake;
}

test("step 3 keeps its Mission number, place, action identities, rewards and prerequisite", () => {
  const definition = programAiMissionDefinition(STEP_THREE)!;
  assert.deepEqual(programmeJourney, [1, 2, 8, 3, 4, 5, 6, 7, 9, 10]);
  assert.equal(missionStep(STEP_THREE), 3);
  assert.deepEqual(missionsBefore(STEP_THREE), [1, 2]);
  assert.equal(definition.prerequisite, 2);
  assert.equal(definition.artifactVersion, "programme-ai-v1:mission-08");
  assert.deepEqual(definition.actions.map((action) => [action.id, action.xp]), [["learn_comparison_signals", 15], ["decode_offer_terms", 20], ["build_research_checklist", 15]]);
  assert.equal(actionAwardKey(STEP_THREE, "decode_offer_terms"), "programme-ai-v1:m08:decode_offer_terms:xp");
  assert.equal(completionAwardKey(STEP_THREE), "programme-ai-v1:m08:complete:xp");
  assert.equal(programmeMissionTitles[STEP_THREE - 1], "Know who to turn to");
  assert.equal(controlProgrammePath[STEP_THREE - 1], "Know who to turn to");
});

test("the help lesson takes closed answers only; the research answers and anything extra are refused", () => {
  for (const [action, artifact] of Object.entries(NEW_ANSWERS)) {
    assert.deepEqual(parseProgramAiMissionAction(STEP_THREE, { action, artifact }).artifact, artifact, action);
  }
  for (const value of PROGRAMME_HELP_SERVICE_TYPES) parseProgramAiMissionAction(STEP_THREE, { action: "decode_offer_terms", artifact: { helpService: value } });
  const refused: Array<[string, Record<string, unknown>]> = [
    ["learn_comparison_signals", { comparisonSignals: ["licensing_status", "material_terms"] }],
    ["decode_offer_terms", { offerTermSignal: "wagering_requirement" }],
    ["build_research_checklist", { researchCriteria: ["licensing_status", "terms", "withdrawals"] }],
    // A name, a number or a service picked by name never reaches the server.
    ["learn_comparison_signals", { trustedPerson: "friend", openingLine: "call_me", name: "Anna" }],
    ["learn_comparison_signals", { trustedPerson: "Anna", openingLine: "call_me" }],
    ["decode_offer_terms", { helpService: "Stödlinjen" }],
    ["decode_offer_terms", { helpService: "phone", phone: "020-81 91 00" }],
    ["build_research_checklist", { firstTenMinutes: ["phone_away"] }],
    ["build_research_checklist", { firstTenMinutes: ["phone_away", "send_line", "contact_service", "go_outside"] }],
  ];
  for (const [action, artifact] of refused) {
    assert.throws(() => parseProgramAiMissionAction(STEP_THREE, { action, artifact }), Error, `${action} ${JSON.stringify(artifact)}`);
  }
  // The final plan offers the support card instead of the research checklist.
  assert.deepEqual(parseProgramAiMissionAction(10, { action: "assemble_final_plan", artifact: { planPriorityIds: ["support_card", "boundary"] } }).artifact, { planPriorityIds: ["support_card", "boundary"] });
  assert.throws(() => parseProgramAiMissionAction(10, { action: "assemble_final_plan", artifact: { planPriorityIds: ["research"] } }));
});

test("a step 3 finished under the research lesson opens as already complete, and no other screen breaks", async () => withProgrammeAi(async () => {
  const fake = personWithOldStepThree("COMPLETED");
  const service = new ProgrammeAiMissionsService(fake.unit as never);
  const mission = await service.mission("user-a", STEP_THREE);
  assert.equal(mission.status, "completed");
  assert.equal(mission.legacyCompletion, true, "the earlier lesson's result is not shown as an empty card");
  assert.deepEqual(mission.artifact, {}, "no research answer is sent to the screen");
  const home = await service.home("user-a");
  assert.equal(home.missions.find((item) => item.missionNumber === STEP_THREE)?.status, "completed");
  assert.equal(home.currentMission, 3, "the journey goes on to step 4");
  // Step 10's timeline, its plan and the full Review read every completed Mission: the old record is left out.
  readyMissionTen(fake);
  fake.progress.set(STEP_THREE, { ...fake.progress.get(STEP_THREE)!, draft: { programAiV1: { version: "programme-ai-v1:mission-08", artifact: OLD_ARTIFACT } } });
  const missionTen = await service.mission("user-a", 10);
  assert.ok("programmeFacts" in missionTen);
  assert.ok(!missionTen.programmeFacts.facts.some((fact) => fact.missionNumber === STEP_THREE), "the research answers are not a fact of the plan");
  fake.progress.set(10, { ...fake.progress.get(10)!, status: "COMPLETED", completedAt: new Date("2026-09-13T23:01:52.000Z") });
  const review = await service.reviewContext("user-a", 10);
  assert.deepEqual(review.facts.find((fact) => fact.missionNumber === STEP_THREE)?.artifact, {});
  assert.doesNotMatch(JSON.stringify(review), /comparisonSignals|offerTermSignal|researchCriteria|wagering/);
}));

test("a step 3 begun under the research lesson continues with the help questions and drops the old answers", async () => withProgrammeAi(async () => {
  const fake = personWithOldStepThree("IN_PROGRESS", 1);
  const service = new ProgrammeAiMissionsService(fake.unit as never);
  const before = await service.mission("user-a", STEP_THREE);
  assert.equal(before.legacyCompletion, false);
  assert.deepEqual(before.artifact, {});
  assert.equal(before.currentAction, "decode_offer_terms", "the saved action and its XP stay");
  const saved = await service.recordAction("user-a", STEP_THREE, { action: "decode_offer_terms", artifact: { helpService: "chat" } });
  assert.equal(saved.xpAwarded, 20);
  assert.deepEqual(saved.mission.artifact, { helpService: "chat" });
  assert.deepEqual(fake.progress.get(STEP_THREE)!.draft, { programAiV1: { version: "programme-ai-v1:mission-08", artifact: { helpService: "chat" } } }, "the research answers are gone from the record");
  await service.recordAction("user-a", STEP_THREE, { action: "build_research_checklist", artifact: { firstTenMinutes: ["wait_ten_minutes", "contact_service"] } });
  const done = await service.complete("user-a", STEP_THREE);
  assert.equal(done.xpAwarded, 25);
  assert.equal(done.mission.legacyCompletion, false);
  assert.deepEqual(Object.keys(done.mission.artifact).sort(), ["firstTenMinutes", "helpService"]);
}));

test("the help lesson end to end: 50 XP for its actions, 25 for its completion, and a full support card", async () => withProgrammeAi(async () => {
  const fake = personWithOldStepThree("IN_PROGRESS", 0);
  fake.progress.set(STEP_THREE, { ...fake.progress.get(STEP_THREE)!, draft: null });
  const service = new ProgrammeAiMissionsService(fake.unit as never);
  let xp = 0;
  for (const [action, artifact] of Object.entries(NEW_ANSWERS)) xp += (await service.recordAction("user-a", STEP_THREE, { action, artifact })).xpAwarded;
  const done = await service.complete("user-a", STEP_THREE);
  assert.equal(xp + done.xpAwarded, 75);
  assert.equal((await service.recordAction("user-a", STEP_THREE, { action: "decode_offer_terms", artifact: { helpService: "debt" } })).xpAwarded, 0, "a replay awards nothing");
  assert.deepEqual(done.mission.artifact, { ...NEW_ANSWERS.learn_comparison_signals, ...NEW_ANSWERS.decode_offer_terms, ...NEW_ANSWERS.build_research_checklist });
}));

test("the support card names the checked service, its number and hours, and the crisis line of the market", () => {
  const artifact = { ...NEW_ANSWERS.learn_comparison_signals, ...NEW_ANSWERS.decode_offer_terms, ...NEW_ANSWERS.build_research_checklist };
  const expected: Partial<Record<ProgrammeLocale, { service: string; crisis: RegExp; title: string; sentence: string }>> = {
    "sv-SE": { service: "Stödlinjen · 020-81 91 00 · Helgfria vardagar: mån 9–19, tis–ons 9–17, tors 11–19, fre 9–15", crisis: /^Självmordslinjen \(Mind\) · 90101 · dygnet runt, alla dagar · chatt på mind\.se\. Om det är bråttom: ring 112\.$/, title: "MITT STÖDKORT", sentence: "Om jag sms:ar dig ett ord, kan du ringa mig då?" },
    "da-DK": { service: "StopSpillet · 70 22 28 25 · Mandag–torsdag 9.00–21.00, fredag 9.00–17.00", crisis: /^Livslinien · 70\u00a0201\u00a0201 · alle dage fra kl\. 9 om morgenen til kl\. 5 om natten\. Er du akut selvmordstruet: ring 112\.$/, title: "MIT STØTTEKORT", sentence: "Hvis jeg skriver ét ord til dig, kan du så ringe til mig?" },
    "en-GB": { service: "National Gambling Helpline · 0808 8020 133 · Free, 24 hours a day, 7 days a week · In Wales: NHS Wales Helpline 0808 2819 265, free, 24 hours a day", crisis: /^Samaritans · 116\u00a0123 · any time, day or night, free from any phone\. If a life is at risk: call 999 or 112\.$/, title: "MY SUPPORT CARD", sentence: "If I text you one word, can you call me?" },
  };
  for (const [locale, want] of Object.entries(expected) as Array<[ProgrammeLocale, NonNullable<(typeof expected)["en-GB"]>]>) {
    const card = programmeMissionKeepsake(STEP_THREE, artifact, locale);
    assert.equal(card.title, want.title, locale);
    assert.equal(card.sentence, want.sentence, `${locale}: the chosen line is the card's sentence`);
    assert.ok(!card.rows.some((row) => row.key === "openingLine"), `${locale}: the line is shown once`);
    assert.equal(card.rows.find((row) => row.key === "helpService")?.value, keepNumbersTogether(want.service), locale);
    assert.match(card.rows.at(-1)!.value, want.crisis, locale);
    assert.equal(card.rows.at(-1)!.key, "crisisLine");
    // Words the person wrote in the tab replace the chosen line.
    assert.equal(programmeMissionKeepsake(STEP_THREE, artifact, locale, "  Ring mig nu  ").sentence, "Ring mig nu");
  }
  // Sweden's phone line closes evenings and weekends: the card adds the line that answers then.
  const swedish = programmeMissionKeepsake(STEP_THREE, artifact, "sv-SE").rows;
  assert.deepEqual(swedish.map((row) => row.key), ["trustedPerson", "helpService", "afterHours", "firstTenMinutes", "crisisLine"]);
  assert.equal(swedish.find((row) => row.key === "afterHours")!.value, keepNumbersTogether("Föreningen Spelfriheten · 08-37 43 00 · Öppet dygnet runt, året om"));
  // A language whose market we have not checked shows no number at all and points to the Help page.
  for (const locale of PROGRAMME_LOCALES.filter((value) => !programmeHelpMarket(value))) {
    const card = programmeMissionKeepsake(STEP_THREE, artifact, locale);
    const text = card.rows.map((row) => row.value).join(" ");
    assert.doesNotMatch(text, /\d{3}/, `${locale}: no unchecked number`);
    assert.ok(text.includes(programmeText(locale, "See the Help page")), locale);
    assert.equal(card.rows.at(-1)!.value, programmeText(locale, "Call your local emergency number now."), locale);
  }
  // An empty card from the earlier lesson still carries the crisis line.
  assert.equal(programmeMissionKeepsake(STEP_THREE, {}, "en-GB").rows.map((row) => row.key).join(), "crisisLine");
});

test("every checked service has its source page, a number or website, and one list per checked market", () => {
  assert.deepEqual(PROGRAMME_LOCALES.filter((locale) => programmeHelpMarket(locale)), ["en-GB", "sv-SE", "da-DK"]);
  const numbers = new Set<string>();
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const market = programmeHelpMarket(locale)!;
    for (const type of PROGRAMME_HELP_SERVICE_TYPES) {
      const service = market.services[type];
      assert.match(service.href, /^https:\/\//, `${locale} ${type}`);
      assert.ok(service.name && service.about && service.contact, `${locale} ${type}`);
      if (service.tel) assert.equal(service.tel, service.contact.replace(/\D/g, ""), `${locale} ${type}: the link dials the number shown`);
      if (service.tel) numbers.add(service.contact);
    }
    for (const service of Object.values(market.afterHours)) {
      if (service.tel) assert.equal(service.tel, service.contact.replace(/\D/g, ""), `${locale} ${service.name}: the link dials the number shown`);
    }
    assert.equal(market.crisis.tel, market.crisis.contact.replace(/\D/g, ""));
    assert.ok(market.crisis.emergency.includes(market.crisis.emergencyTel), `${locale}: the emergency link dials the number shown`);
    numbers.add(market.crisis.contact);
  }
  // The numbers as each service writes them (checked 16 October 2026); a change here is a deliberate re-check.
  assert.deepEqual([...numbers].sort(), ["0800 138 1111", "020-81 91 00", "0808 8020 133", "116 123", "63 40 11 49", "70 11 18 10", "70 201 201", "70 22 28 25", "90101"].sort());
  const sourceHosts = new Set(HELP_SERVICE_SOURCES.map((source) => new URL(source.url).host));
  for (const host of ["stodlinjen.se", "foreningenspelfriheten.se", "spelberoende.se", "www.konsumentverket.se", "mind.se", "www.1177.se", "www.stopspillet.dk", "ludomani.dk", "www.raad.dk", "www.livslinien.dk", "www.nhs.uk", "www.gambleaware.org", "www.gamcare.org.uk", "www.stepchange.org", "gamfam.org.uk", "www.samaritans.org"]) {
    assert.ok(sourceHosts.has(host), host);
  }
});

test("the lesson is written in all 13 Programme languages, with no casino word and no verdict on quitting", () => {
  for (const locale of PROGRAMME_LOCALES) {
    for (const key of LESSON_KEYS) {
      const value = programmeText(locale, key);
      assert.ok(value.trim(), `${locale} ${key}`);
      if (locale !== "en-GB") assert.notEqual(value, key, `${locale} ${key} is translated`);
      assert.doesNotMatch(value, /casino|kasino|καζίνο|казино|bonus|бонус|μπόνους|operator|оператор|wager|omsättning/i, `${locale} ${key}`);
    }
    const copy = programmeMissionCopy(locale, STEP_THREE);
    assert.doesNotMatch(`${copy.title} ${copy.description}`, /casino|kasino|καζίνο|казино|bonus|бонус|offer|erbjud|(?<!hjælpe|hjelpe)tilbud|research|undersök|undersøg|vergleich|compar/i, locale);
  }
  // Both readers: the person who wants control and the person who wants to stop. No line tells
  // either that they must quit or that they need not.
  const verdicts: Partial<Record<ProgrammeLocale, RegExp>> = {
    "en-GB": /\bquit|must stop|have to stop|need not stop|don't have to stop|stop gambling/i,
    "sv-SE": /sluta spela|måste sluta|behöver inte sluta/i,
    "da-DK": /stoppe med at spille|holde op med at spille|skal stoppe|behøver ikke stoppe/i,
  };
  for (const [locale, pattern] of Object.entries(verdicts) as Array<[ProgrammeLocale, RegExp]>) {
    const lesson = [...LESSON_KEYS.map((key) => programmeText(locale, key)), ...["learn_comparison_signals", "decode_offer_terms", "build_research_checklist"].flatMap((action) => [questionWhyLine(action)!, ...questionOptionLineEntries(action).map(([, line]) => line)].map((key) => programmeText(locale, key)))].join("\n");
    assert.doesNotMatch(lesson, pattern, locale);
    const market = programmeHelpMarket(locale)!;
    assert.doesNotMatch(JSON.stringify(market), pattern, `${locale} services`);
  }
});

test("the public 10 Steps page and the step lists show the help lesson as step 3, in every language", () => {
  for (const route of PROGRAMME_ROUTES) {
    const steps = currentProgrammeJourney(route.locale);
    assert.equal(steps[2].title, programmeMissionCopy(route.locale, STEP_THREE).title, route.locale);
    const text = tenStepsTranslation(route.locale).text;
    const missions = text.slice(20, 40).join("\n");
    assert.ok(missions.includes(steps[2].title), `${route.locale}: the page lists step 3`);
    assert.doesNotMatch(missions, /casino|kasino|bonus|operator|operatør|operatör|wager|offer terms|Research responsibly|Undersök ansvarsfullt|Undersøg ansvarligt/i, route.locale);
  }
  assert.equal(currentProgrammeJourney("en-GB")[2].title, "Know who to turn to");
  assert.equal(currentProgrammeJourney("sv-SE")[2].title, "Bestäm vem du vänder dig till");
  assert.equal(currentProgrammeJourney("da-DK")[2].title, "Bestem, hvem du kan gå til");
});

test("the final plan names the support card and leaves out a stored research checklist", () => {
  const facts = [{ missionNumber: STEP_THREE, artifact: { ...NEW_ANSWERS.learn_comparison_signals, ...NEW_ANSWERS.decode_offer_terms, ...NEW_ANSWERS.build_research_checklist } }];
  const plan = deterministicFinalPlanText({ facts, planPriorityIds: ["support_card"] }, "en-GB");
  assert.equal(plan, "Support card: A friend; Put the phone away · Send my line to my person; National Gambling Helpline");
  // A plan saved while "Research checklist" was a priority shows the rest of its priorities, not "Unavailable".
  assert.deepEqual(presentMissionArtifact({ planPriorityIds: ["research", "boundary"] }, "en-GB"), [{ key: "planPriorityIds", label: "Plan priorities", value: "Boundary" }]);
  assert.equal(deterministicFinalPlanText({ facts, planPriorityIds: ["research"] }, "en-GB"), "Review only the confirmed parts of your Programme; add nothing that is missing.");
});

test("the final plan never cuts a number, an opening time or a move of the support card", () => {
  const moves = ["phone_away", "send_line", "contact_service", "wait_ten_minutes", "go_outside", "read_card"];
  const moveSets: string[][] = [];
  for (let a = 0; a < moves.length; a += 1) for (let b = a + 1; b < moves.length; b += 1) {
    moveSets.push([moves[a], moves[b]]);
    for (let c = b + 1; c < moves.length; c += 1) moveSets.push([moves[a], moves[b], moves[c]]);
  }
  const people = ["partner", "family", "friend", "colleague", "been_there", "professional", "service_first"];
  let cases = 0;
  for (const locale of ["sv-SE", "da-DK", "en-GB", "de-DE", "el-GR"] as const) {
    const market = programmeHelpMarket(locale);
    const numbers = market ? [...Object.values(market.services), ...Object.values(market.afterHours)].flatMap((service) => service.tel ? [service.tel] : []) : [];
    const label = `${programmeText(locale, "Support card")}: `;
    for (const helpService of PROGRAMME_HELP_SERVICE_TYPES) for (const trustedPerson of people) for (const firstTenMinutes of moveSets) {
      const artifact = { trustedPerson, openingLine: "call_me", helpService, firstTenMinutes };
      const plan = deterministicFinalPlanText({ facts: [{ missionNumber: STEP_THREE, artifact }], planPriorityIds: ["support_card"] }, locale);
      const where = `${locale} ${helpService} ${trustedPerson} ${firstTenMinutes.join(",")}`;
      assert.ok(plan.startsWith(label), where);
      const segment = plan.slice(label.length);
      assert.ok(segment.length <= 84, `${where}: ${segment.length}`);
      assert.doesNotMatch(segment, /…/, `${where}: nothing is cut`);
      assert.doesNotMatch(segment, /\d[\s\u00a0\u2060.–-]+\d/, `${where}: no number or time range`);
      for (const tel of numbers) assert.ok(!segment.replace(/\D/g, "").includes(tel.slice(0, 5)), `${where}: no phone number`);
      assert.ok(segment.startsWith(presentMissionArtifact({ trustedPerson }, locale)[0].value), `${where}: the person comes first`);
      // In the three languages with a checked list the first move always fits after the person.
      if (market) assert.ok(segment.includes(presentMissionArtifact({ firstTenMinutes: [firstTenMinutes[0]] }, locale)[0].value), `${where}: the first move is kept`);
      cases += 1;
    }
  }
  assert.equal(cases, 5 * 5 * 7 * 35);
});

const now = "2026-10-16T09:00:00.000Z";

function homeAfterStepTwo(): ProgramAiHome {
  return {
    totalXp: 115, activeDays: 2, currentStreak: 1, achievements: [], currentMission: STEP_THREE, currentStep: 3,
    primaryAction: "start-mission", engagementDayBucket: "day_1", currentAction: null, startingPoint: null, weekGoal: null,
    missions: programmeJourney.map((missionNumber, index) => ({ missionNumber, step: index + 1, title: programmeMissionTitles[missionNumber - 1], status: index < 2 ? "completed" : index === 2 ? "current" : "locked", actionsCompleted: index < 2 ? 3 : 0, actionsTotal: missionNumber === 1 ? 2 : 3, xpEarnedHere: 0, completionBonus: missionNumber === 1 ? 0 : 25 })),
    reviews: [], nextReview: null,
  } as unknown as ProgramAiHome;
}

function stepThree(overrides: Partial<ProgramAiMission>): ProgramAiMission {
  return {
    missionNumber: STEP_THREE, step: 3, stepId: "step-8", title: "Know who to turn to", purpose: "", status: "in_progress",
    actions: [["learn_comparison_signals", 15], ["decode_offer_terms", 20], ["build_research_checklist", 15]].map(([id, xp]) => ({ id: id as string, label: id as string, xp: xp as number, completed: false })),
    currentAction: "learn_comparison_signals", currentActionPosition: 1, actionsCompleted: 0, actionsTotal: 3,
    artifact: {}, artifactVersion: "programme-ai-v1:mission-08", xpEarnedHere: 0, completionBonus: 25, completedAt: null, legacyCompletion: false,
    ...overrides,
  } as ProgramAiMission;
}

test("the screens of step 3 render the help lesson, its support card, and an old record as already complete", async () => {
  const { ProgramAiMissionExperience } = await import("../components/programme/ProgramAiMissionExperience");
  const render = (mission: ProgramAiMission, locale: ProgrammeLocale = "en-GB") => renderToStaticMarkup(
    <ProgramAiMissionExperience home={homeAfterStepTwo()} locale={locale} localWording="" mission={mission} onBack={() => undefined} onHome={() => undefined} onLocalWording={() => undefined} programmePath={programmePath(locale)} userId="step-three-user" />,
  );
  const first = render(stepThree({}));
  assert.match(first, /data-programme-action="learn_comparison_signals"/);
  for (const text of ["Who is one person", "Your person", "What you would say", "Nobody yet: a help service first", "If I text you one word, can you call me?", "Or write the line in your own words…"]) assert.ok(first.includes(text.replace("'", "&#x27;")), text);
  assert.doesNotMatch(first, /casino|bonus|wagering|checklist/i);
  const completed: Partial<ProgramAiMission> = { status: "completed", currentAction: null, currentActionPosition: null, actionsCompleted: 3, completedAt: now, actions: stepThree({}).actions.map((action) => ({ ...action, completed: true })), artifact: { ...NEW_ANSWERS.learn_comparison_signals, ...NEW_ANSWERS.decode_offer_terms, ...NEW_ANSWERS.build_research_checklist } };
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const done = render(stepThree(completed), locale);
    assert.match(done, /data-programme-completion=/, locale);
    assert.ok(done.includes(programmeText(locale, "MY SUPPORT CARD")), locale);
    assert.ok(done.includes(keepNumbersTogether(programmeHelpMarket(locale)!.services.phone.contact)), `${locale}: the number is on the card`);
    assert.ok(done.includes(keepNumbersTogether(programmeHelpMarket(locale)!.crisis.contact)), `${locale}: the crisis line is on the card`);
  }
  // An old research record, as the server sends it now: already complete, nothing of the research shown.
  const old = render(stepThree({ ...completed, artifact: {}, legacyCompletion: true }), "sv-SE");
  assert.ok(old.includes(programmeText("sv-SE", "ALREADY COMPLETE")));
  assert.doesNotMatch(old, /checklista|jämför|casino/i);
  // And a client still holding the old answers renders without them.
  const stale = render(stepThree({ ...completed, artifact: OLD_ARTIFACT as never }), "en-GB");
  assert.doesNotMatch(stale, /Licence|Wagering|Withdrawal|research/i);
});

test("the provider never writes a number, and the policy says the support card holds the checked ones", () => {
  const prompt = readFileSync("lib/programme/program-ai/openai-mission-guidance.ts", "utf8");
  assert.match(prompt, /PROGRAM_AI_MISSION_PROMPT_VERSION = "programme-ai-missions:2026-10-16:v3"/);
  assert.match(prompt, /Never write a phone number, opening hours, a website or the name of a help service, helpline or crisis line/);
  const review = (body: string) => ({ kind: "review", operation: "REVIEW_M10", title: "Your review", sections: ["where_started", "what_built", "in_place", "review_next", "one_screen"].map((id) => ({ id, title: "Part", body })) });
  assert.equal(parseGeneratedResult("REVIEW_M10", review("Keep your support card close.")).kind, "review");
  for (const body of ["Call 0808 8020 133 tonight.", "Ring 020-81 91 00.", "Ring 70222825."]) {
    assert.throws(() => parseGeneratedResult("REVIEW_M10", review(body)), Error, body);
  }
});

test("a service that cannot answer during an urge brings the market's phone line, and every card ends with a line that answers", async () => {
  const { HelpServiceCard } = await import("../components/programme/ProgramAiMissionPrimitives");
  const keys = (locale: ProgrammeLocale, helpService: string) => programmeMissionKeepsake(STEP_THREE, { ...NEW_ANSWERS.learn_comparison_signals, helpService, ...NEW_ANSWERS.build_research_checklist }, locale).rows.map((row) => row.key);
  const expected: Record<"sv-SE" | "da-DK" | "en-GB", Record<string, string[]>> = {
    "sv-SE": { phone: ["afterHours"], chat: ["afterHours"], in_person: ["urgeLine", "afterHours"], debt: ["urgeLine", "afterHours"], close_ones: ["afterHours"] },
    "da-DK": { phone: [], chat: [], in_person: ["urgeLine"], debt: ["urgeLine"], close_ones: ["urgeLine"] },
    "en-GB": { phone: [], chat: [], in_person: ["urgeLine"], debt: ["urgeLine"], close_ones: ["urgeLine"] },
  };
  for (const [locale, byService] of Object.entries(expected) as Array<["sv-SE" | "da-DK" | "en-GB", Record<string, string[]>]>) {
    const market = programmeHelpMarket(locale)!;
    for (const [helpService, extras] of Object.entries(byService)) {
      assert.deepEqual(keys(locale, helpService), ["trustedPerson", "helpService", ...extras, "firstTenMinutes", "crisisLine"], `${locale} ${helpService}`);
      const card = programmeMissionKeepsake(STEP_THREE, { helpService }, locale);
      const urge = card.rows.find((row) => row.key === "urgeLine");
      if (urge) {
        assert.equal(urge.label, programmeText(locale, "When the urge comes"));
        assert.ok(urge.value.includes(keepNumbersTogether(market.services.phone.contact)), `${locale} ${helpService}: the urge line has a number`);
      }
      // Every card but a chat carries a number to call, besides the crisis line.
      if (helpService !== "chat") assert.match(card.rows.filter((row) => row.key !== "crisisLine").map((row) => row.value).join(" "), /\d[\d\u00a0\u2060 -]{5,}\d/, `${locale} ${helpService}`);
      const html = renderToStaticMarkup(<HelpServiceCard locale={locale} service={helpService} />);
      assert.equal(html.includes(programmeText(locale, "When the urge comes")), Boolean(urge), `${locale} ${helpService}: the card on screen matches the keepsake`);
      assert.ok(html.includes(`href="tel:${market.crisis.emergencyTel}"`), `${locale}: the emergency number can be tapped`);
    }
  }
  // Wales: the British helpline and its chat serve England and Scotland; the card names the Welsh line.
  assert.match(programmeMissionKeepsake(STEP_THREE, { helpService: "phone" }, "en-GB").rows[0].value, /In Wales: NHS Wales Helpline 0808\u00a02819\u00a0265/);
  assert.match(renderToStaticMarkup(<HelpServiceCard locale="en-GB" service="chat" />), /For people in England and Scotland/);
  assert.match(renderToStaticMarkup(<HelpServiceCard locale="en-GB" service="phone" />), /Great\u00a0Britain/);
  // A language without a checked list still shows no number.
  assert.doesNotMatch(renderToStaticMarkup(<HelpServiceCard locale="de-DE" service="in_person" />), /tel:|\d{3}/);
});

test("question 3 leaves out \"Send my line to my person\" when the first question was answered under the earlier lesson", async () => {
  const { ProgramAiMissionExperience } = await import("../components/programme/ProgramAiMissionExperience");
  const atQuestionThree = (artifact: Artifact) => renderToStaticMarkup(
    <ProgramAiMissionExperience home={homeAfterStepTwo()} locale="en-GB" localWording="" mission={stepThree({ currentAction: "build_research_checklist", currentActionPosition: 3, actionsCompleted: 2, artifact, actions: stepThree({}).actions.map((action, index) => ({ ...action, completed: index < 2 })) })} onBack={() => undefined} onHome={() => undefined} onLocalWording={() => undefined} programmePath={programmePath("en-GB")} userId="step-three-user" />,
  );
  const withLine = atQuestionThree({ ...NEW_ANSWERS.learn_comparison_signals, ...NEW_ANSWERS.decode_offer_terms });
  assert.ok(withLine.includes("Send my line to my person"));
  assert.ok(withLine.includes("Wait for 10 minutes"));
  const withoutLine = atQuestionThree({ helpService: "chat" });
  assert.ok(!withoutLine.includes("Send my line to my person"));
  assert.ok(withoutLine.includes("Put the phone away"));
});

test("only the final plan and the full Review, which read the support card, refuse a phone-number-like run of digits", () => {
  const goal = (text: string) => ({ kind: "guidance", operation: "M2_GOAL", title: "Three ways to word it", summary: "Pick one.", options: [{ id: "candidate_1", text }] });
  for (const text of ["For seven days I keep to högst 10 000 kr.", "I check in on 2026-10-30."]) {
    assert.equal(parseGeneratedResult("M2_GOAL", goal(text)).kind, "guidance", text);
  }
  const plan = (text: string) => ({ kind: "guidance", operation: "M10_FINAL_PLAN", title: "Your plan", summary: "One screen.", options: [{ id: "plan", text }] });
  assert.equal(parseGeneratedResult("M10_FINAL_PLAN", plan("Keep your support card close.")).kind, "guidance");
  assert.throws(() => parseGeneratedResult("M10_FINAL_PLAN", plan("Ring 020-81 91 00.")));
});

test("a final plan saved with the retired research priority does not send it to the provider", async () => withProgrammeAi(async () => {
  const fake = personWithOldStepThree("COMPLETED");
  readyMissionTen(fake);
  const ten = programAiMissionDefinition(10)!;
  fake.progress.set(10, { ...fake.progress.get(10)!, taskStates: ten.actions.slice(0, 2).map((action) => actionTaskState(10, action.id)), draft: { programAiV1: { version: ten.artifactVersion, artifact: { timelineReviewed: true, planPriorityIds: ["research", "boundary"] } } } });
  const service = new ProgrammeAiMissionsService(fake.unit as never);
  let sent: unknown;
  const guidance = new ProgrammeAiGuidanceService(service, {
    generate: async (operation, context) => {
      sent = context;
      return { kind: "guidance", operation, title: "Your plan", summary: "One screen.", options: [{ id: "plan", text: "Keep the boundary." }], generation: "provider" } as never;
    },
  });
  await guidance.missionGuidance("user-a", 10, { locale: "en-GB" });
  assert.deepEqual((sent as { planPriorityIds: string[] }).planPriorityIds, ["boundary"]);
}));
