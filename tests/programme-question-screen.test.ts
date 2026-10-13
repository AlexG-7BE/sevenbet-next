import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { programmeCatalogueEntries, programmeText } from "../lib/i18n/programme-catalog";
import { PROGRAMME_LOCALES, type ProgrammeLocale } from "../lib/programme/presentation";
import { missionStep, programAiMissionRegistry } from "../lib/programme/program-ai/mission-registry";
import {
  QUESTION_REWARD_LABEL_MS,
  QUESTION_SCREEN_ACTIONS_WITH_LINES,
  questionOptionLine,
  questionOptionLineEntries,
  questionWhyLine,
  splitQuestionHeadline,
} from "../lib/programme/program-ai/question-screen";

// Founder, 13 October 2026: «СДЕЛАТЬ ПРОДУКТ И ЕГО ОЩУЩЕНИЕ БОЛЕЕ ПРЕМИАЛЬНЫМ И УДОБНЫМ, А НЕ ТУПО
// СОКРАТИТЬ ВСЁ ЧТО МОЖНО РАДИ НЕСКОЛЬКИХ КЛИКОВ». The question screen changes how a step looks and
// answers; it removes no press and decides nothing the server decides.

// Every cell of a catalogue row: the eleven languages on the site and the two that are hidden, not deleted.
const CATALOGUE_LOCALES = ["en-GB", "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR", "it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO", "uk-UA", "ru-RU"] as const satisfies readonly ProgrammeLocale[];

const read = (path: string) => readFileSync(path, "utf8");
const missionExperience = read("components/programme/ProgramAiMissionExperience.tsx");
const missionPrimitives = read("components/programme/ProgramAiMissionPrimitives.tsx");
const authenticatedHome = read("components/programme/ProgramAiHome.tsx");
const stylesheet = read("components/programme/ProgramAiAuthenticated.module.css");
const shell = read("components/public-shell/PublicShell.module.css");
const presentation = read("lib/programme/program-ai/question-screen.ts");

test("a question's headline is split by rule: the last third of its words, two to four, is the serif tail", () => {
  // One or two words are not split.
  assert.deepEqual(splitQuestionHeadline("Pause?"), { head: "Pause?", tail: null });
  assert.deepEqual(splitQuestionHeadline("Choose one"), { head: "Choose one", tail: null });
  // At least two words in the tail, and the head never empty.
  assert.deepEqual(splitQuestionHeadline("Pressure-check the boundary."), { head: "Pressure-check", tail: "the boundary." });
  assert.deepEqual(splitQuestionHeadline("one two three four"), { head: "one two", tail: "three four" });
  assert.deepEqual(splitQuestionHeadline("one two three four five six seven"), { head: "one two three four five", tail: "six seven" });
  // The last third.
  assert.deepEqual(splitQuestionHeadline("What would be useful to practise for seven days?"), { head: "What would be useful to practise", tail: "for seven days?" });
  assert.deepEqual(splitQuestionHeadline("Vad skulle vara bra att öva på i sju dagar?"), { head: "Vad skulle vara bra att öva på", tail: "i sju dagar?" });
  // At most four words, however long the question.
  const long = Array.from({ length: 30 }, (_, index) => `w${index + 1}`).join(" ");
  assert.deepEqual(splitQuestionHeadline(long), { head: Array.from({ length: 26 }, (_, index) => `w${index + 1}`).join(" "), tail: "w27 w28 w29 w30" });
  // Spacing in the catalogue does not move the split.
  assert.deepEqual(splitQuestionHeadline("  Choose   one move that creates a little time.  "), { head: "Choose one move that creates", tail: "a little time." });
  // No word of any catalogue text is lost, changed or reordered by the split, in any language.
  for (const locale of PROGRAMME_LOCALES) {
    for (const { value } of programmeCatalogueEntries(locale)) {
      const { head, tail } = splitQuestionHeadline(value);
      const words = value.trim().split(/\s+/).filter(Boolean);
      assert.equal([head, tail].filter(Boolean).join(" "), words.join(" "));
      if (words.length <= 2) assert.equal(tail, null);
      else {
        const tailWords = tail!.split(" ").length;
        assert.ok(tailWords >= 2 && tailWords <= 4 && head.length > 0, `${locale}: ${value}`);
      }
    }
  }
});

