import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "@/lib/programme/presentation";

/**
 * Founder decisions, 11 Oct 2026: the Programme starts with ready answers a
 * person can pick, several at once. There is no voice and no free text, so
 * the last answer is the way forward when none of the others fits. The
 * wording is the Founder's to correct; each answer is one catalogue message.
 */
export const PROGRAMME_START_QUESTION = "What feels hardest right now?" satisfies ProgrammeMessageKey;

export const PROGRAMME_READY_ANSWERS = [
  "I chase my losses",
  "I spend more than I plan",
  "I can't stop once I start",
  "I gamble when I'm stressed",
  "I hide it from people close to me",
  "Something else",
] as const satisfies readonly ProgrammeMessageKey[];

export type ProgrammeReadyAnswer = (typeof PROGRAMME_READY_ANSWERS)[number];

/**
 * What the Programme will work on first, one line per answer. The screen after
 * the answers shows these at once, so it never waits for a server or a
 * provider (Founder decision, 11 Oct 2026: a screen change takes 0.1–0.3 s).
 */
export const PROGRAMME_ANSWER_FOCUS = {
  "I chase my losses": "Set a stop point before you play, so a loss ends the session instead of starting a chase.",
  "I spend more than I plan": "Fix your budget before you play and make it hard to add more.",
  "I can't stop once I start": "Build a pause you can use in the middle of a session.",
  "I gamble when I'm stressed": "Spot the moment stress turns into play, and have another move ready.",
  "I hide it from people close to me": "Find one safe way to stop carrying this alone.",
  "Something else": "Map what happens before you play, then build your own limits step by step.",
} as const satisfies Record<ProgrammeReadyAnswer, ProgrammeMessageKey>;

/** "Something else" may carry a short note in the person's own words. */
export const PROGRAMME_ANSWER_NOTE_MAX_LENGTH = 280;

/** The picked answers in list order; anything else is dropped. */
export function pickedReadyAnswers(picked: readonly unknown[]): ProgrammeReadyAnswer[] {
  return PROGRAMME_READY_ANSWERS.filter((answer) => picked.includes(answer));
}

function tidyNote(note: string) {
  return note.replace(/\s+/g, " ").trim().slice(0, PROGRAMME_ANSWER_NOTE_MAX_LENGTH);
}

/**
 * The picked answers as the person read them, in their language and in list
 * order, under the question they answered, with the note they wrote for
 * "Something else". This is the whole text Mission 01 receives; nothing the
 * person did not see or write is added.
 */
export function readyAnswersSituation(locale: ProgrammeLocale, picked: readonly ProgrammeReadyAnswer[], note = "") {
  const answers = pickedReadyAnswers(picked);
  if (answers.length === 0) return "";
  const written = tidyNote(note);
  return [
    programmeText(locale, PROGRAMME_START_QUESTION),
    ...answers.map((answer) => (
      answer === "Something else" && written
        ? `${programmeText(locale, answer)}: ${written}${/[.!?…]$/.test(written) ? "" : "."}`
        : `${programmeText(locale, answer)}.`
    )),
  ].join(" ");
}
