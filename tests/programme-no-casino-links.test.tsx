// Founder decision, 16 October 2026 ("Без казино для всех"): the Programme shows no casino, offer,
// bonus or comparison link to anyone, so that it ends in help. No Programme screen, card or letter
// links into the research section or to a partner route, and finishing step 3 ("Research
// responsibly") opens nothing in the menu. The research pages themselves stay public and keep
// their own menu. Decision record: docs/07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ProgramAiHome, ProgramAiMission } from "../components/programme/ProgramAiAuthenticated.types";
import { PAUSE_LETTER_SEEDS, pauseLetterSeedBodies } from "../lib/email/pause-letters/seed-templates";
import { emailTemplateLinksToCasinoPages, renderEmailTemplate, sanitizeEmailTemplate } from "../lib/email/templates.server";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { PROGRAMME_ROUTES, programmePath } from "../lib/programme/presentation";
import { missionStep, programmeJourney, programmeMissionTitles } from "../lib/programme/program-ai/mission-registry";
import { isResearchSectionRoute } from "../lib/research-access";

const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;

/**
 * A link into the research section or to a partner route, with or without a language prefix.
 * `/catalog` redirects to `/casinos`, so it counts too.
 */
const RESEARCH_HREF = /href="(?:https:\/\/b4gamble\.com)?(?:\/[a-z]{2}(?:-[a-z]{2})?)?\/(?:best-offers|casinos|casino|catalog|bonuses|compare|bonus-guide|wagering-calculator|outbound|r|go)(?:[/?#"]|$)/i;
/** The same targets written as a route literal in source. */
const RESEARCH_LITERAL = /["'`](?:\/[a-z]{2})?\/(?:best-offers|casinos|casino\/|catalog\b|bonuses|compare|bonus-guide|wagering-calculator|outbound|r\/|go\/)/;
/** The research section's roots as `lib/research-access.ts` lists them (it exports only its reader). */
const researchSectionRoots = [...readFileSync("lib/research-access.ts", "utf8").matchAll(/^\s+"(\/[a-z-]+)",$/gm)].map((match) => match[1]);

function sources(root: string) {
  return (readdirSync(root, { recursive: true }) as string[])
    .filter((name) => /\.(?:tsx|ts|mjs)$/.test(name) && !/\.test\./.test(name))
    .map((name) => `${root}/${name}`);
}

test("no Programme source names a research route or a partner route", () => {
  const programmeSources = [
    ...sources("app/program"),
    ...sources("app/api/program"),
    ...sources("components/programme"),
    ...sources("lib/programme"),
    ...sources("lib/email/pause-letters"),
  ];
  assert.ok(programmeSources.length > 60, "the scan covers the Programme");
  for (const path of programmeSources) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, RESEARCH_LITERAL, path);
    assert.doesNotMatch(source, /from "@\/lib\/research-access"|b4g_research_access|b4g:research-access|b4g_research_opened_at/, path);
    assert.doesNotMatch(source, /discoveryLinks|researchAccess|discoveryClicked|sourceSurface: "mission_(?:08|10)"|programme_home/, path);
  }
});

test("no Programme path is inside the research section, so the menu there never shows casino links", () => {
  for (const route of PROGRAMME_ROUTES) {
    for (const path of [programmePath(route.locale), `${programmePath(route.locale)}/missing`]) {
      assert.equal(isResearchSectionRoute(path.replace(/^\/[a-z]{2}(?=\/)/, "")), false, path);
      assert.equal(isResearchSectionRoute(path), false, path);
    }
  }
  assert.equal(isResearchSectionRoute("/program"), false);
});

const now = "2026-10-16T09:00:00.000Z";

