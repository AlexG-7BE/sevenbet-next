"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import { useSiteClass, useSiteName, useSiteNameIn } from "@/components/site/SiteNameProvider";
import { withSiteNameDeep } from "@/lib/site/help-copy";
import {
  AiCandidatePicker,
  ChoiceCards,
  DecisionApplication,
  HumanArtifact,
  KeepsakeCard,
  HelpServiceCard,
  ProgrammeTimeline,
  ScenarioPanel,
  SequenceBuilder,
  StackBuilder,
} from "@/components/programme/ProgramAiMissionPrimitives";
import type {
  ProgramAiGuidance,
  ProgramAiHome,
  ProgramAiMission,
} from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeMissionCopy, programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import { deliverKeepsakeImage, keepsakeFonts, keepsakeImage } from "@/lib/programme/program-ai/keepsake-image";
import { presentMissionArtifact, programmeMissionKeepsake } from "@/lib/programme/program-ai/mission-presentation";
import { QUESTION_REWARD_LABEL_MS, questionOptionLine, questionWhyLine, splitQuestionHeadline } from "@/lib/programme/program-ai/question-screen";
import { programmeHelpPath, type ProgrammeLocale } from "@/lib/programme/presentation";
import { fetchProgrammeWithRetry } from "@/lib/programme/request-retry";
import styles from "./ProgramAiAuthenticated.module.css";

type Option = { value: string; label: ProgrammeMessageKey; description?: ProgrammeMessageKey };
type Field = { key: string; legend: ProgrammeMessageKey; options: readonly Option[]; multiple?: boolean; minimum?: number; maximum?: number };
type ActionUi = { prompt: ProgrammeMessageKey; explanation: ProgrammeMessageKey; fields: readonly Field[]; constants?: Record<string, string | number | boolean | string[]> };
type MissionCompletionReceipt = { xpAwarded: number };

