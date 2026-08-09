"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { authClient, useSession } from "@/lib/auth/client";
import {
  anonymousProgrammeSubject,
  clearProgrammeSubjectContent,
  hasProgrammeAgeAttestation,
  loadProgrammeSubjectContent,
  migrateClaimedJourneyToUser,
  programmeSubjectsEqual,
  rotateAnonymousProgrammeSubject,
  saveProgrammeSubjectContent,
  setProgrammeAgeAttestation,
  userProgrammeSubject,
  type ProgrammeLocalSubject,
} from "@/lib/programme/local-subject-storage";
import styles from "./ActiveControlProgramme.module.css";

const MISSION_ONE_TASKS = [
  "brief",
  "evidence",
  "moment_selection",
  "cue_scan",
  "sequence_builder",
  "learning_check",
  "notice_rule",
  "result_review",
] as const;

const MISSION_TWO_TASKS = [
  "brief",
  "evidence",
  "review_moment_map",
  "goal_direction",
  "action_builder",
  "confidence_calibration",
  "scenario_check",
  "result_review",
] as const;

const MISSION_THREE_TASKS = [
  "brief",
  "cue_urge_action",
  "urge_wave",
  "scenario_check",
  "signal_scan",
  "signal_builder",
  "meaning_check",
  "result_review",
] as const;

const MISSION_FOUR_TASKS = [
  "brief",
  "boundary_anatomy",
  "category_selection",
  "decision_point",
  "rule_builder",
  "execution_method",
  "coping_review",
  "strength_check",
  "result_review",
] as const;

const BOUNDARY_CHECKS = [
  "placed_before_pressure",
  "specific",
  "executable",
  "protected_from_in_moment_editing",
] as const;

const WAVE_MOMENTS = ["cue", "early_signal", "urge_builds", "choice_point"] as const;

const STAGES = ["Orient", "Learn", "Apply", "Build", "Review"] as const;

const PEOPLE = {
  portrait: "https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=1800",
  planning: "https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=1800",
  outcome: "https://images.pexels.com/photos/37057075/pexels-photo-37057075.jpeg?auto=compress&cs=tinysrgb&w=1800",
  studio: "https://images.pexels.com/photos/4450147/pexels-photo-4450147.jpeg?auto=compress&cs=tinysrgb&w=1800",
} as const;

type MomentMap = {
  id?: string;
  situation: string;
  cues: string[];
  thoughtOrFeeling: string;
  response: string;
  immediateConsequence: string;
  noticeRule: string;
  neutralFlags: string[];
  notSureFlags: string[];
};

type GoalDirection =
  | "understand"
  | "pause"
  | "reduce_impulse"
  | "set_boundary"
  | "research_later"
  | "seek_support";

type CurrentGoal = {
  id?: string;
  sourceMomentMapId: string;
  direction: GoalDirection;
  action: string;
  triggerOrSituation: string;
  alternativeAction: string;
  successSignal: string;
  reviewAt: string;
  confidence: number;
  confidenceAdjustment: string;
  status: "active" | "completed" | "paused";
};

type EarlySignalCategory = "body" | "thought" | "attention" | "action_tendency" | "not_sure";

type UrgeLearningRecord = {
  id?: string;
  earlySignalCategory: EarlySignalCategory | null;
  earlySignalText: string | null;
  notNow: boolean;
  reviewedAt?: string;
};

type UrgeLearningDraft = {
  evidenceReviewed: boolean;
  waveMomentsReviewed: string[];
  scenarioAnswer: string;
  earlySignalCategory?: EarlySignalCategory;
  earlySignalText?: string;
  notNow: boolean;
  meaningAnswer: string;
};

type BoundaryCategory = "money" | "time" | "access" | "pause";
type BoundaryTriggerType = "saved_early_signal" | "before_access" | "scheduled_time" | "custom";
type BoundaryExecutionMethod = "operator_account_limit" | "bank_gambling_block" | "device_site_block" | "remove_payment_access" | "trusted_contact" | "leave_action" | "self_exclusion_help" | "custom";

type ActiveBoundary = {
  id?: string;
  evidenceReviewed: boolean;
  category: BoundaryCategory | "";
  triggerType: BoundaryTriggerType | "";
  triggerText: string;
  ruleText: string;
  limitValue: number | "";
  limitUnit: string;
  limitPeriod: string;
  executionMethod: BoundaryExecutionMethod | "";
  executionDetail: string;
  copingAction: string;
  reviewAt: string;
  scenarioAnswer: string;
  strengthChecks: string[];
  status: "active" | "paused" | "retired";
};

type DashboardModel = {
  totalXp: number;
  currentMission: number;
  missions: Array<{ missionNumber: number; title: string; status: "completed" | "current" | "locked" }>;
  activeDays: number;
  currentStreak: number;
  achievements: Array<{ slug: string; title: string; state: "earned" | "locked" }>;
  momentMap: MomentMap | null;
  currentGoal: CurrentGoal | null;
  urgeLearningRecord: UrgeLearningRecord | null;
  activeBoundary: ActiveBoundary | null;
};

type ProgrammeLocalContent = {
  momentMap: MomentMap;
  goal: CurrentGoal;
  urgeLearning: UrgeLearningDraft;
  activeBoundary: ActiveBoundary;
};

type ApiPayload<T> = { ok?: boolean; error?: string; code?: string } & T;
type View = "mission-01" | "registration-gate" | "registration" | "dashboard" | "mission-02" | "mission-03" | "mission-04";

const emptyMomentMap: MomentMap = {
  situation: "",
  cues: [],
  thoughtOrFeeling: "",
  response: "",
  immediateConsequence: "",
  noticeRule: "",
  neutralFlags: [],
  notSureFlags: [],
};

function sevenDaysFromNow() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function emptyGoal(sourceMomentMapId = ""): CurrentGoal {
  return {
    sourceMomentMapId,
    direction: "pause",
    action: "",
    triggerOrSituation: "",
    alternativeAction: "",
    successSignal: "",
    reviewAt: sevenDaysFromNow(),
    confidence: 7,
    confidenceAdjustment: "",
    status: "active",
  };
}

const emptyUrgeLearning: UrgeLearningDraft = {
  evidenceReviewed: false,
  waveMomentsReviewed: [],
  scenarioAnswer: "",
  notNow: false,
  meaningAnswer: "",
};

function tomorrowAtTen() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}

const emptyBoundary: ActiveBoundary = {
  evidenceReviewed: false,
  category: "",
  triggerType: "",
  triggerText: "",
  ruleText: "",
  limitValue: "",
  limitUnit: "",
  limitPeriod: "",
  executionMethod: "",
  executionDetail: "",
  copingAction: "",
  reviewAt: tomorrowAtTen(),
  scenarioAnswer: "",
  strengthChecks: [],
  status: "active",
};

function mergeDashboardLocal(dashboard: DashboardModel, local: Partial<ProgrammeLocalContent>): DashboardModel {
  return {
    ...dashboard,
    momentMap: dashboard.momentMap ? { ...dashboard.momentMap, ...(local.momentMap || {}), id: dashboard.momentMap.id } : null,
    currentGoal: dashboard.currentGoal ? { ...dashboard.currentGoal, ...(local.goal || {}), id: dashboard.currentGoal.id, sourceMomentMapId: dashboard.currentGoal.sourceMomentMapId } : null,
    urgeLearningRecord: dashboard.urgeLearningRecord ? {
      ...dashboard.urgeLearningRecord,
      earlySignalCategory: local.urgeLearning?.notNow ? null : local.urgeLearning?.earlySignalCategory ?? null,
      earlySignalText: local.urgeLearning?.notNow ? null : local.urgeLearning?.earlySignalText ?? null,
      notNow: local.urgeLearning?.notNow ?? dashboard.urgeLearningRecord.notNow,
    } : null,
    activeBoundary: dashboard.activeBoundary ? { ...dashboard.activeBoundary, ...(local.activeBoundary || {}), id: dashboard.activeBoundary.id } : null,
  };
}

async function programmeRequest<T>(path: string, subject: ProgrammeLocalSubject, init?: RequestInit) {
  const ageAttested = hasProgrammeAgeAttestation(window.sessionStorage, subject);
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(ageAttested ? { "x-sevenbet-age-attestation": "18-or-over" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiPayload<T>;
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || "The programme could not be updated") as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }
  return payload;
}

function momentSummary(map: MomentMap) {
  return [map.situation, map.cues[0], map.thoughtOrFeeling, map.response, map.immediateConsequence]
    .filter(Boolean)
    .join(" → ");
}

function reviewLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(date);
}

function Header({ xp, authenticated }: { xp?: number; authenticated?: boolean }) {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/">SEVENBET</Link>
      <nav className={styles.nav} aria-label="Commercial navigation">
        <Link href="/casinos">Casinos</Link>
        <Link href="/bonuses">Bonuses</Link>
        <Link href="/best-offers">Best offers</Link>
        <Link href="/casinos">Reviews</Link>
        <Link href="/casinos">Compare</Link>
      </nav>
      <div className={styles.accountNav}>
        <Link href="/responsible-gambling">Help</Link>
        {authenticated ? <><span className={styles.xpPill}>{xp ?? 0} XP</span><span className={styles.accountPill}>My programme</span></> : <Link href="/program?auth=sign-in">Log in</Link>}
      </div>
    </header>
  );
}

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  return <div className={styles.programmeShell}><Header /><section className={styles.registrationForm}><div><div className={styles.titleBlock}><span>ADULT PROGRAMME · 18+</span><h1>Confirm before you continue.</h1><p>Persistent SevenBet accounts and Programme saving are for adults aged 18 or over. We do not ask for your date of birth or perform identity checks here.</p></div><label className={styles.check}><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>I confirm I am 18 or over · required</span></label><PrimaryButton disabled={!confirmed} onClick={onConfirm}>Continue to the Programme</PrimaryButton><p><Link href="/responsible-gambling">Protected Help remains available without creating an account.</Link></p></div><PhotoTheatre image={PEOPLE.portrait} eyebrow="18+ · SELF-ATTESTATION" title="Private reflection. Adult access." note="No date of birth or KYC is collected by this step." /></section></div>;
}

