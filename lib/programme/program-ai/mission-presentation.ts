import type { ProgramAiStructuralArtifact } from "@/lib/programme/program-ai/mission-validation";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import {
  crisisLine,
  helpContactLine,
  isProgrammeHelpServiceType,
  programmeHelpExtras,
  programmeHelpMarket,
} from "@/lib/programme/program-ai/help-services";

const fieldLabels: Record<string, ProgrammeMessageKey> = {
  direction: "Your direction",
  goalStyle: "Your 7-day approach",
  reviewWindowDays: "Review point",
  realityCheck: "Difficult-day version",
  sequenceOrder: "Your choice-point sequence",
  earlySignalCategory: "Where you may notice it first",
  pauseMove: "Your pause move",
  boundaryCategory: "Your boundary",
  triggerType: "When it acts",
  executionMethod: "How you will put it in place",
  pressureCheck: "What it needs next",
  scenarioChoice: "Practice moment",
  decisionChecks: "Your 3 checks",
  pauseRuleType: "Your pause rule",
  frictionMethods: "Your friction layers",
  fallbackMethod: "Your fallback",
  bypassReason: "What could undo it",
  supportModes: "Support routes",
  supportCardStyle: "Support card",
  exitActionType: "Your exit action",
  trustedPerson: "My person",
  openingLine: "What I will say",
  helpService: "My help service",
  firstTenMinutes: "First 10 minutes",
  scenarioType: "Rehearsal moment",
  responseStrategy: "First response",
  fallbackStrategy: "Fallback response",
  timelineReviewed: "Programme timeline",
  planPriorityIds: "Plan priorities",
  reviewCadenceDays: "Review cadence",
  confirm: "Timeline check",
};

const valueLabels: Record<string, ProgrammeMessageKey> = {
  understand: "Understand the pattern",
  pause: "Practise a pause",
  reduce_impulse: "Reduce one impulsive route",
  set_boundary: "Set one boundary",
  research_later: "Research only after a pause",
  seek_support: "Prepare support",
  notice_and_note: "Notice and note one moment",
  pause_first: "Pause before one decision",
  use_one_boundary: "Use one boundary",
  research_after_pause: "Research after a pause",
  ask_for_support: "Use a support route",
  make_it_smaller: "Make the experiment smaller",
  use_the_pause: "Use the pause only",
  restart_next_day: "Restart the next day",
  cue: "Cue",
  early_signal: "Early signal",
  urge_builds: "Urge builds",
  choice_point: "Choice point",
  body: "In the body",
  thought: "In a thought",
  attention: "In where attention goes",
  action_tendency: "In the urge to act",
  not_sure: "Not sure yet",
  three_slow_breaths: "Take three slow breaths",
  leave_the_screen: "Leave the screen",
  wait_ten_minutes: "Wait 10 minutes",
  message_support: "Use a support message",
  open_help: "Open Help",
  money: "Money",
  time: "Time",
  access: "Access",
  before_access: "Before access",
  saved_early_signal: "When the early signal appears",
  scheduled_time: "At a scheduled time",
  custom_local: "A moment you word in this tab",
  operator_limit: "Account limit",
  bank_block: "Bank block",
  device_or_site_block: "Device or site block",
  remove_payment: "Remove saved payment",
  remove_saved_payment: "Remove saved payment",
  trusted_contact: "Trusted contact",
  leave: "Leave",
  self_exclusion_or_help: "Self-exclusion or Help",
  easy_to_use: "Ready and easy to use",
  needs_setup: "Needs setup",
  needs_support: "Needs support",
  choose_another: "Choose another method",
  unexpected_offer: "An unexpected offer appears",
  difficult_day: "A difficult day",
  social_prompt: "A social prompt",
  quick_return: "The temptation to return quickly",
  purpose: "Why am I considering this?",
  terms: "Are the material terms clear?",
  mood: "Am I reacting to the moment?",
  exit: "What is my exit route?",
  pause_before_access: "Pause before access",
  pause_before_payment: "Pause before payment",
  pause_when_signal_appears: "Pause when the early signal appears",
  pause_when_terms_are_unclear: "Pause when terms are unclear",
  too_many_steps: "It feels like too many steps",
  easy_to_disable: "The layer is easy to disable",
  another_device: "Another device is available",
  change_of_mind: "I change my mind in the moment",
  wait_twenty_minutes: "Wait 20 minutes",
  contact_support: "Use support",
  use_second_layer: "Use the second layer",
  trusted_person: "A trusted person",
  professional_support: "Professional support",
  peer_support: "Peer support",
  protected_help: "Help",
  not_ready: "Not ready",
  when_then: "When this happens, I can take the next step",
  short_prompt: "One short prompt",
  two_step: "A 2-step route",
  leave_page: "Leave the page",
  close_account_tools: "Open account control tools",
  take_a_walk: "Step away",
  unclear_terms: "Terms remain unclear",
  urge_after_stress: "An urge after stress",
  social_invitation: "A social invitation",
  pause_and_check: "Pause and run the checks",
  leave_and_return: "Leave and return later",
  use_boundary: "Use the boundary",
  starting_point: "Starting Point",
  goal: "7-day goal",
  pause_move: "Pause move",
  boundary: "Boundary",
  decision_checks: "Decision checks",
  friction: "Friction",
  support: "Support",
  support_card: "Support card",
  fallback: "Fallback",
  yes: "I reviewed the available structural facts",
};