const option = (value: string, label: ProgrammeMessageKey, description?: ProgrammeMessageKey): Option => ({ value, label, description });
const actionUi: Record<string, ActionUi> = {
  choose_direction: { prompt: "What would be useful to practise for seven days?", explanation: "Choose a direction, not a promise of a perfect week.", fields: [{ key: "direction", legend: "Seven-day direction", options: [option("understand", "Understand the pattern"), option("pause", "Practise a pause"), option("reduce_impulse", "Reduce one impulsive route"), option("set_boundary", "Set one boundary"), option("research_later", "Research only after a pause"), option("seek_support", "Prepare support")] }] },
  build_7_day_goal: { prompt: "Turn the direction into a small experiment.", explanation: "The wording can stay broad. Your optional personal wording stays in this tab.", constants: { reviewWindowDays: 7 }, fields: [{ key: "goalStyle", legend: "Goal style", options: [option("notice_and_note", "Notice and note one moment"), option("pause_first", "Pause before one decision"), option("use_one_boundary", "Use one boundary"), option("research_after_pause", "Research after a pause"), option("ask_for_support", "Use a support route")] }] },
  reality_check: { prompt: "What will you do on a difficult day?", explanation: "A useful goal has a restart route; it does not need a perfect streak.", fields: [{ key: "realityCheck", legend: "Difficult-day response", options: [option("make_it_smaller", "Make the experiment smaller"), option("use_the_pause", "Use the pause only"), option("restart_next_day", "Restart the next day"), option("ask_for_support", "Use support")]}] },
  map_urge_sequence: { prompt: "Put the choice point back into view.", explanation: "The sequence is keyboard-readable and does not require drag and drop.", constants: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] }, fields: [{ key: "confirm", legend: "Sequence check", options: [option("yes", "I can use this sequence as a way to notice the moment")] }] },
  name_early_signal: { prompt: "Where might the earliest signal show up?", explanation: "Choose the earliest place you might notice a change.", fields: [{ key: "earlySignalCategory", legend: "Early signal category", options: [option("body", "In the body"), option("thought", "In a thought"), option("attention", "In where attention goes"), option("action_tendency", "In the urge to act"), option("not_sure", "Not sure yet")] }] },
  choose_pause_move: { prompt: "Choose one move that creates a little time.", explanation: "The move is an option you control, not a guarantee.", fields: [{ key: "pauseMove", legend: "Pause move", options: [option("three_slow_breaths", "Take three slow breaths"), option("leave_the_screen", "Leave the screen"), option("wait_ten_minutes", "Wait ten minutes"), option("message_support", "Use a support message"), option("open_help", "Open protected Help")] }] },
  choose_boundary: { prompt: "Choose where one boundary begins.", explanation: "Use a category and trigger that you can recognise.", fields: [{ key: "boundaryCategory", legend: "Boundary category", options: [option("money", "Money"), option("time", "Time"), option("access", "Access"), option("pause", "Pause")] }, { key: "triggerType", legend: "When it starts", options: [option("before_access", "Before access"), option("saved_early_signal", "At the saved early signal"), option("scheduled_time", "At a scheduled time"), option("custom_local", "A trigger I word locally")] }] },
  build_boundary_rule: { prompt: "Choose a practical way to put it in place.", explanation: "Third-party controls may help, but B4GAMBLE does not enforce them.", fields: [{ key: "executionMethod", legend: "Execution method", options: [option("operator_limit", "Operator limit"), option("bank_block", "Bank block"), option("device_or_site_block", "Device or site block"), option("remove_payment", "Remove saved payment"), option("trusted_contact", "Trusted contact"), option("leave", "Leave"), option("self_exclusion_or_help", "Self-exclusion or protected Help"), option("custom_local", "Another method I word locally")] }] },
  choose_execution: { prompt: "Pressure-check the boundary.", explanation: "Choose the most truthful setup state.", fields: [{ key: "pressureCheck", legend: "Setup check", options: [option("easy_to_use", "Ready and easy to use"), option("needs_setup", "Needs setup"), option("needs_support", "Needs support"), option("choose_another", "I should choose another method")] }] },
  run_decision_check: { prompt: "A quick route appears. What kind of moment is it?", explanation: "This neutral scenario starts the decision check; there is no score.", fields: [{ key: "scenarioChoice", legend: "Scenario", options: [option("unexpected_offer", "An unexpected offer"), option("difficult_day", "A difficult day"), option("social_prompt", "A social prompt"), option("quick_return", "The temptation to return quickly")] }] },
  build_three_checks: { prompt: "Choose exactly three checks before deciding.", explanation: "These checks should make the decision clearer, not certify it as safe.", fields: [{ key: "decisionChecks", legend: "Three checks", multiple: true, minimum: 3, maximum: 3, options: [option("purpose", "Why am I considering this?"), option("time", "What time boundary applies?"), option("money", "What money boundary applies?"), option("terms", "Are the material terms clear?"), option("mood", "Am I reacting to the moment?"), option("exit", "What is my exit route?")] }] },
  commit_pause_rule: { prompt: "Where will the pause become automatic?", explanation: "Commit one closed rule you can review later.", fields: [{ key: "pauseRuleType", legend: "Pause rule", options: [option("pause_before_access", "Pause before access"), option("pause_before_payment", "Pause before payment"), option("pause_when_signal_appears", "Pause when the early signal appears"), option("pause_when_terms_are_unclear", "Pause when terms are unclear")] }] },
  choose_friction_layer: { prompt: "Choose the first layer of friction.", explanation: "Start with one practical step that makes the quick route less immediate.", fields: [{ key: "frictionMethods", legend: "First layer", multiple: true, minimum: 1, maximum: 1, options: frictionOptions() }] },
  build_friction_stack: { prompt: "Keep one layer or add a second.", explanation: "A layer count is factual. It is not a scientific friction score.", fields: [{ key: "frictionMethods", legend: "One or two layers", multiple: true, minimum: 1, maximum: 2, options: frictionOptions() }] },
  rehearse_bypass: { prompt: "If the quick route bypasses the layer, what comes next?", explanation: "Name the weak point and choose one generic fallback.", fields: [{ key: "bypassReason", legend: "Possible bypass", options: [option("too_many_steps", "It feels like too many steps"), option("easy_to_disable", "The layer is easy to disable"), option("another_device", "Another device is available"), option("change_of_mind", "I change my mind in the moment"), option("not_sure", "Not sure yet")] }, { key: "fallbackMethod", legend: "Fallback", options: [option("leave", "Leave"), option("wait_twenty_minutes", "Wait twenty minutes"), option("open_help", "Open protected Help"), option("contact_support", "Use support"), option("use_second_layer", "Use the second layer")] }] },
  choose_support_route: { prompt: "Which support route could be available?", explanation: "Choose a type of support, without adding a name. ‘Not ready’ is a valid choice.", fields: [{ key: "supportModes", legend: "Support route", multiple: true, minimum: 1, maximum: 2, options: [option("trusted_person", "A trusted person"), option("professional_support", "Professional support"), option("peer_support", "Peer support"), option("protected_help", "Help"), option("not_ready", "Not ready")]}] },
  build_support_card: { prompt: "Choose the shape of a short support card.", explanation: "Personal names and wording can stay local to this tab.", fields: [{ key: "supportCardStyle", legend: "Card style", options: [option("when_then", "When X, I can Y"), option("short_prompt", "One short prompt"), option("two_step", "A two-step route")] }] },
  choose_exit_action: { prompt: "Choose an exit action that does not depend on disclosure.", explanation: "Protected Help remains available whether or not you finish this Mission.", fields: [{ key: "exitActionType", legend: "Exit action", options: [option("leave_page", "Leave the page"), option("close_account_tools", "Open account control tools"), option("open_help", "Open protected Help"), option("contact_support", "Use the support route"), option("take_a_walk", "Step away")]}] },
  // Step 3 · Know who to turn to (Founder, 16 October 2026). The action ids are the Mission's
  // identities from its earlier lesson; the questions are the help lesson's.
  learn_comparison_signals: { prompt: "Who is one person you could tell?", explanation: "Choose who they are to you, not their name. Nobody is contacted and nothing is sent.", fields: [{ key: "trustedPerson", legend: "Your person", options: [option("partner", "My partner"), option("family", "Someone in my family"), option("friend", "A friend"), option("colleague", "Someone at work"), option("been_there", "Someone who has been there"), option("professional", "A doctor or counsellor"), option("service_first", "Nobody yet: a help service first")] }, { key: "openingLine", legend: "What you would say", options: [option("call_me", "Can you call me? I'm having a hard moment."), option("tell_you", "I want to tell you something about my gambling."), option("one_word", "If I text you one word, can you call me?"), option("check_in", "Can you ask me how it is going this week?"), option("first_call", "I would like to talk about my gambling.")] }] },
  decode_offer_terms: { prompt: "Which kind of help would you try first?", explanation: "Choose the one you would really use. You will see who answers and when.", fields: [{ key: "helpService", legend: "Your help service", options: [option("phone", "Talk on the phone"), option("chat", "Write in a chat"), option("in_person", "Join a group or see a counsellor"), option("debt", "Get help with money and debt"), option("close_ones", "Help for the people close to me")] }] },
  build_research_checklist: { prompt: "What will you do in the first 10 minutes of an urge?", explanation: "Choose two or three moves, in the order you will make them.", fields: [{ key: "firstTenMinutes", legend: "Your first 10 minutes", multiple: true, minimum: 2, maximum: 3, options: [option("phone_away", "Put the phone away"), option("send_line", "Send my line to my person"), option("contact_service", "Call or write to my help service"), option("wait_ten_minutes", "Wait for 10 minutes"), option("go_outside", "Go outside or move"), option("read_card", "Read my support card")] }] },
  choose_scenario: { prompt: "Choose one decision scenario to rehearse.", explanation: "You will practise one response and one fallback.", fields: [{ key: "scenarioType", legend: "Scenario", options: [option("unexpected_offer", "An unexpected offer"), option("urge_after_stress", "An urge after stress"), option("social_invitation", "A social invitation"), option("unclear_terms", "Unclear terms")] }] },
  rehearse_response: { prompt: "Rehearse the response at the choice point.", explanation: "Choose a strategy; feedback stays short and non-shaming.", fields: [{ key: "responseStrategy", legend: "Response strategy", options: responseOptions() }] },
  build_fallback_response: { prompt: "If the first response is hard to use, what is the fallback?", explanation: "A fallback keeps the plan usable without claiming certainty.", fields: [{ key: "fallbackStrategy", legend: "Fallback strategy", options: responseOptions() }] },
  review_my_plan: { prompt: "Review what is legitimately present.", explanation: "Missing outputs are omitted. Nothing is invented to make the timeline look complete.", constants: { timelineReviewed: true }, fields: [{ key: "confirm", legend: "Timeline check", options: [option("yes", "I reviewed the available structural facts")] }] },
  assemble_final_plan: { prompt: "Choose up to three priorities for the one-screen plan.", explanation: "Save the parts you want the final plan to emphasise. Only confirmed facts from those parts will be used.", fields: [{ key: "planPriorityIds", legend: "Plan priorities", multiple: true, minimum: 1, maximum: 3, options: [option("starting_point", "Starting Point"), option("goal", "7-day goal"), option("early_signal", "Early signal"), option("pause_move", "Pause move"), option("boundary", "Boundary"), option("decision_checks", "Decision checks"), option("friction", "Friction"), option("support", "Support"), option("support_card", "Support card"), option("fallback", "Fallback")] }] },
  choose_review_cadence: { prompt: "Build the plan, then choose when to review it.", explanation: "The draft uses your persisted priorities and confirmed Programme facts. The cadence creates no email or reminder.", fields: [{ key: "reviewCadenceDays", legend: "Review cadence", options: [option("7", "Every 7 days"), option("14", "Every 14 days"), option("30", "Every 30 days")] }] },
};