function home(stepsDone: number): ProgramAiHome {
  const currentMission = programmeJourney[Math.min(stepsDone, 9)];
  return {
    totalXp: 40 + stepsDone * 75,
    activeDays: 6,
    currentStreak: 3,
    achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
    currentMission,
    currentStep: missionStep(currentMission),
    primaryAction: stepsDone >= 10 ? "review-mission" : "start-mission",
    engagementDayBucket: "day_4_7",
    currentAction: null,
    startingPoint: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
    weekGoal: { goalStyle: "research_after_pause", totalDays: 7, day: 4, checkInDate: "2026-10-20" },
    missions: programmeJourney.map((missionNumber, index) => ({
      missionNumber,
      step: index + 1,
      title: programmeMissionTitles[missionNumber - 1],
      status: index < stepsDone ? "completed" : index === stepsDone ? "current" : "locked",
      actionsCompleted: index < stepsDone ? 3 : 0,
      actionsTotal: missionNumber === 1 ? 2 : 3,
      xpEarnedHere: index < stepsDone ? 50 : 0,
      completionBonus: missionNumber === 1 ? 0 : 25,
    })),
    reviews: [
      { milestone: "first", unlockMission: 3, unlockStep: missionStep(3), title: "First Personal Review", maxWords: 250, status: stepsDone >= 4 ? "available" : "locked" },
      { milestone: "mid", unlockMission: 6, unlockStep: missionStep(6), title: "Mid-Programme Personal Review", maxWords: 300, status: stepsDone >= 7 ? "available" : "locked" },
      { milestone: "full", unlockMission: 10, unlockStep: 10, title: "Full Programme Personal Review", maxWords: 450, status: stepsDone >= 10 ? "available" : "locked" },
    ],
    nextReview: null,
  };
}

/**
 * The fields the home carried until 16 October 2026. A screen given them anyway (an old server
 * answer, a cached response) must still render no research card and no casino link.
 */
function withOldResearchFields(value: ProgramAiHome) {
  return { ...value, researchAccess: "open", discoveryLinks: [{ href: "/casinos", label: "Compare casinos" }, { href: "/bonuses", label: "Bonuses" }, { href: "/best-offers", label: "Best offers" }] } as ProgramAiHome;
}

function completedMission(missionNumber: 8 | 10): ProgramAiMission {
  const actions = missionNumber === 8
    ? [["learn_comparison_signals", 20], ["decode_offer_terms", 20], ["build_research_checklist", 15]] as const
    : [["review_my_plan", 20], ["assemble_final_plan", 20], ["choose_review_cadence", 15]] as const;
  return {
    missionNumber,
    step: missionStep(missionNumber),
    stepId: `step-${missionNumber}`,
    title: programmeMissionTitles[missionNumber - 1],
    purpose: "",
    status: "completed",
    actions: actions.map(([id, xp]) => ({ id, label: id, xp, completed: true })),
    currentAction: null,
    currentActionPosition: null,
    actionsCompleted: 3,
    actionsTotal: 3,
    artifact: missionNumber === 8
      ? { comparisonSignals: ["licensing_status", "material_terms"], offerTermSignal: "wagering_requirement", researchCriteria: ["licensing_status", "terms", "withdrawals"] }
      : { timelineReviewed: true, planPriorityIds: ["pause_move", "boundary", "fallback"], reviewCadenceDays: 14 },
    artifactVersion: "1",
    xpEarnedHere: 80,
    completionBonus: 25,
    completedAt: now,
    legacyCompletion: false,
  };
}

test("Programme Home, before and after step 3 and at the end, renders no casino, offer or bonus link", async () => {
  const { ProgramAiHomeScreen } = await import("../components/programme/ProgramAiHome");
  for (const stepsDone of [1, 2, 3, 4, 10]) {
    for (const route of PROGRAMME_ROUTES) {
      const html = renderToStaticMarkup(
        <ProgramAiHomeScreen home={withOldResearchFields(home(stepsDone))} locale={route.locale} onMission={() => undefined} onMissionOneEntry={() => undefined} onReview={() => undefined} programmePath={programmePath(route.locale)} userId="no-casino-user" />,
      );
      assert.match(html, /data-programme-presentation="dashboard"/);
      assert.doesNotMatch(html, RESEARCH_HREF, `${route.locale} after ${stepsDone} steps`);
      assert.doesNotMatch(html, /data-programme-research/, `${route.locale} after ${stepsDone} steps`);
    }
  }
});

test("the completion screens of step 3 and step 10 render no research block and no casino link", async () => {
  const { ProgramAiMissionExperience } = await import("../components/programme/ProgramAiMissionExperience");
  for (const missionNumber of [8, 10] as const) {
    for (const route of PROGRAMME_ROUTES) {
      const html = renderToStaticMarkup(
        <ProgramAiMissionExperience home={withOldResearchFields(home(missionNumber === 8 ? 3 : 10))} locale={route.locale} localWording="" mission={completedMission(missionNumber)} onBack={() => undefined} onHome={() => undefined} onLocalWording={() => undefined} programmePath={programmePath(route.locale)} userId="no-casino-user" />,
      );
      assert.match(html, /data-programme-completion=/, `Mission ${missionNumber} ${route.locale}: the completion screen rendered`);
      assert.doesNotMatch(html, RESEARCH_HREF, `Mission ${missionNumber} ${route.locale}`);
      assert.doesNotMatch(html, /data-programme-research/, `Mission ${missionNumber} ${route.locale}`);
    }
  }
});

