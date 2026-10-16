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
  // Step 3 · Know who to turn to (Mission 08; its action ids are kept from the earlier lesson)
  learn_comparison_signals: "an urge is easier to get through when one person knows.",
  decode_offer_terms: "a number you already have is quicker than a search.",
  build_research_checklist: "a plan made now needs no thinking when the urge comes.",
  // Step 4 · Understand the urge (Mission 03)
  map_urge_sequence: "seeing the order shows where you still have a choice.",
  name_early_signal: "an early sign gives you more time to choose.",
  choose_pause_move: "a move picked in advance is ready when the urge comes.",
  // Step 5 · Build one boundary (Mission 04)
  choose_boundary: "a limit works best when you know exactly where it starts.",
  build_boundary_rule: "a limit holds better when something practical backs it.",
  choose_execution: "an honest look now shows what is still missing.",
  // Step 6 · Check before deciding (Mission 05)
  run_decision_check: "naming the moment makes it easier to see what to check.",
  build_three_checks: "three fixed questions are easier to remember than ten.",
  commit_pause_rule: "a rule set in advance needs no decision in the moment.",
  // Step 7 · Add friction (Mission 06)
  choose_friction_layer: "one extra step gives you time to think again.",
  build_friction_stack: "you decide how much stands between you and a quick start.",
  rehearse_bypass: "every obstacle has a weak spot, and it helps to know yours.",
  // Step 8 · Prepare support (Mission 07)
  choose_support_route: "it is easier to reach out when you know where to turn.",
  build_support_card: "words written in advance are easier to use under pressure.",
  choose_exit_action: "a way out you chose yourself is easier to take.",
  // Step 9 · Rehearse the decision (Mission 09)
  choose_scenario: "one situation you know well is the best one to practise.",
  rehearse_response: "a response you have tried once comes more easily.",
  build_fallback_response: "so you have a next move if the first one does not work.",
  // Step 10 · Make the plan reviewable (Mission 10)
  review_my_plan: "seeing it all in one place shows what you have built.",
  assemble_final_plan: "a short plan is easier to use than a long one.",
  choose_review_cadence: "a plan is easier to keep when you look at it now and then.",
};

