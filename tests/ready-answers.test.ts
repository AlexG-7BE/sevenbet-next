import assert from "node:assert/strict";
import test from "node:test";

import { programmeText, type ProgrammeMessageKey } from "../lib/i18n/programme-catalog";
import { PROGRAMME_LOCALES } from "../lib/programme/presentation";
import {
  PROGRAMME_ANSWER_FOCUS,
  PROGRAMME_ANSWER_NOTE_MAX_LENGTH,
  PROGRAMME_READY_ANSWERS,
  PROGRAMME_START_QUESTION,
  pickedReadyAnswers,
  readyAnswersSituation,
} from "../lib/programme/program-ai/ready-answers";
import { parseProgrammeAiTurn } from "../lib/programme/program-ai/validation";

// Founder decisions, 11 Oct 2026: Mission 01 starts with ready answers a person picks, several
// at once, with no voice; "Something else" may carry one short note.

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

test("a note for Something else is sent in the person's words, tidied and bounded", () => {
  assert.equal(
    readyAnswersSituation("en-GB", ["Something else"], "  I bet on\nfootball every   weekend "),
    "What feels hardest right now? Something else: I bet on football every weekend.",
  );
  // The person's own closing punctuation is kept.
  assert.match(readyAnswersSituation("en-GB", ["Something else"], "Why can't I stop?"), /Something else: Why can't I stop\?$/);
  // A note without the answer is not sent, and an empty note adds nothing.
  assert.equal(readyAnswersSituation("en-GB", ["I chase my losses"], "ignored"), "What feels hardest right now? I chase my losses.");
  assert.equal(readyAnswersSituation("en-GB", ["Something else"], "   "), "What feels hardest right now? Something else.");
  const long = readyAnswersSituation("en-GB", [...PROGRAMME_READY_ANSWERS], "x".repeat(2000));
  assert.ok(long.length < 700, String(long.length));
  assert.ok(long.includes("x".repeat(PROGRAMME_ANSWER_NOTE_MAX_LENGTH)) && !long.includes("x".repeat(PROGRAMME_ANSWER_NOTE_MAX_LENGTH + 1)));
  const turn = parseProgrammeAiTurn({ locale: "en-GB", inputMode: "text", situation: long, clarificationAnswers: [] });
  assert.equal(turn.situation, long);
});

test("every answer has a first-focus line of ours, translated, so the next screen waits for nothing", () => {
  assert.deepEqual(Object.keys(PROGRAMME_ANSWER_FOCUS), [...PROGRAMME_READY_ANSWERS]);
  assert.equal(new Set(Object.values(PROGRAMME_ANSWER_FOCUS)).size, PROGRAMME_READY_ANSWERS.length);
  for (const locale of PROGRAMME_LOCALES) {
    if (locale === "en-GB") continue;
    for (const answer of PROGRAMME_READY_ANSWERS) {
      const line: ProgrammeMessageKey = PROGRAMME_ANSWER_FOCUS[answer];
      assert.notEqual(programmeText(locale, line), line, `${locale}: ${answer}`);
    }
    assert.notEqual(programmeText(locale, "Tell us in a few words"), "Tell us in a few words", locale);
  }
});

test("restored answers keep list order and drop anything that is not a ready answer", () => {
  assert.deepEqual(pickedReadyAnswers(["Something else", "I chase my losses", "not an answer", 7, null]), ["I chase my losses", "Something else"]);
  assert.deepEqual(pickedReadyAnswers([]), []);
});
