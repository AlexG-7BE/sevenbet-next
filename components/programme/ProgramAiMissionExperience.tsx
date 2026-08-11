"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type {
  ProgramAiGuidance,
  ProgramAiHome,
  ProgramAiMission,
} from "@/components/programme/ProgramAiAuthenticated.types";
import styles from "./ProgramAiAuthenticated.module.css";

type Option = { value: string; label: string };
type Field = { key: string; legend: string; options: readonly Option[]; multiple?: boolean; minimum?: number; maximum?: number };
type ActionUi = { prompt: string; explanation: string; fields: readonly Field[]; constants?: Record<string, string | number | boolean | string[]>; sequence?: readonly string[] };

const option = (value: string, label: string): Option => ({ value, label });
const actionUi: Record<string, ActionUi> = {
  choose_direction: { prompt: "What would be useful to practise for seven days?", explanation: "Choose a direction, not a promise of a perfect week.", fields: [{ key: "direction", legend: "Seven-day direction", options: [option("understand", "Understand the pattern"), option("pause", "Practise a pause"), option("reduce_impulse", "Reduce one impulsive route"), option("set_boundary", "Set one boundary"), option("research_later", "Research only after a pause"), option("seek_support", "Prepare support")] }] },
  build_7_day_goal: { prompt: "Turn the direction into a small experiment.", explanation: "The wording can stay broad. Your optional personal wording stays in this tab.", constants: { reviewWindowDays: 7 }, fields: [{ key: "goalStyle", legend: "Goal style", options: [option("notice_and_note", "Notice and note one moment"), option("pause_first", "Pause before one decision"), option("use_one_boundary", "Use one boundary"), option("research_after_pause", "Research after a pause"), option("ask_for_support", "Use a support route")] }] },
  reality_check: { prompt: "What will you do on a difficult day?", explanation: "A useful goal has a restart route; it does not need a perfect streak.", fields: [{ key: "realityCheck", legend: "Difficult-day response", options: [option("make_it_smaller", "Make the experiment smaller"), option("use_the_pause", "Use the pause only"), option("restart_next_day", "Restart the next day"), option("ask_for_support", "Use support")]}] },
  map_urge_sequence: { prompt: "Put the choice point back into view.", explanation: "The sequence is keyboard-readable and does not require drag and drop.", sequence: ["Cue", "Early signal", "Urge builds", "Choice point"], constants: { sequenceOrder: ["cue", "early_signal", "urge_builds", "choice_point"] }, fields: [{ key: "confirm", legend: "Sequence check", options: [option("yes", "I can use this sequence as a way to notice the moment")] }] },
  name_early_signal: { prompt: "Where might the earliest signal show up?", explanation: "Choose a category. This is not a diagnosis or severity label.", fields: [{ key: "earlySignalCategory", legend: "Early signal category", options: [option("body", "In the body"), option("thought", "In a thought"), option("attention", "In where attention goes"), option("action_tendency", "In the urge to act"), option("not_sure", "Not sure yet")] }] },
  choose_pause_move: { prompt: "Choose one move that creates a little time.", explanation: "The move is an option you control, not a guarantee.", fields: [{ key: "pauseMove", legend: "Pause move", options: [option("three_slow_breaths", "Take three slow breaths"), option("leave_the_screen", "Leave the screen"), option("wait_ten_minutes", "Wait ten minutes"), option("message_support", "Use a support message"), option("open_help", "Open protected Help")] }] },
  choose_boundary: { prompt: "Choose where one boundary begins.", explanation: "Use a category and trigger that you can recognise.", fields: [{ key: "boundaryCategory", legend: "Boundary category", options: [option("money", "Money"), option("time", "Time"), option("access", "Access"), option("pause", "Pause")] }, { key: "triggerType", legend: "When it starts", options: [option("before_access", "Before access"), option("saved_early_signal", "At the saved early signal"), option("scheduled_time", "At a scheduled time"), option("custom_local", "A trigger I word locally")] }] },
  build_boundary_rule: { prompt: "Choose a practical way to put it in place.", explanation: "Third-party controls may help, but B4GAMBLE does not enforce them.", fields: [{ key: "executionMethod", legend: "Execution method", options: [option("operator_limit", "Operator limit"), option("bank_block", "Bank block"), option("device_or_site_block", "Device or site block"), option("remove_payment", "Remove saved payment"), option("trusted_contact", "Trusted contact"), option("leave", "Leave"), option("self_exclusion_or_help", "Self-exclusion or protected Help"), option("custom_local", "Another method I word locally")] }] },
  choose_execution: { prompt: "Pressure-check the boundary.", explanation: "Choose the most truthful setup state.", fields: [{ key: "pressureCheck", legend: "Setup check", options: [option("easy_to_use", "Ready and easy to use"), option("needs_setup", "Needs setup"), option("needs_support", "Needs support"), option("choose_another", "I should choose another method")] }] },
  run_decision_check: { prompt: "A quick route appears. What kind of moment is it?", explanation: "This neutral scenario starts the decision check; there is no score.", fields: [{ key: "scenarioChoice", legend: "Scenario", options: [option("unexpected_offer", "An unexpected offer"), option("difficult_day", "A difficult day"), option("social_prompt", "A social prompt"), option("quick_return", "The temptation to return quickly")] }] },
  build_three_checks: { prompt: "Choose exactly three checks before deciding.", explanation: "These checks should make the decision clearer, not certify it as safe.", fields: [{ key: "decisionChecks", legend: "Three checks", multiple: true, minimum: 3, maximum: 3, options: [option("purpose", "Why am I considering this?"), option("time", "What time boundary applies?"), option("money", "What money boundary applies?"), option("terms", "Are the material terms clear?"), option("mood", "Am I reacting to the moment?"), option("exit", "What is my exit route?")] }] },
  commit_pause_rule: { prompt: "Where will the pause become automatic?", explanation: "Commit one closed rule you can review later.", fields: [{ key: "pauseRuleType", legend: "Pause rule", options: [option("pause_before_access", "Pause before access"), option("pause_before_payment", "Pause before payment"), option("pause_when_signal_appears", "Pause when the early signal appears"), option("pause_when_terms_are_unclear", "Pause when terms are unclear")] }] },
  choose_friction_layer: { prompt: "Choose the first layer of friction.", explanation: "Start with one practical mechanism; no operator is selected here.", fields: [{ key: "frictionMethods", legend: "First layer", multiple: true, minimum: 1, maximum: 1, options: frictionOptions() }] },
  build_friction_stack: { prompt: "Keep one layer or add a second.", explanation: "A layer count is factual. It is not a scientific friction score.", fields: [{ key: "frictionMethods", legend: "One or two layers", multiple: true, minimum: 1, maximum: 2, options: frictionOptions() }] },
  rehearse_bypass: { prompt: "If the quick route bypasses the layer, what comes next?", explanation: "Name the weak point and choose one generic fallback.", fields: [{ key: "bypassReason", legend: "Possible bypass", options: [option("too_many_steps", "It feels like too many steps"), option("easy_to_disable", "The layer is easy to disable"), option("another_device", "Another device is available"), option("change_of_mind", "I change my mind in the moment"), option("not_sure", "Not sure yet")] }, { key: "fallbackMethod", legend: "Fallback", options: [option("leave", "Leave"), option("wait_twenty_minutes", "Wait twenty minutes"), option("open_help", "Open protected Help"), option("contact_support", "Use support"), option("use_second_layer", "Use the second layer")] }] },
  choose_support_route: { prompt: "Which support route could be available?", explanation: "No person's identity is requested. ‘Not ready’ is a valid choice.", fields: [{ key: "supportModes", legend: "Support route", multiple: true, minimum: 1, maximum: 2, options: [option("trusted_person", "A trusted person"), option("professional_support", "Professional support"), option("peer_support", "Peer support"), option("protected_help", "Protected Help"), option("not_ready", "Not ready")]}] },
  build_support_card: { prompt: "Choose the shape of a short support card.", explanation: "Personal names and wording can stay local to this tab.", fields: [{ key: "supportCardStyle", legend: "Card style", options: [option("when_then", "When X, I can Y"), option("short_prompt", "One short prompt"), option("two_step", "A two-step route")] }] },
  choose_exit_action: { prompt: "Choose an exit action that does not depend on disclosure.", explanation: "Protected Help remains available whether or not you finish this Mission.", fields: [{ key: "exitActionType", legend: "Exit action", options: [option("leave_page", "Leave the page"), option("close_account_tools", "Open account control tools"), option("open_help", "Open protected Help"), option("contact_support", "Use the support route"), option("take_a_walk", "Step away")]}] },
  learn_comparison_signals: { prompt: "Which facts make a comparison materially clearer?", explanation: "Choose two or three public facts. This is education, not an operator recommendation.", fields: [{ key: "comparisonSignals", legend: "Comparison signals", multiple: true, minimum: 2, maximum: 3, options: comparisonOptions() }] },
  decode_offer_terms: { prompt: "Which offer term most needs clarification?", explanation: "The example is generic and is not fictional operator inventory.", fields: [{ key: "offerTermSignal", legend: "Material term", options: [option("wagering_requirement", "Wagering requirement"), option("expiry", "Expiry"), option("eligible_games", "Eligible games"), option("deposit_condition", "Deposit condition"), option("withdrawal_limit", "Withdrawal limit"), option("unclear_terms", "Terms remain unclear")] }] },
  build_research_checklist: { prompt: "Build a reusable research checklist.", explanation: "Choose three to five criterion IDs. No Programme data enters public comparison pages.", fields: [{ key: "researchCriteria", legend: "Research criteria", multiple: true, minimum: 3, maximum: 5, options: researchOptions() }] },
  choose_scenario: { prompt: "Choose one neutral decision scenario.", explanation: "The rehearsal contains one cycle and no gambling recommendation.", fields: [{ key: "scenarioType", legend: "Scenario", options: [option("unexpected_offer", "An unexpected offer"), option("urge_after_stress", "An urge after stress"), option("social_invitation", "A social invitation"), option("unclear_terms", "Unclear terms")] }] },
  rehearse_response: { prompt: "Rehearse the response at the choice point.", explanation: "Choose a strategy; feedback stays short and non-shaming.", fields: [{ key: "responseStrategy", legend: "Response strategy", options: responseOptions() }] },
  build_fallback_response: { prompt: "If the first response is hard to use, what is the fallback?", explanation: "A fallback keeps the plan usable without claiming certainty.", fields: [{ key: "fallbackStrategy", legend: "Fallback strategy", options: responseOptions() }] },
  review_my_plan: { prompt: "Review what is legitimately present.", explanation: "Missing outputs are omitted. Nothing is invented to make the timeline look complete.", constants: { timelineReviewed: true }, sequence: ["Starting Point", "Goal", "Pause", "Boundary", "Checks", "Friction", "Support", "Research", "Fallback"], fields: [{ key: "confirm", legend: "Timeline check", options: [option("yes", "I reviewed the available structural facts")] }] },
  assemble_final_plan: { prompt: "Choose up to three priorities for the one-screen plan.", explanation: "The final draft only uses facts you confirmed.", fields: [{ key: "planPriorityIds", legend: "Plan priorities", multiple: true, minimum: 1, maximum: 3, options: [option("starting_point", "Starting Point"), option("goal", "7-day goal"), option("early_signal", "Early signal"), option("pause_move", "Pause move"), option("boundary", "Boundary"), option("decision_checks", "Decision checks"), option("friction", "Friction"), option("support", "Support"), option("research", "Research checklist"), option("fallback", "Fallback")] }] },
  choose_review_cadence: { prompt: "When will you review the plan?", explanation: "This saves a cadence only. It does not create an email or reminder.", fields: [{ key: "reviewCadenceDays", legend: "Review cadence", options: [option("7", "Every 7 days"), option("14", "Every 14 days"), option("30", "Every 30 days")] }] },
};