function frictionOptions() { return [option("operator_limit", "Operator limit"), option("bank_block", "Bank block"), option("device_or_site_block", "Device or site block"), option("remove_saved_payment", "Remove saved payment"), option("trusted_contact", "Trusted contact"), option("self_exclusion_or_help", "Self-exclusion or protected Help")]; }
function responseOptions() { return [option("pause_and_check", "Pause and run the checks"), option("leave_and_return", "Leave and return later"), option("use_boundary", "Use the boundary"), option("ask_for_support", "Use support")]; }

const guidanceActions = new Set(["build_7_day_goal", "name_early_signal", "build_boundary_rule", "build_friction_stack", "build_support_card", "rehearse_response"]);
const localWordingActions = new Set(["build_7_day_goal", "build_boundary_rule", "build_support_card", "learn_comparison_signals"]);
const guidanceBuilderActions = new Set(["build_7_day_goal", "build_boundary_rule", "build_friction_stack", "build_support_card", "rehearse_response"]);
const correctSequence = ["cue", "early_signal", "urge_builds", "choice_point"];

// A Mission action, its completion and its guidance are safe to send twice, so one failed attempt
// (network or 5xx) is repeated before the screen says anything (lib/programme/request-retry.ts).
async function request<T>(path: string, init?: RequestInit) {
  const response = await fetchProgrammeWithRetry(path, { credentials: "same-origin", cache: "no-store", ...init, headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers } });
  const payload = await response.json() as T & { ok?: boolean };
  if (!response.ok || payload.ok === false) throw new Error("PROGRAMME_MISSION_REQUEST_FAILED");
  return payload;
}

function initialValues(ui: ActionUi, artifact: ProgramAiMission["artifact"]) {
  const values: Record<string, string[]> = {};
  for (const field of ui.fields) {
    const current = artifact[field.key];
    values[field.key] = Array.isArray(current) ? current : current === undefined ? [] : [String(current)];
  }
  return values;
}

function localizedOptions(field: Field, locale: ProgrammeLocale, actionId?: string) {
  return field.options.map((item) => {
    // The line under an option is presentation: the one the option already carries, or the question screen's own.
    const line = item.description ?? (actionId ? questionOptionLine(actionId, item.value) : undefined);
    return { value: item.value, label: programmeText(locale, item.label), description: line ? programmeText(locale, line) : undefined };
  });
}

function selectionNote(field: Field, locale: ProgrammeLocale) {
  if (!field.multiple || field.minimum === undefined || field.maximum === undefined) return undefined;
  return field.minimum === field.maximum
    ? programmeText(locale, "choose {count}", { count: field.minimum })
    : programmeText(locale, "choose {minimum}–{maximum}", { minimum: field.minimum, maximum: field.maximum });
}

/** Content that opens after a pick is brought on screen: it would otherwise open under the pinned bar. */
function bringIntoView(element: HTMLElement | null) {
  if (!element) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tall = element.getBoundingClientRect().height > window.innerHeight * 0.55;
  element.scrollIntoView({ block: tall ? "start" : "nearest", behavior: reducedMotion ? "auto" : "smooth" });
}