const fieldValueLabels: Record<string, Record<string, ProgrammeMessageKey>> = {
  boundaryCategory: { money: "Money", time: "Time", access: "Access", pause: "Pause" },
  decisionChecks: {
    purpose: "Why am I considering this?",
    time: "What time boundary applies?",
    money: "What money boundary applies?",
    terms: "Are the material terms clear?",
    mood: "Am I reacting to the moment?",
    exit: "What is my exit route?",
  },
  // Step 3 · Know who to turn to (Mission 08)
  trustedPerson: {
    partner: "My partner",
    family: "Someone in my family",
    friend: "A friend",
    colleague: "Someone at work",
    been_there: "Someone who has been there",
    professional: "A doctor or counsellor",
    service_first: "Nobody yet: a help service first",
  },
  openingLine: {
    call_me: "Can you call me? I'm having a hard moment.",
    tell_you: "I want to tell you something about my gambling.",
    one_word: "If I text you one word, can you call me?",
    check_in: "Can you ask me how it is going this week?",
    first_call: "I would like to talk about my gambling.",
  },
  helpService: {
    phone: "Talk on the phone",
    chat: "Write in a chat",
    in_person: "Join a group or see a counsellor",
    debt: "Get help with money and debt",
    close_ones: "Help for the people close to me",
  },
  firstTenMinutes: {
    phone_away: "Put the phone away",
    send_line: "Send my line to my person",
    contact_service: "Call or write to my help service",
    wait_ten_minutes: "Wait for 10 minutes",
    go_outside: "Go outside or move",
    read_card: "Read my support card",
  },
};

/** Values an earlier lesson could store and the current one no longer offers: they are left out. */
const retiredFieldValues: Record<string, readonly string[]> = {
  // "Research checklist" was a final-plan priority while step 3 was "Research responsibly".
  planPriorityIds: ["research"],
};

/** A stored value an earlier lesson offered and the current one does not: screens and the provider leave it out. */
export function isRetiredFieldValue(key: string, value: unknown) {
  return (retiredFieldValues[key] ?? []).includes(String(value));
}

const missionResultTitles: Record<number, ProgrammeMessageKey> = {
  2: "MY 7-DAY GOAL",
  3: "MY CHOICE POINT",
  4: "MY BOUNDARY",
  5: "MY 3-CHECK ROUTINE",
  6: "MY FRICTION STACK",
  7: "MY SUPPORT ROUTE",
  8: "MY SUPPORT CARD",
  9: "MY REHEARSED DECISION",
  10: "MY PLAN",
};

export type PresentedArtifactRow = { key: string; label: string; value: string };

function presentValue(key: string, value: string | number | boolean | string[], locale: ProgrammeLocale) {
  if (key === "reviewWindowDays") return programmeText(locale, "In 7 days");
  if (key === "reviewCadenceDays") return programmeText(locale, "Every {days} days", { days: String(value) });
  if (key === "timelineReviewed") return programmeText(locale, value === true ? "Reviewed" : "Not reviewed yet");
  if (key === "helpService") return helpServiceValue(value, locale);
  const values = (Array.isArray(value) ? value : [value]).filter((item) => !isRetiredFieldValue(key, item));
  if (!values.length) return programmeText(locale, "Unavailable");
  return values.map((item) => {
    const label = fieldValueLabels[key]?.[String(item)] ?? valueLabels[String(item)];
    return label ? programmeText(locale, label) : programmeText(locale, "Unavailable");
  }).join(" · ");
}

/** The kind of help a person chose, as the service that answers for it in their language's market. */
function helpServiceValue(value: string | number | boolean | string[], locale: ProgrammeLocale) {
  if (!isProgrammeHelpServiceType(value)) return programmeText(locale, "Unavailable");
  const market = programmeHelpMarket(locale);
  return market
    ? helpContactLine(market.services[value])
    : `${programmeText(locale, fieldValueLabels.helpService[value])} · ${programmeText(locale, "See the Help page")}`;
}

