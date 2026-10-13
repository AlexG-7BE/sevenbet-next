import type { ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";

/**
 * Presentation of a step's question screen (Founder, 13 October 2026). Nothing here is Mission
 * logic: the server's Mission definitions know nothing about these lines, and a Mission without
 * an entry simply shows its options and helper as before.
 */

/**
 * The headline of a question is set in two voices: the first part in heavy capitals, the tail in
 * the italic serif. The catalogue is not edited for this. The tail is the last third of the words,
 * at least two and at most four; a question of one or two words is not split.
 */
export function splitQuestionHeadline(text: string): { head: string; tail: string | null } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return { head: words.join(" "), tail: null };
  const tailLength = Math.min(4, Math.max(2, Math.round(words.length / 3)));
  return { head: words.slice(0, -tailLength).join(" "), tail: words.slice(-tailLength).join(" ") };
}

/** One "Why we ask" line under the helper of an action. Absent: the screen shows no such line. */
const whyLines: Readonly<Record<string, ProgrammeMessageKey>> = {
  // Step 2 · Set a 7-day goal
  choose_direction: "a small goal lasts longer than a big promise.",
  build_7_day_goal: "so you know what to do, not only what you want.",
  reality_check: "it is easier to choose now than on a hard day.",
  // Step 3 · Research responsibly
  learn_comparison_signals: "a few clear facts say more than a big headline.",
  decode_offer_terms: "the small print often changes what the headline means.",
  build_research_checklist: "a fixed list lets you check the same things every time.",
};

/** One short line under an option, by action and option value. Absent: the card shows its title only. */
const optionLines: Readonly<Record<string, Readonly<Record<string, ProgrammeMessageKey>>>> = {
  choose_direction: {
    understand: "See when the urge comes and what sets it off.",
    pause: "Wait a moment before you decide.",
    reduce_impulse: "Make it harder to start playing straight away.",
    set_boundary: "Decide the amount and the time before you start.",
    research_later: "Compare in peace, not in the middle of an urge.",
    seek_support: "Choose one person who will know.",
  },
  build_7_day_goal: {
    notice_and_note: "Write down one moment when the urge shows up.",
    pause_first: "Wait a little before one choice this week.",
    use_one_boundary: "Keep to one limit you set in advance.",
    research_after_pause: "Look and compare only once you have paused.",
    ask_for_support: "Turn to a person or a service you trust.",
  },
  reality_check: {
    make_it_smaller: "Do a smaller version of the same thing.",
    use_the_pause: "Skip the rest and just take the pause.",
    restart_next_day: "Leave today and start again tomorrow.",
    ask_for_support: "Talk to someone instead of handling it alone.",
  },
  decode_offer_terms: {
    wagering_requirement: "How many times you must bet before a withdrawal.",
    expiry: "How long you have before the bonus runs out.",
    eligible_games: "Which games count towards the requirement.",
    deposit_condition: "What you must pay in to get the bonus.",
    withdrawal_limit: "The most you can take out from the bonus.",
    unclear_terms: "You could not find a clear answer.",
  },
  // The checklist lists the same seven facts as the step's first question, so each keeps the line
  // it already carries there.
  build_research_checklist: {
    licensing_status: "Confirms whether the product is permitted for the relevant market.",
    operator_identity: "Shows the legal business behind the consumer brand.",
    terms: "Reveals the conditions that shape the headline.",
    withdrawals: "Shows how and when funds can be accessed.",
    payments: "Makes fees, methods and processing expectations visible.",
    safer_gambling_tools: "Shows what account controls are available before they are needed.",
    offer_conditions: "Separates the headline from the conditions attached to it.",
  },
};

export function questionWhyLine(actionId: string): ProgrammeMessageKey | undefined {
  return whyLines[actionId];
}

export function questionOptionLine(actionId: string, optionValue: string): ProgrammeMessageKey | undefined {
  return optionLines[actionId]?.[optionValue];
}

export const QUESTION_SCREEN_ACTIONS_WITH_LINES: readonly string[] = Object.keys(whyLines);

export function questionOptionLineEntries(actionId: string): ReadonlyArray<readonly [string, ProgrammeMessageKey]> {
  return Object.entries(optionLines[actionId] ?? {});
}

/** How long the reward of a saved action stands in the progress label before the question count returns. */
export const QUESTION_REWARD_LABEL_MS = 2000;
