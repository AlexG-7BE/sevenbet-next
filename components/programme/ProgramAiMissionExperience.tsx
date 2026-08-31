"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import {
  AiCandidatePicker,
  ChoiceCards,
  DecisionApplication,
  HumanArtifact,
  OfferDecoder,
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
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { PROGRAMME_ACCESS_HEADERS, PROGRAMME_ACCESS_HEADER_VALUES } from "@/lib/programme/access-contract";
import { hasProgrammeAccessAuthority, userProgrammeSubject } from "@/lib/programme/local-subject-storage";
import styles from "./ProgramAiAuthenticated.module.css";

type Option = { value: string; label: string; description?: string };
type Field = { key: string; legend: string; options: readonly Option[]; multiple?: boolean; minimum?: number; maximum?: number };
type ActionUi = { prompt: string; explanation: string; fields: readonly Field[]; constants?: Record<string, string | number | boolean | string[]>; sequence?: readonly string[] };
type MissionCompletionReceipt = { xpAwarded: number };

const option = (value: string, label: string, description?: string): Option => ({ value, label, description });
const actionUi: Record<string, ActionUi> = {
  choose_direction: { prompt: "What would be useful to practise for seven days?", explanation: "Choose a direction, not a promise of a perfect week.", fields: [{ key: "direction", legend: "Seven-day direction", options: [option("understand", "Understand the pattern"), option("pause", "Practise a pause"), option("reduce_impulse", "Reduce one impulsive route"), option("set_boundary", "Set one boundary"), option("research_later", "Research only after a pause"), option("seek_support", "Prepare support")] }] },
  build_7_day_goal: { prompt: "Turn the direction into a small experiment.", explanation: "The wording can stay broad. Your optional personal wording stays in this tab.", constants: { reviewWindowDays: 7 }, fields: [{ key: "goalStyle", legend: "Goal style", options: [option("notice_and_note", "Notice and note one moment"), option("pause_first", "Pause before one decision"), option("use_one_boundary", "Use one boundary"), option("research_after_pause", "Research after a pause"), option("ask_for_support", "Use a support route")] }] },
  reality_check: { prompt: "What will you do on a difficult day?", explanation: "A useful goal has a restart route; it does not need a perfect streak.", fields: [{ key: "realityCheck", legend: "Difficult-day response", options: [option("make_it_smaller", "Make the experiment smaller"), option("use_the_pause", "Use the pause only"), option("restart_next_day", "Restart the next day"), option("ask_for_support", "Use support")]}] },
  map_urge_sequence: { prompt: "Put the choice point back into view.", explanation: "The sequence is keyboard-readable and does not require drag and drop.", sequence: ["Cue", "Early signal", "Urge builds", "Choice point"], constants: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] }, fields: [{ key: "confirm", legend: "Sequence check", options: [option("yes", "I can use this sequence as a way to notice the moment")] }] },
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
  learn_comparison_signals: { prompt: "Which facts make a comparison materially clearer?", explanation: "Choose two or three signals and see why each matters.", fields: [{ key: "comparisonSignals", legend: "Comparison signals", multiple: true, minimum: 2, maximum: 3, options: comparisonOptions() }] },
  decode_offer_terms: { prompt: "Which offer term most needs clarification?", explanation: "The example is generic and is not fictional operator inventory.", fields: [{ key: "offerTermSignal", legend: "Material term", options: [option("wagering_requirement", "Wagering requirement"), option("expiry", "Expiry"), option("eligible_games", "Eligible games"), option("deposit_condition", "Deposit condition"), option("withdrawal_limit", "Withdrawal limit"), option("unclear_terms", "Terms remain unclear")] }] },
  build_research_checklist: { prompt: "Build a reusable research checklist.", explanation: "Choose three to five things you want to check every time.", fields: [{ key: "researchCriteria", legend: "Research checklist", multiple: true, minimum: 3, maximum: 5, options: researchOptions() }] },
  choose_scenario: { prompt: "Choose one decision scenario to rehearse.", explanation: "You will practise one response and one fallback.", fields: [{ key: "scenarioType", legend: "Scenario", options: [option("unexpected_offer", "An unexpected offer"), option("urge_after_stress", "An urge after stress"), option("social_invitation", "A social invitation"), option("unclear_terms", "Unclear terms")] }] },
  rehearse_response: { prompt: "Rehearse the response at the choice point.", explanation: "Choose a strategy; feedback stays short and non-shaming.", fields: [{ key: "responseStrategy", legend: "Response strategy", options: responseOptions() }] },
  build_fallback_response: { prompt: "If the first response is hard to use, what is the fallback?", explanation: "A fallback keeps the plan usable without claiming certainty.", fields: [{ key: "fallbackStrategy", legend: "Fallback strategy", options: responseOptions() }] },
  review_my_plan: { prompt: "Review what is legitimately present.", explanation: "Missing outputs are omitted. Nothing is invented to make the timeline look complete.", constants: { timelineReviewed: true }, sequence: ["Starting Point", "Goal", "Pause", "Boundary", "Checks", "Friction", "Support", "Research", "Fallback"], fields: [{ key: "confirm", legend: "Timeline check", options: [option("yes", "I reviewed the available structural facts")] }] },
  assemble_final_plan: { prompt: "Choose up to three priorities for the one-screen plan.", explanation: "Save the parts you want the final plan to emphasise. Only confirmed facts from those parts will be used.", fields: [{ key: "planPriorityIds", legend: "Plan priorities", multiple: true, minimum: 1, maximum: 3, options: [option("starting_point", "Starting Point"), option("goal", "7-day goal"), option("early_signal", "Early signal"), option("pause_move", "Pause move"), option("boundary", "Boundary"), option("decision_checks", "Decision checks"), option("friction", "Friction"), option("support", "Support"), option("research", "Research checklist"), option("fallback", "Fallback")] }] },
  choose_review_cadence: { prompt: "Build the plan, then choose when to review it.", explanation: "The draft uses your persisted priorities and confirmed Programme facts. The cadence creates no email or reminder.", fields: [{ key: "reviewCadenceDays", legend: "Review cadence", options: [option("7", "Every 7 days"), option("14", "Every 14 days"), option("30", "Every 30 days")] }] },
};