function frictionOptions() { return [option("operator_limit", "Operator limit"), option("bank_block", "Bank block"), option("device_or_site_block", "Device or site block"), option("remove_saved_payment", "Remove saved payment"), option("trusted_contact", "Trusted contact"), option("self_exclusion_or_help", "Self-exclusion or protected Help")]; }
function comparisonOptions() { return [option("licensing_status", "Licensing or regulatory status"), option("operator_identity", "Operator identity"), option("material_terms", "Material terms"), option("withdrawal_conditions", "Withdrawal conditions"), option("payments", "Payments"), option("safer_gambling_tools", "Safer-gambling tools"), option("offer_conditions", "Offer conditions")]; }
function researchOptions() { return [option("licensing_status", "Licensing or regulatory status"), option("operator_identity", "Operator identity"), option("terms", "Material terms"), option("withdrawals", "Withdrawal conditions"), option("payments", "Payments"), option("safer_gambling_tools", "Safer-gambling tools"), option("offer_conditions", "Offer conditions")]; }
function responseOptions() { return [option("pause_and_check", "Pause and run the checks"), option("leave_and_return", "Leave and return later"), option("use_boundary", "Use the boundary"), option("ask_for_support", "Use support")]; }

const aiMissionNumbers = new Set([2, 3, 4, 6, 7, 9, 10]);

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init, headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers } });
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
  const [completedNow, setCompletedNow] = useState(false);
  const current = mission.actions.find((action) => action.id === mission.currentAction);
  const ui = current ? actionUi[current.id] : null;
  useEffect(() => { if (ui) setValues(initialValues(ui, mission.artifact)); }, [mission.currentAction]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = useMemo(() => ui?.fields.every((field) => {
    const count = values[field.key]?.length ?? 0;
    return count >= (field.minimum ?? 1) && count <= (field.maximum ?? 1);
  }) ?? false, [ui, values]);

  function choose(field: Field, value: string) {
    setValues((currentValues) => {
      const selected = currentValues[field.key] ?? [];
      const next = field.multiple
        ? selected.includes(value) ? selected.filter((item) => item !== value) : selected.length < (field.maximum ?? Infinity) ? [...selected, value] : selected
        : [value];
      return { ...currentValues, [field.key]: next };
    });
  }

  async function saveAction() {
    if (!current || !ui || !valid) return;
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
      setAnnouncement(result.xpAwarded ? `Action complete. ${result.xpAwarded} XP earned.` : "Action already complete. No additional XP awarded.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The action could not be saved"); }
    finally { setBusy(false); }
  }

  async function getGuidance() {
    setBusy(true); setError("");
    try {
      const result = await request<{ guidance: ProgramAiGuidance }>(`/api/program/program-ai/missions/${mission.missionNumber}/guidance`, { method: "POST", body: JSON.stringify({ ...(localWording.trim() ? { localWording: localWording.trim() } : {}) }) });
      setGuidance(result.guidance);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Guidance is unavailable"); }
    finally { setBusy(false); }
  }

  async function complete() {
    setBusy(true); setError("");
    try {
      const result = await request<{ mission: ProgramAiMission; home: ProgramAiHome; xpAwarded: number }>(`/api/program/program-ai/missions/${mission.missionNumber}/complete`, { method: "POST", body: "{}" });
      setMission(result.mission); setHome(result.home); onHome(result.home); setCompletedNow(true);
      setAnnouncement(result.xpAwarded ? "Mission complete. 25 XP earned." : "Mission was already complete. No additional XP awarded.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The Mission could not be completed"); }
    finally { setBusy(false); }
  }

  const totalXp = home.totalXp;
  if (mission.legacyCompletion) return <div className={styles.shell}><ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · COMPLETE`} totalXp={totalXp} userId={userId} /><main className={styles.missionMain}><section className={styles.reward}><span className={styles.eyebrow}>LEGACY COMPLETION PRESERVED</span><h2>{mission.title}</h2><p>This Mission remains complete. You do not need to repeat it and no PROGRAM-AI-v1 rewards were added retroactively.</p><ActionButton onClick={onBack} size="large">Return to Programme Home</ActionButton></section></main></div>;
  if (completedNow || mission.status === "completed") return <div className={styles.shell}><ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · COMPLETE`} totalXp={totalXp} userId={userId} /><main className={styles.missionMain}><section className={styles.reward}><span className={styles.eyebrow}>MISSION COMPLETE</span><strong>{completedNow ? "+25" : mission.xpEarnedHere}</strong><h2>{mission.title}</h2><p>{completedNow ? "Completion XP was recorded exactly once." : "This completed result remains reviewable and awards no repeat XP."}</p><ActionButton onClick={onBack} size="large">Continue from Programme Home</ActionButton><p aria-live="polite">{announcement}</p></section>{[8, 10].includes(mission.missionNumber) ? <CommercialNext missionNumber={mission.missionNumber} /> : null}</main></div>;

  return <div className={styles.shell}>
    <ProgramAiAuthenticatedHeader label={`MISSION ${String(mission.missionNumber).padStart(2, "0")} · ${mission.title.toUpperCase()}`} totalXp={totalXp} userId={userId} />
    <main className={styles.missionMain}>
      <div className={styles.missionTopline}><button className={styles.back} onClick={onBack} type="button">← Programme Home</button><Link className={styles.back} href="/responsible-gambling">Protected Help / pause</Link></div>
      <section className={styles.missionIntro}><span className={styles.eyebrow}>MISSION {String(mission.missionNumber).padStart(2, "0")} · {mission.actionsCompleted}/3 ACTIONS</span><h1>{mission.title}</h1><p>{mission.purpose}</p></section>
      <div aria-label="Mission progress" className={styles.actionRail}>{mission.actions.map((action) => <span data-complete={action.completed} key={action.id} title={`${action.label}: ${action.completed ? "complete" : "not complete"}`} />)}<span data-complete={false} title="Mission completion bonus" /></div>
      {ui && current ? <div className={styles.workspace}>
        <section className={styles.challenge}>
          <span className={styles.eyebrow}>ACTION {mission.actionsCompleted + 1} · +{current.xp} XP</span><h2>{ui.prompt}</h2><p>{ui.explanation}</p>
          {ui.sequence ? <ol className={styles.sequence}>{ui.sequence.map((item) => <li key={item}>{item}</li>)}</ol> : null}
          {ui.fields.map((field) => <fieldset className={styles.choices} key={field.key}><legend>{field.legend}{field.multiple ? ` · choose ${field.minimum === field.maximum ? field.minimum : `${field.minimum}–${field.maximum}`}` : ""}</legend>{field.options.map((item) => {
            const checked = values[field.key]?.includes(item.value) ?? false;
            return <label className={styles.choice} key={item.value}><input checked={checked} name={field.key} onChange={() => choose(field, item.value)} type={field.multiple ? "checkbox" : "radio"} value={item.value} /><span>{item.label}</span></label>;
          })}</fieldset>)}
          {aiMissionNumbers.has(mission.missionNumber) ? <label className={styles.localField}><span>Optional personal wording · this tab only</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder="Add wording for the editable guidance, or leave blank." value={localWording} /></label> : null}
          {guidance ? <aside className={styles.guidance} aria-live="polite"><span className={styles.eyebrow}>{guidance.generation === "provider" ? "OPTIONAL AI GUIDANCE" : "DETERMINISTIC FALLBACK"}</span><h3>{guidance.title}</h3><p>{guidance.summary}</p><ul>{guidance.options.map((item) => <li key={item.id}>{item.text}</li>)}</ul><small>Guidance does not complete the action or award XP.</small></aside> : null}
          <div className={styles.submitRow}>{aiMissionNumbers.has(mission.missionNumber) && !guidance ? <ActionButton disabled={busy} onClick={getGuidance} variant="ghost-paper">Prepare optional guidance</ActionButton> : null}<ActionButton disabled={busy || !valid} onClick={saveAction} size="large">{busy ? "Saving…" : `Complete action · +${current.xp} XP`}</ActionButton></div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}<p aria-live="polite" className={styles.status}>{announcement}</p>
        </section>
        <Artifact artifact={mission.artifact} title={mission.title} />
      </div> : <section className={styles.challenge}><span className={styles.eyebrow}>ALL THREE ACTIONS COMPLETE</span><h2>Review the result, then finish the Mission.</h2><p>The +25 XP completion bonus is server-owned and can be awarded only once.</p><Artifact artifact={mission.artifact} title={mission.title} /><ActionButton disabled={busy} onClick={complete} size="large">{busy ? "Completing…" : "Complete Mission · +25 XP"}</ActionButton>{error ? <p className={styles.error} role="alert">{error}</p> : null}</section>}
      {mission.missionNumber === 7 ? <aside className={styles.guidance}><h3>Support stays separate</h3><p>This support-first Mission contains no commercial links. You can open <Link href="/responsible-gambling">protected Help</Link> at any point.</p></aside> : null}
    </main>
  </div>;
}