function BackIcon() {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function TickIcon() {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
}

function LockIcon() {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="9" rx="2" width="14" x="5" y="11" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;
}

function SavingDots() {
  return <span aria-hidden="true" className={styles.stepDots} data-programme-saving-dots=""><i /><i /><i /></span>;
}

export function ProgramAiMissionExperience({ mission: initialMission, home: initialHome, userId, localWording, onLocalWording, onHome, onBack, locale, programmePath }: {
  mission: ProgramAiMission;
  home: ProgramAiHome;
  userId: string;
  localWording: string;
  onLocalWording: (value: string) => void;
  onHome: (home: ProgramAiHome) => void;
  onBack: () => void;
  locale: ProgrammeLocale;
  programmePath: string;
}) {
  const [mission, setMission] = useState(initialMission);
  const [home, setHome] = useState(initialHome);
  const [values, setValues] = useState<Record<string, string[]>>({});
  const [guidance, setGuidance] = useState<ProgramAiGuidance | null>(null);
  const [busy, setBusy] = useState(false);
  // Which request keeps the screen busy: only a save shows the dots on the button.
  const [busyWith, setBusyWith] = useState<"save" | "other">("other");
  const saving = busy && busyWith === "save";
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  // What the server just awarded stands in the progress label for a moment, then the question count returns.
  const [rewardLabel, setRewardLabel] = useState("");
  const rewardTimer = useRef<number | null>(null);
  const questionRef = useRef<HTMLHeadingElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [completionReceipt, setCompletionReceipt] = useState<MissionCompletionReceipt | null>(null);
  const [imageState, setImageState] = useState<"idle" | "busy" | "failed">("idle");
  const [sequenceOrder, setSequenceOrder] = useState(["choice_point", "cue", "urge_builds", "early_signal"]);
  const [sequenceFeedback, setSequenceFeedback] = useState("");
  const [guidanceSelected, setGuidanceSelected] = useState("");
  const [appliedChecks, setAppliedChecks] = useState<string[]>([]);
  const [firstCheck, setFirstCheck] = useState("");
  const current = mission.actions.find((action) => action.id === mission.currentAction);
  const ui = current ? actionUi[current.id] : null;
  const missionCopy = programmeMissionCopy(locale, mission.missionNumber);
  const site = useSiteClass();
  const inSite = useSiteNameIn();
  const siteOwnName = useSiteName();
  const t = (key: ProgrammeMessageKey, values: Readonly<Record<string, string | number>> = {}) => inSite(programmeText(locale, key, values));
  const finalPlanStage = mission.missionNumber === 10 && current?.id === "choose_review_cadence";
  useEffect(() => {
    if (ui) setValues(initialValues(ui, mission.artifact));
    setGuidance(null); setGuidanceSelected(""); setSequenceFeedback(""); setAnnouncement(""); setAppliedChecks([]); setFirstCheck("");
  }, [mission.currentAction]); // eslint-disable-line react-hooks/exhaustive-deps
  // The next question opens at its top, with the reader's place on its heading.
  const shownAction = useRef(mission.currentAction);
  useEffect(() => {
    if (shownAction.current === mission.currentAction) return;
    shownAction.current = mission.currentAction;
    window.scrollTo({ top: 0, behavior: "instant" });
    questionRef.current?.focus({ preventScroll: true });
  }, [mission.currentAction]);
  useEffect(() => () => { if (rewardTimer.current !== null) window.clearTimeout(rewardTimer.current); }, []);
  // The completion screen opens at its top too, with the reader's place on its heading.
  useEffect(() => {
    if (!completionReceipt) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    questionRef.current?.focus({ preventScroll: true });
  }, [completionReceipt]);
  const revealed = !current ? ""
    : current.id === "decode_offer_terms" ? values.helpService?.[0] ?? ""
      : current.id === "run_decision_check" ? values.scenarioChoice?.[0] ?? ""
        : guidance ? `guidance:${guidance.title}` : "";
  const lastRevealed = useRef({ action: mission.currentAction, value: "" });
  useEffect(() => {
    const previous = lastRevealed.current;
    lastRevealed.current = { action: mission.currentAction, value: revealed };
    if (!revealed || previous.action !== mission.currentAction || previous.value === revealed) return;
    bringIntoView(revealRef.current);
  }, [mission.currentAction, revealed]);
  const valid = useMemo(() => {
    if (!ui || !current) return false;
    const fieldsValid = current.id === "map_urge_sequence" || ui.fields.every((field) => {
    const count = values[field.key]?.length ?? 0;
    return count >= (field.minimum ?? 1) && count <= (field.maximum ?? 1);
    });
    if (!fieldsValid) return false;
    if (finalPlanStage && !guidance) return false;
    if (guidanceBuilderActions.has(current.id) && !guidance) return false;
    if (["build_7_day_goal", "build_boundary_rule", "rehearse_response"].includes(current.id) && !guidanceSelected) return false;
    if (current.id === "run_decision_check" && !firstCheck) return false;
    if (current.id === "commit_pause_rule") {
      const checks = Array.isArray(mission.artifact.decisionChecks) ? mission.artifact.decisionChecks : [];
      return checks.length > 0 && checks.every((check) => appliedChecks.includes(check));
    }
    return true;
  }, [appliedChecks, current, finalPlanStage, firstCheck, guidance, guidanceSelected, mission.artifact.decisionChecks, ui, values]);

  function choose(field: Field, value: string) {
    setValues((currentValues) => {
      const selected = currentValues[field.key] ?? [];
      const next = field.multiple
        ? selected.includes(value) ? selected.filter((item) => item !== value) : selected.length < (field.maximum ?? Infinity) ? [...selected, value] : selected
        : [value];
      return { ...currentValues, [field.key]: next };
    });
  }

  function showReward(label: string) {
    if (rewardTimer.current !== null) window.clearTimeout(rewardTimer.current);
    setRewardLabel(label);
    rewardTimer.current = window.setTimeout(() => { rewardTimer.current = null; setRewardLabel(""); }, QUESTION_REWARD_LABEL_MS);
  }

  function moveSequence(index: number, direction: -1 | 1) {
    setSequenceFeedback(""); setAnnouncement("");
    setSequenceOrder((currentOrder) => {
      const target = index + direction;
      if (target < 0 || target >= currentOrder.length) return currentOrder;
      const next = [...currentOrder];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveSelected(fieldKey: string, index: number, direction: -1 | 1) {
    setValues((currentValues) => {
      const selected = [...(currentValues[fieldKey] ?? [])];
      const target = index + direction;
      if (target < 0 || target >= selected.length) return currentValues;
      [selected[index], selected[target]] = [selected[target], selected[index]];
      return { ...currentValues, [fieldKey]: selected };
    });
  }

  async function saveAction() {
    if (!current || !ui || !valid) return;
    if (current.id === "map_urge_sequence" && sequenceOrder.join("|") !== correctSequence.join("|")) {
      setSequenceFeedback(t("That starts too late in the moment. Put the cue first, then look for the earliest signal before the urge builds."));
      setAnnouncement(t("No XP awarded. Adjust the order and try again."));
      return;
    }
    setBusyWith("save");
    setBusy(true); setError("");
    try {
      const artifact: Record<string, string | number | boolean | string[]> = { ...(ui.constants ?? {}) };
      for (const field of ui.fields) {
        if (field.key === "confirm") continue;
        const selected = values[field.key] ?? [];
        artifact[field.key] = field.multiple ? selected : field.key === "reviewCadenceDays" ? Number(selected[0]) : selected[0];
      }
      const result = await request<{ mission: ProgramAiMission; home: ProgramAiHome; xpAwarded: number }>(`/api/program/program-ai/missions/${mission.missionNumber}/actions`, { method: "POST", body: JSON.stringify({ action: current.id, artifact }) });
      setMission(result.mission); setHome(result.home); onHome(result.home);
      // The number is the server's. It is shown once, briefly, and never stays under the next question.
      showReward(result.xpAwarded ? `+${result.xpAwarded} XP` : t("This action was already saved."));
    } catch { setError(t("The action could not be saved")); }
    finally { setBusy(false); }
  }

  async function getGuidance() {
    setBusyWith("other");
    setBusy(true); setError("");
    try {
      const result = await request<{ guidance: ProgramAiGuidance }>(`/api/program/program-ai/missions/${mission.missionNumber}/guidance`, { method: "POST", body: JSON.stringify({ locale, ...(localWording.trim() ? { localWording: localWording.trim() } : {}) }) });
      // The guidance text is written on the server, which does not know which host asked;
      // one of its sentences names B4GAMBLE (lib/programme/program-ai/mission-guidance.ts).
      // It is rendered raw below, so it is said in the serving site's name here.
      setGuidance(withSiteNameDeep(result.guidance, site));
      if ((current?.id === "build_support_card" || finalPlanStage) && !localWording.trim() && result.guidance.options[0]) {
        onLocalWording(result.guidance.options[0].text);
      }
      if (finalPlanStage && result.guidance.options[0]) setGuidanceSelected(result.guidance.options[0].id);
    } catch { setError(t("Guidance is unavailable")); }
    finally { setBusy(false); }
  }

  function selectGuidance(id: string, text: string) {
    setGuidanceSelected(id);
    if (current?.id === "rehearse_response") {
      setValues((currentValues) => ({ ...currentValues, responseStrategy: [id] }));
    } else {
      onLocalWording(text);
    }
  }

  function toggleAppliedCheck(value: string) {
    setAppliedChecks((currentChecks) => currentChecks.includes(value)
      ? currentChecks.filter((item) => item !== value)
      : [...currentChecks, value]);
  }

  async function complete() {
    setBusyWith("other");
    setBusy(true); setError("");
    try {
      const result = await request<{ mission: ProgramAiMission; home: ProgramAiHome; xpAwarded: number }>(`/api/program/program-ai/missions/${mission.missionNumber}/complete`, { method: "POST", body: "{}" });
      setMission(result.mission); setHome(result.home); onHome(result.home); setCompletionReceipt({ xpAwarded: result.xpAwarded });
    } catch { setError(t("The Mission could not be completed")); }
    finally { setBusy(false); }
  }

  const totalXp = home.totalXp;
  const availableReview = home.reviews.find((review) => review.unlockMission === mission.missionNumber && review.status === "available") ?? null;
  const newlyCompleted = (completionReceipt?.xpAwarded ?? 0) > 0;
  const completeLabel = t("MISSION {number} · COMPLETE", { number: String(mission.step).padStart(2, "0") });
  if (mission.legacyCompletion) return <div className={styles.shell}>
    <ProgramAiAuthenticatedHeader label={completeLabel} locale={locale} programmePath={programmePath} totalXp={totalXp} userId={userId} />
    <main className={styles.missionMain}><section className={styles.reward}>
      <span className={styles.eyebrow}>{t("ALREADY COMPLETE")}</span>
      <h2>{missionCopy.title}</h2>
      <p>{t("Your earlier progress is here. You do not need to repeat this Mission.")}</p>
      <ActionButton onClick={onBack} size="large">{t("Return to Programme Home")}</ActionButton>
    </section></main>
  </div>;
  // A step's own bar, on its question, result and completion screens.
  const stepBar = <div className={styles.stepBar}>
    <button aria-label={`← ${t("Programme Home")}`} className={styles.stepBack} onClick={onBack} type="button"><BackIcon /></button>
    <p className={styles.stepWhere}>{t("Step {step} of {total}", { step: mission.step, total: home.missions.length })}</p>
    <Link className={styles.stepHelp} href={programmeHelpPath(locale)}>{t("Protected Help / pause")}</Link>
  </div>;
  const privacyCue = <p className={styles.stepNote} data-programme-privacy-cue=""><LockIcon /><span>{t("Your data is private. We never use it for offers or rankings.")}</span></p>;
  // The person's result as a keepsake: its own sentence when it has one, and its rows.
  const keepsake = programmeMissionKeepsake(mission.missionNumber, mission.artifact, locale, localWording);
  // The picture is made on the device from what the card shows; nothing is sent anywhere.
  async function saveAsImage() {
    setImageState("busy");
    try {
      const image = await keepsakeImage({ ...keepsake, brand: siteOwnName }, keepsakeFonts(document.body));
      await deliverKeepsakeImage(image, `pause-step-${mission.step}.png`);
      setImageState("idle");
    } catch { setImageState("failed"); }
  }
  if (completionReceipt || mission.status === "completed") {
    const doneTitle = splitQuestionHeadline(keepsake.title);
    // The reward, once: every number is the server's (this Mission's XP and the steps it lists as completed).
    const stepsDone = home.missions.filter((item) => item.status === "completed").length;
    return <div className={`${styles.shell} ${styles.stepShell}`} data-programme-step-frame="">
      <ProgramAiAuthenticatedHeader label={completeLabel} locale={locale} programmePath={programmePath} totalXp={totalXp} userId={userId} />
      <main className={styles.stepMain} data-programme-completion={newlyCompleted ? "fresh" : "review"}>
        {stepBar}
        <section className={styles.stepDone}>
          <p className={styles.stepDoneTick}><i aria-hidden="true"><TickIcon /></i><span>{t("Step {step} done", { step: mission.step })}</span></p>
          <h1 className={styles.stepHeadline} ref={questionRef} tabIndex={-1}>{doneTitle.head}{doneTitle.tail ? <> <em>{doneTitle.tail}</em></> : null}</h1>
          <p className={styles.stepHelper}>{newlyCompleted ? t("You built it yourself. It is yours, not ours.") : completionReceipt ? t("This Mission was already complete. Your completed result is ready to review.") : t("Your completed result is ready to review.")}</p>
        </section>
        <div className={styles.stepDoneBody}>
          <KeepsakeCard rows={keepsake.rows} sentence={keepsake.sentence} title={keepsake.title} />
          <div className={styles.keepsakeActions}><button data-programme-save-image="" disabled={imageState === "busy"} onClick={saveAsImage} type="button"><DownloadIcon /><span>{t("Save as image")}</span></button></div>
          {imageState === "failed" ? <p className={styles.error} role="alert">{t("The image could not be saved.")}</p> : null}
          {availableReview ? <div className={styles.reviewReveal}><span>{t("PERSONAL REVIEW AVAILABLE")}</span><p>{t("{title} is ready. Return Home to open it and see what you have built so far.", { title: programmeText(locale, availableReview.milestone === "first" ? "First Personal Review" : availableReview.milestone === "mid" ? "Mid-Programme Personal Review" : "Full Programme Personal Review") })}</p></div> : null}
        </div>
        <div className={styles.stepCta} data-programme-step-cta="">
          <div className={styles.stepReward}>
            <span aria-hidden="true" className={styles.stepRewardDots}>{home.missions.map((item) => <i data-new={newlyCompleted && item.missionNumber === mission.missionNumber ? "" : undefined} data-on={item.status === "completed"} key={item.missionNumber} />)}</span>
            <p data-programme-step-reward="">{t("{xp} XP · {done} of {total} steps", { xp: newlyCompleted ? `+${completionReceipt?.xpAwarded}` : mission.xpEarnedHere, done: stepsDone, total: home.missions.length })}</p>
          </div>
          <button className={styles.stepContinue} onClick={onBack} type="button"><span>{t("Continue from Programme Home")}</span><ArrowIcon /></button>
        </div>
      </main>
    </div>;
  }

  const header = <ProgramAiAuthenticatedHeader label={`${t("Mission").toLocaleUpperCase(locale)} ${String(mission.step).padStart(2, "0")} · ${missionCopy.title.toLocaleUpperCase(locale)}`} locale={locale} programmePath={programmePath} totalXp={totalXp} userId={userId} />;
  const supportNote = mission.missionNumber === 7 ? <aside className={styles.guidance}><h3>{t("Your support route is ready")}</h3><p>{t("Keep it simple enough to use.")} <Link href={programmeHelpPath(locale)}>{t("Help")}</Link> {t("is always available.")}</p></aside> : null;
  // All actions are saved: the result as a keepsake, with its finish press pinned and without XP on it.
  if (!ui || !current) {
    const review = splitQuestionHeadline(t("Review what you built, then finish the Mission."));
    return <div className={`${styles.shell} ${styles.stepShell}`} data-programme-step-frame="">
      {header}
      <main className={styles.stepMain} data-programme-result="">
        {stepBar}
        <div className={styles.stepProgress}>
          <div aria-hidden="true" className={styles.stepSegments}>{mission.actions.map((action) => <i data-on="true" key={action.id} />)}</div>
          <p className={styles.stepCount} data-programme-step-count={rewardLabel ? "reward" : "completion"} role="status">{rewardLabel || `+${mission.completionBonus} XP`}</p>
        </div>
        <section className={styles.stepQuestion}>
          <header className={styles.stepHeading}>
            <h1 className={styles.stepEyebrow}>{missionCopy.title}</h1>
            <h2 className={styles.stepHeadline} ref={questionRef} tabIndex={-1}>{review.head}{review.tail ? <> <em>{review.tail}</em></> : null}</h2>
          </header>
          <p className={styles.keepsakeIntro}>{t("YOUR RESULT IS READY")}</p>
          <KeepsakeCard rows={keepsake.rows} sentence={keepsake.sentence} title={keepsake.title} />
        </section>
        {supportNote}
        <div className={styles.stepCta} data-programme-step-cta="">
          <button aria-busy={busy || undefined} className={styles.stepContinue} data-saving={busy ? "" : undefined} disabled={busy} onClick={complete} type="button"><span>{t("Complete Mission")}</span>{busy ? <SavingDots /> : <ArrowIcon />}</button>
          {error ? <p className={styles.stepNote} data-tone="error" role="alert"><span>{error}</span></p> : privacyCue}
        </div>
      </main>
    </div>;
  }

  const headline = splitQuestionHeadline(t(ui.prompt));
  const whyLine = questionWhyLine(current.id);
  const sequenceAction = current.id === "map_urge_sequence";
  const guidanceLabel = finalPlanStage ? t("Build my plan")
    : guidanceActions.has(current.id) ? t(current.id === "rehearse_response" ? "Create my rehearsal" : current.id === "build_friction_stack" ? "Suggest an order" : current.id === "name_early_signal" ? "Show one possible pattern" : "Create personal drafts")
      : "";
  // A step 3 begun under the earlier lesson has no chosen line, so "Send my line to my person" is left out.
  const choiceFields = sequenceAction || current.id === "rehearse_response" ? []
    : current.id === "build_research_checklist" && typeof mission.artifact.openingLine !== "string"
      ? ui.fields.map((field) => ({ ...field, options: field.options.filter((item) => item.value !== "send_line") }))
      : ui.fields;
  // A lone single-choice list is named by the question itself; its legend stays for assistive technology.
  const legendHidden = choiceFields.length === 1 && !choiceFields[0].multiple;
  const choiceCards = (field: Field) => <ChoiceCards key={field.key} legend={t(field.legend)} legendHidden={legendHidden} multiple={field.multiple} onChoose={(value) => choose(field, value)} options={localizedOptions(field, locale, current.id)} selected={values[field.key] ?? []} selectionNote={selectionNote(field, locale)} />;
  // One short line under a disabled button says what is missing.
  const missing = (() => {
    if (valid) return "";
    if (finalPlanStage && !guidance) return t("Press “{label}” first.", { label: guidanceLabel });
    const open = choiceFields.filter((field) => { const count = values[field.key]?.length ?? 0; return count < (field.minimum ?? 1) || count > (field.maximum ?? 1); });
    if (open.length) return choiceFields.length > 1 ? t("Answer every part to continue.") : selectionNote(open[0], locale) ?? t("Choose an answer to continue.");
    if (guidanceBuilderActions.has(current.id) && !guidance) return t("Press “{label}” first.", { label: guidanceLabel });
    if (["build_7_day_goal", "build_boundary_rule", "rehearse_response"].includes(current.id) && !guidanceSelected) return t("Choose one of the suggestions above.");
    return t("Answer every part to continue.");
  })();
  const artifactShown = presentMissionArtifact(mission.artifact, locale).length > 0 || Boolean(localWording.trim()) || Boolean(guidanceSelected);
  const hintId = `programme-step-hint-${current.id}`;

  return <div className={`${styles.shell} ${styles.stepShell}`} data-programme-step-frame="">
    {header}
    <main className={styles.stepMain} data-programme-action={current.id}>
      {stepBar}
      <div className={styles.stepProgress}>
        <div aria-hidden="true" className={styles.stepSegments}>{mission.actions.map((action) => <i data-on={action.completed || action.id === current.id} key={action.id} />)}</div>
        <p className={styles.stepCount} data-programme-step-count={rewardLabel ? "reward" : "question"} role="status">{rewardLabel || t("Question {position} of {total}", { position: mission.currentActionPosition ?? "", total: mission.actionsTotal })}</p>
      </div>
      <section className={styles.stepQuestion} key={current.id}>
        <header className={styles.stepHeading}>
          <h1 className={styles.stepEyebrow}>{missionCopy.title}</h1>
          <h2 className={styles.stepHeadline} ref={questionRef} tabIndex={-1}>{headline.head}{headline.tail ? <> <em>{headline.tail}</em></> : null}</h2>
          <p className={styles.stepHelper}>{t(ui.explanation)}</p>
          {whyLine ? <p className={styles.stepWhy} data-programme-why=""><svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg><span><b>{t("Why we ask:")}</b> {t(whyLine)}</span></p> : null}
        </header>
        {sequenceAction ? <SequenceBuilder feedback={sequenceFeedback} locale={locale} onMove={moveSequence} order={sequenceOrder} /> : null}
        {current.id === "review_my_plan" ? <ProgrammeTimeline facts={mission.programmeFacts?.facts ?? []} locale={locale} startingPoint={mission.programmeFacts?.startingPoint?.startingPoint} /> : null}
        {current.id === "reality_check" ? <ScenarioPanel eyebrow={t("REALITY CHECK")} locale={locale} scenario={t("It’s been a difficult day. Which version still feels realistic?")} /> : null}
        {["run_decision_check", "choose_scenario"].includes(current.id) && (values.scenarioChoice?.[0] || values.scenarioType?.[0]) ? <ScenarioPanel locale={locale} scenario={values.scenarioChoice?.[0] ?? values.scenarioType?.[0] ?? ""} /> : null}
        {current.id === "rehearse_response" && typeof mission.artifact.scenarioType === "string" ? <ScenarioPanel eyebrow={t("YOUR REHEARSAL")} locale={locale} scenario={mission.artifact.scenarioType} /> : null}
        {current.id === "choose_execution" ? <ScenarioPanel eyebrow={t("PRESSURE CHECK")} locale={locale} scenario={t("The boundary is ready on paper. What would it need before a pressured moment?")} /> : null}
        {current.id === "rehearse_bypass" ? <ScenarioPanel eyebrow={t("BYPASS TEST")} locale={locale} scenario={t("What could make this easy to undo?")} /> : null}
        {current.id === "commit_pause_rule" ? <><ScenarioPanel eyebrow={t("APPLY YOUR CHECKS")} locale={locale} scenario={t("A second decision appears with less time and more pressure. Use the routine before choosing your pause rule.")} /><DecisionApplication applied={appliedChecks} checks={Array.isArray(mission.artifact.decisionChecks) ? mission.artifact.decisionChecks : []} locale={locale} onToggle={toggleAppliedCheck} /></> : null}
        {finalPlanStage ? <>
          {!guidance ? <ActionButton className={styles.stepSecondary} disabled={busy} onClick={getGuidance} variant="ghost-night">{guidanceLabel}{busy && !saving ? <SavingDots /> : null}</ActionButton> : <div className={styles.stepReveal} ref={revealRef}><AiCandidatePicker guidance={guidance} heading={t("Review your one-screen plan")} locale={locale} onSelect={selectGuidance} selectedId={guidanceSelected} /></div>}
          {guidance ? <label className={styles.localField}><span>{t("Your wording · kept in this tab")}</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder={t("Use the grounded draft above or write your own version…")} value={localWording} /></label> : null}
          {guidance ? choiceFields.map(choiceCards) : null}
        </> : choiceFields.map(choiceCards)}
        {current.id === "run_decision_check" && values.scenarioChoice?.[0] ? <div className={styles.stepReveal} ref={revealRef}><ChoiceCards legend={t("What would you check first?")} onChoose={setFirstCheck} options={localizedOptions({ key: "decisionChecks", legend: "Three checks", options: [option("purpose", "Why am I considering this?"), option("terms", "Are the material terms clear?"), option("mood", "Am I reacting to the moment?"), option("exit", "What is my exit route?")] }, locale)} selected={firstCheck ? [firstCheck] : []} /></div> : null}
        {current.id === "build_friction_stack" ? <StackBuilder locale={locale} onMove={(index, direction) => moveSelected("frictionMethods", index, direction)} selected={values.frictionMethods ?? []} /> : null}
        {current.id === "decode_offer_terms" && values.helpService?.[0] ? <div className={styles.stepReveal} ref={revealRef}><HelpServiceCard locale={locale} service={values.helpService[0]} /></div> : null}
        {!finalPlanStage && guidanceActions.has(current.id) && !guidance ? <ActionButton className={styles.stepSecondary} disabled={busy} onClick={getGuidance} variant="ghost-night">{guidanceLabel}{busy && !saving ? <SavingDots /> : null}</ActionButton> : null}
        {guidance && guidanceBuilderActions.has(current.id) ? <div className={styles.stepReveal} ref={revealRef}><AiCandidatePicker guidance={guidance} heading={current.id === "rehearse_response" ? guidance.title : t("Choose or edit the wording that fits")} locale={locale} onSelect={selectGuidance} selectedId={guidanceSelected} /></div> : null}
        {guidance && !guidanceBuilderActions.has(current.id) && !finalPlanStage ? <div className={styles.stepReveal} ref={revealRef}><aside className={styles.guidance} aria-live="polite"><span className={styles.eyebrow}>{t("USEFUL INSIGHT")}</span><h3>{guidance.title}</h3><p>{guidance.summary}</p><ul>{guidance.options.map((item) => <li key={item.id}>{item.text}</li>)}</ul></aside></div> : null}
        {current.id === "rehearse_response" && guidanceSelected ? <p className={styles.contextFeedback} role="status">{t("That response creates a clear next move. You can still choose a different option before confirming it.")}</p> : null}
        {localWordingActions.has(current.id) ? <label className={styles.localField}><span>{t("Your wording · kept in this tab")}</span><textarea maxLength={current.id === "learn_comparison_signals" ? 160 : 600} onChange={(event) => onLocalWording(event.target.value)} placeholder={t(current.id === "learn_comparison_signals" ? "Or write the line in your own words…" : "Choose a draft above or write your own version…")} value={localWording} /></label> : null}
      </section>
      {artifactShown ? <HumanArtifact artifact={mission.artifact} guidance={guidance} guidanceSelected={guidanceSelected} locale={locale} localWording={localWording} missionNumber={mission.missionNumber} /> : null}
      {supportNote}
      <div className={styles.stepCta} data-programme-step-cta="">
        <button aria-busy={saving || undefined} aria-describedby={missing && !busy ? hintId : undefined} className={styles.stepContinue} data-saving={saving ? "" : undefined} disabled={busy || !valid} onClick={saveAction} type="button">
          <span>{t(sequenceAction ? "Check sequence" : "Continue")}</span>{saving ? <SavingDots /> : <ArrowIcon />}
        </button>
        {error ? <p className={styles.stepNote} data-tone="error" role="alert"><span>{error}</span></p>
          : announcement ? <p className={styles.stepNote} data-tone="notice" role="status"><span>{announcement}</span></p>
            : missing && !busy ? <p className={styles.stepNote} data-programme-step-hint="" id={hintId}><span>{missing}</span></p>
              : privacyCue}
      </div>
    </main>
  </div>;
}
