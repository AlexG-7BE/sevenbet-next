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
 * The picked answers as the person read them, in their language and in list
 * order, under the question they answered. This is the whole text Mission 01
 * receives; nothing the person did not see is added.
 */
export function readyAnswersSituation(locale: ProgrammeLocale, picked: readonly ProgrammeReadyAnswer[]) {
  const answers = PROGRAMME_READY_ANSWERS.filter((answer) => picked.includes(answer));
  if (answers.length === 0) return "";
  return [
    programmeText(locale, PROGRAMME_START_QUESTION),
    ...answers.map((answer) => `${programmeText(locale, answer)}.`),
  ].join(" ");
}