function Artifact({ artifact, title }: { artifact: ProgramAiMission["artifact"]; title: string }) {
  const entries = Object.entries(artifact);
  return <aside className={styles.artifact}><span className={styles.eyebrow}>LIVE RESULT · {title}</span><h3>{entries.length ? "What you have built" : "Your result will appear here"}</h3>{entries.length ? <dl>{entries.map(([key, value]) => <div key={key}><dt>{key.replaceAll(/([A-Z])/g, " $1").replaceAll("_", " ")}</dt><dd>{Array.isArray(value) ? value.join(" · ") : String(value)}</dd></div>)}</dl> : <p>Complete the first action to begin the structural result.</p>}</aside>;
}

function CommercialNext({ missionNumber }: { missionNumber: number }) {
  return <aside className={styles.commercialAside}><span className={styles.eyebrow}>SEPARATE OPTIONAL NAVIGATION · 0 XP</span><h3>{missionNumber === 8 ? "Put the checklist to use later" : "What next?"}</h3><p>No click is required for completion and no private Programme data is included.</p><nav className={styles.exploreLinks} aria-label="Optional public discovery"><Link href="/casinos">Casino directory</Link><Link href="/compare">Compare</Link><Link href="/bonuses">Bonuses</Link><Link href="/best-offers">Best offers</Link>{missionNumber === 8 ? <Link href="/bonus-guide">Bonus guide</Link> : null}</nav></aside>;
}