function MissionProgress({ mission, step }: { mission: 1 | 2 | 3 | 4; step: number }) {
  const stageIndex = mission === 4
    ? step <= 0 ? 0 : step === 1 ? 1 : step <= 3 ? 2 : step <= 6 ? 3 : 4
    : mission === 3
    ? step <= 0 ? 0 : step <= 2 ? 1 : step === 3 ? 2 : step <= 5 ? 3 : 4
    : step <= 0 ? 0 : step <= 1 ? 1 : step <= 3 ? 2 : step <= 5 ? 3 : 4;
  return (
    <div className={styles.missionMeta}>
      <div className={styles.progressPanel}>
        <div className={styles.progressCopy}>
          <span>MISSION {String(mission).padStart(2, "0")} · {stageIndex + 1} OF 5</span>
          <strong>{STAGES[stageIndex]}</strong>
        </div>
        <div className={styles.progressBars} aria-label={`${STAGES[stageIndex]} stage`}>
          {STAGES.map((stage, index) => <i key={stage} data-state={index < stageIndex ? "done" : index === stageIndex ? "current" : "next"} />)}
        </div>
      </div>
      <div className={styles.metaPills}>
        <span>{mission === 1 ? "17–22 MIN" : mission === 4 ? "20–25 MIN" : "18–24 MIN"}</span>
        <span>{mission === 1 ? "PRIVATE UNTIL SAVED" : "SAVED TO YOUR ACCOUNT"}</span>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return <button className={styles.primaryButton} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

function ActionBar({ children, note, busy }: { children: ReactNode; note?: string; busy?: boolean }) {
  return (
    <div className={styles.actionBar}>
      <span>{note || "You can leave or open protected Help at any time."}</span>
      <div aria-live="polite">{busy ? <span className={styles.saving}>Saving…</span> : children}</div>
    </div>
  );
}

function PhotoTheatre({ image, eyebrow, title, note, compact = false }: { image: string; eyebrow: string; title: string; note: string; compact?: boolean }) {
  return (
    <figure className={`${styles.photoTheatre} ${compact ? styles.photoCompact : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="Adult taking a thoughtful, practical next step" />
      <div className={styles.photoScrim} />
      <span className={styles.photoAccent} />
      <figcaption>
        <b>{eyebrow}</b>
        <em>{title}</em>
        <small>{note}</small>
      </figcaption>
    </figure>
  );
}

function EvidenceCard({ mission }: { mission: 1 | 2 | 3 | 4 }) {
  const isFirst = mission === 1;
  const isThird = mission === 3;
  const isFourth = mission === 4;
  return (
    <article className={styles.evidenceCard}>
      <div><span>EVIDENCE NOTE</span><b>{isFourth ? "UKGC · RCT EVIDENCE" : "NICE NG248 · 2025"}</b></div>
      <h3>{isFirst ? "Why map the moment?" : isThird ? "Why notice an early signal?" : isFourth ? "Why plan before pressure?" : "Why choose one goal?"}</h3>
      <p>{isFirst
        ? "Clinical guidance examines triggers, cravings, thoughts and feelings to understand what happens around gambling."
        : isThird
          ? "NICE includes triggers, cravings, thoughts and emotions among factors that can contribute to continued gambling."
        : isFourth
          ? "Concrete action and coping plans have been studied as ways to support an existing intention."
        : "NICE recommends agreeing an aim and other goals that matter to the person."}</p>
      <small>{isFirst
        ? "SevenBet adapts the idea as education. This mission is not CBT, assessment or treatment."
        : isThird
          ? "Research does not establish one universal urge pattern. This is education, not diagnosis, CBT or treatment."
        : isFourth
          ? "Evidence for voluntary limit tools is mixed. This SevenBet mission has not been clinically evaluated."
        : "SevenBet adapts goal clarification as self-directed education. It is not motivational interviewing or treatment."}</small>
      <a href={isFourth ? "https://www.gamblingcommission.gov.uk/blog/post/changes-to-customer-led-tools-financial-limits/" : "https://www.nice.org.uk/guidance/ng248/chapter/recommendations"} rel="noreferrer" target="_blank">Read the source ↗</a>
    </article>
  );
}

function Choice({ active, title, description, onClick }: { active: boolean; title: string; description?: string; onClick: () => void }) {
  return (
    <button className={`${styles.choice} ${active ? styles.choiceActive : ""}`} onClick={onClick} type="button">
      <span>{active ? "✓" : ""}</span><strong>{title}</strong>{description ? <small>{description}</small> : null}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false, hint, type = "text", min, max }: {
  label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; hint?: string; type?: string; min?: number; max?: number;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {multiline
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} />
        : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={min} max={max} />}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function MissionShell({ mission, step, xp, children }: { mission: 1 | 2 | 3 | 4; step: number; xp: number; children: ReactNode }) {
  return (
    <div className={styles.programmeShell}>
      <Header xp={xp} authenticated={mission !== 1} />
      <MissionProgress mission={mission} step={step} />
      {children}
    </div>
  );
}

function MissionOneScreen({
  step,
  map,
  setMap,
  onNext,
  busy,
  error,
}: {
  step: number;
  map: MomentMap;
  setMap: (value: MomentMap) => void;
  onNext: () => void;
  busy: boolean;
  error: string;
}) {
  const [learningAnswer, setLearningAnswer] = useState("");
  const situations = ["After work, at home", "A quiet evening", "Stress or boredom", "Not sure yet"];
  const cues = ["Payday notification", "An advert or offer", "A win-back thought", "Feeling bored", "Feeling stressed", "Opening an app"];
  const canContinue =
    step < 2 ||
    (step === 2 && Boolean(map.situation)) ||
    (step === 3 && map.cues.length > 0) ||
    (step === 4 && Boolean(map.thoughtOrFeeling && map.response && map.immediateConsequence)) ||
    (step === 5 && learningAnswer === "cue") ||
    (step === 6 && Boolean(map.noticeRule)) ||
    step === 7;

  if (step === 0) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.splitHero}>
          <div className={styles.titleBlock}>
            <span>MISSION 01 OF 10</span><h1>Map one real moment.</h1>
            <p>Create a private sequence you can recognise next time. No judgement. No diagnosis.</p>
            <ul><li>Reconstruct one specific situation</li><li>Separate the cue from what happened next</li><li>Write one notice rule for the next moment</li></ul>
          </div>
          <PhotoTheatre image={PEOPLE.portrait} eyebrow="WHAT YOU'LL MAKE · A MOMENT MAP" title="See the moment." note="Situation → cue → thought or feeling → response → immediate consequence" />
        </section>
        <ActionBar busy={busy}><PrimaryButton onClick={onNext}>Begin with one moment</PrimaryButton></ActionBar>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </MissionShell>
    );
  }

  if (step === 1) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.learningGrid}>
          <div className={styles.titleBlock}><span>LEARN · ABOUT 2 MIN</span><h1>Triggers are not the same as choices.</h1><p>Look at what came before the decision, what happened next, and the immediate result.</p><dl><dt>Cues</dt><dd>Place, time, notification, money, mood.</dd><dt>Thoughts</dt><dd>“Tonight, finally, sign or expectation.”</dd><dt>Response</dt><dd>Action and immediate consequence.</dd></dl></div>
          <div className={styles.stack}><EvidenceCard mission={1} /><PhotoTheatre compact image={PEOPLE.portrait} eyebrow="NICE NG248 · APPLIED LEARNING" title="See what came before." note="A cue can influence a decision without removing your agency." /></div>
        </section>
        <ActionBar busy={busy} note="Source and limitation stay visible in the mission."><PrimaryButton onClick={onNext}>Use this in my moment</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  if (step === 2) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.formGrid}>
          <div><div className={styles.titleBlock}><span>APPLY · ABOUT 3 MIN</span><h1>Choose one moment to map.</h1><p>Use a recent moment or a representative example. You do not need to describe harm.</p></div><div className={styles.choiceList}>{situations.map((item) => <Choice key={item} active={map.situation === item} title={item} onClick={() => setMap({ ...map, situation: item })} />)}</div><Field label="Or describe it in your own words" value={situations.includes(map.situation) ? "" : map.situation} onChange={(situation) => setMap({ ...map, situation })} placeholder="Friday evening, after work…" /></div>
          <PhotoTheatre image={PEOPLE.studio} eyebrow="PRIVATE WORKSPACE" title="One moment is enough." note="Only add the detail that helps you recognise the situation." />
        </section>
        <ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Save this situation</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  if (step === 3) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.wideForm}><div className={styles.titleBlock}><span>APPLY · ABOUT 3 MIN</span><h1>What showed up first?</h1><p>Select at least one cue. A cue can be outside you or inside you.</p></div><div className={styles.cueLayout}><div className={styles.choiceGrid}>{cues.map((item) => <Choice key={item} active={map.cues.includes(item)} title={item} onClick={() => setMap({ ...map, cues: map.cues.includes(item) ? map.cues.filter((cue) => cue !== item) : [...map.cues, item] })} />)}</div><PhotoTheatre compact image={PEOPLE.portrait} eyebrow="PERSONAL CUE" title="Notice it earlier." note="A cue is information, not a verdict." /></div></section>
        <ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Add this cue</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  if (step === 4) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.wideForm}><div className={styles.titleBlock}><span>BUILD · ABOUT 5 MIN</span><h1>Put the moment in order.</h1><p>Check the five parts. Edit anything that does not match what you meant.</p></div><div className={styles.sequenceGrid}><SequenceCard number="01" label="Situation" value={map.situation} /><SequenceCard number="02" label="Cue" value={map.cues.join(", ")} /><Field label="03 · Thought or feeling" value={map.thoughtOrFeeling} onChange={(thoughtOrFeeling) => setMap({ ...map, thoughtOrFeeling })} multiline placeholder="What did your mind say?" /><Field label="04 · Response" value={map.response} onChange={(response) => setMap({ ...map, response })} multiline placeholder="What happened next?" /><Field label="05 · Immediate consequence" value={map.immediateConsequence} onChange={(immediateConsequence) => setMap({ ...map, immediateConsequence })} multiline placeholder="What changed straight away?" /></div><PhotoTheatre compact image={PEOPLE.planning} eyebrow="METHOD NOTE · FUNCTIONAL ANALYSIS" title="Make the sequence visible." note="Situation → cue → thought → response → consequence" /></section>
        <ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Check the sequence</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  if (step === 5) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.learningGrid}><div><div className={styles.titleBlock}><span>REVIEW · ABOUT 3 MIN</span><h1>Which part is the cue?</h1><p>Sam sees a payday notification, thinks about winning back a loss, and opens an app.</p></div><div className={styles.choiceList}>{[["cue", "The payday notification"], ["thought", "The thought itself"], ["response", "Opening the app"]].map(([key, label]) => <Choice key={key} active={learningAnswer === key} title={label} onClick={() => setLearningAnswer(key)} />)}</div>{learningAnswer ? <div className={`${styles.feedback} ${learningAnswer === "cue" ? styles.feedbackGood : ""}`}><b>{learningAnswer === "cue" ? "That’s right." : "Look one step earlier."}</b><span>{learningAnswer === "cue" ? "The notification came before the thought and action." : "The cue is what appeared before the thought and response."}</span></div> : null}</div><div className={styles.stack}><article className={styles.evidenceCard}><div><span>EVIDENCE NOTE</span><b>LARIMER ET AL. · PMID 22188239</b></div><h3>Why separate cue from response?</h3><p>A brief-intervention study included analysing triggers and considering alternative responses.</p><small>The study population was specific. It does not prove outcomes for SevenBet.</small><a href="https://pubmed.ncbi.nlm.nih.gov/22188239/" rel="noreferrer" target="_blank">Read the study ↗</a></article><PhotoTheatre compact image={PEOPLE.portrait} eyebrow="LARIMER ET AL. · APPLIED LEARNING" title="Cue comes first." note="Separating the cue from the response creates a place to plan." /></div></section>
        <ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Use this distinction</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  if (step === 6) {
    return (
      <MissionShell mission={1} step={step} xp={0}>
        <section className={styles.formGrid}><div><div className={styles.titleBlock}><span>BUILD · ABOUT 3 MIN</span><h1>Write the rule you want to notice.</h1><p>This is a recognition rule, not a promise that you must feel differently.</p></div><Field label="When I notice…" value={map.noticeRule} onChange={(noticeRule) => setMap({ ...map, noticeRule })} multiline placeholder="When I see a payday notification, I will pause and name it before deciding." hint="Make it short enough to remember." /></div><PhotoTheatre image={PEOPLE.planning} eyebrow="PERSONAL RULE" title="Pause before deciding." note="The rule belongs to you and can be edited later." /></section>
        <ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Build my notice rule</PrimaryButton></ActionBar>
      </MissionShell>
    );
  }

  return (
    <MissionShell mission={1} step={step} xp={0}>
      <section className={styles.resultLayout}><div><div className={styles.titleBlock}><span>REVIEW · ABOUT 2 MIN</span><h1>Your Moment Map is ready.</h1><p>Check the local result before deciding whether to save completion and XP to a SevenBet account.</p></div><ArtifactCard eyebrow="MISSION 01 RESULT · LOCAL" title="Your Moment Map" body={momentSummary(map)} footer={`Notice rule: ${map.noticeRule}`} dark /></div><aside className={styles.rewardColumn}><Recognition label="PROGRESS AFTER ACCOUNT" value="+60 XP" note="Awarded after account creation." /><ul><li>Your five-part Moment Map stays in this tab</li><li>Your personal notice rule stays in this tab</li><li>Mission 01 completion and 60 XP save to the account</li></ul></aside><PhotoTheatre compact image={PEOPLE.planning} eyebrow="MISSION 01 · RESULT READY" title="Useful work, locally held." note="Only completion, reward and neutral continuity become persistent." /></section>
      <ActionBar busy={busy} note="No casino or bonus action is connected to this reward."><PrimaryButton onClick={onNext}>Save and create my account</PrimaryButton></ActionBar>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </MissionShell>
  );
}

function SequenceCard({ number, label, value }: { number: string; label: string; value: string }) {
  return <article className={styles.sequenceCard}><div><span>{number}</span><b>{label}</b></div><p>{value || "Not added yet"}</p></article>;
}

function Recognition({ label, value, note, dark = false }: { label: string; value: string; note: string; dark?: boolean }) {
  return <article className={`${styles.recognition} ${dark ? styles.recognitionDark : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function ArtifactCard({ eyebrow, title, body, footer, dark = false, onEdit }: { eyebrow: string; title: string; body: string; footer: string; dark?: boolean; onEdit?: () => void }) {
  return <article className={`${styles.artifact} ${dark ? styles.artifactDark : ""}`}><div><span>{eyebrow}</span>{onEdit ? <button onClick={onEdit} type="button">EDIT</button> : null}</div><h3>{title}</h3><p>{body}</p><small>{footer}</small></article>;
}

function Registration({
  gate,
  map,
  authenticated,
  onContinue,
  onSubmit,
  busy,
  error,
  returning = false,
}: {
  gate: boolean;
  map: MomentMap;
  authenticated: boolean;
  onContinue: () => void;
  onSubmit: (input: { email: string; password: string; mode: "sign-up" | "sign-in"; adultConfirmed: boolean }) => Promise<void>;
  busy: boolean;
  error: string;
  returning?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [mode, setMode] = useState<"sign-up" | "sign-in">(returning ? "sign-in" : "sign-up");

  if (gate) {
    return (
      <div className={styles.programmeShell}><Header authenticated={authenticated} xp={0} /><section className={styles.registrationGate}><div className={styles.titleBlock}><span>MISSION 01 COMPLETE · ACCOUNT FOR PROGRESS</span><h1>Keep your progress. Keep the words local.</h1><p>Create a private SevenBet account so mission completion and +60 XP remain available. Your Moment Map narrative stays in this browser session.</p><ul><li>Keep the Moment Map locally in this tab</li><li>Save mission completion and receive 60 XP</li><li>Return to Mission 02 with neutral continuity</li></ul><Recognition label="ACCOUNT REWARD" value="+60 XP" note="Awarded after successful progress claim." /></div><div className={styles.stack}><ArtifactCard eyebrow="LOCAL RESULT PREVIEW" title="Your Moment Map" body={momentSummary(map)} footer="Stored only in this browser session" dark /><PhotoTheatre compact image={PEOPLE.outcome} eyebrow="EARNED-RESULT REGISTRATION" title="Keep the progress. Continue the path." note="The account stores completion and rewards, not this personal narrative." /></div></section><ActionBar busy={busy} note="No marketing consent is requested."><PrimaryButton onClick={onContinue}>{authenticated ? "Save my progress" : "Create my private account"}</PrimaryButton></ActionBar>{error ? <p className={styles.error} role="alert">{error}</p> : null}</div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "sign-up" && !terms) return;
    if (mode === "sign-up" && !adultConfirmed) return;
    await onSubmit({ email, password, mode, adultConfirmed });
  }

  return (
    <div className={styles.programmeShell}><Header /><section className={styles.registrationForm}><form onSubmit={submit}><div className={styles.titleBlock}><span>PRIVATE SEVENBET ACCOUNT · 18+</span><h1>{mode === "sign-up" ? "Create your account." : returning ? "Return to your programme." : "Sign in to save progress."}</h1><p>Progress and rewards save to your account. Personal narrative stays only in this browser session and is not used for affiliate ranking or advertising targeting.</p></div><Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" hint="Used to sign in and recover access." /><Field label={mode === "sign-up" ? "Create a password" : "Password"} type="password" value={password} onChange={setPassword} placeholder="At least 12 characters" hint="Use a unique password you can save." />{mode === "sign-up" ? <><label className={styles.check}><input checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} type="checkbox" /><span>I confirm I am 18 or over · required</span></label><label className={styles.check}><input checked={terms} onChange={(event) => setTerms(event.target.checked)} type="checkbox" /><span>I agree to the Terms and Privacy Notice · required</span></label></> : null}{error ? <p className={styles.error} role="alert">{error}</p> : null}<PrimaryButton disabled={busy || !email || (mode === "sign-up" ? password.length < 12 || !terms || !adultConfirmed : !password)} type="submit">{busy ? "Saving…" : mode === "sign-up" ? "Create private account" : returning ? "Sign in to my Dashboard" : "Sign in and save progress"}</PrimaryButton>{!returning ? <button className={styles.textButton} onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")} type="button">{mode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one"}</button> : null}</form><div className={styles.stack}>{returning ? <ArtifactCard eyebrow="PRIVATE PROGRAMME" title="Your work stays yours" body="Sign in to continue from the latest completed mission." footer="Personal narrative is not restored from the account" dark /> : <ArtifactCard eyebrow="LOCAL PREVIEW" title="Your Moment Map" body={momentSummary(map)} footer="This narrative stays in this browser session · +60 XP saves to the account" dark />}<PhotoTheatre image={PEOPLE.outcome} eyebrow="PRIVATE ACCOUNT · YOUR PLAN" title="Come back to your progress." note="No marketing consent is bundled with account creation." /></div></section></div>
  );
}

function Dashboard({ dashboard, onStartMission, onEdit, onClearLocal }: { dashboard: DashboardModel; onStartMission: () => void; onEdit: (type: "moment" | "goal" | "signal" | "boundary") => void; onClearLocal: () => void }) {
  const afterTwo = dashboard.currentMission >= 3;
  const afterThree = dashboard.currentMission >= 4;
  const afterFour = dashboard.currentMission >= 5;
  const currentTitle = afterFour ? "05 · Check before deciding" : afterThree ? "04 · Build one boundary" : afterTwo ? "03 · Understand the urge" : "02 · Set a 7-day goal";
  const currentCopy = afterFour ? "Run a short check before the next gambling decision." : afterThree ? "Create one personal rule you can edit, review or remove." : afterTwo ? "Learn what an urge can feel like and keep one local early signal." : "Turn the Moment Map into one specific action and a review date.";
  const completedCount = afterFour ? 4 : afterThree ? 3 : afterTwo ? 2 : 1;
  const record = dashboard.urgeLearningRecord;
  const signalBody = record?.notNow
    ? "No personal signal saved yet. The evidence item and learning checks are complete."
    : record?.earlySignalText || `I will notice a change in ${(record?.earlySignalCategory || "my attention").replace("_", " ")} as information to pause.`;
  return (
    <div className={styles.dashboardPage}>
      <Header authenticated xp={dashboard.totalXp} />
      <section className={styles.dashboardHeading}>
        <div className={styles.titleBlock}><span>PERSONAL CONTROL DASHBOARD</span><h1>{afterFour ? "Your boundary progress is active." : afterThree ? "Your signal step is complete." : afterTwo ? "Your 7-day goal progress is active." : "Your first map is complete."}</h1><p>{afterFour ? "Personal wording remains in this browser session. Mission 05 is ready when the next design package is approved." : afterThree ? "Mission 04 turns the local signal into one concrete, editable boundary." : afterTwo ? "Mission 03 helps you notice what can happen before an action." : "Mission 02 uses your local map to build one specific 7-day goal."}</p><button className={styles.textButton} onClick={onClearLocal} type="button">Clear local Programme content</button></div>
        <div className={styles.recognitionGrid}><Recognition label={afterTwo ? "TOTAL EARNED" : "MOMENT MAP SAVED"} value={afterTwo ? `${dashboard.totalXp} XP` : "+60 XP"} note={`${completedCount} mission${completedCount === 1 ? "" : "s"} completed.`} /><Recognition label="ACTIVE DAY" value={String(dashboard.activeDays)} note="Truthful calendar activity." /><Recognition dark={afterTwo} label={afterTwo ? "ACHIEVEMENT EARNED" : "COMPLETE MISSION 02"} value={afterFour ? "BOUNDARY BUILT" : "FIRST PLAN"} note={afterFour ? "Your first boundary remains editable." : afterTwo ? "Your 7-day goal remains saved." : "Create a 7-day goal to earn."} /></div>
      </section>
      <section className={styles.currentMission}>
        <div><span>CURRENT MISSION · {afterThree && !afterFour ? "20–25" : "18–24"} MIN</span><h2>{currentTitle}</h2><p>{currentCopy}</p></div>
        <div className={styles.currentPhoto}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={afterThree ? PEOPLE.planning : afterTwo ? PEOPLE.outcome : PEOPLE.portrait} alt="Adult ready to continue a practical plan" /><span>{afterFour ? "UP NEXT · CHECK BEFORE DECIDING" : afterThree ? "UP NEXT · BUILD ONE BOUNDARY" : afterTwo ? "UP NEXT · UNDERSTAND THE URGE" : "NEXT · ONE USEFUL ACTION"}</span>{afterFour ? <button className={styles.primaryButton} disabled type="button">Mission 05 · next package</button> : <PrimaryButton onClick={onStartMission}>Start Mission {String(dashboard.currentMission).padStart(2, "0")}</PrimaryButton>}</div>
      </section>
      <div className={styles.pathHeading}><span>MY 10-STEP PATH</span><b>{completedCount} OF 10 COMPLETE</b></div>
      <ol className={styles.pathPreview}>{dashboard.missions.slice(0, afterFour ? 5 : 3).map((mission) => <li key={mission.missionNumber} data-status={mission.status}><span>{String(mission.missionNumber).padStart(2, "0")}</span><div><b>{mission.title}</b><small>{mission.status === "completed" ? `COMPLETED · +${mission.missionNumber === 1 ? 60 : mission.missionNumber === 2 ? 80 : mission.missionNumber === 3 ? 90 : 100} XP` : mission.status === "current" ? `CURRENT · ${mission.missionNumber === 4 ? "20–25" : "18–24"} MIN` : "UP NEXT"}</small></div></li>)}{!afterFour ? <li data-status={afterThree ? "current" : undefined}><span>04–10</span><div><b>{afterThree ? "Mission 04 current · six more follow" : "Seven more practical missions"}</b></div></li> : null}</ol>
      <section className={styles.dashboardArtifacts}>{afterFour && dashboard.activeBoundary ? <ArtifactCard eyebrow="MISSION 04 RESULT · LOCAL WORDING" title="My active boundary" body={boundarySentence(dashboard.activeBoundary, record)} footer={`Review ${reviewLabel(dashboard.activeBoundary.reviewAt)} · Browser session · Editable`} onEdit={() => onEdit("boundary")} /> : afterThree && record ? <ArtifactCard eyebrow="MISSION 03 RESULT · LOCAL WORDING" title={record.notNow ? "Not now" : "My early signal"} body={signalBody} footer="Browser session · Editable · Evidence item reviewed" onEdit={() => onEdit("signal")} /> : afterTwo && dashboard.currentGoal ? <ArtifactCard eyebrow="MISSION 02 RESULT · LOCAL WORDING" title="My 7-day goal" body={dashboard.currentGoal.action ? `When ${dashboard.currentGoal.triggerOrSituation}, I will ${dashboard.currentGoal.action}.` : "Personal wording is not available in this browser session."} footer={`Review on ${reviewLabel(dashboard.currentGoal.reviewAt)} · Confidence ${dashboard.currentGoal.confidence}/10`} onEdit={() => onEdit("goal")} /> : dashboard.momentMap ? <ArtifactCard eyebrow="MISSION 01 RESULT · LOCAL WORDING" title="Your Moment Map" body={momentSummary(dashboard.momentMap) || "Personal wording is not available in this browser session."} footer="Stored only in this browser session · Clear any time" dark onEdit={() => onEdit("moment")} /> : null}<EvidenceCard mission={afterFour ? 4 : afterThree ? 3 : afterTwo ? 2 : 1} /></section>
    </div>
  );
}

function MissionTwoScreen({ step, goal, setGoal, map, onNext, busy, error }: { step: number; goal: CurrentGoal; setGoal: (goal: CurrentGoal) => void; map: MomentMap; onNext: () => void; busy: boolean; error: string }) {
  const [scenarioAnswer, setScenarioAnswer] = useState("");
  const directions: Array<[GoalDirection, string, string]> = [
    ["pause", "Create a pause", "Add time between the cue and the decision."],
    ["reduce_impulse", "Reduce an impulse", "Make an automatic action less immediate."],
    ["set_boundary", "Set a money boundary", "Choose one concrete rule for the next seven days."],
    ["understand", "Understand the pattern", "Learn more before changing anything."],
    ["research_later", "Research or decide later", "Delay commercial research until a calmer moment."],
    ["seek_support", "Ask for support", "Prepare a person or service you can contact."],
  ];
  const canContinue = step < 3 || (step === 3 && Boolean(goal.direction)) || (step === 4 && Boolean(goal.action && goal.triggerOrSituation && goal.alternativeAction && goal.successSignal && goal.reviewAt)) || (step === 5 && Boolean(goal.confidenceAdjustment)) || (step === 6 && scenarioAnswer === "specific") || step === 7;

  if (step === 0) return <MissionShell mission={2} step={step} xp={60}><section className={styles.splitHero}><div className={styles.titleBlock}><span>MISSION 02 OF 10</span><h1>Turn your map into one 7-day goal.</h1><p>Choose one action that is specific, realistic and reviewable in seven days.</p><ul><li>Choose one direction for this week</li><li>Build a specific action around your cue</li><li>Set a success signal and review date</li></ul></div><PhotoTheatre image={PEOPLE.portrait} eyebrow="WHAT YOU'LL MAKE · A 7-DAY GOAL" title="A goal you can review." note="Direction → cue → action → success signal → review date" /></section><ActionBar busy={busy}><PrimaryButton onClick={onNext}>Build my 7-day goal</PrimaryButton></ActionBar></MissionShell>;
  if (step === 1) return <MissionShell mission={2} step={step} xp={60}><section className={styles.learningGrid}><div className={styles.titleBlock}><span>LEARN · ABOUT 2 MIN</span><h1>A useful goal is chosen, not imposed.</h1><p>Use your Moment Map to choose one direction that matters and one action you can review.</p><dl><dt>One direction</dt><dd>Choose what matters most for the next seven days.</dd><dt>Small action</dt><dd>Make it specific enough to know when you did it.</dd><dt>Review</dt><dd>Choose a date and decide what progress will look like.</dd></dl></div><div className={styles.stack}><EvidenceCard mission={2} /><PhotoTheatre compact image={PEOPLE.portrait} eyebrow="NICE NG248 · PERSONALLY IMPORTANT GOALS" title="Choose it. Then make it specific." note="SevenBet uses a self-directed educational adaptation." /></div></section><ActionBar busy={busy}><PrimaryButton onClick={onNext}>Choose my direction</PrimaryButton></ActionBar></MissionShell>;
  if (step === 2) return <MissionShell mission={2} step={step} xp={60}><section className={styles.learningGrid}><div><div className={styles.titleBlock}><span>APPLY · ABOUT 3 MIN</span><h1>Which part can your goal influence?</h1><p>Review your saved map. Choose a point where a small action could change what happens next.</p></div><div className={styles.choiceList}><Choice active title={map.cues[0] || "Your cue"} description="A useful place to plan before the response." onClick={() => undefined} /><Choice active={false} title={map.thoughtOrFeeling || "The thought or feeling"} onClick={() => undefined} /><Choice active={false} title={map.response || "The response"} onClick={() => undefined} /></div></div><div className={styles.stack}><ArtifactCard eyebrow="YOUR MOMENT MAP" title={map.situation} body={momentSummary(map)} footer={map.noticeRule} dark /><PhotoTheatre compact image={PEOPLE.portrait} eyebrow="START FROM YOUR MAP" title="Use what you already noticed." note="The saved map is the starting point, not a judgement." /></div></section><ActionBar busy={busy}><PrimaryButton onClick={onNext}>Use this part of my map</PrimaryButton></ActionBar></MissionShell>;
  if (step === 3) return <MissionShell mission={2} step={step} xp={60}><section className={styles.formGrid}><div><div className={styles.titleBlock}><span>APPLY · ABOUT 3 MIN</span><h1>Choose one direction for this week.</h1><p>Pick the direction that feels most useful now. You can change it later.</p></div><div className={styles.choiceGrid}>{directions.map(([key, title, description]) => <Choice key={key} active={goal.direction === key} title={title} description={description} onClick={() => setGoal({ ...goal, direction: key })} />)}</div></div><PhotoTheatre image={PEOPLE.portrait} eyebrow="DIRECTION · 01" title="Choose." note="One direction keeps the next action focused." /></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Build the action</PrimaryButton></ActionBar></MissionShell>;
  if (step === 4) return <MissionShell mission={2} step={step} xp={60}><section className={styles.wideForm}><div className={styles.titleBlock}><span>BUILD · ABOUT 5 MIN</span><h1>Build the action in five parts.</h1><p>Make the goal specific enough to recognise, do and review.</p></div><div className={styles.sequenceGrid}><Field label="01 · Cue" value={goal.triggerOrSituation} onChange={(triggerOrSituation) => setGoal({ ...goal, triggerOrSituation })} placeholder={map.cues[0] || "Payday notification"} /><Field label="02 · Action" value={goal.action} onChange={(action) => setGoal({ ...goal, action })} multiline placeholder="Wait 20 minutes before opening any gambling app" /><Field label="03 · Alternative" value={goal.alternativeAction} onChange={(alternativeAction) => setGoal({ ...goal, alternativeAction })} multiline placeholder="Walk outside and message someone" /><Field label="04 · Success signal" value={goal.successSignal} onChange={(successSignal) => setGoal({ ...goal, successSignal })} multiline placeholder="I completed the pause before deciding" /><Field label="05 · Review date" type="date" value={goal.reviewAt} onChange={(reviewAt) => setGoal({ ...goal, reviewAt })} /></div><PhotoTheatre compact image={PEOPLE.planning} eyebrow="IMPLEMENTATION DETAIL" title="Make the next action observable." note="Cue → action → alternative → success signal → review date." /><div className={styles.qualityCheck}><b>QUALITY CHECK</b><span>The action starts after a named cue and success is based on what you do.</span></div></section><ActionBar busy={busy} note="Personal wording stays only in this browser session."><PrimaryButton disabled={!canContinue} onClick={onNext}>Check my action</PrimaryButton></ActionBar></MissionShell>;
  if (step === 5) return <MissionShell mission={2} step={step} xp={60}><section className={styles.formGrid}><div><div className={styles.titleBlock}><span>BUILD · ABOUT 3 MIN</span><h1>How confident are you that this fits?</h1><p>Choose a private number. If it feels too low, make the action smaller or add support.</p></div><label className={styles.confidence}><span>MY CONFIDENCE</span><strong>{goal.confidence} / 10</strong><input type="range" min="0" max="10" value={goal.confidence} onChange={(event) => setGoal({ ...goal, confidence: Number(event.target.value) })} /></label></div><div className={styles.stack}><Field label="What would raise it by one point?" value={goal.confidenceAdjustment} onChange={(confidenceAdjustment) => setGoal({ ...goal, confidenceAdjustment })} multiline placeholder="Put my phone in another room during the pause." hint="Private planning, not a readiness-to-gamble score." /><PhotoTheatre compact image={PEOPLE.outcome} eyebrow="PRACTICE NOTE" title="Smaller can be stronger." note="If confidence is low, reduce the action until it feels realistic." /></div></section><ActionBar busy={busy} note="Confidence helps adjust the plan; it does not assess you."><PrimaryButton disabled={!canContinue} onClick={onNext}>Keep this confidence plan</PrimaryButton></ActionBar></MissionShell>;
  if (step === 6) return <MissionShell mission={2} step={step} xp={60}><section className={styles.learningGrid}><div><div className={styles.titleBlock}><span>REVIEW · ABOUT 3 MIN</span><h1>Which goal is specific and controllable?</h1><p>Choose the action that can be checked without predicting feelings or losses.</p></div><div className={styles.choiceList}>{[["specific", "Wait 20 minutes after a payday notification"], ["vague", "Never feel an urge again"], ["outcome", "Win less often this week"]].map(([key, label]) => <Choice key={key} active={scenarioAnswer === key} title={label} onClick={() => setScenarioAnswer(key)} />)}</div>{scenarioAnswer ? <div className={`${styles.feedback} ${scenarioAnswer === "specific" ? styles.feedbackGood : ""}`}><b>{scenarioAnswer === "specific" ? "The action can be noticed and reviewed." : "Choose what the person can do directly."}</b><span>Specific actions are easier to recognise, revise and review.</span></div> : null}</div><div className={styles.stack}><article className={styles.evidenceCard}><div><span>EVIDENCE NOTE</span><b>NICE NG248 · 2025</b></div><h3>Why make the plan specific?</h3><p>Behaviour-change approaches often turn broad aims into concrete, reviewable actions.</p><small>SevenBet is not treatment and does not claim a clinical outcome.</small></article><PhotoTheatre compact image={PEOPLE.planning} eyebrow="SCENARIO CHECK" title="Specific beats vague." note="A reviewable action describes what you can do." /></div></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Use this review</PrimaryButton></ActionBar></MissionShell>;
  return <MissionShell mission={2} step={step} xp={60}><section className={styles.resultLayout}><div><div className={styles.titleBlock}><span>REVIEW · ABOUT 2 MIN</span><h1>Your 7-day goal is ready.</h1><p>Review the local action, recognition and account-saved check-in facts.</p></div><ArtifactCard eyebrow="MISSION 02 RESULT · LOCAL WORDING" title="My 7-day goal" body={`When ${goal.triggerOrSituation}, I will ${goal.action}.`} footer={`Review on ${reviewLabel(goal.reviewAt)} · Confidence ${goal.confidence}/10`} /></div><aside className={styles.rewardColumn}><Recognition label="PROGRESS SAVED" value="+80 XP" note="Mission 02 complete." /><ul><li>+80 XP added to your total</li><li>First Plan achievement unlocked</li><li>Personal wording stays in this tab</li></ul><Recognition dark label="ACHIEVEMENT EARNED" value="FIRST PLAN" note="Goal direction and review facts save; wording stays local." /></aside><PhotoTheatre compact image={PEOPLE.outcome} eyebrow="MISSION 02 · RESULT READY" title="Your first plan is ready." note="The reward recognises the useful plan, never a gambling action." /></section><ActionBar busy={busy} note="Streak advances only after eligible activity on another calendar day."><PrimaryButton onClick={onNext}>Save progress · earn 80 XP</PrimaryButton></ActionBar>{error ? <p className={styles.error} role="alert">{error}</p> : null}</MissionShell>;
}

function MissionThreeScreen({
  step,
  learning,
  setLearning,
  onNext,
  busy,
  error,
  dashboard,
}: {
  step: number;
  learning: UrgeLearningDraft;
  setLearning: (learning: UrgeLearningDraft) => void;
  onNext: () => void;
  busy: boolean;
  error: string;
  dashboard: DashboardModel | null;
}) {
  const signalOptions: Array<[EarlySignalCategory, string, string]> = [
    ["body", "Body", "Tension, restlessness, faster breathing."],
    ["thought", "Thought", "A repeated prediction, justification or win-back thought."],
    ["attention", "Attention", "Your focus keeps returning to an offer, game or result."],
    ["action_tendency", "Action tendency", "Reaching for the app, wallet or comparison tab."],
    ["not_sure", "Not sure yet", "Keep the category open without inventing an answer."],
  ];
  const reviewedAllWaveMoments = WAVE_MOMENTS.every((item) => learning.waveMomentsReviewed.includes(item));
  const signalLabel = signalOptions.find(([key]) => key === learning.earlySignalCategory)?.[1] || "Early signal";
  const signalSentence = learning.notNow
    ? "You chose not to save a personal signal yet. The learning item and checks are still complete."
    : learning.earlySignalText || `I will notice a change in ${signalLabel.toLowerCase()} as information to pause.`;

  if (step === 0) {
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.splitHero}>
        <div className={styles.titleBlock}>
          <span>MISSION 03 OF 10</span>
          <h1>Notice the urge before the action.</h1>
          <p>Learn a small cue → urge experience → action model, test it, then save one private early signal—or choose not now.</p>
          <ul><li>Explore four moments in an urge experience</li><li>Apply the model to a neutral scenario</li><li>Make one editable early-signal card</li></ul>
        </div>
        <PhotoTheatre image={PEOPLE.portrait} eyebrow="WHAT YOU'LL MAKE · AN EARLY-SIGNAL CARD" title="Notice before action." note="A signal is information to pause and notice—not a diagnosis or command." />
      </section>
      <ActionBar busy={busy}><PrimaryButton onClick={onNext}>Start Mission 03</PrimaryButton></ActionBar>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </MissionShell>;
  }

  if (step === 1) {
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.learningGrid}>
        <div>
          <div className={styles.titleBlock}><span>LEARN · ABOUT 3 MIN</span><h1>Three layers, one place to notice.</h1><p>Reveal the sequence without treating it as a fixed rule for every person.</p></div>
          <div className={styles.modelStrip}>
            <article><span>01</span><b>Cue</b><p>A time, place, notification, feeling or gambling-related prompt.</p></article>
            <i>→</i>
            <article><span>02</span><b>Urge experience</b><p>Thought, attention shift, body sensation or impulse to act.</p></article>
            <i>→</i>
            <article><span>03</span><b>Action</b><p>What happens later. The urge is not the action itself.</p></article>
          </div>
        </div>
        <div className={styles.stack}>
          <EvidenceCard mission={3} />
          <Choice active={learning.evidenceReviewed} title="I reviewed the evidence note and limitation" description="The complete SevenBet Programme has not been clinically evaluated." onClick={() => setLearning({ ...learning, evidenceReviewed: true })} />
        </div>
      </section>
      <ActionBar busy={busy} note="Sources open in a new tab; your mission remains saved."><PrimaryButton disabled={!learning.evidenceReviewed} onClick={onNext}>Explore how intensity can change</PrimaryButton></ActionBar>
    </MissionShell>;
  }

  if (step === 2) {
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.wideForm}>
        <div className={styles.titleBlock}><span>LEARN · ABOUT 4 MIN</span><h1>An urge can change from moment to moment.</h1><p>Select every marked moment. This educational wave is not a timer, forecast or promise that an urge will pass in a set time.</p></div>
        <div className={styles.waveTheatre}>
          <svg aria-hidden="true" className={styles.waveCurve} viewBox="0 0 1100 250" preserveAspectRatio="none"><path d="M0 210 C150 205 180 165 290 150 C410 130 420 38 560 42 C700 46 705 165 835 160 C960 156 970 92 1100 78" /></svg>
          <div className={styles.waveMoments}>
            {WAVE_MOMENTS.map((moment, index) => {
              const copy = ["Cue appears", "Early signal", "Urge builds", "Choice point"][index];
              const active = learning.waveMomentsReviewed.includes(moment);
              return <button key={moment} data-active={active} onClick={() => setLearning({ ...learning, waveMomentsReviewed: active ? learning.waveMomentsReviewed : [...learning.waveMomentsReviewed, moment] })} type="button"><span>{active ? "✓" : index + 1}</span><b>{copy}</b><small>{["Something shows up.", "A small change may be noticeable.", "Intensity may rise or shift.", "The action is still separate."][index]}</small></button>;
            })}
          </div>
        </div>
      </section>
      <ActionBar busy={busy} note={`${learning.waveMomentsReviewed.length} of 4 moments reviewed.`}><PrimaryButton disabled={!reviewedAllWaveMoments} onClick={onNext}>Apply the model</PrimaryButton></ActionBar>
    </MissionShell>;
  }

  if (step === 3) {
    const correct = learning.scenarioAnswer === "early_signal";
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.learningGrid}>
        <div>
          <div className={styles.titleBlock}><span>APPLY · ABOUT 3 MIN</span><h1>What is the earliest signal Alex could notice?</h1><p>A betting offer appears. Alex keeps looking back at it, shoulders tighten, then the casino app opens.</p></div>
          <div className={styles.choiceList}>
            <Choice active={learning.scenarioAnswer === "cue"} title="The offer appearing" description="This is the cue." onClick={() => setLearning({ ...learning, scenarioAnswer: "cue" })} />
            <Choice active={correct} title="Attention returning and shoulders tightening" description="These happen before the later action." onClick={() => setLearning({ ...learning, scenarioAnswer: "early_signal" })} />
            <Choice active={learning.scenarioAnswer === "action"} title="Opening the casino app" description="This is the later action." onClick={() => setLearning({ ...learning, scenarioAnswer: "action" })} />
          </div>
          {learning.scenarioAnswer ? <div className={`${styles.feedback} ${correct ? styles.feedbackGood : ""}`}><b>{correct ? "That is the earliest available signal." : "Look between the cue and the action."}</b><span>{correct ? "Attention and body changes can be noticed without treating them as proof of a disorder." : "The offer is the cue; opening the app is the later action."}</span></div> : null}
        </div>
        <PhotoTheatre image={PEOPLE.studio} eyebrow="NEUTRAL SCENARIO · NO PENALTY" title="Look one step earlier." note="Retry as often as needed. Wrong answers do not remove XP or progress." />
      </section>
      <ActionBar busy={busy}><PrimaryButton disabled={!correct} onClick={onNext}>Scan my signal types</PrimaryButton></ActionBar>
    </MissionShell>;
  }

  if (step === 4) {
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.formGrid}>
        <div>
          <div className={styles.titleBlock}><span>BUILD · ABOUT 3 MIN</span><h1>Where might your earliest signal show up?</h1><p>Choose one category to explore. It can be edited or deleted later.</p></div>
          <div className={styles.signalScan}>{signalOptions.map(([key, title, description]) => <Choice key={key} active={!learning.notNow && learning.earlySignalCategory === key} title={title} description={description} onClick={() => setLearning({ ...learning, earlySignalCategory: key, notNow: false })} />)}</div>
          <button className={styles.notNowButton} data-active={learning.notNow} onClick={() => setLearning({ ...learning, notNow: true, earlySignalCategory: undefined, earlySignalText: undefined })} type="button">Not now — complete the learning without saving a personal signal</button>
        </div>
        <PhotoTheatre image={PEOPLE.portrait} eyebrow="PRIVATE SIGNAL SCAN" title="Notice, don't diagnose." note="A category is a practical place to look—not a label about who you are." />
      </section>
      <ActionBar busy={busy} note="Personal detail is optional."><PrimaryButton disabled={!learning.notNow && !learning.earlySignalCategory} onClick={onNext}>{learning.notNow ? "Continue without a personal signal" : "Build my signal card"}</PrimaryButton></ActionBar>
    </MissionShell>;
  }

  if (step === 5) {
    const examples: Record<EarlySignalCategory, string[]> = {
      body: ["My shoulders tighten", "My breathing gets quicker"],
      thought: ["I start telling myself this time is different", "I think about winning it back"],
      attention: ["My attention keeps returning to the offer", "I stop noticing what is around me"],
      action_tendency: ["I reach for the app without deciding", "I start checking my balance"],
      not_sure: ["I notice something has shifted", "I need another moment to name it"],
    };
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.formGrid}>
        <div>
          <div className={styles.titleBlock}><span>BUILD · ABOUT 4 MIN</span><h1>{learning.notNow ? "Keep the personal signal open." : "Make the signal easy to recognise."}</h1><p>{learning.notNow ? "You can complete this branch without adding a personal detail." : "Choose a neutral example or write one short sentence in your own words."}</p></div>
          {learning.notNow ? <ArtifactCard eyebrow="MISSION 03 · PRIVATE CHOICE" title="Not now" body="No personal signal will be saved." footer="You can return and add one later." /> : <>
            <div className={styles.exampleChips}>{examples[learning.earlySignalCategory || "not_sure"].map((example) => <button key={example} onClick={() => setLearning({ ...learning, earlySignalText: example })} type="button">{example}</button>)}</div>
            <Field label="My early signal · optional wording" value={learning.earlySignalText || ""} onChange={(earlySignalText) => setLearning({ ...learning, earlySignalText })} multiline placeholder="When my attention keeps returning to an offer…" hint="Maximum 240 characters. Stored only in your private Programme record." />
          </>}
        </div>
        <div className={styles.stack}><ArtifactCard eyebrow="EARLY-SIGNAL PREVIEW" title={learning.notNow ? "No personal signal saved" : signalLabel} body={signalSentence} footer="Private · Editable · Deletable" dark /><EvidenceCard mission={3} /></div>
      </section>
      <ActionBar busy={busy}><PrimaryButton onClick={onNext}>Check what this signal means</PrimaryButton></ActionBar>
    </MissionShell>;
  }

  if (step === 6) {
    const correct = learning.meaningAnswer === "pause_information";
    return <MissionShell mission={3} step={step} xp={140}>
      <section className={styles.learningGrid}>
        <div>
          <div className={styles.titleBlock}><span>REVIEW · ABOUT 3 MIN</span><h1>What does an early signal mean?</h1><p>Choose the meaning that keeps agency with the person.</p></div>
          <div className={styles.choiceList}>
            <Choice active={learning.meaningAnswer === "proof_failure"} title="It proves I have failed" onClick={() => setLearning({ ...learning, meaningAnswer: "proof_failure" })} />
            <Choice active={learning.meaningAnswer === "instruction_act"} title="It tells me I must act on the urge" onClick={() => setLearning({ ...learning, meaningAnswer: "instruction_act" })} />
            <Choice active={correct} title="It is information to pause and notice" description="The signal does not decide the next action." onClick={() => setLearning({ ...learning, meaningAnswer: "pause_information" })} />
          </div>
          {learning.meaningAnswer ? <div className={`${styles.feedback} ${correct ? styles.feedbackGood : ""}`}><b>{correct ? "Exactly." : "A signal is not a verdict or instruction."}</b><span>Noticing preserves a choice point. It does not guarantee an outcome.</span></div> : null}
        </div>
        <PhotoTheatre image={PEOPLE.outcome} eyebrow="MEANING CHECK · AGENCY STAYS WITH YOU" title="Information, then choice." note="The programme recognises completed learning—not a promise about future behaviour." />
      </section>
      <ActionBar busy={busy} note="Completing this review saves the learning record and +90 XP."><PrimaryButton disabled={!correct} onClick={onNext}>Complete Mission 03</PrimaryButton></ActionBar>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </MissionShell>;
  }

  return <MissionShell mission={3} step={step} xp={dashboard?.totalXp || 230}>
    <section className={styles.resultLayout}>
      <div><div className={styles.titleBlock}><span>REVIEW · ABOUT 2 MIN</span><h1>Your early-signal card is ready.</h1><p>Mission 03 is complete. Review what was saved, the evidence note and your reward.</p></div><ArtifactCard eyebrow="MISSION 03 RESULT" title={learning.notNow ? "No personal signal saved" : "My early signal"} body={signalSentence} footer="Private · Editable · Evidence item reviewed" /></div>
      <aside className={styles.rewardColumn}><Recognition label="LEARNING SAVED" value="+90 XP" note="Mission 03 complete." /><ul><li>Evidence item and checks reviewed</li><li>{learning.notNow ? "Not-now preference saved" : "Early-signal card saved"}</li><li>230 XP total · Mission 04 current</li></ul><Recognition dark label="ACTIVE DAY" value={String(dashboard?.activeDays || 1)} note="Truthful calendar activity." /></aside>
      <PhotoTheatre compact image={PEOPLE.outcome} eyebrow="MISSION 03 · RESULT SAVED" title="You noticed before the action." note="+90 XP · 230 XP total · Mission 04 unlocked." />
    </section>
    <ActionBar busy={busy} note="You can edit or delete the personal signal from your Dashboard."><PrimaryButton onClick={onNext}>Go to my Dashboard</PrimaryButton></ActionBar>
  </MissionShell>;
}

