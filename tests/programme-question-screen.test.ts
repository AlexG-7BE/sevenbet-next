import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PROGRAMME_MESSAGE_KEYS, programmeCatalogueEntries, programmeText } from "../lib/i18n/programme-catalog";
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
const CATALOGUE_LOCALES = ["en-GB", "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR", "it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO", "uk-UA", "ru-RU", "uz-UZ"] as const satisfies readonly ProgrammeLocale[];

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

test("the lines of the question screen are presentation: written for every step after sign-in, in every language, unknown to the server", () => {
  // Mission 02 is step 2 and Mission 08 is step 3; every action of every Mission carries a why-line.
  assert.equal(missionStep(2), 2);
  assert.equal(missionStep(8), 3);
  const allActions = programAiMissionRegistry.flatMap((mission) => mission.actions.map((action) => action.id as string));
  assert.equal(allActions.length, 27);
  assert.deepEqual([...QUESTION_SCREEN_ACTIONS_WITH_LINES].sort(), [...allActions].sort());
  for (const actionId of allActions) assert.ok(questionWhyLine(actionId), `${actionId} has a why-line`);
  const firstSteps = programAiMissionRegistry.filter((mission) => mission.missionNumber === 2 || mission.missionNumber === 8).flatMap((mission) => mission.actions.map((action) => action.id as string));

  // The option cards of every action, read from the Mission screen itself: each card has a line,
  // the screen's own or the one the option already carried. Two questions show no option cards
  // (a sequence to put in order, drafted responses to choose from) and carry the why-line only.
  const optionLists: Record<string, string> = {};
  for (const [, name, body] of missionExperience.matchAll(/^function (\w+Options)\(\) \{ return \[(.*)\]; \}$/gm)) optionLists[name] = body;
  assert.deepEqual(Object.keys(optionLists).sort(), ["frictionOptions", "responseOptions"]);
  const cardsByAction: Record<string, { value: string; described: boolean }[]> = {};
  for (const [, actionId, definition] of missionExperience.matchAll(/^  (\w+): \{ prompt: "[^"]+", explanation: "[^"]+",(.*)\},$/gm)) {
    const fields = Object.entries(optionLists).reduce((text, [name, body]) => text.replace(`${name}()`, `[${body}]`), definition);
    cardsByAction[actionId] = [...fields.matchAll(/option\("([^"]+)", "[^"]+"(, "[^"]+")?\)/g)].map(([, value, description]) => ({ value, described: Boolean(description) }));
  }
  assert.deepEqual(Object.keys(cardsByAction).sort(), [...allActions].sort());
  const withoutCards = ["map_urge_sequence", "rehearse_response"];
  // Step 3's last question leaves out "Send my line to my person" when no line was chosen (an answer from the earlier lesson).
  assert.ok(missionExperience.includes('const choiceFields = sequenceAction || current.id === "rehearse_response" ? []\n'));
  assert.ok(missionExperience.includes('options: field.options.filter((item) => item.value !== "send_line")'));
  assert.ok(missionExperience.includes('const sequenceAction = current.id === "map_urge_sequence";'));
  let optionLineCount = 0;
  for (const actionId of allActions) {
    const cards = cardsByAction[actionId];
    assert.ok(cards.length > 0, actionId);
    const lines = questionOptionLineEntries(actionId);
    if (withoutCards.includes(actionId) || cards.every((card) => card.described)) assert.deepEqual(lines, [], actionId);
    else {
      assert.ok(cards.every((card) => !card.described), actionId);
      assert.deepEqual(lines.map(([value]) => value), cards.map((card) => card.value), actionId);
      optionLineCount += lines.length;
    }
  }
  // 15 lines for step 2, 23 for step 3 ("Know who to turn to", 16 October 2026) and 101 for
  // Missions 03–07, 09 and 10.
  assert.equal(optionLineCount, 6 + 5 + 4 + 12 + 5 + 6 + (10 + 20 + 14 + 22 + 13 + 8 + 14));
  const optionsByAction: Record<string, readonly string[]> = {
    choose_direction: ["understand", "pause", "reduce_impulse", "set_boundary", "research_later", "seek_support"],
    build_7_day_goal: ["notice_and_note", "pause_first", "use_one_boundary", "research_after_pause", "ask_for_support"],
    reality_check: ["make_it_smaller", "use_the_pause", "restart_next_day", "ask_for_support"],
    // Step 3: who the person is to you, then the line you would say; the kind of help; the first 10 minutes.
    learn_comparison_signals: ["partner", "family", "friend", "colleague", "been_there", "professional", "service_first", "call_me", "tell_you", "one_word", "check_in", "first_call"],
    decode_offer_terms: ["phone", "chat", "in_person", "debt", "close_ones"],
    build_research_checklist: ["phone_away", "send_line", "contact_service", "wait_ten_minutes", "go_outside", "read_card"],
  };
  for (const [actionId, options] of Object.entries(optionsByAction)) {
    assert.deepEqual(questionOptionLineEntries(actionId).map(([value]) => value), options, actionId);
    for (const value of options) assert.ok(missionExperience.includes(`option("${value}"`), `${actionId}.${value} is an option of the Mission screen`);
  }
  assert.ok(missionExperience.includes("const line = item.description ?? (actionId ? questionOptionLine(actionId, item.value) : undefined);"));
  // A question without lines shows its options and helper only: both are optional in the layout.
  assert.equal(questionWhyLine("not_an_action"), undefined);
  assert.equal(questionOptionLine("not_an_action", "money"), undefined);
  assert.equal(questionOptionLine("choose_direction", "not-an-option"), undefined);
  assert.equal(questionOptionLine("map_urge_sequence", "yes"), undefined);
  // The second list of "Run a decision check" is drawn without the action, so it takes no line.
  assert.ok(missionExperience.includes('option("exit", "What is my exit route?")] }, locale)} selected={firstCheck ? [firstCheck] : []} />'));
  assert.ok(missionExperience.includes("{whyLine ? <p className={styles.stepWhy}"));
  assert.ok(missionPrimitives.includes("<strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}"));

  // One short plain sentence each, in every language the catalogue carries; no promise, no jargon.
  const firstWritten = [
    ...firstSteps.map((actionId) => questionWhyLine(actionId)!),
    ...firstSteps.flatMap((actionId) => questionOptionLineEntries(actionId).map(([, line]) => line))
      // "Wait 10 minutes" keeps the timer line it carries in steps 4 and 7.
      .filter((line) => line !== questionOptionLine("choose_pause_move", "wait_ten_minutes")),
  ];
  assert.equal(firstWritten.length, 6 + 6 + 5 + 4 + 12 + 5 + 5);
  assert.equal(new Set(firstWritten).size, firstWritten.length);
  // Every line the mapping names: a why-line per action, a line per option card. An option offered
  // in more than one question keeps one line, so the rows are fewer than the cards.
  const mapped = [...new Set([
    ...allActions.map((actionId) => questionWhyLine(actionId)!),
    ...allActions.flatMap((actionId) => questionOptionLineEntries(actionId).map(([, line]) => line)),
  ])];
  // No line is carried over from an earlier screen any more: step 3's research checklist is gone.
  const inherited = new Set<string>();
  const written = mapped.filter((key) => !inherited.has(key));
  assert.equal(written.length, firstWritten.length + 21 + 79);
  for (const key of firstWritten) assert.ok(written.includes(key), key);
  for (const locale of PROGRAMME_LOCALES) assert.ok(CATALOGUE_LOCALES.includes(locale));
  assert.equal(CATALOGUE_LOCALES.length, 14);
  for (const key of written) {
    assert.ok(key.length <= 60, `${key}: ${key.length} characters`);
    assert.match(key, /\.$/);
    assert.doesNotMatch(key, /guarantee|will stop|will win|safe to|cure|always works|never lose|XP|casino|quit|\?/i, key);
  }
  for (const key of mapped) {
    // Every mapped line is a row of the catalogue, with every language cell filled and translated.
    assert.ok(PROGRAMME_MESSAGE_KEYS.includes(key), `${key} is a row of the catalogue`);
    for (const locale of CATALOGUE_LOCALES) {
      const value = programmeText(locale, key);
      assert.ok(value.trim().length > 0 && value === value.trim(), `${locale} ${key} is filled`);
      if (!inherited.has(key)) {
        assert.ok(value.length <= 80, `${locale} ${key}: ${value.length} characters`);
        assert.match(value, /[.]$/u, `${locale} ${key} is a sentence`);
      }
      assert.doesNotMatch(value, /XP|\{|\}/, `${locale} ${key}`);
      if (locale !== "en-GB") assert.notEqual(value, key, `${locale} ${key} is translated`);
    }
    // The launch languages and German: no cell is the English source left in place.
    for (const locale of ["sv-SE", "da-DK", "de-DE"] as const) assert.notEqual(programmeText(locale, key), key, `${locale} ${key}`);
    // No English loan word for comparing in Swedish or Danish, and Swedish writes "casino" with a c.
    for (const locale of ["sv-SE", "da-DK"] as const) assert.doesNotMatch(programmeText(locale, key), /research/i, `${locale} ${key}`);
    assert.doesNotMatch(programmeText("sv-SE", key), /kasino/i, key);
  }
  // A why-line continues "Why we ask:", so it starts in lower case (German sets its first word in capitals).
  for (const actionId of allActions) {
    const key = questionWhyLine(actionId)!;
    assert.match(key, /^[a-z]/, key);
    assert.doesNotMatch(key, /why we ask/i, key);
    for (const locale of ["sv-SE", "da-DK"] as const) assert.match(programmeText(locale, key), /^\p{Ll}/u, `${locale} ${key}`);
    for (const locale of CATALOGUE_LOCALES) assert.ok(!programmeText(locale, key).includes(programmeText(locale, "Why we ask:").replace(":", "")), `${locale} ${key} repeats the prefix`);
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
  assert.ok(missionExperience.includes('onClick={complete} type="button"><span>{t("Complete Mission")}</span>'));
  assert.ok(missionExperience.includes('<button className={styles.stepContinue} onClick={onBack} type="button"><span>{t("Continue from Programme Home")}</span><ArrowIcon /></button>'));
  assert.equal(missionExperience.match(/onClick=\{complete\}/g)?.length, 1, "completion is asked for by its own press only");
  assert.equal(missionExperience.match(/\bcomplete\(\)/g)?.length, 1, "complete() is declared once and called by nothing else");
  assert.equal(missionExperience.match(/onClick=\{getGuidance\}/g)?.length, 2, "drafts and the plan are still asked for by a press");
  assert.doesNotMatch(missionExperience, /useEffect\(\(\) => \{[^}]*(?:getGuidance|saveAction)\(/);
  // The question, the result and the completion are the step's three framed screens; the legacy one is not.
  assert.equal(missionExperience.match(/data-programme-step-frame/g)?.length, 3);

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

test("the end of a step: a keepsake card, the finish press without XP, the reward said once, and the same flow", async () => {
  const { keepsakeRowIsWide, keepsakeSentenceSize, KEEPSAKE_WIDE_VALUE } = await import("../lib/programme/program-ai/keepsake-image");
  const catalogue = read("lib/i18n/programme-catalog.ts");
  const image = read("lib/programme/program-ai/keepsake-image.ts");

  // The flow: result → "Complete Mission" → completion → the Programme home. Nothing leads into the next step.
  assert.ok(missionExperience.includes('disabled={busy} onClick={complete} type="button"><span>{t("Complete Mission")}</span>{busy ? <SavingDots /> : <ArrowIcon />}</button>'));
  assert.ok(missionExperience.includes('<button className={styles.stepContinue} onClick={onBack} type="button"><span>{t("Continue from Programme Home")}</span><ArrowIcon /></button>'));
  assert.doesNotMatch(missionExperience, /Next step|onMission|openMission|nextMission/);
  for (const locale of CATALOGUE_LOCALES) assert.doesNotMatch(programmeText(locale, "Complete Mission"), /XP|\d/, `${locale}: no XP on the finish press`);

  // The reward: the server's numbers, once. The lines that repeated it are gone from the screen and the catalogue.
  assert.ok(missionExperience.includes("{rewardLabel || `+${mission.completionBonus} XP`}"), "the completion reward is the quiet label by the progress");
  assert.ok(missionExperience.includes('t("{xp} XP · {done} of {total} steps", { xp: newlyCompleted ? `+${completionReceipt?.xpAwarded}` : mission.xpEarnedHere, done: stepsDone, total: home.missions.length })'));
  assert.ok(missionExperience.includes('const stepsDone = home.missions.filter((item) => item.status === "completed").length;'));
  for (const gone of ["The final step adds the {xp} XP completion reward.", "Your result is ready and the completion reward has been added.", "Mission complete. {xp} XP earned.", "Complete Mission · +{xp} XP", "MISSION COMPLETE"]) {
    assert.ok(!catalogue.includes(`  [${JSON.stringify(gone)},`), gone);
    assert.ok(!missionExperience.includes(gone), gone);
  }

  // "Change the plan" is not offered: the server answers a completed Mission, and an action already
  // recorded, without writing, so there is nothing such a button could change.
  const service = read("lib/programme/application/programme-ai-missions.service.ts");
  const record = service.slice(service.indexOf("async recordAction("), service.indexOf("const saved = await unitOfWork.progress.upsertMissionProgress({"));
  assert.match(record, /if \(progress\?\.status === "COMPLETED"\) \{\s+return \{\s+actionPosition: null,\s+xpAwarded: 0,/);
  assert.match(record, /if \(existingStates\.includes\(taskState\)\) \{[\s\S]*?xpAwarded: 0,/);
  assert.doesNotMatch(missionExperience, /Change the plan/);
  assert.ok(!catalogue.includes('["Change the plan"'));

  // The card draws any Mission's rows; a long value takes the whole width; a long sentence is set smaller.
  assert.ok(missionPrimitives.includes("{sentence ? <blockquote data-length={keepsakeSentenceSize(sentence)}>{sentence}</blockquote> : null}"));
  assert.ok(missionPrimitives.includes('<div data-wide={keepsakeRowIsWide(row.value, row.label) ? "" : undefined} key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>'));
  // A step's keepsake: its name, its sentence and its rows; step 3's support card adds its line and the crisis line.
  assert.ok(missionExperience.includes("const keepsake = programmeMissionKeepsake(mission.missionNumber, mission.artifact, locale, localWording);"));
  assert.equal(keepsakeRowIsWide("x".repeat(KEEPSAKE_WIDE_VALUE)), false);
  assert.equal(keepsakeRowIsWide("x".repeat(KEEPSAKE_WIDE_VALUE + 1)), true);
  // A label with a very long word takes the whole width too, so no word breaks inside itself.
  assert.equal(keepsakeRowIsWide("Om 7 dagar", "Granskningspunkt"), true);
  assert.equal(keepsakeRowIsWide("Öva på en paus", "Din riktning"), false);
  assert.deepEqual(["x".repeat(90), "x".repeat(91), "x".repeat(180), "x".repeat(181)].map(keepsakeSentenceSize), ["short", "medium", "medium", "long"]);
  assert.match(stylesheet, /\.keepsake \{[^}]*background: var\(--pg-paper\);[^}]*color: var\(--pg-ink\); \}/);
  assert.ok(stylesheet.includes(".keepsakeRows > div[data-wide] { grid-column: 1 / -1; }"));

  // "Save as image": made on the device from what the card shows. No request, no markup injection,
  // nothing the Content-Security-Policy would have to allow, and the policy file is not touched for it.
  assert.doesNotMatch(image, /fetch\(|XMLHttpRequest|sendBeacon|innerHTML|new Image\(|foreignObject|eval\(|new Worker/);
  assert.match(image, /canvas\.toBlob\(/);
  assert.match(image, /navigator\.canShare\(\{ files: \[file\] \}\)/);
  assert.match(image, /link\.download = fileName;/);
  // The card is drawn with the name of the site the person is using: "B4GAMBLE" here, "Pause
  // Plan" on the help host, because the image is saved and kept (Founder, 17 October 2026).
  assert.ok(missionExperience.includes("const image = await keepsakeImage({ ...keepsake, brand: siteOwnName }, keepsakeFonts(document.body));"));
  assert.match(read("lib/security/content-security-policy.ts"), /"img-src 'self' data: blob: https:",/);

  // The completion screen carries no research block (Founder, 16 October 2026).
  assert.doesNotMatch(missionExperience, /from "@\/lib\/(?:research-access|commercial-section)"|researchDoorOpen\(|ResearchOpened|ResearchChecklist/);

  // Motion: the card rises, the tick and the new dot follow; none for readers who ask for none.
  assert.ok(stylesheet.includes('.stepMain[data-programme-completion="fresh"] .keepsake { animation: programme-keepsake-in 240ms var(--pg-ease) both; }'));
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\) \{\s*\.stepMain\[data-programme-completion="fresh"\] \.keepsake,[^}]*\{ animation: none; \}\s*\}/);

  // The new words, in every cell of the catalogue.
  assert.equal(programmeText("sv-SE", "Step {step} done", { step: 2 }), "Steg 2 klart");
  assert.equal(programmeText("sv-SE", "You built it yourself. It is yours, not ours."), "Du har byggt den själv. Den är din, inte vår.");
  assert.equal(programmeText("sv-SE", "Save as image"), "Spara som bild");
  assert.equal(programmeText("sv-SE", "{xp} XP · {done} of {total} steps", { xp: "+25", done: 2, total: 10 }), "+25 XP · 2 av 10 steg");
  for (const key of ["Complete Mission", "Step {step} done", "You built it yourself. It is yours, not ours.", "Save as image", "The image could not be saved.", "{xp} XP · {done} of {total} steps"] as const) {
    const cells = CATALOGUE_LOCALES.map((locale) => programmeText(locale, key));
    assert.equal(new Set(cells).size, key === "Complete Mission" ? cells.length : 14, key);
    for (const cell of cells) assert.ok(cell.trim().length > 0, key);
  }
});