function frictionOptions() { return [option("operator_limit", "Operator limit"), option("bank_block", "Bank block"), option("device_or_site_block", "Device or site block"), option("remove_saved_payment", "Remove saved payment"), option("trusted_contact", "Trusted contact"), option("self_exclusion_or_help", "Self-exclusion or protected Help")]; }
function comparisonOptions() { return [option("licensing_status", "Licence / regulatory status", "Confirms whether the product is permitted for the relevant market."), option("operator_identity", "Who operates the casino", "Shows the legal business behind the consumer brand."), option("material_terms", "Material terms", "Reveals the conditions that shape the headline."), option("withdrawal_conditions", "Withdrawal conditions", "Shows how and when funds can be accessed."), option("payments", "Payments", "Makes fees, methods and processing expectations visible."), option("safer_gambling_tools", "Tools and limits", "Shows what account controls are available before they are needed."), option("offer_conditions", "Bonus conditions", "Separates the headline from the conditions attached to it.")]; }
function researchOptions() { return [option("licensing_status", "Licensing or regulatory status"), option("operator_identity", "Operator identity"), option("terms", "Material terms"), option("withdrawals", "Withdrawal conditions"), option("payments", "Payments"), option("safer_gambling_tools", "Safer-gambling tools"), option("offer_conditions", "Offer conditions")]; }
function responseOptions() { return [option("pause_and_check", "Pause and run the checks"), option("leave_and_return", "Leave and return later"), option("use_boundary", "Use the boundary"), option("ask_for_support", "Use support")]; }