function boundarySentence(boundary: ActiveBoundary, signal?: UrgeLearningRecord | null) {
  const when = boundary.triggerType === "saved_early_signal"
    ? signal?.earlySignalText || signal?.earlySignalCategory?.replaceAll("_", " ") || "my saved early signal appears"
    : boundary.triggerText || "the decision point appears";
  return `When ${when}, ${boundary.ruleText || "my boundary action will go here"}`;
}

function BoundaryComposer({ boundary, signal, compact = false }: { boundary: ActiveBoundary; signal?: UrgeLearningRecord | null; compact?: boolean }) {
  const parts = [
    ["01", "WHEN", boundary.triggerType ? "Locked" : "Next"],
    ["02", "RULE", boundary.ruleText ? "Locked" : "Next"],
    ["03", "EXECUTION", boundary.executionMethod ? "Locked" : "Next"],
    ["04", "COPING + REVIEW", boundary.copingAction ? "Locked" : "Next"],
  ];
  return <article className={`${styles.boundaryComposer} ${compact ? styles.boundaryComposerCompact : ""}`}><span>BOUNDARY COMPOSER</span><h3>{boundarySentence(boundary, signal)}</h3><ol>{parts.map(([number, label, state]) => <li key={number} data-state={state.toLowerCase()}><b>{number}</b><span>{label}</span><small>{state}</small></li>)}</ol></article>;
}