test("no letter, the marketing broadcast included, links to a casino, bonus, offer, comparison or partner page", () => {
  // The letters as seeded (migration 0045) and as first seeded for the lifecycle (migration 0037).
  for (const letter of PAUSE_LETTER_SEEDS) {
    const { htmlBody, textBody } = pauseLetterSeedBodies(letter);
    assert.doesNotMatch(htmlBody, RESEARCH_HREF, `${letter.key}:${letter.locale}`);
    assert.doesNotMatch(`${htmlBody}\n${textBody}`, /\/(?:best-offers|casinos|catalog|bonuses|compare|bonus-guide|wagering-calculator|outbound|r|go)\b/, `${letter.key}:${letter.locale}`);
    assert.equal(emailTemplateLinksToCasinoPages({ subject: letter.subject, htmlBody, textBody }), false, `${letter.key}:${letter.locale}`);
  }
  const lifecycle = readFileSync("prisma/migrations/0037_customer_data_analytics_lifecycle_core/migration.sql", "utf8");
  const seeded = lifecycle.slice(lifecycle.indexOf('INSERT INTO "EmailTemplate"'));
  assert.ok(seeded.includes("{{programme_url}}"), "the 0037 seed is read");
  assert.doesNotMatch(seeded.slice(0, seeded.indexOf(";")), /\/(?:best-offers|casinos|catalog|bonuses|compare|bonus-guide|wagering-calculator|outbound|r|go)\b/);

  // And the Admin editor cannot add one: every letter refuses a static link into the research
  // section, in HTML and in plain text, with or without a language prefix. The marketing broadcast
  // too: accounts are Programme accounts, the opt-in starts ticked, and a broadcast can be aimed at
  // people by their Programme progress.
  const base = { type: "LIFECYCLE", locale: "en", subject: "Hello {{name}}" } as const;
  const programmeLetters = [
    ["MARKETING_BROADCAST", "MARKETING", ["unsubscribe_url"]],
    ["WELCOME", "LIFECYCLE", ["programme_url"]],
    ["PROGRAMME_REMINDER", "LIFECYCLE", ["programme_url", "unsubscribe_url"]],
    ["PROGRAMME_DAY_3", "LIFECYCLE", ["programme_url", "unsubscribe_url"]],
    ["PROGRAMME_DAY_7", "LIFECYCLE", ["programme_url", "unsubscribe_url"]],
    ["PROGRAMME_DAY_10", "LIFECYCLE", ["programme_url", "unsubscribe_url"]],
    ["PAUSE_ENDS_TOMORROW", "LIFECYCLE", ["plan_url", "unsubscribe_url"]],
    ["PAUSE_OVER", "LIFECYCLE", ["plan_url", "unsubscribe_url"]],
    ["PAUSE_TOOL_CONFIRMATION", "LIFECYCLE", ["plan_url", "unsubscribe_url"]],
    ["EMAIL_VERIFICATION", "TRANSACTIONAL", ["action_url"]],
    ["PASSWORD_RESET", "TRANSACTIONAL", ["action_url"]],
    ["ACCOUNT_SECURITY", "TRANSACTIONAL", []],
  ] as const;
  for (const [key, type, required] of programmeLetters) {
    const links = required.map((variable) => `<a href="{{${variable}}}">Open</a>`).join("");
    const text = required.map((variable) => `{{${variable}}}`).join(" ") || "Hello";
    const letter = { ...base, key, type, htmlBody: `<p>Hello</p>${links}`, textBody: text };
    assert.doesNotThrow(() => sanitizeEmailTemplate(letter), key);
    assert.doesNotThrow(() => sanitizeEmailTemplate({ ...letter, htmlBody: `${letter.htmlBody}<a href="https://b4gamble.com/sv/pause-plan">Plan</a>` }), `${key}: a help page is fine`);
    for (const path of ["/casinos", "/sv/casinos", "/casino/playojo", "/en/bonuses", "/best-offers", "/compare", "/da/bonus-guide", "/wagering-calculator", "/outbound/x", "/%63asinos", "/catalog", "/sv/catalog?sort=rating", "/r/playojo", "/go/x"]) {
      assert.throws(() => sanitizeEmailTemplate({ ...letter, htmlBody: `${letter.htmlBody}<a href="https://b4gamble.com${path}">More</a>` }), /casino pages|canonical B4GAMBLE/, `${key} ${path}`);
      assert.throws(() => sanitizeEmailTemplate({ ...letter, textBody: `${letter.textBody} https://b4gamble.com${path}` }), /casino pages|canonical B4GAMBLE/, `${key} ${path} (text)`);
    }
  }
  assert.equal(programmeLetters.length, 12, "every template key");
  const broadcast = { key: "MARKETING_BROADCAST", type: "MARKETING", locale: "en", subject: "News", htmlBody: '<p>News</p><a href="https://b4gamble.com/en/casinos">Casinos</a><a href="{{unsubscribe_url}}">Unsubscribe</a>', textBody: "News {{unsubscribe_url}}" } as const;
  assert.throws(() => sanitizeEmailTemplate(broadcast), /casino pages/);
});