export function presentMissionArtifact(
  artifact: ProgramAiStructuralArtifact,
  locale: ProgrammeLocale = "en-GB",
): PresentedArtifactRow[] {
  return Object.entries(artifact)
    .filter(([key]) => Boolean(fieldLabels[key]))
    .map(([key, value]) => ({ key, label: programmeText(locale, fieldLabels[key]), value: presentValue(key, value, locale) }));
}

export function humanValue(value: string, locale: ProgrammeLocale = "en-GB", fieldKey?: string) {
  const label = fieldKey ? fieldValueLabels[fieldKey]?.[value] ?? valueLabels[value] : valueLabels[value];
  return label ? programmeText(locale, label) : programmeText(locale, "Unavailable");
}

export function programmeArtifactFieldLabel(fieldKey: string, locale: ProgrammeLocale) {
  const label = fieldLabels[fieldKey];
  return label ? programmeText(locale, label) : programmeText(locale, "Unavailable");
}

export function programmeMissionResultTitle(missionNumber: number, locale: ProgrammeLocale) {
  const title = missionResultTitles[missionNumber];
  return programmeText(locale, title ?? "YOUR RESULT");
}

const planPriorityFacts: Record<string, { missionNumber: number; fields: readonly string[] }> = {
  goal: { missionNumber: 2, fields: ["direction", "goalStyle", "reviewWindowDays"] },
  early_signal: { missionNumber: 3, fields: ["earlySignalCategory"] },
  pause_move: { missionNumber: 3, fields: ["pauseMove"] },
  boundary: { missionNumber: 4, fields: ["boundaryCategory", "triggerType", "executionMethod"] },
  decision_checks: { missionNumber: 5, fields: ["decisionChecks", "pauseRuleType"] },
  friction: { missionNumber: 6, fields: ["frictionMethods", "fallbackMethod"] },
  support: { missionNumber: 7, fields: ["supportModes", "exitActionType"] },
  support_card: { missionNumber: 8, fields: ["trustedPerson", "helpService", "firstTenMinutes"] },
  fallback: { missionNumber: 9, fields: ["responseStrategy", "fallbackStrategy"] },
};

const PLAN_SEGMENT_MAXIMUM = 84;