function MissionFourScreen({ step, boundary, setBoundary, onNext, busy, error, dashboard }: { step: number; boundary: ActiveBoundary; setBoundary: (value: ActiveBoundary) => void; onNext: () => void; busy: boolean; error: string; dashboard: DashboardModel | null }) {
  const signal = dashboard?.urgeLearningRecord;
  const needsValue = ["money", "time", "pause"].includes(boundary.category);
  const canContinue = step <= 1
    ? step === 0 || boundary.evidenceReviewed
    : step === 2
      ? Boolean(boundary.category)
      : step === 3
        ? Boolean(boundary.triggerType && (boundary.triggerType === "saved_early_signal" || boundary.triggerText))
        : step === 4
          ? Boolean(boundary.ruleText && (!needsValue || (boundary.limitValue && boundary.limitUnit)) && (boundary.category !== "money" || boundary.limitPeriod))
          : step === 5
            ? Boolean(boundary.executionMethod && (boundary.executionMethod !== "custom" || boundary.executionDetail))
            : step === 6
              ? Boolean(boundary.copingAction && boundary.reviewAt)
              : step === 7
                ? boundary.scenarioAnswer === "concrete" && BOUNDARY_CHECKS.every((item) => boundary.strengthChecks.includes(item))
                : true;
  const categories: Array<[BoundaryCategory, string, string]> = [
    ["money", "Money", "A user-entered value and a clear reset period."],
    ["time", "Time", "A no-start, stop or review point."],
    ["access", "Access", "A block, removal or concrete restriction."],
    ["pause", "Pause", "A signal-triggered wait before another decision."],
  ];
  const executions: Array<[BoundaryExecutionMethod, string, string]> = [
    ["operator_account_limit", "Operator account limit", "Activate a user-chosen limit with the operator."],
    ["bank_gambling_block", "Bank gambling block", "Ask your bank whether a gambling block is available."],
    ["device_site_block", "Device or site block", "Use a blocking tool on the relevant device."],
    ["remove_payment_access", "Remove payment or access", "Remove a saved payment method or app access."],
    ["trusted_contact", "Trusted contact", "Tell one person what you plan to do."],
    ["leave_action", "Leave action", "Close the app or leave the setting."],
  ];

  if (step === 0) return <MissionShell mission={4} step={step} xp={230}><section className={styles.splitHero}><div className={styles.boundaryHero}><div className={styles.titleBlock}><span>MISSION 04 OF 10 · BUILD</span><h1>One clear rule, built before pressure.</h1><p>Turn your goal and early signal into a boundary you can recognise, use and review.</p></div><div className={styles.boundaryMeta}><b>+100 XP</b><span>4 parts</span><span>Local wording</span></div><BoundaryComposer boundary={boundary} signal={signal} compact /></div><PhotoTheatre image={PEOPLE.portrait} eyebrow="WHAT YOU’LL MAKE · ACTIVE BOUNDARY" title="Specific. Editable. Yours." note="Personal wording stays in this tab. External tools do the blocking." /></section><ActionBar busy={busy}><PrimaryButton onClick={onNext}>Start building</PrimaryButton></ActionBar></MissionShell>;

  if (step === 1) return <MissionShell mission={4} step={step} xp={230}><section className={styles.learningGrid}><div><div className={styles.titleBlock}><span>LEARN · ABOUT 4 MIN</span><h1>A boundary is more than a limit.</h1><p>It needs a decision point, a concrete rule, an execution method and a plan for the difficult moment.</p></div><div className={styles.boundaryAnatomy}>{[["01", "Decision point", "When the rule starts"], ["02", "Concrete rule", "What you will or will not do"], ["03", "Execution", "What adds friction outside SevenBet"], ["04", "Coping + review", "What happens before any later change"]].map(([number, title, copy]) => <article key={number}><b>{number}</b><div><strong>{title}</strong><span>{copy}</span></div></article>)}</div></div><div className={styles.stack}><EvidenceCard mission={4} /><Choice active={boundary.evidenceReviewed} title="I reviewed the evidence and limitation" description="The complete SevenBet mission has not been clinically evaluated." onClick={() => setBoundary({ ...boundary, evidenceReviewed: true })} /></div></section><ActionBar busy={busy} note="A prompt can increase limit-setting without proving reduced gambling intensity."><PrimaryButton disabled={!canContinue} onClick={onNext}>Build the four parts</PrimaryButton></ActionBar></MissionShell>;

  if (step === 2) return <MissionShell mission={4} step={step} xp={230}><section className={styles.wideForm}><div className={styles.titleBlock}><span>APPLY · CHOOSE ONE</span><h1>What should the boundary control?</h1><p>Choose the kind of decision you want to make earlier. No amount or duration is suggested.</p></div><div className={styles.boundaryCategoryGrid}>{categories.map(([key, title, copy], index) => <button key={key} data-active={boundary.category === key} onClick={() => setBoundary({ ...boundary, category: key, limitValue: "", limitUnit: key === "money" ? "GBP" : key === "access" ? "" : "minutes", limitPeriod: "", ruleText: "" })} type="button"><span>0{index + 1}</span><b>{title}</b><small>{copy}</small></button>)}</div><div className={styles.disclosureStrip}>Material values stay blank until you enter them. SevenBet does not recommend a “safe” limit.</div></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Use this category</PrimaryButton></ActionBar></MissionShell>;

  if (step === 3) return <MissionShell mission={4} step={step} xp={230}><section className={styles.learningGrid}><div><div className={styles.titleBlock}><span>APPLY · USE WHAT YOU KNOW</span><h1>When should your rule begin?</h1><p>Choose one point you can recognise before or at the earliest signal.</p></div><div className={styles.choiceList}><Choice active={boundary.triggerType === "saved_early_signal"} title="At my saved early signal" description={signal?.earlySignalText || signal?.earlySignalCategory?.replaceAll("_", " ") || "No personal signal is currently saved"} onClick={() => signal && !signal.notNow ? setBoundary({ ...boundary, triggerType: "saved_early_signal", triggerText: "" }) : undefined} /><Choice active={boundary.triggerType === "before_access"} title="Before opening an app or site" description="A neutral access point." onClick={() => setBoundary({ ...boundary, triggerType: "before_access", triggerText: "Before opening a gambling app or site" })} /><Choice active={boundary.triggerType === "scheduled_time"} title="At a scheduled day or time" description="A planned no-start or review point." onClick={() => setBoundary({ ...boundary, triggerType: "scheduled_time", triggerText: "At my scheduled review time" })} /><Choice active={boundary.triggerType === "custom"} title="Write another decision point" description="Keep it concrete and recognisable." onClick={() => setBoundary({ ...boundary, triggerType: "custom" })} /></div>{boundary.triggerType === "custom" ? <Field label="My decision point" value={boundary.triggerText} onChange={(triggerText) => setBoundary({ ...boundary, triggerText })} placeholder="When I notice…" /> : null}</div><div className={styles.stack}>{dashboard?.currentGoal ? <ArtifactCard eyebrow="MISSION 02 RESULT" title="My current goal" body={`When ${dashboard.currentGoal.triggerOrSituation}, I will ${dashboard.currentGoal.action}.`} footer="Use it only if this is the point you want the boundary to start." dark /> : null}<BoundaryComposer boundary={boundary} signal={signal} compact /></div></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Connect this point</PrimaryButton></ActionBar></MissionShell>;

  if (step === 4) return <MissionShell mission={4} step={step} xp={230}><section className={styles.composerLayout}><div><div className={styles.titleBlock}><span>BUILD · DEFINE THE RULE</span><h1>Make the rule specific.</h1><p>The product checks structure, not whether a value is safe or suitable.</p></div><div className={styles.ruleFields}>{needsValue ? <><Field label={boundary.category === "money" ? "Amount · entered by you" : "Duration · entered by you"} type="number" min={0} value={boundary.limitValue} onChange={(value) => setBoundary({ ...boundary, limitValue: value ? Number(value) : "" })} placeholder="No suggested value" /><Field label="Unit" value={boundary.limitUnit} onChange={(limitUnit) => setBoundary({ ...boundary, limitUnit })} placeholder={boundary.category === "money" ? "GBP" : "minutes"} />{boundary.category === "money" ? <Field label="Reset period" value={boundary.limitPeriod} onChange={(limitPeriod) => setBoundary({ ...boundary, limitPeriod })} placeholder="per calendar day, per week…" /> : null}</> : null}<Field label="Plain-language rule" value={boundary.ruleText} onChange={(ruleText) => setBoundary({ ...boundary, ruleText })} multiline placeholder={boundary.category === "access" ? "I remove the app and saved payment access before deciding again." : "I pause for the value entered above before another gambling decision."} hint="Describe an action and a clear completion condition." /></div></div><BoundaryComposer boundary={boundary} signal={signal} /></section><ActionBar busy={busy} note="No amount or duration is prefilled or recommended."><PrimaryButton disabled={!canContinue} onClick={onNext}>Use this rule</PrimaryButton></ActionBar></MissionShell>;

  if (step === 5) return <MissionShell mission={4} step={step} xp={230}><section className={styles.formGrid}><PhotoTheatre image={PEOPLE.planning} eyebrow="MAKE THE RULE EASIER TO FOLLOW" title="Add real friction." note="Choose one action you can activate outside SevenBet." /><div><div className={styles.titleBlock}><span>BUILD · EXECUTION</span><h1>What makes it easier to carry out?</h1><p>SevenBet saves only the structured method choice. Your detail stays in this tab. The operator, bank, device or person must activate it.</p></div><div className={styles.choiceList}>{executions.map(([key, title, copy]) => <Choice key={key} active={boundary.executionMethod === key} title={title} description={copy} onClick={() => setBoundary({ ...boundary, executionMethod: key })} />)}<Choice active={boundary.executionMethod === "custom"} title="Another method" description="Describe one action you can activate." onClick={() => setBoundary({ ...boundary, executionMethod: "custom" })} /></div>{boundary.executionMethod === "custom" ? <Field label="Execution detail" value={boundary.executionDetail} onChange={(executionDetail) => setBoundary({ ...boundary, executionDetail })} /> : null}</div></section><ActionBar busy={busy} note="Provider-neutral · no operator recommendation."><PrimaryButton disabled={!canContinue} onClick={onNext}>Use this method</PrimaryButton></ActionBar></MissionShell>;

  if (step === 6) return <MissionShell mission={4} step={step} xp={230}><section className={styles.copingLayout}><div><div className={styles.titleBlock}><span>BUILD · PROTECT THE RULE</span><h1>Plan for the urge to override it.</h1><p>Choose one action before any change, then choose a later review point.</p></div><div className={styles.choiceList}>{["Leave the app or site", "Message my trusted contact", "Move to another room", "Open protected Help"].map((item) => <Choice key={item} active={boundary.copingAction === item} title={item} onClick={() => setBoundary({ ...boundary, copingAction: item })} />)}</div></div><div className={styles.reviewPanel}><span>04 · REVIEW LATER</span><h2>Not in the pressure moment.</h2><Field label="Review point" type="datetime-local" value={boundary.reviewAt} onChange={(reviewAt) => setBoundary({ ...boundary, reviewAt })} /><blockquote>“If I want to override it, I {boundary.copingAction ? boundary.copingAction.toLowerCase() : "use my coping action"}, then review the boundary later.”</blockquote><small>This is a coping plan, not enforcement.</small></div></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Add coping and review</PrimaryButton></ActionBar></MissionShell>;

  if (step === 7) return <MissionShell mission={4} step={step} xp={230}><section className={styles.learningGrid}><div className={styles.scenarioPanel}><span>NEUTRAL SCENARIO</span><h2>Sam wants to avoid chasing a loss.</h2><p>Which boundary is specific, executable and reviewed later?</p><Choice active={boundary.scenarioAnswer === "vague"} title="I’ll try to be more careful next time." onClick={() => setBoundary({ ...boundary, scenarioAnswer: "vague" })} /><Choice active={boundary.scenarioAnswer === "concrete"} title="After a loss, I leave the app for 30 minutes, message Alex and review tomorrow." onClick={() => setBoundary({ ...boundary, scenarioAnswer: "concrete" })} /></div><div><div className={styles.titleBlock}><span>REVIEW · UNLIMITED RETRY</span><h1>Run four structure checks.</h1><p>These checks do not label the boundary safe, healthy or sufficient.</p></div>{boundary.scenarioAnswer ? <div className={`${styles.feedback} ${boundary.scenarioAnswer === "concrete" ? styles.feedbackGood : ""}`}><b>{boundary.scenarioAnswer === "concrete" ? "That’s the stronger structure." : "Look for a concrete point and action."}</b><span>{boundary.scenarioAnswer === "concrete" ? "It names the point, action, friction and later review." : "The vague intention cannot be checked or carried out."}</span></div> : null}<div className={styles.strengthChecks}>{[["placed_before_pressure", "Placed before pressure"], ["specific", "Specific"], ["executable", "Executable"], ["protected_from_in_moment_editing", "Protected from instant editing"]].map(([key, label]) => <Choice key={key} active={boundary.strengthChecks.includes(key)} title={label} onClick={() => setBoundary({ ...boundary, strengthChecks: boundary.strengthChecks.includes(key) ? boundary.strengthChecks.filter((item) => item !== key) : [...boundary.strengthChecks, key] })} />)}</div></div></section><ActionBar busy={busy}><PrimaryButton disabled={!canContinue} onClick={onNext}>Check my boundary</PrimaryButton></ActionBar></MissionShell>;

  return <MissionShell mission={4} step={step} xp={230}><section className={styles.resultLayout}><div><div className={styles.titleBlock}><span>REVIEW · READY TO SAVE PROGRESS</span><h1>Your boundary is ready.</h1><p>Review the local rule, privacy controls and evidence limitation.</p></div><ArtifactCard eyebrow="MISSION 04 RESULT · LOCAL WORDING" title="My active boundary" body={boundarySentence(boundary, signal)} footer={`Review ${reviewLabel(boundary.reviewAt)} · Local to this tab`} /><article className={styles.boundaryDisclosure}><b>BEFORE SAVING PROGRESS</b><p>This plan does not make gambling safe. SevenBet cannot enforce operator, bank or device controls, and the complete mission has not been clinically evaluated.</p></article></div><aside className={styles.rewardColumn}><Recognition label="PROGRESS SAVED" value="+100 XP" note="Mission 04 complete." /><Recognition dark label="ACHIEVEMENT EARNED" value="BOUNDARY BUILT" note="Structured boundary facts become active; wording stays local." /><div className={styles.disclosureStrip}>330 XP total · 4 of 10 · Mission 05 current</div></aside><PhotoTheatre compact image={PEOPLE.outcome} eyebrow="MISSION 04 · RESULT READY" title="Useful work, recognised." note="The reward recognises a plan, never a gambling action." /></section><ActionBar busy={busy} note="Personal wording stays in this browser session and is not used for advertising targeting."><PrimaryButton onClick={onNext}>Save progress · earn 100 XP</PrimaryButton></ActionBar>{error ? <p className={styles.error} role="alert">{error}</p> : null}</MissionShell>;
}