const guidanceActions = new Set(["build_7_day_goal", "name_early_signal", "build_boundary_rule", "build_friction_stack", "build_support_card", "rehearse_response"]);
const localWordingActions = new Set(["build_7_day_goal", "build_boundary_rule", "build_support_card"]);
const guidanceBuilderActions = new Set(["build_7_day_goal", "build_boundary_rule", "build_friction_stack", "build_support_card", "rehearse_response"]);
const correctSequence = ["cue", "early_signal", "urge_builds", "choice_point"];

async function request<T>(path: string, userId: string, init?: RequestInit) {
  const subject = userProgrammeSubject(userId);
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init, headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...(hasProgrammeAccessAuthority(window.sessionStorage, subject) ? { [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age } : {}), ...init?.headers } });
  const payload = await response.json() as T & { ok?: boolean; error?: string };
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "The Mission could not be updated");
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

export function ProgramAiMissionExperience({ mission: initialMission, home: initialHome, userId, localWording, onLocalWording, onHome, onBack }: {
  mission: ProgramAiMission;
  home: ProgramAiHome;
  userId: string;
  localWording: string;
  onLocalWording: (value: string) => void;
  onHome: (home: ProgramAiHome) => void;
  onBack: () => void;
}) {
  const [mission, setMission] = useState(initialMission);
  const [home, setHome] = useState(initialHome);
  const [values, setValues] = useState<Record<string, string[]>>({});
  const [guidance, setGuidance] = useState<ProgramAiGuidance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [completionReceipt, setCompletionReceipt] = useState<MissionCompletionReceipt | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState(["choice_point", "cue", "urge_builds", "early_signal"]);
  const [sequenceFeedback, setSequenceFeedback] = useState("");
  const [guidanceSelected, setGuidanceSelected] = useState("");
  const [appliedChecks, setAppliedChecks] = useState<string[]>([]);
  const [firstCheck, setFirstCheck] = useState("");
  const current = mission.actions.find((action) => action.id === mission.currentAction);
  const ui = current ? actionUi[current.id] : null;
  const finalPlanStage = mission.missionNumber === 10 && current?.id === "choose_review_cadence";
  useEffect(() => {
    if (ui) setValues(initialValues(ui, mission.artifact));
    setGuidance(null); setGuidanceSelected(""); setSequenceFeedback(""); setAppliedChecks([]); setFirstCheck("");
  }, [mission.currentAction]); // eslint-disable-line react-hooks/exhaustive-deps
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

  function moveSequence(index: number, direction: -1 | 1) {
    setSequenceFeedback("");
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
      setSequenceFeedback("That starts too late in the moment. Put the cue first, then look for the earliest signal before the urge builds.");
      setAnnouncement("No XP awarded. Adjust the order and try again.");
      return;
    }
    setBusy(true); setError("");
    try {
      const artifact: Record<string, string | number | boolean | string[]> = { ...(ui.constants ?? {}) };
      for (const field of ui.fields) {
        if (field.key === "confirm") continue;
        const selected = values[field.key] ?? [];
        artifact[field.key] = field.multiple ? selected : field.key === "reviewCadenceDays" ? Number(selected[0]) : selected[0];
      }
      const result = await request<{ mission: ProgramAiMission; home: ProgramAiHome; xpAwarded: number }>(`/api/program/program-ai/missions/${mission.missionNumber}/actions`, userId, { method: "POST", body: JSON.stringify({ action: current.id, artifact }) });
      setMission(result.mission); setHome(result.home); onHome(result.home);
      setAnnouncement(result.xpAwarded ? `Action complete. ${result.xpAwarded} XP earned.` : "This action was already saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The action could not be saved"); }
    finally { setBusy(false); }
  }

  async function getGuidance() {
    setBusy(true); setError("");
    try {
      const result = await request<{ guidance: ProgramAiGuidance }>(`/api/program/program-ai/missions/${mission.missionNumber}/guidance`, userId, { method: "POST", body: JSON.stringify({ ...(localWording.trim() ? { localWording: localWording.trim() } : {}) }) });
      setGuidance(result.guidance);
      if ((current?.id === "build_support_card" || finalPlanStage) && !localWording.trim() && result.guidance.options[0]) {
        onLocalWording(result.guidance.options[0].text);
      }
      if (finalPlanStage && result.guidance.options[0]) setGuidanceSelected(result.guidance.options[0].id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Guidance is unavailable"); }
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
    setBusy(true); setError("");
    try {
      const result = await request<{ mission: ProgramAiMission; home: ProgramAiHome; xpAwarded: number }>(`/api/program/program-ai/missions/${mission.missionNumber}/complete`, userId, { method: "POST", body: "{}" });
      setMission(result.mission); setHome(result.home); onHome(result.home); setCompletionReceipt({ xpAwarded: result.xpAwarded });
      setAnnouncement(result.xpAwarded ? `Mission complete. ${result.xpAwarded} XP earned.` : "This Mission was already complete.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The Mission could not be completed"); }
    finally { setBusy(false); }
  }

  const totalXp = home.totalXp;
  const availableReview = home.reviews.find((review) => review.unlockMission === mission.missionNumber && review.status === "available") ?? null;
  const newlyCompleted = (completionReceipt?.xpAwarded ?? 0) > 0;
  if (mission.legacyCompletion) return <div className={styles.shell}><ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · COMPLETE`} totalXp={totalXp} userId={userId} /><main className={styles.missionMain}><section className={styles.reward}><span className={styles.eyebrow}>ALREADY COMPLETE</span><h2>{mission.title}</h2><p>Your earlier progress is here. You do not need to repeat this Mission.</p><ActionButton onClick={onBack} size="large">Return to Programme Home</ActionButton></section></main></div>;
  if (completionReceipt || mission.status === "completed") return <div className={styles.shell}><ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · COMPLETE`} totalXp={totalXp} userId={userId} /><main className={styles.missionMain}><section className={styles.reward}><span className={styles.eyebrow}>MISSION COMPLETE</span><strong>{newlyCompleted ? `+${completionReceipt?.xpAwarded}` : `${mission.xpEarnedHere} XP`}</strong><h2>{mission.title}</h2><p>{newlyCompleted ? "Your result is ready and the completion reward has been added." : completionReceipt ? "This Mission was already complete. Your completed result is ready to review." : "Your completed result is ready to review."}</p>{availableReview ? <div className={styles.reviewReveal}><span>PERSONAL REVIEW AVAILABLE</span><p>{availableReview.title} is ready. Return Home to open it and see what you have built so far.</p></div> : null}<ActionButton onClick={onBack} size="large">Continue from Programme Home</ActionButton><p aria-live="polite">{announcement}</p></section>{[8, 10].includes(mission.missionNumber) ? <CommercialNext missionNumber={mission.missionNumber} /> : null}</main></div>;

  return <div className={styles.shell}>
    <ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · ${mission.title.toUpperCase()}`} totalXp={totalXp} userId={userId} />
    <main className={styles.missionMain}>
      <div className={styles.missionTopline}><button className={styles.back} onClick={onBack} type="button">← Programme Home</button><Link className={styles.back} href="/help">Protected Help / pause</Link></div>
      <section className={styles.missionIntro}><span className={styles.eyebrow}>MISSION {String(mission.missionNumber).padStart(2, "0")} · {mission.actionsCompleted}/{mission.actionsTotal} ACTIONS</span><h1>{mission.title}</h1><p>{mission.purpose}</p></section>
      <div aria-label="Mission progress" className={styles.actionRail}>{mission.actions.map((action) => <span data-complete={action.completed} key={action.id} title={`${action.label}: ${action.completed ? "complete" : "not complete"}`} />)}<span data-complete={false} title="Mission completion bonus" /></div>
      {ui && current ? <div className={styles.workspace}>
        <section className={styles.challenge}>
          <span className={styles.eyebrow}>ACTION {mission.currentActionPosition} · +{current.xp} XP</span><h2>{ui.prompt}</h2><p>{ui.explanation}</p>
          {current.id === "map_urge_sequence" ? <SequenceBuilder feedback={sequenceFeedback} onMove={moveSequence} order={sequenceOrder} /> : null}
          {current.id === "review_my_plan" ? <ProgrammeTimeline facts={mission.programmeFacts?.facts ?? []} startingPoint={mission.programmeFacts?.startingPoint?.startingPoint} /> : null}
          {current.id === "reality_check" ? <ScenarioPanel eyebrow="REALITY CHECK" scenario="It’s been a difficult day. Which version still feels realistic?" /> : null}
          {["run_decision_check", "choose_scenario"].includes(current.id) && (values.scenarioChoice?.[0] || values.scenarioType?.[0]) ? <ScenarioPanel scenario={values.scenarioChoice?.[0] ?? values.scenarioType?.[0] ?? ""} /> : null}
          {current.id === "rehearse_response" && typeof mission.artifact.scenarioType === "string" ? <ScenarioPanel eyebrow="YOUR REHEARSAL" scenario={mission.artifact.scenarioType} /> : null}
          {current.id === "choose_execution" ? <ScenarioPanel eyebrow="PRESSURE CHECK" scenario="The boundary is ready on paper. What would it need before a pressured moment?" /> : null}
          {current.id === "rehearse_bypass" ? <ScenarioPanel eyebrow="BYPASS TEST" scenario="What could make this easy to undo?" /> : null}
          {current.id === "commit_pause_rule" ? <><ScenarioPanel eyebrow="APPLY YOUR CHECKS" scenario="A second decision appears with less time and more pressure. Use the routine before choosing your pause rule." /><DecisionApplication applied={appliedChecks} checks={Array.isArray(mission.artifact.decisionChecks) ? mission.artifact.decisionChecks : []} onToggle={toggleAppliedCheck} /></> : null}
          {finalPlanStage ? <>
            {!guidance ? <ActionButton disabled={busy} onClick={getGuidance} variant="ghost-paper">Build my plan</ActionButton> : <AiCandidatePicker guidance={guidance} heading="Review your one-screen plan" onSelect={selectGuidance} selectedId={guidanceSelected} />}
            {guidance ? <label className={styles.localField}><span>Your wording · kept in this tab</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder="Use the grounded draft above or write your own version…" value={localWording} /></label> : null}
            {guidance ? ui.fields.map((field) => <ChoiceCards key={field.key} legend={field.legend} multiple={field.multiple} onChoose={(value) => choose(field, value)} options={field.options} selected={values[field.key] ?? []} selectionNote={field.multiple ? `choose ${field.minimum === field.maximum ? field.minimum : `${field.minimum}–${field.maximum}`}` : undefined} />) : null}
          </> : ui.fields.filter(() => current.id !== "map_urge_sequence" && current.id !== "rehearse_response").map((field) => <ChoiceCards key={field.key} legend={field.legend} multiple={field.multiple} onChoose={(value) => choose(field, value)} options={field.options} selected={values[field.key] ?? []} selectionNote={field.multiple ? `choose ${field.minimum === field.maximum ? field.minimum : `${field.minimum}–${field.maximum}`}` : undefined} />)}
          {current.id === "run_decision_check" && values.scenarioChoice?.[0] ? <ChoiceCards legend="What would you check first?" onChoose={setFirstCheck} options={[option("purpose", "Why am I considering this?"), option("terms", "Are the material terms clear?"), option("mood", "Am I reacting to the moment?"), option("exit", "What is my exit route?")]} selected={firstCheck ? [firstCheck] : []} /> : null}
          {current.id === "build_friction_stack" ? <StackBuilder onMove={(index, direction) => moveSelected("frictionMethods", index, direction)} selected={values.frictionMethods ?? []} /> : null}
          {current.id === "decode_offer_terms" ? <OfferDecoder selected={values.offerTermSignal?.[0] ?? ""} /> : null}
          {guidance && guidanceBuilderActions.has(current.id) ? <AiCandidatePicker guidance={guidance} heading={current.id === "rehearse_response" ? guidance.title : "Choose or edit the wording that fits"} onSelect={selectGuidance} selectedId={guidanceSelected} /> : null}
          {guidance && !guidanceBuilderActions.has(current.id) ? <aside className={styles.guidance} aria-live="polite"><span className={styles.eyebrow}>USEFUL INSIGHT</span><h3>{guidance.title}</h3><p>{guidance.summary}</p><ul>{guidance.options.map((item) => <li key={item.id}>{item.text}</li>)}</ul></aside> : null}
          {current.id === "rehearse_response" && guidanceSelected ? <p className={styles.contextFeedback} role="status">That response creates a clear next move. You can still choose a different option before confirming it.</p> : null}
          {localWordingActions.has(current.id) ? <label className={styles.localField}><span>Your wording · kept in this tab</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder="Choose a draft above or write your own version…" value={localWording} /></label> : null}
          <div className={styles.submitRow}>{guidanceActions.has(current.id) && !guidance ? <ActionButton disabled={busy} onClick={getGuidance} variant="ghost-paper">{current.id === "rehearse_response" ? "Create my rehearsal" : current.id === "build_friction_stack" ? "Suggest an order" : current.id === "name_early_signal" ? "Show one possible pattern" : "Create personal drafts"}</ActionButton> : null}<ActionButton disabled={busy || !valid} onClick={saveAction} size="large">{busy ? "Saving…" : current.id === "map_urge_sequence" ? `Check sequence · +${current.xp} XP when correct` : `Confirm action · +${current.xp} XP`}</ActionButton></div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}<p aria-live="polite" className={styles.status}>{announcement}</p>
        </section>
        <HumanArtifact artifact={mission.artifact} guidance={guidance} guidanceSelected={guidanceSelected} localWording={localWording} missionNumber={mission.missionNumber} />
      </div> : <section className={styles.challenge}><span className={styles.eyebrow}>YOUR RESULT IS READY</span><h2>Review what you built, then finish the Mission.</h2><p>The final step adds the {mission.completionBonus} XP completion reward.</p><HumanArtifact artifact={mission.artifact} guidance={guidance} localWording={localWording} missionNumber={mission.missionNumber} /><ActionButton disabled={busy} onClick={complete} size="large">{busy ? "Completing…" : `Complete Mission · +${mission.completionBonus} XP`}</ActionButton>{error ? <p className={styles.error} role="alert">{error}</p> : null}</section>}
      {mission.missionNumber === 7 ? <aside className={styles.guidance}><h3>Your support route is ready</h3><p>Keep it simple enough to use. <Link href="/help">Help</Link> is always available.</p></aside> : null}
    </main>
  </div>;
}

function CommercialNext({ missionNumber }: { missionNumber: number }) {
  const sourceSurface = missionNumber === 8 ? "mission_08" : "mission_10";
  const discovery = (destinationRoute: "casinos" | "compare" | "bonuses" | "best_offers" | "bonus_guide") => {
    productAnalyticsClient.discoveryClicked({ sourceSurface, destinationRoute });
  };
  return <aside className={styles.commercialAside}><span className={styles.eyebrow}>PUT IT TO USE</span><h3>{missionNumber === 8 ? "Research with your checklist" : "Explore when you are ready"}</h3><p>Use B4GAMBLE’s public guides to compare facts and understand offers.</p><nav className={styles.exploreLinks} aria-label="Public guides"><Link href="/casinos" onClick={() => discovery("casinos")}>Compare casinos</Link><Link href="/bonuses" onClick={() => discovery("bonuses")}>Explore bonuses</Link><Link href="/best-offers" onClick={() => discovery("best_offers")}>Best offers</Link>{missionNumber === 8 ? <Link href="/bonus-guide" onClick={() => discovery("bonus_guide")}>Bonus guide</Link> : null}</nav></aside>;
}