test("the lines of the question screen are presentation: written for the first two steps after sign-in, in every language, unknown to the server", () => {
  // Mission 02 is step 2 and Mission 08 is step 3: all three actions of each carry a why-line.
  assert.equal(missionStep(2), 2);
  assert.equal(missionStep(8), 3);
  const firstSteps = programAiMissionRegistry.filter((mission) => mission.missionNumber === 2 || mission.missionNumber === 8).flatMap((mission) => mission.actions.map((action) => action.id as string));
  assert.deepEqual([...QUESTION_SCREEN_ACTIONS_WITH_LINES].sort(), [...firstSteps].sort());
  // Every option of those actions has a line: the screen's own, or the one the option already carried.
  const optionsByAction: Record<string, readonly string[]> = {
    choose_direction: ["understand", "pause", "reduce_impulse", "set_boundary", "research_later", "seek_support"],
    build_7_day_goal: ["notice_and_note", "pause_first", "use_one_boundary", "research_after_pause", "ask_for_support"],
    reality_check: ["make_it_smaller", "use_the_pause", "restart_next_day", "ask_for_support"],
    decode_offer_terms: ["wagering_requirement", "expiry", "eligible_games", "deposit_condition", "withdrawal_limit", "unclear_terms"],
    build_research_checklist: ["licensing_status", "operator_identity", "terms", "withdrawals", "payments", "safer_gambling_tools", "offer_conditions"],
  };
  for (const [actionId, options] of Object.entries(optionsByAction)) {
    assert.deepEqual(questionOptionLineEntries(actionId).map(([value]) => value), options, actionId);
    for (const value of options) assert.ok(missionExperience.includes(`option("${value}"`), `${actionId}.${value} is an option of the Mission screen`);
  }
  // The first question of step 3 keeps the lines its options already had.
  assert.deepEqual(questionOptionLineEntries("learn_comparison_signals"), []);
  assert.ok(missionExperience.includes('option("licensing_status", "Licence / regulatory status", "Confirms whether the product is permitted for the relevant market.")'));
  assert.ok(missionExperience.includes("const line = item.description ?? (actionId ? questionOptionLine(actionId, item.value) : undefined);"));
  // A Mission without lines shows its options and helper only: both are optional in the layout.
  assert.equal(questionWhyLine("choose_boundary"), undefined);
  assert.equal(questionOptionLine("choose_boundary", "money"), undefined);
  assert.equal(questionOptionLine("choose_direction", "not-an-option"), undefined);
  assert.ok(missionExperience.includes("{whyLine ? <p className={styles.stepWhy}"));
  assert.ok(missionPrimitives.includes("<strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}"));

  // One short plain sentence each, in every language the catalogue carries; no promise, no jargon.
  const written = [
    ...firstSteps.map((actionId) => questionWhyLine(actionId)!),
    ...["choose_direction", "build_7_day_goal", "reality_check", "decode_offer_terms"].flatMap((actionId) => questionOptionLineEntries(actionId).map(([, line]) => line)),
  ];
  assert.equal(written.length, 6 + 6 + 5 + 4 + 6);
  assert.equal(new Set(written).size, written.length);
  for (const locale of PROGRAMME_LOCALES) assert.ok(CATALOGUE_LOCALES.includes(locale));
  for (const key of written) {
    assert.ok(key.length <= 60, `${key}: ${key.length} characters`);
    assert.match(key, /\.$/);
    assert.doesNotMatch(key, /guarantee|will stop|will win|safe to|cure|always works|never lose|XP|casino/i, key);
    for (const locale of CATALOGUE_LOCALES) {
      const value = programmeText(locale, key);
      assert.ok(value.trim().length > 0 && value.length <= 80, `${locale} ${key}: ${value.length} characters`);
      if (locale !== "en-GB") assert.notEqual(value, key, `${locale} ${key} is translated`);
    }
  }
  // The Swedish the Founder approved on the mockup for the first question.
  assert.equal(programmeText("sv-SE", "Why we ask:"), "Varför vi frågar:");
  assert.equal(programmeText("sv-SE", questionWhyLine("choose_direction")!), "ett litet mål håller längre än ett stort löfte.");
  assert.deepEqual(questionOptionLineEntries("choose_direction").map(([, line]) => programmeText("sv-SE", line)), [
    "Se när suget kommer och vad som väcker det.",
    "Vänta en stund innan du bestämmer dig.",
    "Gör det svårare att börja spela direkt.",
    "Bestäm summa och tid innan du börjar.",
    "Jämför i lugn och ro, inte mitt i suget.",
    "Välj en person som får veta.",
  ]);
  assert.equal(programmeText("sv-SE", "Step {step} of {total}", { step: 2, total: 10 }), "Steg 2 av 10");
  assert.equal(programmeText("sv-SE", "Question {position} of {total}", { position: 1, total: 3 }), "Fråga 1 av 3");
  assert.equal(programmeText("sv-SE", "Continue"), "Fortsätt");

  // The server's Mission definitions and services do not know these lines.
  const serverSide = [
    read("lib/programme/program-ai/mission-registry.ts"),
    read("lib/programme/program-ai/mission-presentation.ts"),
    read("lib/programme/application/programme-ai-missions.service.ts"),
    read("lib/programme/application/programme-ai-guidance.service.ts"),
  ].join("\n");
  assert.doesNotMatch(serverSide, /question-screen|Why we ask|questionOptionLine|questionWhyLine/);
  assert.doesNotMatch(presentation, /prisma|server-only|fetch\(/i);
});

test("the question screen keeps every press, takes XP off the button and leaves no reward line under the next question", () => {
  // Top bar: the same back destination and name, the person-facing step number, the same protected Help link.
  assert.ok(missionExperience.includes('<button aria-label={`← ${t("Programme Home")}`} className={styles.stepBack} onClick={onBack} type="button"><BackIcon /></button>'));
  assert.ok(missionExperience.includes('{t("Step {step} of {total}", { step: mission.step, total: home.missions.length })}'));
  assert.ok(missionExperience.includes('<Link className={styles.stepHelp} href={programmeHelpPath(locale)}>{t("Protected Help / pause")}</Link>'));
  // Progress inside the step comes from the server's projection of the Mission.
  assert.ok(missionExperience.includes('t("Question {position} of {total}", { position: mission.currentActionPosition ?? "", total: mission.actionsTotal })'));
  assert.ok(missionExperience.includes("mission.actions.map((action) => <i data-on={action.completed || action.id === current.id} key={action.id} />)"));

  // XP: the server's number, once, for about two seconds; never on the button, never a stale line.
  assert.ok(missionExperience.includes('showReward(result.xpAwarded ? `+${result.xpAwarded} XP` : t("This action was already saved."));'));
  assert.equal(QUESTION_REWARD_LABEL_MS, 2000);
  assert.doesNotMatch(missionExperience, /Action complete|current\.xp|ACTION \{position\}|Confirm action|t\("Saving…"\)/);
  assert.ok(missionExperience.includes('setSequenceFeedback(""); setAnnouncement(""); setAppliedChecks([]);'), "nothing said about one question stays for the next");
  assert.ok(missionExperience.includes('<span>{t(sequenceAction ? "Check sequence" : "Continue")}</span>{saving ? <SavingDots /> : <ArrowIcon />}'));
  assert.ok(missionExperience.includes("aria-busy={saving || undefined}"));
  for (const locale of PROGRAMME_LOCALES) {
    assert.doesNotMatch(programmeText(locale, "Continue"), /XP|\d/, `${locale}: no XP on the button`);
    assert.doesNotMatch(programmeText(locale, "Check sequence"), /XP|\d/, `${locale}: no XP on the button`);
  }

  // Not in this round: no press is removed and nothing finishes or opens by itself.
  assert.ok(missionExperience.includes('"Create personal drafts"'));
  assert.ok(missionExperience.includes('t("Build my plan")'));
  assert.ok(missionExperience.includes('{busy ? t("Completing…") : t("Complete Mission · +{xp} XP", { xp: mission.completionBonus })}'));
  assert.ok(missionExperience.includes('<ActionButton onClick={onBack} size="large">{t("Continue from Programme Home")}</ActionButton>'));
  assert.equal(missionExperience.match(/onClick=\{complete\}/g)?.length, 1, "completion is asked for by its own press only");
  assert.equal(missionExperience.match(/\bcomplete\(\)/g)?.length, 1, "complete() is declared once and called by nothing else");
  assert.equal(missionExperience.match(/onClick=\{getGuidance\}/g)?.length, 2, "drafts and the plan are still asked for by a press");
  assert.doesNotMatch(missionExperience, /useEffect\(\(\) => \{[^}]*(?:getGuidance|saveAction)\(/);
  // The result screen keeps its own layout.
  assert.ok(missionExperience.includes('<section className={styles.challenge}><span className={styles.eyebrow}>{t("YOUR RESULT IS READY")}</span>'));
  assert.ok(missionExperience.includes('t("MISSION {number} · {completed}/{total} ACTIONS"'));
  assert.equal(missionExperience.match(/data-programme-step-frame/g)?.length, 1, "only the question screen is a step frame");

  // The privacy cue is wording the Programme home already carries.
  const cue = 't("Your data is private. We never use it for offers or rankings.")';
  assert.ok(authenticatedHome.includes(cue));
  assert.ok(missionExperience.includes(cue));
  assert.doesNotMatch(missionExperience, /Only you see your answers/);

  // Layout contracts: cards, the pinned bar that takes its own room, type floors, reduced motion.
  assert.ok(stylesheet.includes(".choice { position: relative; min-height: 66px; padding: 12px 16px; display: flex; gap: 14px; align-items: center; border: 1px solid var(--pg-line); border-radius: 16px;"));
  assert.match(stylesheet, /\.choice:has\(input:checked\) \{ border-color: var\(--pg-acid\);[^}]*box-shadow: 0 0 0 1px var\(--pg-acid\) inset, 0 14px 34px -16px rgba\(228, 226, 78, \.5\); \}/);
  assert.match(stylesheet, /\.stepCta \{ position: sticky; bottom: 0; z-index: 5; margin: auto calc\(var\(--step-gutter\) \* -1\) 0;/);
  assert.match(stylesheet, /\.stepContinue \{ width: 100%; min-height: 58px;[^}]*border-radius: 16px;[^}]*font-size: 17px;/);
  assert.match(stylesheet, /\.stepBack \{ width: 44px; height: 44px;/);
  assert.match(stylesheet, /\.stepHelp \{[^}]*min-height: 44px;[^}]*font-size: 14px;/);
  assert.match(stylesheet, /\.stepQuestion \{[^}]*animation: programme-question-in 220ms var\(--pg-ease\) both; \}/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{\s*\.stepQuestion, \.stepDots i \{ animation: none; \}\s*\.choice:active, \.stepContinue:active:not\(:disabled\), \.choiceTick svg \{ transform: none; \}\s*\}/);
  const stepRules = stylesheet.slice(stylesheet.indexOf("/* The question screen of a step"), stylesheet.indexOf("@media (max-width: 1000px)"));
  assert.ok(stepRules.length > 2000);
  for (const size of stepRules.matchAll(/font-size: ([\d.]+)px/g)) assert.ok(Number(size[1]) >= 12, `text of ${size[1]}px`);
  // On a phone the step's bar stands where the site header was; a wide screen keeps the header.
  assert.ok(shell.includes("@media (max-width: 640px) {\n  :global(html:has([data-programme-step-frame])) .header { display: none; }\n}"));
});