function EditOverlay({ type, dashboard, onClose, onSaved }: { type: "moment" | "goal" | "signal" | "boundary"; dashboard: DashboardModel; onClose: () => void; onSaved: (dashboard: DashboardModel) => void }) {
  const [moment, setMoment] = useState(dashboard.momentMap || emptyMomentMap);
  const [goal, setGoal] = useState(dashboard.currentGoal || emptyGoal(dashboard.momentMap?.id));
  const [signal, setSignal] = useState<UrgeLearningRecord>(dashboard.urgeLearningRecord || { earlySignalCategory: null, earlySignalText: null, notNow: true });
  const [boundary, setBoundary] = useState<ActiveBoundary>(dashboard.activeBoundary || emptyBoundary);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      onSaved({
        ...dashboard,
        momentMap: type === "moment" ? moment : dashboard.momentMap,
        currentGoal: type === "goal" ? goal : dashboard.currentGoal,
        urgeLearningRecord: type === "signal" ? signal : dashboard.urgeLearningRecord,
        activeBoundary: type === "boundary" ? boundary : dashboard.activeBoundary,
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the change"); } finally { setBusy(false); }
  }
  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Edit ${type}`}><form className={styles.editPanel} onSubmit={save}><div><span>LOCAL PROGRAMME CONTENT · THIS BROWSER SESSION</span><button onClick={onClose} type="button">Close</button></div><h2>{type === "moment" ? "Edit your Moment Map" : type === "goal" ? "Edit your 7-day goal" : type === "signal" ? "Edit your early signal" : "Edit your active boundary"}</h2>{type === "moment" ? <><Field label="Situation" value={moment.situation} onChange={(situation) => setMoment({ ...moment, situation })} /><Field label="Cues · comma separated" value={moment.cues.join(", ")} onChange={(value) => setMoment({ ...moment, cues: value.split(",").map((item) => item.trim()).filter(Boolean) })} /><Field label="Thought or feeling" value={moment.thoughtOrFeeling} onChange={(thoughtOrFeeling) => setMoment({ ...moment, thoughtOrFeeling })} multiline /><Field label="Response" value={moment.response} onChange={(response) => setMoment({ ...moment, response })} multiline /><Field label="Immediate consequence" value={moment.immediateConsequence} onChange={(immediateConsequence) => setMoment({ ...moment, immediateConsequence })} multiline /><Field label="Notice rule" value={moment.noticeRule} onChange={(noticeRule) => setMoment({ ...moment, noticeRule })} multiline /></> : type === "goal" ? <><Field label="Cue" value={goal.triggerOrSituation} onChange={(triggerOrSituation) => setGoal({ ...goal, triggerOrSituation })} /><Field label="Action" value={goal.action} onChange={(action) => setGoal({ ...goal, action })} multiline /><Field label="Alternative action" value={goal.alternativeAction} onChange={(alternativeAction) => setGoal({ ...goal, alternativeAction })} multiline /><Field label="Success signal" value={goal.successSignal} onChange={(successSignal) => setGoal({ ...goal, successSignal })} multiline /><Field label="Review date" value={goal.reviewAt.slice(0, 10)} onChange={(reviewAt) => setGoal({ ...goal, reviewAt })} type="date" /></> : type === "signal" ? <><div className={styles.choiceGrid}>{(["body", "thought", "attention", "action_tendency", "not_sure"] as EarlySignalCategory[]).map((category) => <Choice key={category} active={!signal.notNow && signal.earlySignalCategory === category} title={category.replace("_", " ")} onClick={() => setSignal({ ...signal, earlySignalCategory: category, notNow: false })} />)}</div><Field label="My early signal · optional wording" value={signal.earlySignalText || ""} onChange={(earlySignalText) => setSignal({ ...signal, earlySignalText })} multiline /><button className={styles.notNowButton} data-active={signal.notNow} onClick={() => setSignal({ ...signal, earlySignalCategory: null, earlySignalText: null, notNow: true })} type="button">Not now — remove the personal signal</button></> : <><Field label="Plain-language rule" value={boundary.ruleText} onChange={(ruleText) => setBoundary({ ...boundary, ruleText })} multiline /><Field label="Execution detail · optional" value={boundary.executionDetail} onChange={(executionDetail) => setBoundary({ ...boundary, executionDetail })} multiline /><Field label="Coping action" value={boundary.copingAction} onChange={(copingAction) => setBoundary({ ...boundary, copingAction })} multiline /><Field label="Review point" value={boundary.reviewAt.slice(0, 16)} onChange={(reviewAt) => setBoundary({ ...boundary, reviewAt })} type="datetime-local" /></>}{error ? <p className={styles.error}>{error}</p> : null}<PrimaryButton disabled={busy || (type === "signal" && !signal.notNow && !signal.earlySignalCategory)} type="submit">{busy ? "Saving…" : "Keep changes in this tab"}</PrimaryButton></form></div>;
}

export function ActiveControlProgramme() {
  const { data: session, isPending: sessionPending } = useSession();
  const sessionUserId = session?.user?.id || null;
  const [view, setView] = useState<View>("mission-01");
  const [m1Step, setM1Step] = useState(0);
  const [m2Step, setM2Step] = useState(0);
  const [m3Step, setM3Step] = useState(0);
  const [m4Step, setM4Step] = useState(0);
  const [momentMap, setMomentMap] = useState<MomentMap>(emptyMomentMap);
  const [goal, setGoal] = useState<CurrentGoal>(() => emptyGoal());
  const [urgeLearning, setUrgeLearning] = useState<UrgeLearningDraft>(emptyUrgeLearning);
  const [activeBoundary, setActiveBoundary] = useState<ActiveBoundary>(emptyBoundary);
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editType, setEditType] = useState<"moment" | "goal" | "signal" | "boundary" | null>(null);
  const [returningSignIn, setReturningSignIn] = useState(false);
  const [ageAttested, setAgeAttested] = useState(false);
  const [localHydrated, setLocalHydrated] = useState(false);
  const [activeSubject, setActiveSubject] = useState<ProgrammeLocalSubject | null>(null);
  const [claimTransitionPending, setClaimTransitionPending] = useState(false);
  const previousSessionUserId = useRef<string | null | undefined>(undefined);
  const claimedJourneySubject = useRef<ProgrammeLocalSubject | null>(null);
  const authenticated = Boolean(sessionUserId);
  const subjectMatchesSession = Boolean(
    activeSubject
    && (sessionUserId
      ? activeSubject.kind === "user" && activeSubject.id === sessionUserId
      : activeSubject.kind === "journey"),
  );

  useEffect(() => {
    if (sessionPending) return;
    if (claimTransitionPending && sessionUserId && activeSubject?.kind === "journey") return;
    const priorUserId = previousSessionUserId.current;
    const nextSubject = sessionUserId
      ? userProgrammeSubject(sessionUserId)
      : priorUserId
        ? rotateAnonymousProgrammeSubject(window.sessionStorage)
        : anonymousProgrammeSubject(window.sessionStorage);
    previousSessionUserId.current = sessionUserId;
    if (programmeSubjectsEqual(activeSubject, nextSubject)) return;

    // Fail closed on every subject transition: remove the prior subject from memory
    // before hydrating only the exact next subject namespace.
    setLocalHydrated(false);
    setDashboard(null);
    setEditType(null);
    setError("");
    setMomentMap(emptyMomentMap);
    setGoal(emptyGoal());
    setUrgeLearning(emptyUrgeLearning);
    setActiveBoundary(emptyBoundary);
    setAgeAttested(false);
    setActiveSubject(nextSubject);

    const local = loadProgrammeSubjectContent<ProgrammeLocalContent>(window.sessionStorage, nextSubject);
    if (local.momentMap) setMomentMap({ ...emptyMomentMap, ...local.momentMap });
    if (local.goal) setGoal({ ...emptyGoal(), ...local.goal });
    if (local.urgeLearning) setUrgeLearning({ ...emptyUrgeLearning, ...local.urgeLearning });
    if (local.activeBoundary) setActiveBoundary({ ...emptyBoundary, ...local.activeBoundary });
    setAgeAttested(hasProgrammeAgeAttestation(window.sessionStorage, nextSubject));
    setLocalHydrated(true);
    const returning = new URLSearchParams(window.location.search).get("auth") === "sign-in";
    if (returning && nextSubject.kind === "journey") {
      setReturningSignIn(true);
      setView("registration");
    } else if (nextSubject.kind === "journey") {
      setReturningSignIn(false);
      setView("mission-01");
    }
  }, [activeSubject, claimTransitionPending, sessionPending, sessionUserId]);

  useEffect(() => {
    if (!localHydrated || !activeSubject || !subjectMatchesSession) return;
    saveProgrammeSubjectContent(window.sessionStorage, activeSubject, { momentMap, goal, urgeLearning, activeBoundary });
  }, [activeBoundary, activeSubject, goal, localHydrated, momentMap, subjectMatchesSession, urgeLearning]);

  const request = useCallback(<T,>(path: string, init?: RequestInit) => {
    if (!activeSubject || !subjectMatchesSession) {
      return Promise.reject(new Error("Programme subject changed; reload the exact session before continuing"));
    }
    return programmeRequest<T>(path, activeSubject, init);
  }, [activeSubject, subjectMatchesSession]);

  useEffect(() => {
    if (sessionPending || !authenticated || !activeSubject || activeSubject.kind !== "user" || !subjectMatchesSession) return;
    let cancelled = false;
    const local = loadProgrammeSubjectContent<ProgrammeLocalContent>(window.sessionStorage, activeSubject);
    request<{ dashboard: DashboardModel }>("/api/program/dashboard")
      .then((payload) => { if (!cancelled) { const next = mergeDashboardLocal(payload.dashboard, local); setDashboard(next); setMomentMap(next.momentMap || emptyMomentMap); setGoal(next.currentGoal || emptyGoal(next.momentMap?.id)); setUrgeLearning({ ...emptyUrgeLearning, ...(local.urgeLearning || {}) }); setActiveBoundary(next.activeBoundary || emptyBoundary); setView("dashboard"); } })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeSubject, authenticated, request, sessionPending, subjectMatchesSession]);

  const m1Complete = useMemo(() => Boolean(momentMap.situation && momentMap.cues.length && momentMap.thoughtOrFeeling && momentMap.response && momentMap.immediateConsequence && momentMap.noticeRule), [momentMap]);

  async function saveMissionOneStep() {
    setBusy(true); setError("");
    const nextStates = MISSION_ONE_TASKS.slice(0, m1Step + 1);
    const save = () => request("/api/program/session/mission-01", { method: "PATCH", body: JSON.stringify({ taskStates: nextStates }) });
    try {
      try { await save(); }
      catch (cause) {
        if ((cause as Error & { status?: number }).status !== 404) throw cause;
        await request("/api/program/session", { method: "POST" });
        await save();
      }
      if (m1Step === 7) {
        if (!m1Complete) throw new Error("Complete the Moment Map before saving it");
        await request("/api/program/session/mission-01/claim", { method: "POST" });
        claimedJourneySubject.current = activeSubject?.kind === "journey" ? activeSubject : null;
        setView("registration-gate");
      } else setM1Step((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this step"); }
    finally { setBusy(false); }
  }

  async function redeemClaim(targetUserId: string) {
    const payload = await request<{ dashboard: DashboardModel }>("/api/program/claims/redeem", { method: "POST", body: JSON.stringify({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }) });
    const targetSubject = userProgrammeSubject(targetUserId);
    let local: Partial<ProgrammeLocalContent>;
    if (activeSubject?.kind === "journey") {
      if (!programmeSubjectsEqual(activeSubject, claimedJourneySubject.current)) {
        throw new Error("The anonymous Programme journey cannot be matched to this claim");
      }
      local = migrateClaimedJourneyToUser<ProgrammeLocalContent>(window.sessionStorage, activeSubject, targetSubject);
    } else if (programmeSubjectsEqual(activeSubject, targetSubject)) {
      local = loadProgrammeSubjectContent<ProgrammeLocalContent>(window.sessionStorage, targetSubject);
    } else {
      throw new Error("The Programme claim does not match the active account subject");
    }
    claimedJourneySubject.current = null;
    setActiveSubject(targetSubject);
    setAgeAttested(hasProgrammeAgeAttestation(window.sessionStorage, targetSubject));
    const next = mergeDashboardLocal(payload.dashboard, local);
    setDashboard(next); setMomentMap(next.momentMap || momentMap); setView("dashboard");
  }

  async function handleRegistrationContinue() {
    if (!authenticated) { setView("registration"); return; }
    setBusy(true); setError("");
    try {
      if (!sessionUserId) throw new Error("The authenticated account could not be resolved");
      await redeemClaim(sessionUserId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save your result"); } finally { setBusy(false); }
  }

  async function handleAuth(input: { email: string; password: string; mode: "sign-up" | "sign-in"; adultConfirmed: boolean }) {
    setBusy(true); setError("");
    const continuingCurrentClaim = !(returningSignIn && input.mode === "sign-in")
      && activeSubject?.kind === "journey"
      && programmeSubjectsEqual(activeSubject, claimedJourneySubject.current);
    setClaimTransitionPending(continuingCurrentClaim);
    try {
      const result = input.mode === "sign-up"
        ? await authClient.signUp.email({ email: input.email.trim().toLowerCase(), password: input.password, name: input.email.split("@")[0] || "SevenBet member", fetchOptions: { headers: { "x-sevenbet-age-attestation": input.adultConfirmed ? "18-or-over" : "" } } })
        : await authClient.signIn.email({ email: input.email.trim().toLowerCase(), password: input.password });
      if (result.error) throw new Error(input.mode === "sign-up" ? "This account could not be created. Try signing in if the email already exists." : "Email or password is incorrect.");
      const targetUserId = result.data?.user.id;
      if (!targetUserId) throw new Error("The authenticated account could not be resolved");
      if (returningSignIn && input.mode === "sign-in") {
        window.history.replaceState({}, "", "/program");
        setReturningSignIn(false);
      } else await redeemClaim(targetUserId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Account access failed"); }
    finally { setClaimTransitionPending(false); setBusy(false); }
  }

  async function startMissionTwo() {
    if (!dashboard?.momentMap) return;
    setBusy(true); setError("");
    try {
      const payload = await request<{ mission: { draft?: { currentGoal?: Partial<CurrentGoal> } } }>("/api/program/missions/02");
      const draft = payload.mission.draft?.currentGoal;
      setGoal({ ...emptyGoal(dashboard.momentMap.id), ...draft, sourceMomentMapId: dashboard.momentMap.id || "", reviewAt: typeof draft?.reviewAt === "string" ? draft.reviewAt.slice(0, 10) : sevenDaysFromNow(), direction: (draft?.direction || "pause") as GoalDirection });
      setM2Step(0); setView("mission-02");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mission 02 could not be opened"); }
    finally { setBusy(false); }
  }

  async function saveMissionTwoStep() {
    setBusy(true); setError("");
    try {
      const reviewAt = new Date(`${goal.reviewAt.slice(0, 10)}T12:00:00`).toISOString();
      await request("/api/program/missions/02", { method: "PUT", body: JSON.stringify({ taskStates: MISSION_TWO_TASKS.slice(0, m2Step + 1), currentGoal: { sourceMomentMapId: goal.sourceMomentMapId, direction: goal.direction, reviewAt, confidence: goal.confidence, status: goal.status } }) });
      if (m2Step === 7) {
        const payload = await request<{ dashboard: DashboardModel }>("/api/program/missions/02/complete", { method: "POST" });
        setDashboard(mergeDashboardLocal(payload.dashboard, { momentMap, goal, urgeLearning, activeBoundary })); setView("dashboard");
      } else setM2Step((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this step"); }
    finally { setBusy(false); }
  }

  async function startMissionThree() {
    setBusy(true); setError("");
    try {
      const payload = await request<{ mission: { taskStates: string[]; draft?: { urgeLearning?: { evidenceReviewed?: boolean; waveMomentsReviewed?: string[]; scenarioAnswer?: string; signalChoice?: "local" | "not_now"; meaningAnswer?: string } } } }>("/api/program/missions/03");
      const saved = payload.mission.draft?.urgeLearning;
      setUrgeLearning({ ...emptyUrgeLearning, ...urgeLearning, ...saved, notNow: saved?.signalChoice === "not_now" ? true : urgeLearning.notNow });
      setM3Step(Math.min(payload.mission.taskStates.length, 6));
      setView("mission-03");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mission 03 could not be opened"); }
    finally { setBusy(false); }
  }

  async function startMissionFour() {
    setBusy(true); setError("");
    try {
      const payload = await request<{ mission: { taskStates: string[]; draft?: { activeBoundary?: Partial<ActiveBoundary> } } }>("/api/program/missions/04");
      const draft = payload.mission.draft?.activeBoundary;
      setActiveBoundary({
        ...emptyBoundary,
        ...activeBoundary,
        ...draft,
        reviewAt: typeof draft?.reviewAt === "string" ? draft.reviewAt.slice(0, 16) : tomorrowAtTen(),
      });
      setM4Step(Math.min(payload.mission.taskStates.length, 8));
      setView("mission-04");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mission 04 could not be opened"); }
    finally { setBusy(false); }
  }

  async function startCurrentMission() {
    if (dashboard?.currentMission === 2) await startMissionTwo();
    else if (dashboard?.currentMission === 3) await startMissionThree();
    else if (dashboard?.currentMission === 4) await startMissionFour();
  }

  async function saveMissionThreeStep() {
    if (m3Step === 7) { setView("dashboard"); return; }
    setBusy(true); setError("");
    try {
      const completing = m3Step === 6;
      const taskStates = completing ? [...MISSION_THREE_TASKS] : MISSION_THREE_TASKS.slice(0, m3Step + 1);
      await request("/api/program/missions/03", {
        method: "PUT",
        body: JSON.stringify({ taskStates, urgeLearning: { evidenceReviewed: urgeLearning.evidenceReviewed, waveMomentsReviewed: urgeLearning.waveMomentsReviewed, scenarioAnswer: urgeLearning.scenarioAnswer || undefined, signalChoice: urgeLearning.notNow ? "not_now" : "local", meaningAnswer: urgeLearning.meaningAnswer || undefined } }),
      });
      if (completing) {
        const payload = await request<{ dashboard: DashboardModel }>("/api/program/missions/03/complete", { method: "POST" });
        setDashboard(mergeDashboardLocal(payload.dashboard, { momentMap, goal, urgeLearning, activeBoundary }));
        setM3Step(7);
      } else setM3Step((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this step"); }
    finally { setBusy(false); }
  }

  async function saveMissionFourStep() {
    setBusy(true); setError("");
    try {
      const completing = m4Step === 8;
      const taskStates = completing ? [...MISSION_FOUR_TASKS] : MISSION_FOUR_TASKS.slice(0, m4Step + 1);
      const reviewAt = new Date(activeBoundary.reviewAt).toISOString();
      await request("/api/program/missions/04", {
        method: "PATCH",
        body: JSON.stringify({
          taskStates,
          activeBoundary: {
            evidenceReviewed: activeBoundary.evidenceReviewed,
            category: activeBoundary.category || undefined,
            triggerType: activeBoundary.triggerType || undefined,
            executionMethod: activeBoundary.executionMethod || undefined,
            limitValue: activeBoundary.limitValue || undefined,
            reviewAt,
            scenarioAnswer: activeBoundary.scenarioAnswer || undefined,
            strengthChecks: activeBoundary.strengthChecks,
            status: activeBoundary.status,
          },
        }),
      });
      if (completing) {
        const payload = await request<{ dashboard: DashboardModel }>("/api/program/missions/04/complete", { method: "POST" });
        const next = mergeDashboardLocal(payload.dashboard, { momentMap, goal, urgeLearning, activeBoundary });
        setDashboard(next);
        setActiveBoundary(next.activeBoundary || activeBoundary);
        setView("dashboard");
      } else setM4Step((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this step"); }
    finally { setBusy(false); }
  }

  async function clearLocalContent() {
    if (!activeSubject || !subjectMatchesSession) return;
    clearProgrammeSubjectContent(window.sessionStorage, activeSubject);
    setMomentMap(emptyMomentMap);
    setGoal(emptyGoal(dashboard?.momentMap?.id));
    setUrgeLearning(emptyUrgeLearning);
    setActiveBoundary(emptyBoundary);
    try {
      const payload = await request<{ dashboard: DashboardModel }>("/api/program/dashboard");
      setDashboard(payload.dashboard);
    } catch {
      setDashboard(null);
    }
  }

  if (sessionPending || !localHydrated || !activeSubject || !subjectMatchesSession) {
    return <div className={styles.programmeShell}><Header /><section className={styles.registrationForm}><p role="status">Loading your private Programme session…</p><p><Link href="/responsible-gambling">Protected Help remains available.</Link></p></section></div>;
  }

  if (!ageAttested) return <AgeGate onConfirm={() => { setProgrammeAgeAttestation(window.sessionStorage, activeSubject); setAgeAttested(true); }} />;

  return (
    <div className={`activeProgrammePage ${styles.page}`}>
      {view === "mission-01" ? <MissionOneScreen step={m1Step} map={momentMap} setMap={setMomentMap} onNext={saveMissionOneStep} busy={busy} error={error} /> : null}
      {view === "registration-gate" || view === "registration" ? <Registration gate={view === "registration-gate"} map={momentMap} authenticated={authenticated} onContinue={handleRegistrationContinue} onSubmit={handleAuth} busy={busy} error={error} returning={returningSignIn} /> : null}
      {view === "dashboard" && dashboard ? <Dashboard dashboard={dashboard} onStartMission={startCurrentMission} onEdit={setEditType} onClearLocal={clearLocalContent} /> : null}
      {view === "mission-02" && dashboard?.momentMap ? <MissionTwoScreen step={m2Step} goal={goal} setGoal={setGoal} map={dashboard.momentMap} onNext={saveMissionTwoStep} busy={busy} error={error} /> : null}
      {view === "mission-03" ? <MissionThreeScreen step={m3Step} learning={urgeLearning} setLearning={setUrgeLearning} onNext={saveMissionThreeStep} busy={busy} error={error} dashboard={dashboard} /> : null}
      {view === "mission-04" ? <MissionFourScreen step={m4Step} boundary={activeBoundary} setBoundary={setActiveBoundary} onNext={saveMissionFourStep} busy={busy} error={error} dashboard={dashboard} /> : null}
      {editType && dashboard ? <EditOverlay type={editType} dashboard={dashboard} onClose={() => setEditType(null)} onSaved={(next) => { setDashboard(next); if (next.momentMap) setMomentMap(next.momentMap); if (next.currentGoal) setGoal(next.currentGoal); if (next.urgeLearningRecord) setUrgeLearning({ ...urgeLearning, earlySignalCategory: next.urgeLearningRecord.earlySignalCategory || undefined, earlySignalText: next.urgeLearningRecord.earlySignalText || undefined, notNow: next.urgeLearningRecord.notNow }); if (next.activeBoundary) setActiveBoundary(next.activeBoundary); setEditType(null); }} /> : null}
    </div>
  );
}
