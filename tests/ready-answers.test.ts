import assert from "node:assert/strict";
import test from "node:test";

import { programmeText, type ProgrammeMessageKey } from "../lib/i18n/programme-catalog";
import { PROGRAMME_LOCALES } from "../lib/programme/presentation";
import {
  PROGRAMME_READY_ANSWERS,
  PROGRAMME_START_QUESTION,
  readyAnswersSituation,
} from "../lib/programme/program-ai/ready-answers";
import { parseProgrammeAiTurn } from "../lib/programme/program-ai/validation";

// Founder decisions, 11 Oct 2026: Mission 01 starts with ready answers a person picks, several
// at once, with no voice and no free text.

test("the start offers five ready answers and a way forward when none fits", () => {
  assert.equal(PROGRAMME_READY_ANSWERS.length, 6);
  assert.equal(PROGRAMME_READY_ANSWERS.at(-1), "Something else");
  assert.equal(new Set(PROGRAMME_READY_ANSWERS).size, PROGRAMME_READY_ANSWERS.length);
});

test("picked answers are sent as the person read them, under the question, in list order", () => {
  assert.equal(
    readyAnswersSituation("en-GB", ["I spend more than I plan", "I chase my losses"]),
    "What feels hardest right now? I chase my losses. I spend more than I plan.",
  );
  assert.equal(readyAnswersSituation("en-GB", []), "");
  assert.equal(
    readyAnswersSituation("de-DE", ["Something else"]),
    `${programmeText("de-DE", PROGRAMME_START_QUESTION)} ${programmeText("de-DE", "Something else")}.`,
  );
});

test("every single answer in every Programme language passes the server's Mission 01 check", () => {
  for (const locale of PROGRAMME_LOCALES) {
    for (const answer of PROGRAMME_READY_ANSWERS) {
      const situation = readyAnswersSituation(locale, [answer]);
      const turn = parseProgrammeAiTurn({ locale, inputMode: "text", situation, clarificationAnswers: [] });
      assert.equal(turn.situation, situation, `${locale}: ${answer}`);
      assert.ok(situation.includes(programmeText(locale, answer)), `${locale}: ${answer}`);
    }
    // All answers together stay far inside the 4,000-character limit.
    assert.ok(readyAnswersSituation(locale, [...PROGRAMME_READY_ANSWERS]).length < 600, locale);
  }
});

test("each answer and the question are translated in every language", () => {
  for (const locale of PROGRAMME_LOCALES) {
    if (locale === "en-GB") continue;
    const keys: ProgrammeMessageKey[] = [PROGRAMME_START_QUESTION, ...PROGRAMME_READY_ANSWERS];
    for (const key of keys) {
      assert.notEqual(programmeText(locale, key), key, `${locale}: ${key}`);
    }
  }
});