// A control or a move offered in more than one question keeps one line wherever it appears.
const openHelpLine: ProgrammeMessageKey = "Go to the Help page with support and pause options.";
const leaveLine: ProgrammeMessageKey = "Close the site or app and do something else.";
const timerLine: ProgrammeMessageKey = "Set a timer and decide when it rings.";
const notSureLine: ProgrammeMessageKey = "That is an honest answer too.";
const talkToSomeoneLine: ProgrammeMessageKey = "Talk to someone instead of handling it alone.";
const unexpectedOfferLine: ProgrammeMessageKey = "A bonus or message you did not look for.";
const someoneSuggestsLine: ProgrammeMessageKey = "Someone you know suggests playing.";
const removeSavedPaymentLine: ProgrammeMessageKey = "Delete the saved card so paying takes more steps.";
// The controls a boundary can be put in place with (step 5) are the layers of friction of step 7.
const controlLines: Readonly<Record<string, ProgrammeMessageKey>> = {
  operator_limit: "A limit you set in your account at the gambling site.",
  bank_block: "Ask your bank to block payments to gambling.",
  device_or_site_block: "A blocker on your phone or computer for gambling sites.",
  trusted_contact: "Ask someone you trust to help you keep to it.",
  self_exclusion_or_help: "A block you set on yourself for a period, or the Help page.",
};
const frictionLines: Readonly<Record<string, ProgrammeMessageKey>> = {
  operator_limit: controlLines.operator_limit,
  bank_block: controlLines.bank_block,
  device_or_site_block: controlLines.device_or_site_block,
  remove_saved_payment: removeSavedPaymentLine,
  trusted_contact: controlLines.trusted_contact,
  self_exclusion_or_help: controlLines.self_exclusion_or_help,
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
  // Step 3 · Know who to turn to (Mission 08). The first question has two lists: who the person
  // is to you, then the line you would say.
  learn_comparison_signals: {
    partner: "Someone you live with or are close to.",
    family: "A parent, a sister or brother, a grown-up child.",
    friend: "Someone you would call on a bad day.",
    colleague: "A colleague you trust.",
    been_there: "From a support group, or someone who has also gambled.",
    professional: "Someone whose work is to listen.",
    service_first: "That is a fine start. The next question helps you find one.",
    call_me: "For the moment the urge comes.",
    tell_you: "For a first talk, when things are calm.",
    one_word: "Agree on the word now, so it is quick later.",
    check_in: "So you do not have to start the talk yourself.",
    first_call: "Your first sentence when you call a helpline or chat.",
  },
  decode_offer_terms: {
    phone: "A helpline with someone trained to listen.",
    chat: "If saying it out loud feels like too much.",
    in_person: "Near you or online.",
    debt: "If gambling has left you with bills, loans or debts.",
    close_ones: "Support for the person you tell, too.",
  },
  build_research_checklist: {
    phone_away: "In another room, or out of reach.",
    send_line: "The words you chose in the first question.",
    contact_service: "How to reach it is on your card.",
    wait_ten_minutes: timerLine,
    go_outside: "A walk, the stairs, anything that gets you out of the room.",
    read_card: "Your own plan, in your own words.",
  },
  // Step 4 · Understand the urge (Mission 03). The sequence of its first question is put in order,
  // not chosen from cards, so that question carries a why-line only.
  name_early_signal: {
    body: "A tension, restlessness or a quicker pulse.",
    thought: "A thought such as: just one quick look.",
    attention: "Your attention keeps going back to playing.",
    action_tendency: "Your hand is already reaching for the phone.",
    not_sure: notSureLine,
  },
  choose_pause_move: {
    three_slow_breaths: "It takes half a minute and needs nothing else.",
    leave_the_screen: "Put the phone down or walk away from the computer.",
    wait_ten_minutes: timerLine,
    message_support: "Send a short message to someone you trust.",
    open_help: openHelpLine,
  },
  // Step 5 · Build one boundary (Mission 04). The first question has two lists: what the boundary
  // is about, then when it starts.
  choose_boundary: {
    money: "A limit on how much you spend.",
    time: "A limit on how long or when you play.",
    access: "A limit on how easily you can get in.",
    pause: "A set wait before you go on.",
    before_access: "It applies before you open a site or app.",
    saved_early_signal: "It starts when your early signal shows up.",
    scheduled_time: "It starts at a time of day you decide.",
    custom_local: "A moment of your own, put in your own words.",
  },
  build_boundary_rule: {
    operator_limit: controlLines.operator_limit,
    bank_block: controlLines.bank_block,
    device_or_site_block: controlLines.device_or_site_block,
    remove_payment: removeSavedPaymentLine,
    trusted_contact: controlLines.trusted_contact,
    leave: leaveLine,
    self_exclusion_or_help: controlLines.self_exclusion_or_help,
    custom_local: "A way of your own, put in your own words.",
  },
  choose_execution: {
    easy_to_use: "It is set up and you can use it right now.",
    needs_setup: "You still have to turn it on or set it up.",
    needs_support: "You need another person to get it working.",
    choose_another: "This way does not suit you as it stands.",
  },
  // Step 6 · Check before deciding (Mission 05)
  run_decision_check: {
    unexpected_offer: unexpectedOfferLine,
    difficult_day: "A day when you are tired, stressed or low.",
    social_prompt: someoneSuggestsLine,
    quick_return: "You want to play again soon after you stopped.",
  },
  build_three_checks: {
    purpose: "Name the reason before you go on.",
    time: "How long you have decided to play.",
    money: "How much you have decided to spend.",
    terms: "Whether you know what the offer really asks of you.",
    mood: "Whether a feeling right now is driving the choice.",
    exit: "How you stop or walk away if you want to.",
  },
  commit_pause_rule: {
    pause_before_access: "You pause before you open a site or app.",
    pause_before_payment: "You pause before you pay in any money.",
    pause_when_signal_appears: "You pause as soon as you notice your early signal.",
    pause_when_terms_are_unclear: "You pause when you do not understand the terms.",
  },
  // Step 7 · Add friction (Mission 06). The last question has two lists: the weak point, then the fallback.
  choose_friction_layer: frictionLines,
  build_friction_stack: frictionLines,
  rehearse_bypass: {
    too_many_steps: "The extra steps make you want to skip it.",
    easy_to_disable: "You can switch it off in a few taps.",
    another_device: "It only covers one phone or computer.",
    change_of_mind: "In the moment you decide to drop it.",
    not_sure: notSureLine,
    leave: leaveLine,
    wait_twenty_minutes: timerLine,
    open_help: openHelpLine,
    contact_support: talkToSomeoneLine,
    use_second_layer: "Let your second layer take over.",
  },
  // Step 8 · Prepare support (Mission 07)
  choose_support_route: {
    trusted_person: "A friend, partner or relative you can talk to.",
    professional_support: "A counsellor, a helpline or a support service.",
    peer_support: "People who have been through the same thing.",
    protected_help: "The Help page on this site, always open to you.",
    not_ready: "You do not have to involve anyone now.",
  },
  build_support_card: {
    when_then: "One situation and the one thing you do then.",
    short_prompt: "A few words that remind you what to do.",
    two_step: "A first move, and a second if you need it.",
  },
  choose_exit_action: {
    leave_page: "Close the page you are on.",
    close_account_tools: "Go to the limits and breaks in your gambling account.",
    open_help: openHelpLine,
    contact_support: "Turn to a person or a service you trust.",
    take_a_walk: "Get up and go somewhere else for a while.",
  },
  // Step 9 · Rehearse the decision (Mission 09). The second question shows drafted responses to
  // choose from, not option cards, so it carries a why-line only.
  choose_scenario: {
    unexpected_offer: unexpectedOfferLine,
    urge_after_stress: "The wish to play comes after a hard day.",
    social_invitation: someoneSuggestsLine,
    unclear_terms: "The conditions of an offer are hard to follow.",
  },
  build_fallback_response: {
    pause_and_check: "Stop for a moment and go through your three checks.",
    leave_and_return: "Leave now and decide later, when things are calm.",
    use_boundary: "Keep to the limit you built in an earlier step.",
    ask_for_support: talkToSomeoneLine,
  },
  // Step 10 · Make the plan reviewable (Mission 10)
  review_my_plan: {
    yes: "You have read through the list above.",
  },
  assemble_final_plan: {
    starting_point: "Where you stood when you began.",
    goal: "The small goal you set for one week.",
    early_signal: "The first sign that the urge is on its way.",
    pause_move: "The thing you do to give yourself a little time.",
    boundary: "Your one limit and the moment it starts.",
    decision_checks: "The three questions you ask before deciding.",
    friction: "The obstacles you put on the quick route.",
    support: "The person or service you can turn to.",
    support_card: "Your person, your help service and your first 10 minutes.",
    fallback: "What you do if the first move does not hold.",
  },
  choose_review_cadence: {
    "7": "A close follow-up while the plan is still new.",
    "14": "A middle pace, neither close nor loose.",
    "30": "A longer view, once the plan feels familiar.",
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