test("the letter guard refuses every root of the research section, so the two lists cannot drift", () => {
  assert.deepEqual(researchSectionRoots, ["/best-offers", "/casinos", "/casino", "/bonuses", "/compare", "/bonus-guide", "/wagering-calculator", "/outbound"], "the roots are read");
  const letter = { key: "PROGRAMME_REMINDER", type: "LIFECYCLE", locale: "en", subject: "Hello", textBody: "{{programme_url}} {{unsubscribe_url}}" } as const;
  const links = '<a href="{{programme_url}}">Continue</a><a href="{{unsubscribe_url}}">Unsubscribe</a>';
  for (const root of [...researchSectionRoots, "/catalog"]) {
    for (const path of [root, `/sv${root}`, `${root}/x`]) {
      assert.throws(() => sanitizeEmailTemplate({ ...letter, htmlBody: `${links}<a href="https://b4gamble.com${path}">More</a>` }), /casino pages/, path);
      assert.equal(emailTemplateLinksToCasinoPages({ subject: "Hello", htmlBody: `<a href="https://b4gamble.com${path}">More</a>`, textBody: "" }), true, path);
    }
  }
});

test("a stored letter that links to a casino page cannot be rendered, so it is never sent", () => {
  // Rows saved before 16 October 2026, or written outside Admin by SQL or a migration, reach the
  // send paths without the editor's check: rendering checks them again, and every send path turns
  // a render failure into TEMPLATE_RENDER_INVALID (lib/email/service.server.ts, campaigns.server.ts).
  const good = { subject: "Continue your Programme", htmlBody: '<p>Hello {{name}}</p><p><a href="{{programme_url}}">Continue</a> <a href="https://b4gamble.com/sv/pause-plan">Plan</a></p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>', textBody: "Continue: {{programme_url}}\nUnsubscribe: {{unsubscribe_url}}" };
  assert.doesNotThrow(() => renderEmailTemplate(good, { name: "Ada", programme_url: "https://b4gamble.com/sv/program", unsubscribe_url: "https://b4gamble.com/unsubscribe?token=t" }));
  const stored = [
    { ...good, htmlBody: `${good.htmlBody}<a href="https://b4gamble.com/sv/casinos">Casinos</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href='https://b4gamble.com/bonuses'>Bonuses</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href=https://b4gamble.com/best-offers>Offers</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href="/sv/casino/playojo">PlayOJO</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href="https://b4gamble.com/&#99;asinos">Casinos</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href="https://b4gamble.com/%2563asinos">Casinos</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href="https://b4gamble.com/catalog">Catalogue</a>` },
    { ...good, htmlBody: `${good.htmlBody}<a href="https://b4gamble.com/r/playojo">Play</a>` },
    { ...good, textBody: `${good.textBody}\nCompare: https://b4gamble.com/da/compare` },
    { ...good, subject: "See https://b4gamble.com/wagering-calculator" },
  ];
  for (const template of stored) {
    assert.equal(emailTemplateLinksToCasinoPages(template), true, JSON.stringify(template).slice(-80));
    assert.throws(() => renderEmailTemplate(template, { name: "Ada", programme_url: "https://b4gamble.com/sv/program", unsubscribe_url: "https://b4gamble.com/unsubscribe?token=t" }), /casino pages/);
  }
  const service = readFileSync("lib/email/service.server.ts", "utf8");
  assert.match(service, /rendered = renderEmailTemplate\(message\.template,[\s\S]*?\} catch \{[\s\S]*?deliveryErrorCode: "TEMPLATE_RENDER_INVALID"/, "the worker cancels a letter it cannot render");
  assert.match(readFileSync("lib/email/campaigns.server.ts", "utf8"), /renderEmailTemplate\(campaign\.template,[\s\S]*?\} catch \{[\s\S]*?deliveryErrorCode: "TEMPLATE_RENDER_INVALID"/, "a campaign cancels a letter it cannot render");
  // Activating an older version in Admin runs the editor's checks on it again.
  const admin = readFileSync("lib/email/template-admin.server.ts", "utf8");
  const activation = admin.slice(admin.indexOf("export async function setEmailTemplateActive("));
  assert.ok(activation.indexOf("sanitizeEmailTemplate({") > 0 && activation.indexOf("sanitizeEmailTemplate({") < activation.indexOf("transaction.emailTemplate.updateMany("), "checked before anything is activated");
});

test("the Programme's header and footer are built without research links, so no Programme document carries them", async () => {
  const { PathnameContext, SearchParamsContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime");
  const { PublicHeader } = await import("../components/public-shell/PublicHeader");
  const { PublicFooter } = await import("../components/public-shell/PublicFooter");
  const { accountNavigationFor } = await import("../lib/public-shell");
  const layout = readFileSync("app/program/layout.tsx", "utf8");
  assert.equal(layout.match(/researchNavigation=\{false\}/g)?.length, 2, "header and footer");
  assert.equal(layout.match(/commercialProductState="EDITORIAL_ONLY"/g)?.length, 2);
  assert.doesNotMatch(layout, /resolveServerCommercialProductState|commercial-product-state\.server/, "the Programme reads no partner availability");
  // Next writes the root not-found boundary into every document's inline data, so in a Programme
  // document it is built the same way.
  const rootNotFound = readFileSync("app/not-found.tsx", "utf8");
  assert.match(rootNotFound, /const programmeDocument = presentation\.context === PROGRAMME_PRESENTATION_CONTEXT;/);
  assert.match(rootNotFound, /const commercialProductState = programmeDocument \? "EDITORIAL_ONLY" : await resolveServerCommercialProductState\(\);/);
  assert.equal(rootNotFound.match(/researchNavigation=\{!programmeDocument\}/g)?.length, 2, "header and footer");

  // Rendered under a research path, where the menu's door would open if the links had been built.
  const shell = (researchNavigation: boolean, locale: (typeof PROGRAMME_ROUTES)[number]["locale"], language: string) => renderToStaticMarkup(
    <PathnameContext.Provider value="/casinos">
      <SearchParamsContext.Provider value={new URLSearchParams() as never}>
        <PublicHeader account={accountNavigationFor({ authenticated: false, programmePath: programmePath(locale) })} authenticated={false} commercialProductState="EDITORIAL_ONLY" presentation={resolvePresentationContext({ routeLanguage: language })} programme={{ locale, localizePublicLinks: true }} researchNavigation={researchNavigation} />
        <PublicFooter authenticated={false} commercialProductState="EDITORIAL_ONLY" presentation={resolvePresentationContext({ routeLanguage: language })} programme={{ path: programmePath(locale), localizePublicLinks: true }} researchNavigation={researchNavigation} />
      </SearchParamsContext.Provider>
    </PathnameContext.Provider>,
  );
  assert.match(shell(true, "en-GB", "en"), /href="[^"]*\/casinos"/, "the public shell still builds them (control)");
  for (const route of PROGRAMME_ROUTES) {
    const html = shell(false, route.locale, route.language);
    assert.match(html, /data-navigation-href="\/learn"/, route.locale);
    assert.doesNotMatch(html, RESEARCH_HREF, route.locale);
    assert.doesNotMatch(html, /\/(?:casinos|best-offers|bonuses)\b/, route.locale);
  }
});

test("this guard runs in ci:quality", () => {
  const scripts = (JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> }).scripts;
  assert.match(scripts["ci:quality"] ?? "", /npm run programme-no-casino:test(?:\s|$)/);
  assert.match(scripts["programme-no-casino:test"] ?? "", /tests\/programme-no-casino-links\.test\.tsx/);
});