function boundedSegment(value: string, maximum = PLAN_SEGMENT_MAXIMUM) {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1).trimEnd()}…`;
}

/**
 * The support card in the one-screen plan (code review, 17 October 2026): the person, then the
 * moves for the first 10 minutes, then the help service by name. Only whole parts are taken, so
 * no number, opening time or move is ever cut; the number itself stays on the support card of
 * step 3. A language without a checked list names the kind of help.
 */
function supportCardPlanSegment(artifact: ProgramAiStructuralArtifact, locale: ProgrammeLocale) {
  const label = (key: string, value: unknown) => {
    const message = typeof value === "string" ? fieldValueLabels[key]?.[value] : undefined;
    return message ? programmeText(locale, message) : "";
  };
  const market = programmeHelpMarket(locale);
  const service = isProgrammeHelpServiceType(artifact.helpService)
    ? market ? market.services[artifact.helpService].name : label("helpService", artifact.helpService)
    : "";
  const moves = Array.isArray(artifact.firstTenMinutes) ? artifact.firstTenMinutes.map((move) => label("firstTenMinutes", move)) : [];
  const groups = [[label("trustedPerson", artifact.trustedPerson)], moves, [service]]
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length);
  let text = "";
  for (const group of groups) {
    let part = "";
    for (const item of group) {
      const nextPart = part ? `${part} · ${item}` : item;
      const candidate = text ? `${text}; ${nextPart}` : nextPart;
      if (candidate.length > PLAN_SEGMENT_MAXIMUM) break;
      part = nextPart;
    }
    if (part) text = text ? `${text}; ${part}` : part;
  }
  return text || (groups[0] ? boundedSegment(groups[0][0]) : "");
}

export function deterministicFinalPlanText(context: unknown, locale: ProgrammeLocale = "en-GB") {
  const record = context && typeof context === "object" && !Array.isArray(context)
    ? context as Record<string, unknown>
    : {};
  const startingPoint = record.startingPoint && typeof record.startingPoint === "object" && !Array.isArray(record.startingPoint)
    ? record.startingPoint as Record<string, unknown>
    : {};
  const facts = Array.isArray(record.facts) ? record.facts : [];
  const priorities = Array.isArray(record.planPriorityIds)
    ? record.planPriorityIds.filter((value): value is string => typeof value === "string")
    : [];
  const segments = priorities.flatMap((priority) => {
    if (priority === "starting_point") {
      return typeof startingPoint.startingPoint === "string" && startingPoint.startingPoint.trim()
        ? [`${programmeText(locale, "Starting Point")}: ${boundedSegment(startingPoint.startingPoint.trim())}`]
        : [];
    }
    const projection = planPriorityFacts[priority];
    if (!projection) return [];
    const fact = facts.find((value) => value && typeof value === "object" && !Array.isArray(value)
      && (value as Record<string, unknown>).missionNumber === projection.missionNumber) as Record<string, unknown> | undefined;
    const artifact = fact?.artifact && typeof fact.artifact === "object" && !Array.isArray(fact.artifact)
      ? fact.artifact as ProgramAiStructuralArtifact
      : {};
    if (priority === "support_card") {
      const card = supportCardPlanSegment(artifact, locale);
      return card ? [`${humanValue(priority, locale)}: ${card}`] : [];
    }
    const values = presentMissionArtifact(artifact, locale)
      .filter((row) => projection.fields.includes(row.key) && row.value !== "Unavailable")
      .map((row) => row.value);
    return values.length ? [`${humanValue(priority, locale)}: ${boundedSegment(values.join("; "))}`] : [];
  });
  if (!segments.length) return programmeText(locale, "Review only the confirmed parts of your Programme; add nothing that is missing.");
  return segments.reduce((result, segment) => {
    const candidate = result ? `${result}. ${segment}` : segment;
    return candidate.length <= 238 ? candidate : result;
  }, "") || boundedSegment(segments[0], 238);
}

const scenarioCopy: Record<string, ProgrammeMessageKey> = {
  unexpected_offer: "A headline appears when you were not planning to look. The quick route is open.",
  difficult_day: "The day has been difficult and an old route feels easier than making another decision.",
  social_prompt: "Someone else brings up gambling and the decision suddenly feels immediate.",
  quick_return: "You have just stepped away, but returning now feels easier than waiting.",
  urge_after_stress: "After a stressful moment, the quickest familiar route comes back into view.",
  social_invitation: "A social invitation arrives and there is little time to think through the terms.",
  unclear_terms: "The headline is clear, but the conditions that would shape the decision are not.",
};

export function programmeScenarioText(scenario: string, locale: ProgrammeLocale) {
  const message = scenarioCopy[scenario];
  return message ? programmeText(locale, message) : scenario;
}

/** The Mission whose result is the support card of step 3, "Know who to turn to". */
export const SUPPORT_CARD_MISSION = 8;

/**
 * A step's result as its keepsake: its name, its own sentence and its rows. Most steps take the
 * sentence a person wrote in the tab. The support card of step 3 takes the line they chose
 * instead when they wrote none, shows it once, as the sentence, and always ends with the crisis
 * line of the person's market, so the saved picture carries it too.
 */
export function programmeMissionKeepsake(
  missionNumber: number,
  artifact: ProgramAiStructuralArtifact,
  locale: ProgrammeLocale,
  localWording = "",
) {
  const title = programmeMissionResultTitle(missionNumber, locale);
  const rows = presentMissionArtifact(artifact, locale);
  const written = localWording.trim();
  if (missionNumber !== SUPPORT_CARD_MISSION) return { title, sentence: written || undefined, rows };
  const line = typeof artifact.openingLine === "string" && fieldValueLabels.openingLine[artifact.openingLine]
    ? programmeText(locale, fieldValueLabels.openingLine[artifact.openingLine])
    : "";
  return {
    title,
    sentence: written || line || undefined,
    // The line to call when the urge comes and the one that answers when it is closed stand
    // right under the service.
    rows: [
      ...rows.filter((row) => row.key !== "openingLine").flatMap((row) => row.key === "helpService" ? [row, ...programmeHelpExtraRows(artifact, locale)] : [row]),
      programmeCrisisRow(locale),
    ],
  };
}

/** The rows under the chosen service: its market's phone line for the urge, and the line for when it is closed. */
function programmeHelpExtraRows(artifact: ProgramAiStructuralArtifact, locale: ProgrammeLocale): PresentedArtifactRow[] {
  const market = programmeHelpMarket(locale);
  if (!market || !isProgrammeHelpServiceType(artifact.helpService)) return [];
  return programmeHelpExtras(market, artifact.helpService).map(({ kind, contact }) => kind === "urge"
    ? { key: "urgeLine", label: programmeText(locale, "When the urge comes"), value: helpContactLine(contact) }
    : { key: "afterHours", label: programmeText(locale, "When it is closed"), value: helpContactLine(contact) });
}

export function programmeCrisisRow(locale: ProgrammeLocale): PresentedArtifactRow {
  const market = programmeHelpMarket(locale);
  return {
    key: "crisisLine",
    label: programmeText(locale, "If you have thoughts of suicide"),
    value: market
      ? `${crisisLine(market.crisis)}. ${market.crisis.emergency}.`
      : programmeText(locale, "Call your local emergency number now."),
  };
}
